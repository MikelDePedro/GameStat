import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { star, starHalf, starOutline } from 'ionicons/icons';

/**
 * Estrellas para puntuaciones en escala 1..max (default 10).
 * Modo `readonly` muestra; modo interactivo emite (value).
 * Soporta medio punto en modo readonly.
 */
@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [CommonModule, IonIcon],
  styles: [`
    :host { display: inline-flex; }
    .stars {
      display: inline-flex;
      gap: 2px;
      align-items: center;
      color: #fbbf24;
      font-size: var(--star-size, 18px);
    }
    .stars.interactive ion-icon { cursor: pointer; transition: transform .12s ease; }
    .stars.interactive ion-icon:hover { transform: scale(1.15); }
    .value { margin-left: 8px; color: var(--app-text-muted,#c9c0df); font-size: .85em; font-weight:600; }
  `],
  template: `
    <div class="stars" [class.interactive]="!readonly" role="img"
         [attr.aria-label]="ariaLabel()">
      <ion-icon
        *ngFor="let s of slots(); let i = index"
        [name]="iconFor(i)"
        (click)="onSelect(i)"
        (keydown.enter)="onSelect(i)"
        [attr.tabindex]="readonly ? null : 0">
      </ion-icon>
      <span class="value" *ngIf="showValue">{{ display() }}/{{ max }}</span>
    </div>
  `
})
export class RatingStarsComponent {
  @Input() value = 0;
  @Input() max = 10;
  @Input() readonly = true;
  @Input() showValue = false;
  @Input() size = 18;
  @Output() valueChange = new EventEmitter<number>();

  private readonly hover = signal<number | null>(null);

  readonly display = computed(() => this.hover() ?? this.value);

  slots(): number[] {
    return Array.from({ length: this.max }, (_, i) => i + 1);
  }

  iconFor(index: number): string {
    const v = this.display();
    const pos = index + 1;
    if (v >= pos) return 'star';
    if (v >= pos - 0.5) return 'star-half';
    return 'star-outline';
  }

  ariaLabel(): string {
    return `${this.value} de ${this.max}`;
  }

  onSelect(index: number): void {
    if (this.readonly) return;
    const next = index + 1;
    this.valueChange.emit(next);
  }

  constructor() {
    addIcons({ star, starHalf, starOutline });
  }
}
