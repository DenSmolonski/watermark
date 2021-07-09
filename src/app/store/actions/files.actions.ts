import { createAction, props } from '@ngrx/store';
import {
  IImgUpdateOptions,
  ITextUpdateOptions,
} from 'src/app/components/add-watermark/add-watermark.component';
import { FileData } from '../reducers/files.reducer';

export const pushFile = createAction(
  '[Files] push file',
  props<{ file: FileData }>()
);
export const deleteFile = createAction(
  '[Files] delete file',
  props<{ file: FileData }>()
);
export const addWatermark = createAction(
  '[Files] add watermark',
  props<{
    fileId: string;
    canvasAsDataUrl: string;
    watermark: Array<ITextUpdateOptions | IImgUpdateOptions>;
  }>()
);
export const removeAllWateramrk = createAction(
  '[Files] remove all watermark',
  props<{ fileId: string }>()
);
export const applyWateramrkToAll = createAction(
  '[Files] apply watermark to all',
  props<{ fileId: string }>()
);
export const resetFiles = createAction('[Files] reset');
