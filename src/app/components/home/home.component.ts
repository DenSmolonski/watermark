import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { selectFiles } from 'src/app/store/selectors/files.selectors';
import { AppState } from 'src/app/store/types';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  public $files: any;
  constructor(private readonly store: Store<AppState>) {
    this.$files = this.store.pipe(select(selectFiles));
  }
}
