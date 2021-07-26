import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FindTheOneComponent } from "./find-the-one/find-the-one.component";
import { FindTheOneResolver } from "./find-the-one/find-the-one.resolver";
import { HomeComponent } from "./home/home.component";
import { HomeResolver } from "./home/home.resolver";
import { SongComponent } from "./song/song.component";
import { SongResolver } from "./song/song.resolver";

const routes: Routes = [
  {
    path: "home",
    component: HomeComponent,
    resolve: { iSongs: HomeResolver },
  },
  {
    path: "games/findtheone/:level",
    component: FindTheOneComponent,
    resolve: { iGameInfo: FindTheOneResolver },
  },
  {
    path: "games/findtheone",
    redirectTo: "/games/findtheone/easy",
    pathMatch: "full",
  },
  {
    path: "songs/:songId",
    component: SongComponent,
    resolve: { iMetadata: SongResolver },
  },
  { path: "", redirectTo: "/home", pathMatch: "full" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
