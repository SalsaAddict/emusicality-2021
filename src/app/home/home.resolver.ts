import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from "@angular/router";
import { ISongs } from "src/schema/schema";

@Injectable({ providedIn: "root" })
export class HomeResolver implements Resolve<ISongs> {
  constructor(private readonly http: HttpClient) {}
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.http.get<ISongs>("/assets/songs/songs.json");
  }
}
