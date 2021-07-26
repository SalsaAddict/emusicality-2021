export class Color {
  constructor(
    public readonly hue: number,
    public readonly saturation: number = 90,
    public readonly lightness: number = 55
  ) {}
  private alpha(dimmed: boolean) {
    return dimmed ? 0.4 : 1;
  }
  private hsla(h: number, s: number, l: number, a: number) {
    return `hsla(${h},${s}%,${l}%,${a})`;
  }
  private important(expression: string) {
    return `${expression} !important`;
  }
  public solid(dimmed: boolean = false) {
    return this.important(
      this.hsla(this.hue, this.saturation, this.lightness, this.alpha(dimmed))
    );
  }
  public gradient(dimmed: boolean = false) {
    let solid = this.hsla(
        this.hue,
        this.saturation,
        this.lightness,
        this.alpha(dimmed)
      ),
      light = this.hsla(
        this.hue,
        (this.saturation * 75) / 100,
        (this.lightness * 135) / 100,
        this.alpha(dimmed)
      );
    return this.important(
      `radial-gradient(circle,${dimmed ? solid : light},${solid})`
    );
  }
}

export type Colors =
  | "red"
  | "orange"
  | "yellow"
  | "springgreen"
  | "green"
  | "turquoise"
  | "cyan"
  | "ocean"
  | "blue"
  | "violet"
  | "magenta"
  | "raspberry";

export type IPalette = {
  [name: string]: Color;
};

export function assignColors(ids: string[]): IPalette {
  let output: IPalette = {},
    available: IPalette = {
      red: new Color(0),
      orange: new Color(30),
      yellow: new Color(60),
      springgreen: new Color(90),
      green: new Color(120),
      turquoise: new Color(150),
      cyan: new Color(180),
      ocean: new Color(210),
      blue: new Color(240, 80, 60),
      violet: new Color(270),
      magenta: new Color(300),
      raspberry: new Color(330),
    },
    standard: { [section: string]: Colors } = {
      intro: "cyan",
      verse: "orange",
      "pre chorus": "yellow",
      chorus: "green",
      mambo: "ocean",
      bridge: "raspberry",
    };
  ids.forEach((id) => {
    let lookup = id.trim().toLowerCase();
    if (standard[lookup] && available[standard[lookup]]) {
      output[id] = available[standard[lookup]];
      delete available[standard[lookup]];
    } else if (Object.keys(available).length > 0) {
      let color = Object.keys(available).pop();
      output[id] = available[color!];
      delete available[color!];
    } else output[id] = new Color(0, 255, 255);
  });
  return output;
}
