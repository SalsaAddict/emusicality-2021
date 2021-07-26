import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ISongs } from "src/schema/schema";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent {
  constructor(route: ActivatedRoute) {
    this.iSongs = route.snapshot.data.iSongs;
  }
  public readonly iSongs: ISongs;
  public songUrl(songId: string) {
    return `/songs/${songId}`;
  }
  public songImg(songId: string) {
    return `/assets/songs/${songId}/cover.jpg`;
  }
  public levels: string[] = ["easy", "hard"];
  public gameUrl(level: string) {
    return `/games/findtheone/${level}`;
  }
}
