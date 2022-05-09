import {addAttach} from 'jest-html-reporters/helper';
import {expect} from '@jest/globals';
import {IImgPack, ITask, PngUtil} from '../core';
import {BufferFormat} from './contract';

export async function analyzeScreenshotComparison(task: ITask, bufferFormat: BufferFormat = 'png'): Promise<void> {
  const result = await (task as Required<ITask>).compareScreenshotResult();
  if (!result.isEqual) {
    await addAttach(params(result.diff as IImgPack, 'DIFF', bufferFormat));
    await addAttach(params(result.orig as IImgPack, 'ORIGINAL', bufferFormat));
    await addAttach(params(result.toCompare as IImgPack, 'TO COMPARE', bufferFormat));
  }
  expect(result.isEqual).toBeTruthy();
}

function params(imgPack: IImgPack, description: string, bufferFormat: BufferFormat): any {
  return {attach: getAttach(imgPack, bufferFormat), description, bufferFormat};
}

function getAttach({png, pngBuf}: IImgPack, bufferFormat: BufferFormat): Buffer | undefined {
  switch (bufferFormat) {
    case 'png':
      return pngBuf;
    case 'jpg':
      return PngUtil.toJpeg(png).data;
    default:
      throw new Error(`Unknown bufferFormat "${bufferFormat}".`);
  }
}
