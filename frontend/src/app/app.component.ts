import { Component, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ImgContainerComponent } from './components/app-img-container.component';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { DehazeOutput } from './model/dehaze-output.model';

@Component({
  selector: 'app-root',
  imports: [
    MatCardModule,
    MatButtonModule,
    ImgContainerComponent,
    ReactiveFormsModule,
    MatInputModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatIconModule,
    MatSliderModule,
    FormsModule,
    MatTooltipModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private fb = new FormBuilder();
  readonly form = this.fb.group({
    r: [9, [Validators.required, Validators.min(3), Validators.max(50), Validators.pattern(/^\d+$/)]],
    beta: [1.2, [Validators.required, Validators.min(0.001), Validators.max(2.0)]],
    gfr: [60, [Validators.required, Validators.min(3), Validators.max(150), Validators.pattern(/^\d+$/)]],
    auto: [true, Validators.required],
    stages: [false],
  });

  readonly sliderRValue = signal(9);
  readonly sliderBetaValue = signal(1.2);
  readonly sliderGFRValue = signal(60);

  private file = signal<File | null>(null);

  private readonly http = inject(HttpClient);

  readonly originalImg = signal('');
  readonly outputImages = signal<DehazeOutput | null>(null);

  readonly loading = signal(false);

  constructor() {
    effect(() => this.form.get('r')?.setValue(this.sliderRValue()));
    effect(() => this.form.get('beta')?.setValue(this.sliderBetaValue()));
    effect(() => this.form.get('gfr')?.setValue(this.sliderGFRValue()));

    if (this.form.get('auto')?.value == true) {
      this.form.get('r')?.disable();
      this.form.get('beta')?.disable();
      this.form.get('gfr')?.disable();
    }
  }

  isAutoEnabled() {
    return this.form.get('auto')?.value ?? false;
  }

  isSubmitDisabled() {
    return !this.form.valid || !this.file() || this.loading();
  }

  isStagesEnabled() {
    const outputImages = this.outputImages();
    return outputImages && outputImages.region && outputImages.refinedRegion && outputImages.transmission && outputImages.atmosphericLight;
  }

  onSubmit(event: any) {
    event.preventDefault();

    const file = this.file();
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('auto', '' + this.form.get('auto')?.value);
    formData.append('stages', '' + this.form.get('stages')?.value);
    if (!this.form.get('auto')?.value) {
      formData.append('r', '' + this.form.get('r')?.value);
      formData.append('beta', '' + this.form.get('beta')?.value);
      formData.append('gfr', '' + this.form.get('gfr')?.value);
    } else {
      formData.append('r', '0');
      formData.append('beta', '0');
      formData.append('gfr', '0');
    }

    this.loading.set(true);
    this.http
      .post(environment.apiUrl + 'dehaze', formData, {
        headers: { enctype: 'multipart/form-data' },
      })
      .subscribe((res: any) => {
        this.outputImages.set({
          dehazed: environment.apiUrl+res.dehazed,
          region: res.region ? environment.apiUrl+res.region : undefined,
          refinedRegion: res.refinedRegion ? environment.apiUrl+res.refinedRegion : undefined,
          transmission: res.transmission ? environment.apiUrl+res.transmission : undefined,
          atmosphericLight: res.atmospheric ? environment.apiUrl+res.atmospheric : undefined,
        });
        this.loading.set(false);
        this.form.get('r')?.setValue(res.r);
        this.form.get('beta')?.setValue(res.beta);
        this.form.get('gfr')?.setValue(res.gfr);
        this.sliderRValue.set(res.r);
        this.sliderBetaValue.set(res.beta);
        this.sliderGFRValue.set(res.gfr);
      },
      err => {
        this.loading.set(false);
        console.error(err);
      });
  }

  onFileChange(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      this.file.set(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        this.originalImg.set(e.target?.result as string);
        this.outputImages.set(null);
      };
      reader.onerror = (_) => {
        this.originalImg.set('');
        this.outputImages.set(null);
      };
    }
  }

  downloadClick() {
    const dehazedImg = this.outputImages()?.dehazed;
    if (!dehazedImg) {
      return;
    }
    this.http
      .get(dehazedImg, { responseType: 'blob' })
      .subscribe((res) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(res);
        a.href = objectUrl;
        a.download = 'dehazed';
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      });
  }

  setSliderValue(sliderStr: string, event: any) {
    if (sliderStr === 'r') {
      this.sliderRValue.set(event.target.value);
    } else if (sliderStr === 'beta') {
      this.sliderBetaValue.set(event.target.value);
    } else if (sliderStr === 'gfr') {
      this.sliderGFRValue.set(event.target.value);
    }
  }

  onAutoChange() {
    if (this.form.get('auto')?.value) {
      this.form.get('r')?.disable();
      this.form.get('beta')?.disable();
      this.form.get('gfr')?.disable();
    } else {
      this.form.get('r')?.enable();
      this.form.get('beta')?.enable();
      this.form.get('gfr')?.enable();
    }
  }
}
