import {
  Component,
  ElementRef,
  Input,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { deleteFile } from 'src/app/store/actions/files.actions';
import { FileData } from 'src/app/store/reducers/files.reducer';
import { AppState } from 'src/app/store/types';

@Component({
  selector: 'app-image-card',
  templateUrl: './image-card.component.html',
  styleUrls: ['./image-card.component.scss'],
})
export class ImageCardComponent {
  @Input('file')
  public file!: FileData;
  constructor(
    private readonly store: Store<AppState>,
    private router: Router
  ) {}

  delete() {
    this.store.dispatch(deleteFile({ file: this.file }));
  }

  edit() {
    this.router.navigate(['image', this.file.id]);
  }
}
