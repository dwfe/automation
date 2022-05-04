import {readFileSync, writeFileSync} from 'fs';
import {PNG, PNGWithMetadata} from 'pngjs';
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
    writeFileSync(path, PNG.sync.write(png, {filterType: 4}));
  }

  compare(origImg: PNG, imgToCompare: PNG): IImgCompareResult {
    const {width, height} = origImg;
    const diffImg = new PNG({width, height});
    const options = this.opt.pixelmatch || defaultPixelmatchOptions;
    const diffPixelsCount = pixelmatch(origImg.data, imgToCompare.data, diffImg.data, width, height, options);
    return {
      isEqual: diffPixelsCount === 0,
      diffPixelsCount,
      origImg,
      imgToCompare,
      diffImg,
    };
  }

  compareBuf(origImgBuf: Buffer, imgToCompareBuf: Buffer): IImgCompareResult {
    const origImg = this.readBuffer(origImgBuf);
    const imgToCompare = this.readBuffer(imgToCompareBuf);
    return this.compare(origImg, imgToCompare);
  }

  toJpeg({data, width, height}: PNG, quality = 100): RawImageData<Buffer> {
    return JPEG.encode({data, width, height}, quality);
  }


//region Support

  private get opt(): IEnvOpt {
    return this.env.opt;
  }

//endregion

}

