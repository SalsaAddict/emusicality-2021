export const MDASH = "&mdash;";
export const ALL = MDASH + " All " + MDASH;
export interface ISongs {
  [songId: string]: ISong;
}
export interface ISong {
  title: string;
  artist: string;
  genre: string;
  bpm: number;
}
export interface IBreakdown {
  trim?: number;
  beatsPerMeasure: number;
  tracks: ITracks;
  sections: ISection[];
}
export type ITracks = ITrackType[];
export type ITrackType = string | ITrack;
export interface ITrack {
  title: string;
  groups?: string | string[];
}
export interface ISection {
  title: string;
  structure?: string;
  phrases: IPhrases;
}
export type IPhrases = IPhrase[];
export type IPhrase = number | (string | number | IMeasure)[];
export interface IMeasure {
  structure?: string;
  beats?: number;
}
export interface IMetadata {
  songId: string;
  iSong: ISong;
  iBreakdown: IBreakdown;
}
