import { EventEmitter, Injectable } from '@angular/core';
import { fabric } from 'fabric';
import { Canvas } from 'fabric/fabric-impl';
import { FileData } from '../store/reducers/files.reducer';
import { v4 as uuidv4 } from 'uuid';

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

@Injectable({
  providedIn: 'root',
})
export class WatermarkService {
  private file!: FileData | null;
  private canvas!: Canvas | null;
  private activeObjEl?: string;
  private activeWatermark?: Array<IImgUpdateOptions | ITextUpdateOptions>;

  applyWatermarkToAllImage: EventEmitter<
    Array<IImgUpdateOptions | ITextUpdateOptions>
  > = new EventEmitter();
  updateOptions: EventEmitter<IImgUpdateOptions | ITextUpdateOptions> =
    new EventEmitter();
  onMouseDownEl: EventEmitter<void> = new EventEmitter();
  onMouseUpEl: EventEmitter<IElementOpt | null> = new EventEmitter();
  onMoveEl: EventEmitter<void> = new EventEmitter();

  constructor() {}

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
    this.updateOptions.emit(options);
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
        this.updateOptions.emit(options);
      });
    };

    img.src = imgDataUrl;
  }

  updateImg(options: IImgUpdateOptions): void {
    const text = this.canvas?.getActiveObject() as fabric.Image;

    if (!text) {
      return;
    }

    text.set('opacity', options.opacity);
    text.scaleToWidth(options.scaleToWidth);
    text.rotate(options.rotation);

    this.canvas?.renderAll();
  }

  hasObjects(): boolean {
    return !!this.canvas && !!this.canvas.getObjects().length;
  }

  applyWatermartToAll(): void {
    if (!this.activeWatermark?.length) {
      return;
    }

    this.applyWatermarkToAllImage.emit(this.activeWatermark);
  }

  removeEl(): void {
    const activeObj = this.canvas?.getActiveObjects();
    const obj = activeObj?.find((i) => i.name === this.activeObjEl);
    if (obj) {
      this.canvas?.remove(obj);
      this.onMouseDownEl.emit();
    }
  }

  resetWatermark(): void {
    const activeObj = this.canvas?.getObjects();
    if (activeObj?.length) {
      activeObj.forEach((i) => this.canvas?.remove(i));
      this.onMouseDownEl.emit();
    }
  }

  private initEvents(): void {
    this.canvas?.on('mouse:up', (opt) => {
      if (opt.target === undefined) {
        this.activeObjEl = undefined;
        this.onMouseUpEl.emit(null);
        return;
      }
      this.activeObjEl = opt?.target?.name;

      this.mouseUpTextUpdate(opt);
      this.mouseUpImageUpdate(opt);
    });

    this.canvas?.on('mouse:move', (opt) => {
      this.onMoveEl.emit();
    });

    this.canvas?.on('mouse:down', (opt) => {
      this.onMouseDownEl.emit();
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

    this.onMouseUpEl.emit({
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

    this.onMouseUpEl.emit({
      type: 'img',
      name: opt?.target?.name,
      left: opt.target?.oCoords?.tl?.x,
      top: opt.target?.oCoords?.tl?.y,
      width: opt.target?.width * opt.target?.scaleX,
      height: opt.target?.height * opt.target?.scaleY,
    });
  }
}
