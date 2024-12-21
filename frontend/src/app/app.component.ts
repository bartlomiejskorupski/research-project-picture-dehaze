import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ImgContainerComponent } from './components/app-img-container.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
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
    auto: [false, Validators.required],
  });

  private file = signal<File | null>(null);

  private readonly http = inject(HttpClient);

  readonly originalImg = signal('');
  readonly outputImages = signal<DehazeOutput | null>(null);

  readonly loading = signal(false);

  isSubmitDisabled() {
    return !this.form.valid || !this.file() || this.loading();
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
          region: environment.apiUrl + res.region,
          refinedRegion: environment.apiUrl + res.refinedRegion,
          dehazed: environment.apiUrl + res.dehazed,
          transmission: environment.apiUrl + res.transmission,
          atmosphericLight: environment.apiUrl + res.atmospheric,
        });
        this.loading.set(false);
        this.form.get('r')?.setValue(res.r);
        this.form.get('beta')?.setValue(res.beta);
        this.form.get('gfr')?.setValue(res.gfr);
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
