import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from "@angular/router";
import { Observable } from "rxjs";
import { ISongs, IBreakdown } from "src/schema/schema";
import { shuffle } from "../app.module";
import { Section } from "../song/song";
import { Color } from "./colors";
import { IGameInfo, IGameParameters } from "./find-the-one.component";

@Injectable({ providedIn: "root" })
export class FindTheOneResolver implements Resolve<IGameInfo> {
  constructor(private readonly http: HttpClient) {}
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return new Observable<IGameInfo>((observer) => {
      let hard: boolean = route.params["level"].trim().toLowerCase() === "hard",
        parameters: IGameParameters[] = [];
      (async () => {
        let path = "/assets/songs/",
          iSongs: ISongs;
        await this.http
          .get<ISongs>(`${path}songs.json`)
          .toPromise()
          .then((songs) => (iSongs = songs));
        for (let songId of Object.keys(iSongs!)) {
          let index = 1,
            iBreakdown: IBreakdown,
            ones: number[] = [];
          await this.http
            .get<IBreakdown>(`${path}${songId}/breakdown.json`)
            .toPromise()
            .then((breakdown) => (iBreakdown = breakdown));
          let iSong = iSongs![songId],
            secondsPerBeat = 60 / iSong.bpm,
            beatsPerSecond = iSong.bpm / 60;
          iBreakdown!.sections.forEach((iSection) => {
            let section = new Section(
              index,
              iSection,
              iBreakdown.beatsPerMeasure,
              new Color(0)
            );
            index = section.endIndex + 1;
            section.phrases.forEach((phrase) => {
              phrase.forEach((measure) => {
                ones.push(measure.startIndex);
              });
            });
          });
          let leadInSeconds = 5,
            minBeats = Math.ceil(leadInSeconds * beatsPerSecond) + 4,
            leadOutSeconds = 2,
            maxBeats = index - 1 - Math.ceil(leadOutSeconds * beatsPerSecond);
          for (let i = 0; i <= ones.length - 8; i++) {
            if (ones[i] >= minBeats && ones[i] <= maxBeats)
              if (
                hard ===
                (ones[i + 8] !== ones[i] + 8 * iBreakdown!.beatsPerMeasure)
              )
                parameters.push({
                  songId,
                  startTime:
                    (iBreakdown!.trim ?? 0) +
                    (ones[i] - minBeats - 1) * secondsPerBeat,
                  startIndex: ones[i],
                  ones: ones.slice(i, i + 8),
                  hard,
                });
          }
        }
        let item = shuffle(parameters)[0],
          iBreakdown: IBreakdown;
        await this.http
          .get<IBreakdown>(`${path}${item.songId}/breakdown.json`)
          .toPromise()
          .then((breakdown) => (iBreakdown = breakdown));
        let info: IGameInfo = {
          songId: item.songId,
          iSong: iSongs![item.songId],
          iBreakdown: iBreakdown!,
          startTime: item.startTime,
          startIndex: item.startIndex,
          ones: item.ones,
          hard,
        };
        observer.next(info);
        observer.complete();
      })();
    });
  }
}
