import { Component, OnInit, Renderer2 } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  IElementOpt,
  IImgUpdateOptions,
  ITextUpdateOptions,
  WatermarkService,
} from 'src/app/services/watermark.service';
import { FileData } from 'src/app/store/reducers/files.reducer';
import { selectFile } from 'src/app/store/selectors/files.selectors';
import { AppState } from 'src/app/store/types';
import { availableFonts, IFontItem } from 'src/app/utils/fonts';

@Component({
  selector: 'app-add-watermark',
  templateUrl: './add-watermark.component.html',
  styleUrls: ['./add-watermark.component.scss'],
})
export class AddWatermarkComponent implements OnInit {
  private id: string;
  private elName: string = '';
  public $file: Observable<FileData | undefined>;
  public showCard: boolean = false;
  public positionTopCard: string = '0px';
  public positionLeftCard: string = '0px';
  public fonts: Array<IFontItem> = availableFonts();
  public formGroup: FormGroup = new FormGroup({});

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store<AppState>,
    public watermarkService: WatermarkService
  ) {
    this.id = this.route.snapshot.params['id'];
    this.$file = this.store.select(selectFile, { id: this.id });
  }

  ngOnInit(): void {
    this.$file.subscribe((file) => {
      if (!file) {
        this.router.navigate(['']);
        return;
      }
      this.watermarkService.init('canvasBlock', file);

      this.watermarkService.onMouseDownEl.subscribe(() => {
        this.showCard = false;
      });

      this.watermarkService.onMouseUpEl.subscribe((opt) => {
        if (opt === null) {
          this.showCard = false;
          return;
        }

        switch (opt.name) {
          case '':
            this.elName = '';
            this.showCard = false;
            break;
          case this.elName:
            this.showCard = true;
            this.updatePosition(opt);
            break;
          default:
            this.elName = opt.name;
            this.showCard = true;
            this.updatePosition(opt);
            break;
        }
      });

      this.watermarkService.updateOptions.subscribe((options) => {
        switch (options.name) {
          case '':
            this.formGroup = new FormGroup({});
            break;
          case this.elName:
            break;
          default:
            'fontFamily' in options
              ? this.generateTextForm(options)
              : this.generateImgForm(options);
            break;
        }
      });
    });
  }

  updatePosition(opt: IElementOpt): void {
    const canvas = document.getElementById('canvasBlock');
    const cardWidth = 250;
    const cardHeight = 300;

    const canvasPosition = canvas?.getClientRects()[0];

    if (canvasPosition === undefined) {
      return;
    }

    const defaultY = canvasPosition.top + opt.top + opt.height + 10;
    const defaultX = canvasPosition.left + opt.left + opt.width + 10;

    const moreY = window?.innerHeight < cardHeight + defaultY + 30;
    const moreX = window?.innerWidth < cardWidth + defaultX + 30;

    const alternativeY =
      opt.type === 'img'
        ? canvasPosition.top + opt.top - cardHeight
        : canvasPosition.top + opt.top - opt.height - cardHeight;
    const alternativeX = canvasPosition.left + opt.left - cardWidth - 40;

    this.positionTopCard = `${moreY ? alternativeY : defaultY}px`;
    this.positionLeftCard = `${moreX ? alternativeX : defaultX}px`;
  }

  private generateTextForm(props: ITextUpdateOptions): void {
    const { opacity, rotation, fit, text, fontFamily, fill, fontSize } = props;
    const opt = this.getCommotControls(opacity, rotation, fit);
    this.formGroup = new FormGroup({
      ...opt,
      text: new FormControl(text, []),
      searchFontFamily: new FormControl(fontFamily, []),
      fontFamily: new FormControl(fontFamily, []),
      fill: new FormControl(fill, []),
      fontSize: new FormControl(fontSize, []),
    });

    this.formGroup.valueChanges.subscribe((values) => {
      this.watermarkService.updateText(Object.assign(props, values));
    });
  }

  private generateImgForm(props: IImgUpdateOptions): void {
    const { opacity, rotation, fit, scaleToWidth } = props;
    const opt = this.getCommotControls(opacity, rotation, fit);
    this.formGroup = new FormGroup({
      ...opt,
      scaleToWidth: new FormControl(scaleToWidth, []),
    });

    this.formGroup.valueChanges.subscribe((values) => {
      this.watermarkService.updateImg(Object.assign(props, values));
    });
  }

  private getCommotControls(
    opacity: number,
    rotation: number,
    fit: string
  ): { [key: string]: FormControl } {
    return {
      opacity: new FormControl(opacity, []),
      rotation: new FormControl(rotation, []),
      fit: new FormControl(fit, []),
    };
  }
}
