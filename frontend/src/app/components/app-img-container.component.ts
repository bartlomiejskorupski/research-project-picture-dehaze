import { Component, input } from '@angular/core';
 import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-img-container',
  template: `
    <h3>{{ name() }}</h3>
    @if (loading()) {
      <div class="spinner-container">
        <mat-spinner></mat-spinner>
      </div>
    }
    @else {
      <img [src]="src()" />
    }
  `,
  styles: `
    :host {
      display: block;
      padding: .5rem;
      text-align: center;
    }

    img {
      max-width: 100%;
      height: auto;
      max-height: 80dvh;
    }

    .spinner-container {
      display: flex;
      justify-content: center;
    }
  `,
  imports: [MatProgressSpinnerModule],
})
export class ImgContainerComponent {
  name = input('');
  loading = input(false);
  src = input('');
}
