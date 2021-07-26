import { EventEmitter } from "@angular/core";
import {
  ALL,
  IBreakdown,
  IPhrase,
  IPhrases,
  ISection,
  ISong,
  ITrackType,
  MDASH,
} from "src/schema/schema";
import { fade } from "../app.module";
import { assignColors, Color, IPalette } from "../find-the-one/colors";

export interface IRange {
  startIndex: number;
  endIndex: number;
  length: number;
}

export class Queue {
  private timeout?: number;
  private readonly queue: true[] = [];
  public get busy() {
    return this.queue.length > 0;
  }
  public wait(callback: { (): Promise<void> }) {
    return new Promise<void>(async (resolve, reject) => {
      if (this.queue.length === 0) {
        this.timeout = window.setTimeout(() => {
          this.queue.splice(0);
          reject("Queue timeout");
        }, 10000);
      }
      this.queue.push(true);
      await callback();
      this.queue.pop();
      if (!this.busy) window.clearTimeout(this.timeout);
      resolve();
    });
  }
  public waitFor<T>(items: T[], callback: { (item: T): Promise<void> }) {
    return this.wait(async () => {
      await Promise.all(items.map((item) => callback(item)));
    });
  }
}

export class Song implements IRange {
  constructor(
    private readonly songId: string,
    iSong: ISong,
    iBreakdown: IBreakdown
  ) {
    this.queue = new Queue();
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.connect(this.context.destination);
    this.clock = new Clock(this.context, iBreakdown.trim ?? 0, iSong.bpm);
    this.title = iSong.title;
    this.artist = iSong.artist;
    this.genre = iSong.genre;
    this.imageUrl = `/assets/songs/${this.songId}/cover.jpg`;
    this.groups = [];
    this.tracks = [];
    iBreakdown.tracks.forEach((iTrack, trackId) => {
      let track = new Track(
        this.queue,
        this.context,
        this.master,
        this.clock,
        this.songId,
        trackId,
        iTrack,
        async () => {
          let allEnded = true;
          for (let track of this.tracks) {
            if (!track.ended) {
              allEnded = false;
              break;
            }
          }
          if (allEnded) {
            await this.pause();
            await this.setBeat(0);
          }
        }
      );
      track.groups.forEach((group) => {
        if (!this.groups.includes(group)) this.groups.push(group);
      });
      this.tracks.push(track);
    });
    this.groups.sort();
    let index = 1;
    this.blocks = [];
    iBreakdown.sections.forEach((iSection) => {
      if (!this.blocks.includes(iSection.title))
        this.blocks.push(iSection.title);
    });
    this.legend = assignColors(this.blocks);
    this.sections = [];
    iBreakdown.sections.forEach((iSection) => {
      let s = new Section(
        index,
        iSection,
        iBreakdown.beatsPerMeasure,
        this.legend[iSection.title]
      );
      this.sections.push(s);
      index = s.endIndex + 1;
    });
    this.startIndex = 1;
    this.endIndex = index - 1;
    this.length = this.endIndex;
  }
  protected readonly queue: Queue;
  private readonly context: AudioContext;
  private readonly master: GainNode;
  public readonly clock: Clock;
  public readonly title: string;
  public readonly artist: string;
  public readonly genre: string;
  public readonly imageUrl: string;
  public readonly groups: string[];
  public readonly tracks: Track[];
  public readonly blocks: string[];
  public readonly legend: IPalette;
  public readonly sections: Section[];
  public readonly startIndex: number;
  public readonly endIndex: number;
  public readonly length: number;
  public get busy() {
    return this.queue.busy;
  }
  private isPlaying = false;
  public get playing() {
    return this.isPlaying;
  }
  public play(fadeIn = 0.5) {
    return this.queue.wait(async () => {
      await fade(this.context, this.master, 0, 0);
      if (this.context.state !== "running") await this.context.resume();
      await this.queue.waitFor(this.tracks, (track) =>
        track.seek(this.clock.currentTime)
      );
      await this.queue.waitFor(this.tracks, (track) => track.play());
      this.clock.start();
      this.isPlaying = true;
      await fade(this.context, this.master, 1, fadeIn);
    });
  }
  public pause(fadeOut = 0.5) {
    return this.queue.wait(async () => {
      await fade(this.context, this.master, 0, fadeOut);
      await this.queue.waitFor(this.tracks, (track) => track.pause());
      this.clock.stop();
      this.isPlaying = false;
      this.context.suspend();
    });
  }
  public setBeat(index: number) {
    return this.queue.wait(async () => {
      let wasPlaying = this.playing;
      if (wasPlaying) {
        await fade(this.context, this.master, 0, 0.25);
        await this.queue.waitFor(this.tracks, (track) => track.pause());
        this.clock.stop();
      }
      this.clock.setBeat(index);
      await this.queue.waitFor(this.tracks, (track) =>
        track.seek(this.clock.currentTime)
      );
      if (wasPlaying) {
        await this.queue.waitFor(this.tracks, (track) => track.play());
        this.clock.start();
        await fade(this.context, this.master, 1, 0.25);
      }
    });
  }
}

export class Clock {
  constructor(
    private readonly context: AudioContext,
    public readonly trim: number,
    bpm: number
  ) {
    this.secondsPerBeat = 60 / bpm;
    this.currentBpm = this.originalBpm = bpm;
    this.speed = 1;
    this.setTime(0);
  }
  public pulse = new EventEmitter<number>();
  public playbackRateChange = new EventEmitter<number>();
  public readonly secondsPerBeat: number;
  private readonly originalBpm: number;
  private currentBpm: number;
  private time!: number;
  private beats!: number;
  private speed!: number;
  public seconds!: Date;
  public get bpm() {
    return this.currentBpm;
  }
  private set bpm(value: number) {
    this.currentBpm = value;
    this.speed = this.bpm / this.originalBpm;
    this.playbackRateChange.emit(this.speed);
  }
  public get playbackRate() {
    return this.speed;
  }
  public faster() {
    this.bpm++;
  }
  public slower() {
    this.bpm--;
  }
  public normal() {
    this.bpm = this.originalBpm;
  }
  public get currentTime() {
    return this.time;
  }
  public setBeat(value: number) {
    let time = value === 0 ? 0 : (value - 1) * this.secondsPerBeat + this.trim;
    this.setTime(time);
    return time;
  }
  public setTime(time: number) {
    this.time = time;
    let seconds = new Date(0),
      temp = this.time <= this.trim ? 0 : this.time - this.trim;
    seconds.setSeconds(Math.floor(temp));
    if (seconds !== this.seconds) this.seconds = seconds;
    let beats =
      time >= this.trim ? Math.floor(temp / this.secondsPerBeat) + 1 : 0;
    if (beats !== this.beats) {
      this.beats = beats;
      this.pulse.emit(beats);
    }
  }
  public get fast() {
    return this.currentBpm > this.originalBpm;
  }
  public get slow() {
    return this.currentBpm < this.originalBpm;
  }
  private handle?: number;
  public start(currentTime = this.context.currentTime) {
    this.handle = requestAnimationFrame(() => {
      this.setTime(
        this.time -
          (currentTime - (currentTime = this.context.currentTime)) * this.speed
      );
      this.start(currentTime);
    });
  }
  public stop() {
    cancelAnimationFrame(this.handle!);
  }
}

export type IVolume = "mute" | "down" | "up";
export type IVolumes = { [volume in IVolume]: number };
export const VOLUMES: IVolumes = { mute: 0, down: 0.8, up: 1.2 };

export class Track {
  constructor(
    private readonly queue: Queue,
    private readonly context: AudioContext,
    master: GainNode,
    private readonly clock: Clock,
    songId: string,
    trackId: number,
    iTrack: ITrackType,
    onEnded: { (): Promise<void> }
  ) {
    this.trackId = trackId;
    this.title = typeof iTrack === "string" ? iTrack : iTrack.title;
    if (typeof iTrack !== "string" && iTrack.groups)
      this.groups =
        typeof iTrack.groups === "string" ? [iTrack.groups] : iTrack.groups;
    else this.groups = [];
    this.groups.push(ALL);
    this.groups.sort();
    this.file = document.createElement("source");
    this.file.src = `/assets/songs/${songId}/track${trackId}.trk`;
    this.file.type = "audio/mpeg";
    this.element = document.createElement("audio");
    this.element.appendChild(this.file);
    this.element.load();
    this.master = context.createGain();
    this.master.connect(master);
    this.fader = context.createGain();
    this.fader.connect(this.master);
    this.source = context.createMediaElementSource(this.element);
    this.source.connect(this.fader);
    this.setVolume("down");
    this.clock.playbackRateChange.subscribe((value) => {
      this.element.playbackRate = value;
    });
    this.element.onended = async () => {
      await this.queue.wait(onEnded);
    };
  }
  public readonly trackId: number;
  public readonly title: string;
  public readonly groups: string[];
  private readonly file: HTMLSourceElement;
  private readonly element: HTMLAudioElement;
  private readonly master: GainNode;
  private readonly fader: GainNode;
  private readonly source: MediaElementAudioSourceNode;
  private volume!: IVolume;
  private active!: boolean;
  public get hidden() {
    return !this.active;
  }
  public get ended() {
    return this.element.ended;
  }
  public get buttons() {
    return Object.keys(VOLUMES) as IVolume[];
  }
  public button(volume: IVolume) {
    let btn =
      volume === this.volume
        ? `btn-info bi-volume-${volume}-fill`
        : `btn-outline-info bi-volume-${volume}`;
    return `btn ${btn}`;
  }
  public setVolume(volume: IVolume) {
    return this.queue.wait(async () => {
      this.volume = volume;
      await fade(this.context, this.fader, VOLUMES[volume], 0.5);
    });
  }
  public setGroup(group: string) {
    return this.queue.wait(async () => {
      let value = (this.active = this.groups.includes(group)) ? 1 : 0;
      await fade(this.context, this.master, value, 0.5);
    });
  }
  public seek(seconds: number) {
    return this.queue.wait(() => {
      return new Promise<void>((resolve) => {
        this.element.load();
        this.element.currentTime = seconds;
        this.element.playbackRate = this.clock.playbackRate;
        if (this.element.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA)
          resolve();
        else
          this.element.oncanplaythrough = function () {
            resolve();
          };
      });
    });
  }
  public play() {
    return this.queue.wait(() => this.element.play());
  }
  public pause() {
    return this.queue.wait(() => {
      return new Promise<void>((resolve) => {
        this.element.pause();
        if (this.element.paused) resolve();
        else
          this.element.onpause = function () {
            resolve();
          };
      });
    });
  }
}

export class Section implements IRange {
  constructor(
    startIndex: number,
    iSection: ISection,
    beatsPerMeasure: number,
    color: Color
  ) {
    this.title = iSection.title;
    this.color = color;
    let index = startIndex,
      structure = iSection.structure;
    this.phrases = [];
    if (
      (function (iPhrases: IPhrases): iPhrases is IPhrase[] {
        if (!Array.isArray(iPhrases)) iPhrases = [iPhrases];
        return true;
      })(iSection.phrases)
    ) {
      iSection.phrases.forEach((iPhrase) => {
        let phrase: Measure[] = [];
        if (typeof iPhrase === "number") {
          for (let i = 0; i < iPhrase; i++) {
            let m = new Measure(structure!, beatsPerMeasure, false, index);
            index = m.endIndex + 1;
            phrase.push(m);
          }
        } else
          iPhrase.forEach((measure) => {
            let beats: number, warning: boolean;
            if (typeof measure === "number") {
              beats = measure;
            } else if (typeof measure === "string") {
              structure = measure ?? structure;
              beats = beatsPerMeasure;
            } else {
              structure = measure.structure ?? MDASH;
              beats = measure.beats ?? beatsPerMeasure;
            }
            warning = beats !== beatsPerMeasure;
            let m = new Measure(structure!, beats, warning, index);
            index = m.endIndex + 1;
            phrase.push(m);
          });
        this.phrases.push(phrase);
      });
    }
    this.startIndex = startIndex;
    this.endIndex = index - 1;
    this.length = this.endIndex - this.startIndex + 1;
  }
  public readonly title: string;
  public readonly color: Color;
  public readonly phrases: Measure[][];
  public readonly startIndex: number;
  public readonly endIndex: number;
  public readonly length: number;
}

export class Measure implements IRange {
  constructor(
    public readonly structure: string,
    public readonly beats: number,
    public readonly warning: boolean,
    public readonly startIndex: number
  ) {
    this.endIndex = this.startIndex + beats - 1;
    this.length = this.endIndex - this.startIndex + 1;
  }
  public readonly endIndex: number;
  public readonly length: number;
}
