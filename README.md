# Color

Colors in javascript.

## usage

```javascript
import Color from "color";
```

### from

supports *hex*, *rgb*, *hsl* and all *css colors*

```javascript
let hex = Color.from("#fa4");
let rgb = Color.from("rgb(255,170,68)");
let hsl = Color.from("hsl(33 100% 63%)");
let css = Color.from("goldenrod");
```

### conversions and more

```javascript

let color = Color.from("rgb(255,170,68,0.5)");

color.hex;  // #ffaa44
color.hexa; // #ffaa4480

color.rgb;  // rgb(255,170,68)
color.rgba; // rgba(255,170,68,0.50)

color.hsl;  // hsl(33 100% 63%)
color.hsla; // hsl(33 100% 63% / 0.50)

color.bytes;    // [ 255, 170, 68, 128 ]
color.HSLbytes; // [ 33, 100, 63, 0.50196]

color.isDark;   // true
color.luma;     // 0.2126
color.lumaYUV;  // 0.299

```

### clone

```javascript
let copy = color.clone();
let same = Color.from(color);
```

### fiter methods

```javascript
copy
  .opacity(0.7)
  .contrast(1.7)
  .rotateHue(180)
  .saturate(1.5)
  .brightness(1.5)
  .invert();
```

or

```javascript
same.filter({
  opacity: 0.7,
  contrast: 1.7,
  rotateHue: 180,
  saturate: 1.5,
  brightness: 1.5,
  invert: true,
})
```

### background

convert a transparent color into a solid one, maintaining background influence

```javascript
Color.from("#ffaa4480").background("#fff").solid(); 
color.hex; //#ffd4a1
```
