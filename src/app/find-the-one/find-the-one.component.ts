import { i18nMetaToJSDoc } from "@angular/compiler/src/render3/view/i18n/meta";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ALL, IMetadata } from "src/schema/schema";
import { Song } from "../song/song";

@Component({
  selector: "app-find-the-one",
  templateUrl: "./find-the-one.component.html",
  styleUrls: ["./find-the-one.component.css"],
})
export class FindTheOneComponent extends Song implements OnInit {
  constructor(route: ActivatedRoute) {
    super(
      route.snapshot.data.iGameInfo.songId,
      route.snapshot.data.iGameInfo.iSong,
      route.snapshot.data.iGameInfo.iBreakdown
    );

    let iGameInfo: IGameInfo = route.snapshot.data.iGameInfo;
    this.ones = iGameInfo.ones;
    this.startTime = iGameInfo.startTime;
    this.startIndex = iGameInfo.startIndex;
    this.hard = iGameInfo.hard;
    this.beatsPerMeasure = iGameInfo.iBreakdown.beatsPerMeasure;

    this.queue.waitFor(this.tracks, (track) => track.setGroup(ALL));

    this.clock.setTime(iGameInfo.startTime);
    this.clock.pulse.subscribe((beats) => {
      this.beats = beats;
      if (beats > this.ones[this.ones.length - 1]) this.pause(2);
    });
    this.taps = [];
  }
  public readonly hard: boolean;
  public readonly beatsPerMeasure: number;
  public assist: string = "1";

  public readonly ones: number[];

  public readonly markers: number[] = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  public marker(offset: number) {
    if (!this.beats) return "bi-dot";
    let beat = this.beats! + offset,
      isOne = this.ones.includes(beat),
      isTap = this.taps.includes(beat);
    if (isOne && isTap) return "bi-check-circle-fill text-success";
    if (isTap) return "bi-x-circle-fill text-danger";
    if (isOne && this.beats > beat) return "bi-bullseye text-danger";
    if (isOne && this.assist === "1") return "bi-bullseye";
    return "bi-dot";
  }

  public get timer() {
    let seconds = Math.floor(this.clock.currentTime - this.startTime) - 5;
    return seconds;
  }
  public readonly startTime: number;
  public readonly startIndex: number;
  public beats?: number;

  public readonly taps: number[];
  public tap() {
    this.taps.push(
      Math.floor(
        Math.floor(
          ((this.clock.currentTime - this.clock.trim) * 4) /
            this.clock.secondsPerBeat
        ) / 4
      ) + 1
    );
  }

  public startBtnText() {
    if (!this.playing) return "Start";
    if (this.timer < 0) return Math.abs(this.timer).toString();
    return "Go!";
  }

  ngOnInit(): void {}
}
export interface IGameParameters {
  songId: string;
  startTime: number;
  startIndex: number;
  ones: number[];
  hard: boolean;
}
export interface IGameInfo extends IMetadata, IGameParameters {}
