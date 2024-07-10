// these can be used to directly access color bytes (e.g. color[R] for red),
// note, however, that bytes may not be up-to-date, and `rgb` (or `hsl`)
// function should be called before accessing them

export const R = 0;
export const G = 1;
export const B = 2;
export const A = 3;

export const H = 4;
export const S = 5;
export const L = 6;

export const MODEL = 7;

export const RGB = 1;
export const HSL = 2;

/**
 * core class
 */

export class Color extends Uint16Array {

    constructor(color: Color);

    constructor(r?: number, g?: number, b?: number, a?: number);

    constructor(
        r: number | Color = 255,
        g: number = 255,
        b: number = 255,
        a: number = 255
    ) {
        super(8);

        if (r instanceof Color) {
            for (let i = 0; i < 8;) {
                this[i] = r[i++];
            }
        }
        else {
            this[R] = r;
            this[G] = g;
            this[B] = b;
            this[A] = a;

            // Lazily implements Rgb and Hsl color models
            //
            // `this[MODEL]` specifies the up-to-date models
            // `RGB`, `HSL` or `HSL | RGB` (both)

            this[MODEL] = RGB;
        }
    }

    toString(): string {
        return this[MODEL] & RGB

            ? 'rgba('
            + this[R] + ','
            + this[G] + ','
            + this[B] + ','
            + (this[A] / 255).toFixed(2)
            + ')'

            : 'hsla('
            + this[H] + ','
            + this[S] + '%,'
            + this[L] + '%,'
            + (this[A] / 255).toFixed(2)
            + ')';
    }
}

/**
 * require the HSL model to be up-to-date
 */

export function hsl(color: Color): void {
    if (color[MODEL] & HSL) {

        // HSL already up-to-date
        return;
    }

    const r = color[R] / 255;
    const g = color[G] / 255;
    const b = color[B] / 255;

    const l = Math.max(r, g, b);
    const s = l - Math.min(r, g, b);
    const h = s === 0 ? 0 :
        l === r ? (g - b) / s :
            l === g ? 2 + (b - r) / s :
                4 + (r - g) / s;
    const a = 60 * h;

    color[H] = a < 0 ? a + 360 : a;
    color[S] = 100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0);
    color[L] = (100 * (2 * l - s)) / 2;

    color[MODEL] |= HSL;
}

/**
 * require the RGB model to be up-to-date
 */

export function rgb(color: Color): void {
    if (color[MODEL] & RGB) {

        // RGB already up-to-date
        return;
    }

    const l = color[L] / 100;
    const s = (color[S] / 100) * Math.min(l, 1 - l);
    const r = color[H] / 30;
    const rr = r % 12;
    const rg = (r + 8) % 12;
    const rb = (r + 4) % 12;

    color[R] = 255 * (l - s * Math.max(-1, Math.min(rr - 3, 9 - rr, 1)));
    color[G] = 255 * (l - s * Math.max(-1, Math.min(rg - 3, 9 - rg, 1)));
    color[B] = 255 * (l - s * Math.max(-1, Math.min(rb - 3, 9 - rb, 1)));

    color[MODEL] |= RGB;
}

/**
 * get the color luminosity
 */

export function luma(color: Color): number {
    rgb(color);

    return 0.2126 * color[R] + 0.7152 * color[G] + 0.0722 * color[B];
}

/**
 * get the color contrast ratio (ranges from 1 to 21)
 */

export function contrast(a: Color, b: Color): number {
    const luma_a = luma(a) / 255;
    const luma_b = luma(b) / 255;

    return (Math.max(luma_a, luma_b) + 0.05) / (Math.min(luma_a, luma_b) + 0.05);
}

/**
 * get the color luminosity using the Y'UV model
 * Y′UV https://en.wikipedia.org/wiki/Y%E2%80%B2UV
 */

export function lumaYUV(color: Color): number {
    rgb(color);

    return 0.299 * color[R] + 0.587 * color[G] + 0.114 * color[B];
}

/**
 * checks if the color is dark (using Y'UV model)
 */

export function isDark(color: Color): boolean {
    return lumaYUV(color) < 128;
}

/**
 * checks if the color is light (using Y'UV model)
 */

export function isLight(color: Color): boolean {
    return lumaYUV(color) >= 128;
}

/**
 * convert the color to grayscale
 */

export function grayscale(color: Color): Color {
    const gray = lumaYUV(color);

    return new Color(
        gray,
        gray,
        gray,
        color[A]
    );
}

/**
 * mix two colors
 * @param rstren - 0 to 1, default 0.5
 */

export function mix(into: Color, from: Color, rstren = 0.5): Color {
    rgb(into);
    rgb(from);

    const lstren = 1 - rstren;

    return new Color(
        into[R] * lstren + from[R] * rstren,
        into[G] * lstren + from[G] * rstren,
        into[B] * lstren + from[B] * rstren,
        into[A] * lstren + from[A] * rstren
    );
}

/**
 * fill the color transparency with a background color,
 * default white
 */

export function fill(color: Color, background = new Color()): Color {
    color = new Color(color);

    if (color[A] === 255) {
        return color;
    }

    const stren = 1 - color[A] / 255;

    color[A] = 255;

    return mix(color, background, stren);
}

/**
 * whiten the color
 * @param stren - 0 to 1, default 0.1
 */

export function whiten(color: Color, stren = 0.1): Color {
    return mix(color, new Color(), stren);
}

/**
 * blacken the color
 * @param stren - 0 to 1, default 0.1
 */

export function blacken(color: Color, stren = 0.1): Color {
    return mix(color, new Color(0, 0, 0), stren);
}

/**
 * set the color opacity
 * @param stren - 0 to 1, default 1
 */

export function opacity(color: Color, stren = 1): Color {
    color = new Color(color);

    color[A] = stren * 255;

    return color;
}

/**
 * set the color hue
 * @param deg - 0 to 360, default 360
 */

export function hue(color: Color, deg = 360): Color {
    hsl(color);
    color = new Color(color);

    color[H] = deg;
    color[MODEL] = HSL;

    return color;
}

/**
 * set the color saturation
 * @param perc - 0 to 100
 */

export function saturation(color: Color, perc = 100): Color {
    hsl(color);
    color = new Color(color);

    color[S] = perc;
    color[MODEL] = HSL;

    return color;
}

/**
 * set the color lightness
 * @param perc - 0 to 100, default 100
 */

export function lightness(color: Color, perc = 100): Color {
    hsl(color);
    color = new Color(color);

    color[L] = perc;
    color[MODEL] = HSL;

    return color;
}

/**
 * rotate the color hue
 * @param deg - -360 to 360, default 180
 */

export function rotate(color: Color, deg = 180): Color {
    hsl(color);
    color = new Color(color);

    (color[H] = (color[H] + deg) % 360) < 0 && (color[H] += 360);
    color[MODEL] = HSL;

    return color;
}

/**
 * multiply the color saturation
 * @param stren - -1 to 1, default 1
 */

export function saturate(color: Color, stren = 1): Color {
    hsl(color);
    color = new Color(color);

    color[S] = Math.min(100, color[S] * stren);
    color[MODEL] = HSL;

    return color;
}

/**
 * multiply the color lightness
 * @param stren - -1 to 1, default 1
 */

export function lighten(color: Color, stren = 1): Color {
    hsl(color);
    color = new Color(color);

    color[L] = Math.min(100, color[L] * (1 + stren));
    color[MODEL] = HSL;

    return color;
}

/**
 * multiply the color lightness
 * @param stren - -1 to 1, default 1
 */

export function darken(color: Color, stren = 1): Color {
    hsl(color);
    color = new Color(color);

    color[L] = Math.max(0, color[L] * (1 - stren));
    color[MODEL] = HSL;

    return color;
}

/**
 * invert the color in RGB
 */

export function invert(color: Color): Color {
    rgb(color);

    return new Color(
        255 - color[R],
        255 - color[G],
        255 - color[B],
        color[A]
    );
}

/**
 * invert the color in HSL
 */

export function invertHsl(color: Color): Color {
    hsl(color);
    color = new Color(color);

    color[H] = (color[H] + 180) % 360;
    color[S] = 100 - color[S];
    color[L] = 100 - color[L];
    color[MODEL] = HSL;

    return color;
}

/**
 * get the color RGBA bytes
 */

export function bytes(color: Color): Uint8Array {
    rgb(color);

    const bytes = new Uint8Array(4);

    bytes[0] = color[R];
    bytes[1] = color[G];
    bytes[2] = color[B];
    bytes[3] = color[A];

    return bytes;
}

/**
 * get the color HSLA bytes
 */

export function bytesHsl(color: Color): Uint16Array {
    hsl(color);

    const bytes = new Uint16Array(4);

    bytes[0] = color[H];
    bytes[1] = color[S];
    bytes[2] = color[L];
    bytes[3] = color[A];

    return bytes;
}

/**
 * checks RGBA equality
 */

export function eq(a: Color, b: Color): boolean {
    rgb(a);
    rgb(b);

    return a[R] === b[R]
        && a[G] === b[G]
        && a[B] === b[B]
        && a[A] === b[A];
}

/**
 * parse a color string, only supports hex and rgba,
 * throws if invalid or unsupported
 */

export function fromString(color: string): Color {
    if (color.startsWith('#')) {
        return fromHex(color);
    }

    if (color.startsWith('rgb')) {
        return fromRgb(color);
    }

    throw new Error('Unsupported color string: ' + color);
}

/**
 * parse a hex color string,
 * throws if invalid
 */

export function fromHex(hex: string): Color {
    if (!/^#(([0-9a-f]{3,4})){1,2}$/i.test(hex)) {
        throw new Error('Invalid hex color: ' + hex);
    }

    return hex.length < 6
        ? new Color(
            parseInt(hex[1] + hex[1], 16),
            parseInt(hex[2] + hex[2], 16),
            parseInt(hex[3] + hex[3], 16),
            hex.length === 5 ? parseInt(hex[4] + hex[4], 16) : 255
        )
        : new Color(
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16),
            hex.length === 9 ? parseInt(hex.slice(7, 9), 16) : 255
        );
}

/**
 * parse a rgba color string,
 * throws if invalid
 */

export function fromRgb(rgba: string): Color {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*(\d*(?:\.\d+)?)?\)/);

    if (!match) {
        throw new Error('Invalid rgba color: ' + rgba);
    }

    return new Color(
        parseInt(match[1]),
        parseInt(match[2]),
        parseInt(match[3]),
        match[4] ? Math.round(parseFloat(match[4]) * 255) : 255
    );
}
