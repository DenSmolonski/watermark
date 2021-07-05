import { Action, createReducer, on } from '@ngrx/store';
import {
  IImgUpdateOptions,
  ITextUpdateOptions,
} from 'src/app/services/watermark.service';
import * as filesActions from './../actions/files.actions';

export interface FileData {
  id: string;
  fileAsDataUrl: string;
  file: File;
  watermarks: Array<ITextUpdateOptions | IImgUpdateOptions>;
}

export interface FilesState {
  files: Array<FileData>;
}

const initState: FilesState = {
  files: [],
};

const filesReducer = createReducer(
  initState,
  on(filesActions.pushFile, (state: FilesState, { file }) => ({
    ...state,
    files: [...state.files, file],
  })),
  on(filesActions.deleteFile, (state: FilesState, { file }) => ({
    ...state,
    files: state.files.filter((item) => item.id !== file.id),
  })),
  on(filesActions.addWatermark, (state: FilesState, { fileId, watermark }) => ({
    ...state,
    files: state.files.map((item) => {
      if (item.id === fileId) {
        item.watermarks.push(watermark);
      }
      return item;
    }),
  })),
  on(
    filesActions.updateWatermark,
    (state: FilesState, { fileId, watermark }) => ({
      ...state,
      files: state.files.map((item) => {
        if (item.id === fileId) {
          item.watermarks = [
            ...item.watermarks.filter((i) => i.name !== watermark.name),
            watermark,
          ];
        }
        return item;
      }),
    })
  ),
  on(filesActions.removeAllWateramrk, (state: FilesState, { fileId }) => ({
    ...state,
    files: state.files.map((item) => {
      if (item.id === fileId) {
        item.watermarks = [];
      }
      return item;
    }),
  })),
  on(
    filesActions.removeWateramrk,
    (state: FilesState, { fileId, watermarkName }) => ({
      ...state,
      files: state.files.map((item) => {
        if (item.id === fileId) {
          item.watermarks = item.watermarks.filter(
            (i) => i.name !== watermarkName
          );
        }
        return item;
      }),
    })
  ),
  on(filesActions.resetFiles, (state: FilesState) => ({
    ...state,
    files: [],
  }))
);

export function reducer(state: FilesState | undefined, action: Action) {
  return filesReducer(state, action);
}
