import {PackerOptions, PNG, PNGWithMetadata} from 'pngjs';
import {readFileSync, writeFileSync} from 'fs';
import * as JPEG from 'jpeg-js';
import {RawImageData} from 'jpeg-js';
import pixelmatch from 'pixelmatch';
import {defaultPixelmatchOptions} from './default'
import {IImgCompareResult} from './task'
import {Env, IEnvOpt} from './env';

export class PngUtil {

  constructor(public env: Env) {
  }

  read(path: string): PNGWithMetadata {
    return PNG.sync.read(readFileSync(path));
  }

  readBuffer(buf: Buffer): PNGWithMetadata {
    return PNG.sync.read(buf);
  }

  write(path: string, png: PNG): void {
    writeFileSync(path, this.writeBuffer(png));
  }

  /**
   * Процесс перекодирования в PNG:
   *   Raw data -------> Filtered data ----------> Compressed data -------> Formatted PNG
   *             Apply                  Compress                    Apply
   *            filters               (as Deflate)                  CRC32
   *
   * http://www.libpng.org/pub/png/spec/1.2/PNG-Filters.html
   * https://habr.com/ru/post/366677/
   */
  writeBuffer(png: PNG, opt: PackerOptions = {filterType: 4}): Buffer {
    return PNG.sync.write(png, opt);
  }

  compare(origImgBuf: Buffer, imgToCompareBuf: Buffer): IImgCompareResult {
    const origImg = this.readBuffer(origImgBuf);
    const imgToCompare = this.readBuffer(imgToCompareBuf);
    const {width, height} = origImg;
    const diffImg = new PNG({width, height});
    const options = this.opt.pixelmatch || defaultPixelmatchOptions;
    const diffPixelsCount = pixelmatch(origImg.data, imgToCompare.data, diffImg.data, width, height, options);
    const isEqual = diffPixelsCount === 0;
    const result: IImgCompareResult = {isEqual, diffPixelsCount};
    if (!isEqual) {
      result.diff = {
        png: diffImg,
        pngBuf: this.writeBuffer(diffImg),
      };
      result.orig = {
        png: origImg,
        pngBuf: origImgBuf,
      };
      result.toCompare = {
        png: imgToCompare,
        pngBuf: imgToCompareBuf,
      };
    }
    return result;
  }

  static toJpeg(png: PNG, quality = 100): RawImageData<Buffer> {
    return JPEG.encode(png, quality);
  }


//region Support

  private get opt(): IEnvOpt {
    return this.env.opt;
  }

//endregion

}

