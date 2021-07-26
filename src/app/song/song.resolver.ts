import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from "@angular/router";
import { Observable } from "rxjs";
import { ISongs, IBreakdown, IMetadata } from "src/schema/schema";

@Injectable({ providedIn: "root" })
export class SongResolver implements Resolve<IMetadata> {
  constructor(private http: HttpClient) {}
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return new Observable<IMetadata>((observer) => {
      let path = "/assets/songs/",
        songId: string = route.params["songId"];
      this.http.get<ISongs>(`${path}songs.json`).subscribe((iSongs) => {
        path += `${songId}/`;
        this.http
          .get<IBreakdown>(`${path}breakdown.json`)
          .subscribe((iBreakdown) => {
            observer.next({ songId, iSong: iSongs[songId], iBreakdown });
            observer.complete();
          });
      });
    });
  }
}
