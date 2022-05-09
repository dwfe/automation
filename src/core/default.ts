import {PixelmatchOptions} from 'pixelmatch'

// https://www.npmjs.com/package/pixelmatch#pixelmatchimg1-img2-output-width-height-options
export const defaultPixelmatchOptions: PixelmatchOptions = {
  threshold: 0.1,
  includeAA: true, // if 'true', disables detecting and ignoring anti-aliased pixels
  alpha: 0.1,
  diffColor: [0, 0, 255],    // blue  - цвет оригинала
  diffColorAlt: [255, 0, 0], // red   - цвет расхождения с оригиналом
  aaColor: [0, 165, 0],      // green - цвет расхождения anti-aliased pixels с оригиналом
  diffMask: false,
}
