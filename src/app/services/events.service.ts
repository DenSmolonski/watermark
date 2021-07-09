import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  onAddText: EventEmitter<void> = new EventEmitter();
  onAddImage: EventEmitter<string> = new EventEmitter();
  onResetWatermark: EventEmitter<void> = new EventEmitter();
  onApplyWatermark: EventEmitter<void> = new EventEmitter();

  constructor() {}

  addText(): void {
    this.onAddText.emit();
  }

  addImage(fileAsDataUrl: string): void {
    this.onAddImage.emit(fileAsDataUrl);
  }

  resetWatermark(): void {
    this.onResetWatermark.emit();
  }

  applyWatermark(): void {
    this.onApplyWatermark.emit();
  }
}
