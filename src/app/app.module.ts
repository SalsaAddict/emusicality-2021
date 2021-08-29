import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { ServiceWorkerModule } from "@angular/service-worker";
import { environment } from "../environments/environment";
import { SongComponent } from "./song/song.component";
import { MDASH } from "src/schema/schema";
import { FormsModule } from "@angular/forms";
import { FindTheOneComponent } from "./find-the-one/find-the-one.component";
import { HomeComponent } from "./home/home.component";

@NgModule({
  declarations: [
    AppComponent,
    SongComponent,
    FindTheOneComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ServiceWorkerModule.register("ngsw-worker.js", {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

export function fade(
  context: AudioContext,
  node: GainNode,
  value: number,
  seconds: number
): Promise<void> {
  return new Promise<void>((resolve) => {
    if (context.state === "running") {
      node.gain.linearRampToValueAtTime(value, context.currentTime + seconds);
      setTimeout(resolve, seconds * 1005);
    } else {
      node.gain.value = value;
      resolve();
    }
  });
}

export function mdash(value?: string) {
  return (value ?? "").trim() === "" ? MDASH : value;
}

export function shuffle<T>(array: T[]) {
  var currentIndex = array.length,
    randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

const appHeight = () => {
  const doc = document.documentElement;
  doc.style.setProperty(
    "--app-height",
    `${doc.clientHeight || window.innerHeight}px`
  );
};
var resizeHandle: number;
window.addEventListener("resize", () => {
  window.clearTimeout(resizeHandle);
  window.setTimeout(appHeight, 50);
});
appHeight();
