import { ActionReducerMap } from '@ngrx/store';
import { AppState } from './types';
import * as filesReducer from './reducers/files.reducer';

export const appReducer: ActionReducerMap<AppState, any> = {
  filesState: filesReducer.reducer,
};
