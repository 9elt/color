import { RGBa } from "./rgb";
import { HSLa } from "./hsl";

import {
  isCSSColor, CSSColor, CSSColors,
  isHex, isRgb, isHsl,
  rgbToRGB, hexToRGB, hslToHSL,
  RGBToHex, RGBToHexa, RGBToRgb, RGBToRgba,
  HSLtoHsl, HSLtoHsla,
  lumaAlpha, luma, lumaYUVAlpha, lumaYUV,
} from "./util";

import type {
  RGBAbytes, HSLAbytes,
  FilterMethod, FilterOptions,
} from "./types";



export class Color {
  #_RGBa: RGBa;
  #_HSLa: HSLa;
  #outdated: number; // -1 none 0 #_RGBa 1 #_HSLa

  #backgound?: Color;
  #luma?: number;
  #lumaYUV?: number;

  constructor() { }

  static #fromRGBa(rgba: RGBAbytes) {
    let color = new Color();
    color.#_RGBa = new RGBa(rgba);
    color.#outdated = 1;
    return color;
  }

  static #fromHSLa(hsla: HSLAbytes) {
    let color = new Color();
    color.#_HSLa = new HSLa(hsla);
    color.#outdated = 0;
    return color;
  }

  static from(color: string | Color) {
    if (color instanceof Color) { return color.clone() }

    if (isHex(color)) { return this.fromHex(color) }
    if (isRgb(color)) { return this.fromRgb(color) }
    if (isHsl(color)) { return this.fromHsl(color) }
    if (isCSSColor(color)) { return this.fromCSSColor(color as CSSColors) }

    throw new Error("color not supported " + color);
  }

  static fromRgb(color: string) {
    return this.#fromRGBa(rgbToRGB(color));
  }

  static fromHex(color: string) {
    return this.#fromRGBa(hexToRGB(color));
  }

  static fromHsl(color: string) {
    return this.#fromHSLa(hslToHSL(color));
  }

  static fromCSSColor(color: CSSColors) {
    return this.#fromRGBa(CSSColor(color));
  }

  get #RGBa() {
    if (this.#outdated === 0) {
      this.#_RGBa = RGBa.fromHSLa(this.#_HSLa);
      this.#outdated = -1;
    }
    return this.#_RGBa;
  }

  get #HSLa() {
    if (this.#outdated === 1) {
      this.#_HSLa = HSLa.fromRGBa(this.#_RGBa);
      this.#outdated = -1;
    }
    return this.#_HSLa;
  }

  get #preferRGBa() {
    if (this.#outdated !== 0) {
      return this.#_RGBa;
    }
    return this.#_HSLa;
  }

  get #preferHSLa() {
    if (this.#outdated !== 1) {
      return this.#_HSLa;
    }
    return this.#_RGBa;
  }

  #outdateRGBa(preferred?: boolean) {
    if (preferred) {
      if (this.#outdated !== 1) {
        this.#outdated = 0;
      }
    } else {
      this.#outdated = 0;
    }
  }

  #outdateHSLa(preferred?: boolean) {
    if (preferred) {
      if (this.#outdated !== 0) {
        this.#outdated = 1;
      }
    } else {
      this.#outdated = 1;
    }
  }

  get bytes(): RGBAbytes { return this.#RGBa.bytes; }
  get HSLbytes(): HSLAbytes { return this.#HSLa.bytes; }

  get alpha() { return this.#preferHSLa.alpha; }
  get hasAlpha() { return this.#preferHSLa.hasAlpha; }

  get isDark() { return this.lumaYUV < 0.5; }
  get isLight() { return this.lumaYUV >= 0.5; }

  get red() { return this.#RGBa.r; }
  get green() { return this.#RGBa.g; }
  get blue() { return this.#RGBa.b; }

  get hue() { return this.#HSLa.h; }
  get saturation() { return this.#HSLa.s; }
  get lightness() { return this.#HSLa.l; }

  get hex() { return RGBToHex(this.#RGBa.bytes); }
  get hexa() { return RGBToHexa(this.#RGBa.bytes); }

  get rgb() { return RGBToRgb(this.#RGBa.bytes); }
  get rgba() { return RGBToRgba(this.#RGBa.bytes); }

  get hsl() { return HSLtoHsl(this.#HSLa.bytes); }
  get hsla() { return HSLtoHsla(this.#HSLa.bytes); }

  get luma() {
    if (!this.#luma) {
      this.#luma = this.hasAlpha
        ? lumaAlpha(this.#RGBa.bytes, this.#backgound?.bytes)
        : luma(this.#RGBa.bytes)
    }

    return this.#luma;
  }

  get lumaYUV() {
    if (!this.#lumaYUV) {
      this.#lumaYUV = this.hasAlpha
        ? lumaYUVAlpha(this.#RGBa.bytes, this.#backgound?.bytes)
        : lumaYUV(this.#RGBa.bytes)
    }

    return this.#lumaYUV;
  }

  background(color: Color | string) {
    this.#backgound = color instanceof Color
      ? color : Color.from(color);
    return this;
  }

  filter(filters: Partial<FilterOptions>) {
    let method: FilterMethod;

    for (method in filters) {
      if (
        method in this &&
        typeof this[method] === "function"
      ) {
        typeof filters[method] === "boolean"
          ? (this[method] as any)()
          : (this[method] as any)(filters[method]);
      }
    }

    return this;
  }

  contrast(value: number) {
    this.#RGBa.contrast(value);
    this.#outdateHSLa();
    this.#clearLumaCache();
    return this;
  }

  brightness(value: number) {
    this.#RGBa.brightness(value);
    this.#outdateHSLa();
    this.#clearLumaCache();
    return this;
  }

  opacity(value: number) {
    this.#preferRGBa?.opacity(value);
    this.#outdateHSLa(true);
    this.#clearLumaCache();
    return this;
  }

  solid() {
    if (this.hasAlpha) {
      this.#RGBa.solid(this.#backgound?.bytes);
      this.#outdateHSLa();
      this.#clearLumaCache();
    }
    return this;
  }

  rotateHue(deg: number) {
    this.#HSLa.rotateHue(deg);
    this.#outdateRGBa();
    this.#clearLumaCache();
    return this;
  }

  saturate(value: number) {
    this.#HSLa.saturate(value);
    this.#outdateRGBa();
    this.#clearLumaCache();
    return this;
  }

  invert() {
    this.#RGBa.invert();
    this.#outdateHSLa();
    this.#clearLumaCache();
    return this;
  }

  invertHSL() {
    this.#HSLa.invert();
    this.#outdateRGBa();
    this.#clearLumaCache();
    return this;
  }

  clone() {
    const clone = new Color();

    clone.#backgound = this.#backgound?.clone();

    clone.#_HSLa = this.#_HSLa?.clone();
    clone.#_RGBa = this.#_RGBa?.clone();

    clone.#outdated = this.#outdated;
    clone.#luma = this.#luma;
    clone.#lumaYUV = this.#lumaYUV;

    return clone;
  }

  #clearLumaCache() {
    this.#luma = undefined;
    this.#lumaYUV = undefined;
  }
}
