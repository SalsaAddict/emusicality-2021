import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { IMetadata } from "src/schema/schema";
import { mdash } from "../app.module";
import { IRange, Measure, Section, Song } from "./song";

@Component({
  selector: "app-song",
  templateUrl: "./song.component.html",
  styleUrls: ["./song.component.css"],
})
export class SongComponent extends Song {
  constructor(route: ActivatedRoute) {
    let iMetadata: IMetadata = route.snapshot.data.iMetadata;
    super(iMetadata.songId, iMetadata.iSong, iMetadata.iBreakdown);
    this.group = this.groups[0];
    this.setGroup();
    this.clock.pulse.subscribe((beats) => {
      this.beats = beats;
      if (!inRange(beats, this.section)) {
        this.section =
          this.measure =
          this.markers =
          this.beat =
          this.next =
          this.previous =
            undefined;
        for (let i = 0; i < this.sections.length; i++)
          if (inRange(beats, this.sections[i])) {
            this.section = this.sections[i];
            if (i > 0) this.previous = this.sections[i - 1].startIndex;
            if (i + 1 < this.sections.length)
              this.next = this.sections[i + 1].startIndex;
            break;
          }
      }
      if (this.section && !inRange(beats, this.measure)) {
        this.measure = this.markers = this.beat = undefined;
        for (let i = 0; i < this.section!.phrases.length; i++)
          for (let j = 0; j < this.section!.phrases[i].length; j++)
            if (inRange(beats, this.section!.phrases[i][j])) {
              this.measure = this.section!.phrases[i][j];
              this.markers = new Array(this.measure!.beats);
              break;
            }
      }
      if (inRange(beats, this.measure)) {
        this.beat = beats - this.measure!.startIndex + 1;
      }
    });
  }
  public group: string;
  public section?: Section;
  public measure?: Measure;
  public markers?: number[];
  public beats?: number;
  public beat?: number;
  public next?: number;
  public previous?: number;
  public block?: string;
  public setGroup() {
    this.queue.waitFor(this.tracks, (track) => track.setGroup(this.group));
  }
  public animateIf(condition: boolean, animation: string = "heartBeat") {
    return condition ? `animate__animated animate__${animation}` : "";
  }
  public sectionPercent(section: Section) {
    return section.length / this.length;
  }
  public sectionProgress(section: Section) {
    return this.section === section
      ? (this.beats! - section.startIndex) / section.length
      : 1;
  }
  public setBlock($event: Event, block?: string) {
    $event.preventDefault();
    $event.stopPropagation();
    $event.stopImmediatePropagation();
    this.block = block;
  }
  public dimmed(section?: string | Section) {
    let title = typeof section === "string" ? section : section?.title;
    if (this.block) return this.block !== title;
    if (!this.playing) return false;
    if (!section) return true;
    return this.section?.title !== title;
  }
  public colorIf(condition: boolean, color?: string) {
    return condition ? color : undefined;
  }
  public mdash(value?: string) {
    return mdash(value);
  }
}
function inRange(index: number, range?: IRange) {
  return range && index >= range.startIndex && index <= range.endIndex;
}
interface INavigation {
  previous?: number;
  next?: number;
}
