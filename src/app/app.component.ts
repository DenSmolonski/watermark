import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { pushFile, resetFiles } from './store/actions/files.actions';
import { AppState } from './store/types';
import { v4 as uuidv4 } from 'uuid';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { selectFilesExist } from './store/selectors/files.selectors';
import { WatermarkService } from './services/watermark.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public $filesExist: Observable<boolean>;

  constructor(
    private router: Router,
    private readonly store: Store<AppState>,
    public watermarkService: WatermarkService
  ) {
    this.$filesExist = this.store.select(selectFilesExist);
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
    this.watermarkService.addText();
  }

  addImage(imgFile: any): void {
    if (imgFile.target.files) {
      const file = imgFile.target.files[0];
      let reader = new FileReader();
      reader.onload = (e: any) => {
        this.watermarkService.addImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      imgFile.target.value = null;
    }
  }
}
