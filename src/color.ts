import { CSSColors, CSSColor } from "./util/css-colors";

import {
  isHex,
  isRgb,
  isCSSColor,
  percentage,
  isHsl,
  rotate,
  toHex,
  fullHex,
  normalToByte,
  unit,
  byte,
  RGBtoHSL,
  HSLtoRGB,
  contrast,
  brightness,
  solid
} from "./util";

import type { 
  FilterMethod,
  FilterOptions,
  Byte,
  BytesRGB,
  BytesRGBA,
  BytesHSL,
  BytesHSLA
} from "./types";

export class Color {
  #r: Byte;
  #g: Byte;
  #b: Byte;
  #a: Byte;

  #alpha: number;
  #backgound?: Color;

  #hsl?: number[];
  #luma?: number;
  #lumaYUV?: number;

  constructor(r: Byte, g: Byte, b: Byte, a?: Byte) {
    this.#r = r;
    this.#g = g;
    this.#b = b;
    this.#a = a ?? 255;
    this.#alpha = this.#a / 255;
  }

  static from(color: string | Color) {
    if (color instanceof Color) { return color.clone() }

    if (isHex(color)) { return this.fromHex(color) }
    if (isRgb(color)) { return this.fromRgb(color) }
    if (isHsl(color)) { return this.fromHsl(color) }
    if (isCSSColor(color)) { return this.fromCSSColor(color as CSSColor) }

    throw new Error("color not supported " + color);
  }

  static fromRgb(color: string) {
    let rgb = color.split("(")[1]?.split(")")[0]?.split(",");

    if (!rgb || rgb.length < 3) {
      throw new Error("invalid rgb color " + color);
    }

    return new Color(
      parseInt(rgb[0]),
      parseInt(rgb[1]),
      parseInt(rgb[2]),
      normalToByte(parseFloat(rgb[3])) || 255,
    );
  }

  static fromHex(color: string) {
    let hex = fullHex(color);

    return new Color(
      parseInt(hex.substring(1, 3), 16),
      parseInt(hex.substring(3, 5), 16),
      parseInt(hex.substring(5, 7), 16),
      parseInt(hex.substring(7, 9), 16) || 255,
    );
  }

  static fromHsl(color: string) {
    let [clr, alpha] = color.split("(")[1]?.split(")")[0]?.split("/");

    if (!clr) {
      throw new Error("invalid hsl color " + color);
    }

    let data = clr.split(" ");

    if (data.length < 3) {
      throw new Error("invalid hsl color " + color);
    }

    let hsl = [
      parseInt(data[0].replace("%", "")),
      parseInt(data[1].replace("%", "")),
      parseInt(data[2].replace("%", "")),
    ];

    let [r, g, b] = HSLtoRGB(hsl);

    let a = parseFloat(alpha?.replace("%", "")) || 1;
    a = byte((a > 1 ? a * 2.55 : a * 255));

    return new Color(r, g, b, a).#setHsl(hsl);
  }

  static fromCSSColor(color: CSSColor) {
    let [r, g, b] = CSSColors[color];
    return new Color(r, g, b);
  }

  /** the rgb bytes */
  get bytesRGB(): BytesRGB {
    return [this.#r, this.#g, this.#b];
  }

  /** the rgba bytes */
  get bytesRGBA(): BytesRGBA {
    return [this.#r, this.#g, this.#b, this.#a];
  }

  /** the hsl ~bytes */
  get bytesHSL(): BytesHSL {
    if (!this.#hsl) {
      this.#hsl = RGBtoHSL(this.bytesRGB);
    }
    return this.#hsl as BytesHSL;
  }

  /** the hsla ~bytes */
  get bytesHSLA(): BytesHSLA {
    if (!this.#hsl) {
      this.#hsl = RGBtoHSL(this.bytesRGB);
    }
    return this.#hsl.concat(this.#alpha) as BytesHSLA;
  }

  get alpha() {
    return this.#alpha;
  }

  get red() {
    return this.#r;
  }

  get green() {
    return this.#g;
  }

  get blue() {
    return this.#b;
  }

  /** the hex string */
  get hex() {
    return "#"
      + toHex(this.#r)
      + toHex(this.#g)
      + toHex(this.#b);
  }

  /** the hex alpha string */
  get hexa() {
    return "#"
      + toHex(this.#r)
      + toHex(this.#g)
      + toHex(this.#b)
      + toHex(this.#a);
  }

  /** the rgb string */
  get rgb() {
    return `rgb(${this.#r},${this.#g},${this.#b})`;
  }

  /** the rgb alpha string */
  get rgba() {
    return `rgba(${this.#r},${this.#g},${this.#b},${this.#alpha})`;
  }

  /** the hsl string */
  get hsl() {
    if (!this.#hsl) {
      this.#hsl = RGBtoHSL(this.bytesRGB);
    }

    return `hsl(${this.#hsl[0]} ${this.#hsl[1]}% ${this.#hsl[2]}%)`
  }

  /** the hsl alpha string */
  get hsla() {
    if (!this.#hsl) {
      this.#hsl = RGBtoHSL(this.bytesRGB);
    }

    return `hsla(${this.#hsl[0]} ${this.#hsl[1]}% ${this.#hsl[2]}% / ${this.#alpha})`
  }

  get luma() {
    if (!this.#luma) {
      if (this.hasAlpha) {
        let [r, g, b] = this.#backgound?.bytesRGB ?? [255, 255, 255];
        this.#luma = (
          0.2126 * solid(this.#r, r, this.#alpha)
          + 0.7152 * solid(this.#g, g, this.#alpha)
          + 0.0722 * solid(this.#b, b, this.#alpha)
        ) / 255;
      } else {
        this.#luma = (
          0.2126 * this.#r
          + 0.7152 * this.#g
          + 0.0722 * this.#b
        ) / 255;
      }
    }

    return this.#luma;
  }

  get lumaYUV() {
    if (!this.#lumaYUV) {
      if (this.hasAlpha) {
        let [r, g, b] = this.#backgound?.bytesRGB ?? [255, 255, 255];
        this.#lumaYUV = (
          0.299 * solid(this.#r, r, this.#alpha)
          + 0.587 * solid(this.#g, g, this.#alpha)
          + 0.114 * solid(this.#b, b, this.#alpha)
        ) / 255;
      } else {
        this.#lumaYUV = (
          0.299 * this.#r
          + 0.587 * this.#g
          + 0.114 * this.#b
        ) / 255;
      }
    }

    return this.#lumaYUV;
  }

  get hasAlpha() {
    return this.#a !== 255;
  }

  get isDark() {
    return this.lumaYUV < 0.5;
  }

  get isLight() {
    return this.lumaYUV >= 0.5;
  }

  background(color?: Color) {
    this.#backgound = color;
    return this;
  }

  backgroundFrom(color: string) {
    this.#backgound = Color.from(color);
    return this;
  }

  filter(filters: Partial<FilterOptions>, clone?: boolean) {
    let target = clone ? this.clone() : this;

    let method: FilterMethod;
    for (method in filters) {
      if (
        method in this &&
        typeof target[method] === "function"
      ) {
        typeof filters[method] === "boolean"
          ? (target[method] as any)()
          : (target[method] as any)(filters[method]);
      }
    }

    return target;
  }

  contrast(value: number) {
    this.#r = contrast(this.#r, value);
    this.#g = contrast(this.#g, value);
    this.#b = contrast(this.#b, value);
    this.#clearChache();
    this.#hsl = undefined;
    return this;
  }

  brightness(value: number) {
    this.#r = brightness(this.#r, value);
    this.#g = brightness(this.#g, value);
    this.#b = brightness(this.#b, value);
    this.#clearChache();
    this.#hsl = undefined;
    return this;
  }

  opacity(value: number) {
    this.#alpha = unit(value);
    this.#a = byte(Math.round(this.#alpha * 255));
    this.#clearChache();
    return this;
  }

  solid() {
    if (this.hasAlpha) {
      let [r, g, b] = this.#backgound?.bytesRGB ?? [255, 255, 255];
      this.#r = solid(this.#r, r, this.#alpha);
      this.#g = solid(this.#g, g, this.#alpha);
      this.#b = solid(this.#b, b, this.#alpha);
      this.#a = 255;
      this.#alpha = 1;
      this.#clearChache();
      this.#hsl = undefined;
    }
    return this;
  }

  hueRotate(deg: number) {
    let [h, s, l] = this.bytesHSL;
    h = rotate(h, deg);
    this.#hsl = [h,s,l];
    let [r, g, b] = HSLtoRGB([h, s, l]);
    this.#r = r;
    this.#g = g;
    this.#b = b;
    this.#clearChache();
    return this;
  }

  saturation(value: number) {
    let [h, s, l] = this.bytesHSL;
    s = percentage(s * value);
    this.#hsl = [h,s,l];
    let [r, g, b] = HSLtoRGB([h, s, l]);
    this.#r = r;
    this.#g = g;
    this.#b = b;
    this.#clearChache();
    return this;
  }

  invert() {
    this.#r = 255 - this.#r;
    this.#g = 255 - this.#g;
    this.#b = 255 - this.#b;
    this.#clearChache();
    this.#hsl = undefined;
    return this;
  }

  clone() {
    return new Color(this.#r, this.#g, this.#b, this.#a).#loadCache(this);
  }

  #setHsl(hsl: number[]) {
    this.#hsl = hsl;
    return this;
  }

  #loadCache(from: Color) {
    this.#backgound = from.#backgound;
    this.#luma = from.#luma;
    this.#lumaYUV = from.#lumaYUV;
    this.#hsl = from.#hsl;
    return this;
  }

  #clearChache() {
    this.#luma = undefined;
    this.#lumaYUV = undefined;
    // this.#hsl = undefined;
  }
}
