import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fabric } from 'fabric';
import { Canvas } from 'fabric/fabric-impl';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { FileData } from 'src/app/store/reducers/files.reducer';
import {
  selectFile,
  selectFiles,
} from 'src/app/store/selectors/files.selectors';
import { AppState } from 'src/app/store/types';
import { availableFonts, IFontItem } from 'src/app/utils/fonts';
import { v4 as uuidv4 } from 'uuid';
import {
  addWatermark,
  applyWateramrkToAll,
  removeAllWateramrk,
} from 'src/app/store/actions/files.actions';
import { EventsService } from 'src/app/services/events.service';
import { MatDialog } from '@angular/material/dialog';
import { ApplyToAllComponent } from '../apply-to-all/apply-to-all.component';
import { ThrowStmt } from '@angular/compiler';

export interface IElementOpt {
  name: string;
  type: 'img' | 'text';
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ITextUpdateOptions {
  left: number;
  top: number;
  name: string;
  text: string;
  fontFamily: string;
  fill: string;
  fit: 'one' | 'two' | 'three';
  opacity: number;
  fontSize: number;
  rotation: number;
}

export interface IImgUpdateOptions {
  left: number;
  top: number;
  name: string;
  imgDataUrl: string;
  fit: 'one' | 'two' | 'three';
  opacity: number;
  scaleToWidth: number;
  rotation: number;
}

const defaultTextWatermakOption = (name: string): ITextUpdateOptions => ({
  name,
  top: 100,
  left: 100,
  text: 'sample text',
  fontFamily: 'Arial, sans-serif',
  fill: '#FFFFFF',
  fit: 'one',
  opacity: 1,
  rotation: 0,
  fontSize: 42,
});

const defaultImgWatermakOption = (
  name: string,
  imgDataUrl: string
): IImgUpdateOptions => ({
  name,
  imgDataUrl,
  top: 100,
  left: 100,
  fit: 'one',
  opacity: 1,
  scaleToWidth: 150,
  rotation: 0,
});

const defaultVisibility = {
  bl: false,
  mb: false,
  br: false,
  ml: false,
  mr: false,
  mt: false,
  mtr: false,
  tl: false,
  tr: false,
};

const defaultSelectedStyleBorder = {
  borderOpacityWhenMoving: 1,
  borderColor: '#ff4081',
  padding: 1,
  borderDashArray: [5],
};

@Component({
  selector: 'app-add-watermark',
  templateUrl: './add-watermark.component.html',
  styleUrls: ['./add-watermark.component.scss'],
})
export class AddWatermarkComponent implements OnInit, OnDestroy {
  private id: string;
  private elName: string = '';
  public $file: Observable<FileData | undefined>;
  public showCard: boolean = false;
  public positionTopCard: string = '0px';
  public positionLeftCard: string = '0px';
  public fonts: Array<IFontItem> = availableFonts();
  public formGroup: FormGroup = new FormGroup({});
  private file!: FileData | null;
  private files: Array<FileData> = [];
  private canvas!: Canvas | null;
  private activeObjEl?: string;
  public activeWatermark?: Array<IImgUpdateOptions | ITextUpdateOptions>;
  private subscriptions: Array<Subscription> = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store<AppState>,
    private eventsService: EventsService,
    public dialog: MatDialog
  ) {
    this.id = this.route.snapshot.params['id'];
    this.$file = this.store.select(selectFile, { id: this.id });
    this.store.select(selectFiles).subscribe((files) => (this.files = files));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((i) => i.unsubscribe());
    this.destroy();
  }

  ngOnInit(): void {
    const sub1 = this.$file.subscribe((file) => {
      if (!file) {
        this.router.navigate(['']);
        return;
      }
      this.init('canvasBlock', file);
    });
    this.subscriptions.push(sub1);

    const sub2 = this.eventsService.onAddImage.subscribe((v) =>
      this.addImage(v)
    );
    this.subscriptions.push(sub2);

    const sub3 = this.eventsService.onAddText.subscribe(() => this.addText());
    this.subscriptions.push(sub3);

    const sub4 = this.eventsService.onApplyWatermark.subscribe(() => {
      this.openDialog();
    });
    this.subscriptions.push(sub4);

    const sub5 = this.eventsService.onResetWatermark.subscribe(() =>
      this.resetWatermark()
    );
    this.subscriptions.push(sub5);
  }

  openDialog() {
    const dialogRef = this.dialog.open(ApplyToAllComponent);

    dialogRef.afterClosed().subscribe((result) => {
      this.saveWatermarkToFile();

      if (result && this.file?.id) {
        this.store.dispatch(
          applyWateramrkToAll({
            fileId: this.file.id,
          })
        );
        this.applyWatermartToAll();
      }
      this.router.navigate(['']);
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

  init(nameBlock: string, file: FileData): void {
    this.file = file;

    this.canvas = new fabric.Canvas(nameBlock, {
      selection: false,
    });

    const img = new Image();

    img.onload = () => {
      if (!this.canvas || !this.file) {
        return;
      }

      const imgRatio = img.width / img.height;
      let height = window?.innerHeight - 130;
      let width = height * imgRatio;

      if (width > window.innerWidth) {
        width = window?.innerWidth / 1.1;
        height = width / imgRatio;
      }

      this.canvas.setWidth(width);
      this.canvas.setHeight(height);

      fabric.Image.fromURL(this.file.fileAsDataUrl, (myImg) => {
        if (!this.canvas) {
          return;
        }

        this.canvas.setBackgroundImage(
          myImg,
          this.canvas.renderAll.bind(this.canvas),
          {
            scaleX: width / img.width,
            scaleY: height / img.height,
          }
        );

        file?.watermarks?.forEach((watermark) => {
          if ('fontFamily' in watermark) {
            const options = watermark as ITextUpdateOptions;
            const text = new fabric.Text(options.text, {
              ...options,
              ...defaultSelectedStyleBorder,
            });
            text.rotate(options.rotation);
            text.setControlsVisibility(defaultVisibility);

            this.canvas?.add(text);
            this.canvas?.renderAll();
          } else {
            const options = watermark as IImgUpdateOptions;

            fabric.Image.fromURL(options.imgDataUrl, (imgWatermark) => {
              if (!this.canvas) {
                return;
              }

              imgWatermark.name = options.name;
              imgWatermark.top = options.top;
              imgWatermark.left = options.left;
              imgWatermark.opacity = options.opacity;
              imgWatermark.rotate(options.rotation);
              imgWatermark.scaleToWidth(options.scaleToWidth);
              imgWatermark.setOptions(defaultSelectedStyleBorder);
              imgWatermark.rotate(options.rotation);

              imgWatermark.setControlsVisibility(defaultVisibility);
              this.canvas.add(imgWatermark);
              this.canvas.renderAll();
            });
          }
        });

        this.activeWatermark = file?.watermarks ?? [];

        this.initEvents();
      });
    };

    img.src = this.file.fileAsDataUrl;
  }

  addText(): void {
    const name = uuidv4();
    const options = defaultTextWatermakOption(name);
    const text = new fabric.Text(options.text, {
      ...options,
      ...defaultSelectedStyleBorder,
    });

    text.setControlsVisibility(defaultVisibility);

    this.canvas?.add(text);
    this.canvas?.renderAll();
    this.updateActiveWatermark(options);
    this.handleUpdateOptions(options);
  }

  saveWatermarkToFile(): void {
    if (!this.file) {
      return;
    }
    const objCol = this.canvas?.getObjects();
    /* @ts-ignore */
    const watermark: Array<ITextUpdateOptions | IImgUpdateOptions> =
      objCol?.length
        ? objCol?.map((i) => {
            if ('fontFamily' in i) {
              const {
                name,
                top,
                left,
                text,
                fontFamily,
                fill,
                opacity,
                angle,
                fontSize,
              } = i as fabric.Text;
              return {
                name,
                top,
                left,
                text,
                fontFamily,
                fill,
                fit: 'one',
                opacity,
                rotation: angle,
                fontSize,
              };
            } else {
              const { name, top, width, scaleX, left, fill, opacity, angle } =
                i as fabric.Image;
              const aw = this.activeWatermark?.find(
                (i) => i.name === name
              ) as IImgUpdateOptions;
              const imgDataUrl = aw?.imgDataUrl;
              return {
                name,
                top,
                left,
                fill,
                fit: 'one',
                imgDataUrl,
                opacity,
                rotation: angle,
                scaleToWidth: width && scaleX ? width * scaleX : 150,
              };
            }
          })
        : [];
    const canvasAsDataUrl = this.canvas?.toDataURL({
      format: 'imgage/png',
      quality: 1,
    });
    this.store.dispatch(
      addWatermark({
        fileId: this.file?.id,
        watermark: watermark,
        canvasAsDataUrl: canvasAsDataUrl ? canvasAsDataUrl : '',
      })
    );
  }

  updateText(options: ITextUpdateOptions): void {
    const text = this.canvas?.getActiveObject() as fabric.Text;

    if (!text) {
      return;
    }

    text.set('fontFamily', options.fontFamily);
    text.set('text', options.text);
    text.set('fill', options.fill);
    text.set('opacity', options.opacity);
    text.set('fontSize', options.fontSize);
    text.rotate(options.rotation);
    if (text.left && text.top) {
      options.left = text.left;
      options.top = text.top;
    }
    this.updateActiveWatermark(options);
    this.canvas?.renderAll();
  }

  addImage(imgDataUrl: string): void {
    const img = new Image();
    const name = uuidv4();
    const options = defaultImgWatermakOption(name, imgDataUrl);

    img.onload = () => {
      if (!this.canvas || !this.file) {
        return;
      }

      fabric.Image.fromURL(imgDataUrl, (imgWatermark) => {
        if (!this.canvas) {
          return;
        }

        imgWatermark.name = name;
        imgWatermark.top = options.top;
        imgWatermark.left = options.left;
        imgWatermark.opacity = options.opacity;
        imgWatermark.rotate(options.rotation);
        imgWatermark.scaleToWidth(options.scaleToWidth);
        imgWatermark.setOptions(defaultSelectedStyleBorder);

        imgWatermark.setControlsVisibility(defaultVisibility);
        this.canvas.add(imgWatermark);
        this.canvas.renderAll();
        this.updateActiveWatermark(options);
        this.handleUpdateOptions(options);
      });
    };

    img.src = imgDataUrl;
  }

  updateImg(options: IImgUpdateOptions): void {
    const img = this.canvas?.getActiveObject() as fabric.Image;

    if (!img) {
      return;
    }

    img.set('opacity', options.opacity);
    img.scaleToWidth(options.scaleToWidth);
    img.rotate(options.rotation);

    if (img.left && img.top) {
      options.left = img.left;
      options.top = img.top;
    }

    this.updateActiveWatermark(options);
    this.canvas?.renderAll();
  }

  hasObjects(): boolean {
    return !!this.canvas && !!this.canvas.getObjects().length;
  }

  applyWatermartToAll(): void {
    this.files.forEach((f) => {
      const canvasEl = document.createElement('canvas');
      const canvas = new fabric.Canvas(canvasEl, {
        selection: false,
      });
      const img = new Image();

      img.onload = () => {
        if (!canvas) {
          return;
        }

        const imgRatio = img.width / img.height;
        let height = window?.innerHeight - 130;
        let width = height * imgRatio;

        if (width > window.innerWidth) {
          width = window?.innerWidth / 1.1;
          height = width / imgRatio;
        }

        canvas.setWidth(width);
        canvas.setHeight(height);

        fabric.Image.fromURL(f.fileAsDataUrl, (myImg) => {
          canvas.setBackgroundImage(myImg, canvas.renderAll.bind(canvas), {
            scaleX: width / img.width,
            scaleY: height / img.height,
          });

          f?.watermarks?.forEach((watermark) => {
            if ('fontFamily' in watermark) {
              const options = watermark as ITextUpdateOptions;
              const text = new fabric.Text(options.text, {
                ...options,
                ...defaultSelectedStyleBorder,
              });
              text.rotate(options.rotation);
              text.setControlsVisibility(defaultVisibility);

              canvas?.add(text);
              canvas?.renderAll();
            } else {
              const options = watermark as IImgUpdateOptions;

              fabric.Image.fromURL(options.imgDataUrl, (imgWatermark) => {
                if (!canvas) {
                  return;
                }

                imgWatermark.name = options.name;
                imgWatermark.top = options.top;
                imgWatermark.left = options.left;
                imgWatermark.opacity = options.opacity;
                imgWatermark.rotate(options.rotation);
                imgWatermark.scaleToWidth(options.scaleToWidth);
                imgWatermark.setOptions(defaultSelectedStyleBorder);
                imgWatermark.rotate(options.rotation);

                imgWatermark.setControlsVisibility(defaultVisibility);
                canvas.add(imgWatermark);
                canvas.renderAll();
              });
            }
          });

          const canvasAsDataUrl = canvas?.toDataURL({
            format: 'imgage/png',
            quality: 1,
          });

          this.store.dispatch(
            addWatermark({
              fileId: f?.id,
              watermark: f.watermarks,
              canvasAsDataUrl: canvasAsDataUrl ? canvasAsDataUrl : '',
            })
          );
        });
      };

      img.src = f.fileAsDataUrl;
    });
  }

  removeEl(): void {
    const activeObj = this.canvas?.getActiveObjects();
    const obj = activeObj?.find((i) => i.name === this.activeObjEl);
    if (obj) {
      this.canvas?.remove(obj);
      this.activeWatermark = this.activeWatermark?.filter(
        (i) => i.name !== obj?.name
      );
      this.showCard = false;
    }
  }

  destroy(): void {
    this.file = null;
    this.activeObjEl = undefined;
    this.activeWatermark = undefined;
  }

  resetWatermark(): void {
    const activeObj = this.canvas?.getObjects();
    if (activeObj?.length && this.file) {
      activeObj.forEach((i) => this.canvas?.remove(i));
      this.canvas?.renderAll();
      this.activeObjEl = undefined;
      this.activeWatermark = [];
      this.store.dispatch(removeAllWateramrk({ fileId: this.file.id }));
      this.showCard = false;
    }
  }

  private initEvents(): void {
    this.canvas?.on('mouse:up', (opt) => {
      if (opt.target === undefined) {
        this.activeObjEl = undefined;
        this.handleMouseUp(null);
        return;
      }
      this.activeObjEl = opt?.target?.name;
      this.mouseUpTextUpdate(opt);
      this.mouseUpImageUpdate(opt);
    });

    this.canvas?.on('mouse:down', (opt) => {
      this.showCard = false;
    });
  }

  private mouseUpTextUpdate(opt: fabric.IEvent): void {
    if (
      opt.target === undefined ||
      opt.target?.top === undefined ||
      opt.target?.left === undefined ||
      opt.target?.width === undefined ||
      opt.target?.height === undefined ||
      opt?.target?.name === undefined
    ) {
      return;
    }
    const options = this.activeWatermark?.find(
      (i) => i.name === opt?.target?.name
    );
    if (options) {
      const left = opt.target?.left;
      const top = opt.target?.top;
      const newOpt = Object.assign({}, options, { left, top });
      this.updateActiveWatermark(newOpt);
      this.handleUpdateOptions(options);
    }
    this.handleMouseUp({
      type: 'text',
      name: opt?.target?.name,
      left: opt.target?.left,
      top: opt.target?.top,
      width: opt.target?.width,
      height: opt.target?.height,
    });
  }

  private mouseUpImageUpdate(opt: fabric.IEvent): void {
    if (
      opt.target === undefined ||
      opt.target?.oCoords === undefined ||
      opt.target?.oCoords?.tl === undefined ||
      opt.target?.oCoords?.tl?.y === undefined ||
      opt.target?.oCoords?.tl?.x === undefined ||
      opt.target?.scaleX === undefined ||
      opt.target?.scaleY === undefined ||
      opt.target?.width === undefined ||
      opt.target?.height === undefined ||
      opt?.target?.name === undefined
    ) {
      return;
    }
    const options = this.activeWatermark?.find(
      (i) => i.name === opt?.target?.name
    );
    if (options) {
      const left = opt.target?.oCoords?.tl?.x;
      const top = opt.target?.oCoords?.tl?.y;
      const newOpt = Object.assign({}, options, { left, top });
      this.updateActiveWatermark(newOpt);
      this.handleUpdateOptions(options);
    }
    this.handleMouseUp({
      type: 'img',
      name: opt?.target?.name,
      left: opt.target?.oCoords?.tl?.x,
      top: opt.target?.oCoords?.tl?.y,
      width: opt.target?.width * opt.target?.scaleX,
      height: opt.target?.height * opt.target?.scaleY,
    });
  }

  private updateActiveWatermark(
    opt: ITextUpdateOptions | IImgUpdateOptions
  ): void {
    if (!this.activeWatermark?.length) {
      this.activeWatermark = [opt];
      return;
    }

    const contain = this.activeWatermark.some((i) => i.name === opt.name);

    if (contain) {
      const filteredWatermark = this.activeWatermark.filter(
        (i) => i.name !== opt.name
      );
      this.activeWatermark = [...filteredWatermark, opt];
    } else {
      this.activeWatermark?.push(opt);
    }
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
      this.updateText(Object.assign(props, values));
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
      this.updateImg(Object.assign(props, values));
    });
  }

  private handleMouseUp(opt: IElementOpt | null): void {
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
  }

  private handleUpdateOptions(
    options: ITextUpdateOptions | IImgUpdateOptions
  ): void {
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
