import { Injectable } from '@angular/core';
import { storage } from '@lib/utils/storage/storage.utils';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    isAuthenticated$ = new BehaviorSubject<boolean>(true);

    get isAuthenticated(): boolean {
        return true;
    }

    login(): void {
        storage.setItem('appSession', { user: 'some-user-id', token: 'abc' });
        this.isAuthenticated$.next(true);
    }

    logout(): void {
        storage.removeItem('appSession');
        this.isAuthenticated$.next(false);
    }
}
