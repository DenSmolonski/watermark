import { createAction, props } from '@ngrx/store';
import {
  IImgUpdateOptions,
  ITextUpdateOptions,
} from 'src/app/services/watermark.service';
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
  props<{ fileId: string; watermark: ITextUpdateOptions | IImgUpdateOptions }>()
);
export const updateWatermark = createAction(
  '[Files] update watermark',
  props<{ fileId: string; watermark: ITextUpdateOptions | IImgUpdateOptions }>()
);
export const removeAllWateramrk = createAction(
  '[Files] remove all watermark',
  props<{ fileId: string }>()
);
export const removeWateramrk = createAction(
  '[Files] remove watermark',
  props<{ fileId: string; watermarkName: string }>()
);
export const resetFiles = createAction('[Files] reset');
