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

// Lazily implements Rgb and Hsl color models
//
// `this[MODEL]` specifies the up-to-date models
// `RGB`, `HSL` or `HSL | RGB` (both)

export class Color extends Uint16Array {
    constructor(color: Color);

    constructor(r: number, g: number, b: number, a: number);

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

export function hsl(color: Color): void {
    if (color[MODEL] & HSL)

        // HSL already up to date
        return;

    let r = color[R] / 255;
    let g = color[G] / 255;
    let b = color[B] / 255;

    let l = Math.max(r, g, b);
    let s = l - Math.min(r, g, b);
    let h = 0;

    if (s !== 0)
        switch (l) {
            case r: h = (g - b) / s; break;
            case g: h = (b - r) / s + 2; break;
            case b: h = (r - g) / s + 4; break;
        };

    color[H] = 60 * h < 0 ? 60 * h + 360 : 60 * h;
    color[S] = 100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0);
    color[L] = (100 * (2 * l - s)) / 2;

    color[MODEL] |= HSL;
}

export function rgb(color: Color): void {
    if (color[MODEL] & RGB)

        // RGB already up to date
        return;

    let h = color[H];
    let l = color[L] / 100;
    let s = (color[S] / 100) * Math.min(l, 1 - l);

    const f = (n: number) => {
        n = (n + h / 30) % 12;
        return 255 * (l - s * Math.max(-1, Math.min(n - 3, 9 - n, 1)));
    };

    color[R] = f(0);
    color[G] = f(8);
    color[B] = f(4);

    color[MODEL] |= RGB;
}

export function luma(color: Color): number {
    rgb(color);

    return 0.2126 * color[R] + 0.7152 * color[G] + 0.0722 * color[B];
}

export function contrast(a: Color, b: Color): number {
    const luma_a = luma(a) / 255;
    const luma_b = luma(b) / 255;

    return (Math.max(luma_a, luma_b) + 0.05) / (Math.min(luma_a, luma_b) + 0.05);
}

// Y′UV https://en.wikipedia.org/wiki/Y%E2%80%B2UV

export function lumaYUV(color: Color): number {
    rgb(color);

    return 0.299 * color[R] + 0.587 * color[G] + 0.114 * color[B];
}

export function isDark(color: Color): boolean {
    return lumaYUV(color) < 128;
}

export function isLight(color: Color): boolean {
    return lumaYUV(color) >= 128;
}

// All methods modify colors in place, it is
// up to the user to clone them if needed `new Color(color)`

export function grayscale(color: Color): void {
    const gray = lumaYUV(color);

    color[R] = gray;
    color[G] = gray;
    color[B] = gray;

    color[MODEL] = RGB;
}

export function mix(into: Color, from: Color, stren = 0.5): void {
    rgb(into);
    rgb(from);

    const istren = 1 - stren;

    into[R] = into[R] * istren + from[R] * stren;
    into[G] = into[G] * istren + from[G] * stren;
    into[B] = into[B] * istren + from[B] * stren;
    into[A] = into[A] * istren + from[A] * stren;

    into[MODEL] = RGB;
}

export function fill(color: Color, background = new Color()): void {
    if (color[A] === 255)
        return;

    const stren = 1 - color[A] / 255;

    color[A] = 255;

    mix(color, background, stren);
}

export function opacity(color: Color, stren = 1): void {
    color[A] = stren * 255;
}

export function hue(color: Color, deg = 360): void {
    hsl(color);

    color[H] = deg;

    color[MODEL] = HSL;
}

export function saturation(color: Color, perc = 100): void {
    hsl(color);

    color[S] = perc;

    color[MODEL] = HSL;
}

export function lightness(color: Color, perc = 100): void {
    hsl(color);

    color[L] = perc;

    color[MODEL] = HSL;
}

export function rotate(color: Color, deg = 180): void {
    hsl(color);

    (color[H] = (color[H] + deg) % 360) < 0 && (color[H] += 360);

    color[MODEL] = HSL;
}

export function saturate(color: Color, stren = 1): void {
    hsl(color);

    color[S] = Math.min(100, color[S] * stren);

    color[MODEL] = HSL;
}

export function desaturate(color: Color, stren = 1): void {
    hsl(color);

    color[S] = Math.max(0, color[S] * (1 - stren));

    color[MODEL] = HSL;
}

export function lighten(color: Color, stren = 1): void {
    hsl(color);

    color[L] = Math.min(100, color[L] * (1 + stren));

    color[MODEL] = HSL;
}

export function darken(color: Color, stren = 1): void {
    hsl(color);

    color[L] = Math.max(0, color[L] * (1 - stren));

    color[MODEL] = HSL;
}

export function invert(color: Color): void {
    rgb(color);

    color[R] = 255 - color[R];
    color[G] = 255 - color[G];
    color[B] = 255 - color[B];

    color[MODEL] = RGB;
}

export function invertHsl(color: Color): void {
    hsl(color);

    color[H] = (color[H] + 180) % 360;

    color[S] = 100 - color[S];
    color[L] = 100 - color[L];

    color[MODEL] = HSL;
}

export function bytes(color: Color): Uint8Array {
    rgb(color);

    const bytes = new Uint8Array(4);

    bytes[0] = color[R];
    bytes[1] = color[G];
    bytes[2] = color[B];
    bytes[3] = color[A];

    return bytes;
}

export function bytesHsl(color: Color): Uint16Array {
    hsl(color);

    const bytes = new Uint16Array(4);

    bytes[0] = color[H];
    bytes[1] = color[S];
    bytes[2] = color[L];
    bytes[3] = color[A];

    return bytes;
}

export function eq(a: Color, b: Color): boolean {
    rgb(a);
    rgb(b);

    return a[R] === b[R]
        && a[G] === b[G]
        && a[B] === b[B]
        && a[A] === b[A];
}

export function fromString(color: string): Color {
    if (color.startsWith('#'))
        return fromHex(color);

    if (color.startsWith('rgb'))
        return fromRgb(color);

    throw new Error('Unsupported color string: ' + color);
}

export function fromHex(hex: string): Color {
    if (!/^#(([0-9a-f]{3,4})){1,2}$/i.test(hex))
        throw new Error('Invalid hex color: ' + hex);

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

export function fromRgb(rgba: string): Color {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*(\d*(?:\.\d+)?)?\)/);

    if (!match)
        throw new Error('Invalid rgba color: ' + rgba);

    return new Color(
        parseInt(match[1]),
        parseInt(match[2]),
        parseInt(match[3]),
        match[4] ? Math.round(parseFloat(match[4]) * 255) : 255
    );
}
