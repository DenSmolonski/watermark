import { createSelector } from '@ngrx/store';
import { FilesState } from '../reducers/files.reducer';
import { AppState } from '../types';

const selectStore = (state: AppState) => state.filesState;

export const selectFiles = createSelector(
  selectStore,
  (state: FilesState) => state.files
);

export const selectFilesExist = createSelector(
  selectStore,
  (state: FilesState) => !!state.files.length
);

export const selectFile = createSelector(
  selectStore,
  (state: FilesState, props: { id: string }) =>
    state.files.find((i) => i.id === props.id)
);
