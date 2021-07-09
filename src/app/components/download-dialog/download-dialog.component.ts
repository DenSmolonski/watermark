import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import * as FileSaver from 'file-saver';
import * as JSZip from 'jszip';
import { Observable } from 'rxjs';
import { FileData } from 'src/app/store/reducers/files.reducer';
import { selectFiles } from 'src/app/store/selectors/files.selectors';
import { AppState } from 'src/app/store/types';

@Component({
  selector: 'app-download-dialog',
  templateUrl: './download-dialog.component.html',
  styleUrls: ['./download-dialog.component.scss'],
})
export class DownloadDialogComponent implements OnInit {
  files: Array<FileData> = [];
  constructor(
    private dialogRef: MatDialogRef<DownloadDialogComponent>,
    private store: Store<AppState>
  ) {
    this.store.select(selectFiles).subscribe((files) => (this.files = files));
  }

  ngOnInit(): void {}

  close() {
    this.dialogRef.close();
  }

  downloadFile(e: Event, file: FileData): void {
    e.preventDefault();
    if (file?.canvasAsDataUrl)
      FileSaver.saveAs(file?.canvasAsDataUrl, file.file.name);
  }

  download = async () => {
    const zip = new JSZip();

    this.files.forEach((file) => {
      if (file.canvasAsDataUrl) {
        const base64 = file.canvasAsDataUrl.replace(
          /^data:image\/(png|jpg);base64,/,
          ''
        );
        zip.file(file.file.name, base64, { base64: true });
      }
    });

    zip.generateAsync({ type: 'blob' }).then((content) => {
      // see FileSaver.js
      FileSaver.saveAs(content, 'files-with-watermark.zip');
      this.dialogRef.close();
    });
  };
}
