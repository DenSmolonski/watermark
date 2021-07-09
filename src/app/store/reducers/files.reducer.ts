import { Action, createReducer, on } from '@ngrx/store';
import {
  IImgUpdateOptions,
  ITextUpdateOptions,
} from 'src/app/components/add-watermark/add-watermark.component';
import * as filesActions from './../actions/files.actions';

export interface FileData {
  id: string;
  fileAsDataUrl: string;
  canvasAsDataUrl?: string;
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
  on(
    filesActions.addWatermark,
    (state: FilesState, { fileId, watermark, canvasAsDataUrl }) => {
      const newFiles = state.files.map((i) => Object.assign({}, i));
      newFiles.forEach((item) => {
        if (item.id === fileId) {
          item.watermarks = watermark;
          item.canvasAsDataUrl = canvasAsDataUrl;
        }
      });
      return {
        ...state,
        files: newFiles,
      };
    }
  ),
  on(filesActions.removeAllWateramrk, (state: FilesState, { fileId }) => {
    const newFiles = state.files.map((i) => Object.assign({}, i));
    newFiles.forEach((item) => {
      if (item.id === fileId) {
        item.watermarks = [];
      }
    });
    return {
      ...state,
      files: newFiles,
    };
  }),
  on(filesActions.applyWateramrkToAll, (state: FilesState, { fileId }) => {
    const file = state.files.find((i) => i.id === fileId);
    const newFiles = state.files.map((i) =>
      Object.assign({}, i, { watermarks: file?.watermarks })
    );
    return {
      ...state,
      files: newFiles,
    };
  }),
  on(filesActions.resetFiles, (state: FilesState) => ({
    ...state,
    files: [],
  }))
);

export function reducer(state: FilesState | undefined, action: Action) {
  return filesReducer(state, action);
}
