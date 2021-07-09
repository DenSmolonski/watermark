import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { pushFile, resetFiles } from './store/actions/files.actions';
import { AppState } from './store/types';
import { v4 as uuidv4 } from 'uuid';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import {
  selectFiles,
  selectFilesExist,
} from './store/selectors/files.selectors';
import { EventsService } from './services/events.service';
import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';
import { FileData } from './store/reducers/files.reducer';
import { MatDialog } from '@angular/material/dialog';
import { DownloadDialogComponent } from './components/download-dialog/download-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public $filesExist: Observable<boolean>;
  public files: Array<FileData> = [];

  constructor(
    private router: Router,
    private readonly store: Store<AppState>,
    private eventsService: EventsService,
    private dialog: MatDialog
  ) {
    this.$filesExist = this.store.select(selectFilesExist);
    this.store.select(selectFiles).subscribe((files) => {
      this.files = files;
    });
  }

  isPage(partUrl: string): boolean {
    return this.router.url.includes(partUrl);
  }

  goToMainPage(): void {
    this.router.navigate(['']);
  }

  uploadFileEvt(imgFile: any) {
    if (imgFile.target.files) {
      Array.from(imgFile.target.files as File[]).forEach((file: File) => {
        let reader = new FileReader();
        reader.onload = (e: any) => {
          this.store.dispatch(
            pushFile({
              file: {
                id: uuidv4(),
                fileAsDataUrl: reader.result as string,
                file,
                watermarks: [],
              },
            })
          );
        };
        reader.readAsDataURL(file);
      });
      imgFile.target.value = null;
    }
  }

  clearAllFiles(): void {
    this.store.dispatch(resetFiles());
  }

  addText(): void {
    this.eventsService.addText();
  }

  reset(): void {
    this.eventsService.resetWatermark();
  }

  apply(): void {
    this.eventsService.applyWatermark();
  }

  download(): void {
    this.dialog.open(DownloadDialogComponent);
  }

  addImage(imgFile: any): void {
    if (imgFile.target.files) {
      const file = imgFile.target.files[0];
      let reader = new FileReader();
      reader.onload = (e: any) => {
        this.eventsService.addImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      imgFile.target.value = null;
    }
  }
}
