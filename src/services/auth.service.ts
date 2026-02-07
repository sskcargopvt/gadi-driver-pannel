import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export type UserRole = 'driver' | 'mechanic' | 'admin' | null;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<{ name: string, role: UserRole } | null>(null);

  constructor(private router: Router) {
    // Check local storage for session persistence
    const savedUser = localStorage.getItem('gaadi_user');
    if (savedUser) {
      this.currentUser.set(JSON.parse(savedUser));
    }
  }

  login(role: UserRole, name: string) {
    const user = { name, role };
    this.currentUser.set(user);
    localStorage.setItem('gaadi_user', JSON.stringify(user));
    
    if (role === 'driver') this.router.navigate(['/driver']);
    else if (role === 'mechanic') this.router.navigate(['/mechanic']);
    else if (role === 'admin') this.router.navigate(['/admin']);
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('gaadi_user');
    this.router.navigate(['/login']);
  }
}