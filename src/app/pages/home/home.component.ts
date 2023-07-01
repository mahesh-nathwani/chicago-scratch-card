import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AppTheme, ThemeService } from '@lib/services/theme';
import { Subject, takeUntil } from 'rxjs';

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
    templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
    currentTheme!: AppTheme | null;
    url = 'https://script.google.com/macros/s/AKfycbxP_Pq3pH9YdthseVokWFSQEFx_hIQmMfYHi9ZXmZh8DCyalAAkMVcTAAOYj3C5DBKQ/exec';
    showLoading = false;
    loadingText = 'Generating Scratch Card...'
    private readonly _themeService = inject(ThemeService);
    
    private readonly _router = inject(Router);

    private readonly _http = inject(HttpClient);

    private readonly _destroy$ = new Subject();

    ngOnInit(): void {
        this._themeService.currentTheme$
            .pipe(takeUntil(this._destroy$))
            .subscribe((theme) => (this.currentTheme = theme));
    }

    ngOnDestroy(): void {
        this._destroy$.complete();
        this._destroy$.unsubscribe();
    }

    handleThemeChange(theme: AppTheme): void {
        this._themeService.setTheme(theme);
    }

    onSubmit(form: any) {
        // console.log(form.value);
        const data = new URLSearchParams(form.value).toString();
        this.showLoading = true;
        // console.log(data);
        this._http.get(this.url + `?${data}`, form.value).subscribe({
            next: data => {
                console.log(data);
                this._router.navigate([`/cashback`], { queryParams: { amount: form.value.amount } });
            },
            error: error => {
                // this.errorMessage = error.message;
                this.loadingText = 'Error in generating scratch card. Please try again later.'
                console.error('There was an error!', error);
            }
        });
        
    }
}
