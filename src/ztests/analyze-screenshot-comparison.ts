import {addAttach} from 'jest-html-reporters/helper';
import {expect} from '@jest/globals';
import {IImgPack, ITask} from '../task';
import {PngUtil} from '../png.util';

type BufferFormat = 'png' | 'jpg';

export async function analyzeScreenshotComparison(task: ITask, bufferFormat: BufferFormat = 'png'): Promise<void> {
  const result = await (task as Required<ITask>).compareScreenshotResult();
  if (!result.isEqual) {
    await addAttach(params(result.diff, 'DIFF', bufferFormat));
    await addAttach(params(result.orig, 'ORIGINAL', bufferFormat));
    await addAttach(params(result.toCompare, 'TO COMPARE', bufferFormat));
  }
  expect(result.isEqual).toBeTruthy();
}

function params(imgPack: IImgPack, description: string, bufferFormat: BufferFormat): any {
  return {attach: getAttach(imgPack, bufferFormat), description, bufferFormat};
}

function getAttach({png, pngBuf}: IImgPack, bufferFormat: BufferFormat): Buffer {
  switch (bufferFormat) {
    case 'png':
      return pngBuf;
    case 'jpg':
      return PngUtil.toJpeg(png).data;
    default:
      throw new Error(`Unknown bufferFormat "${bufferFormat}".`);
  }
}
