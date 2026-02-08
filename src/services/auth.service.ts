import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

export type UserRole = 'driver' | 'mechanic' | 'admin' | null;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  currentUser = signal<{ name: string, role: UserRole, id: string, email?: string } | null>(null);

  constructor() {
    this.initSession();
  }

  async initSession() {
    const { data } = await this.supabase.getUser();
    if (data.user) {
      this.setUserFromSession(data.user);
    }
  }

  private setUserFromSession(user: any) {
    const role = user.user_metadata?.role || 'driver';
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    
    this.currentUser.set({
      id: user.id,
      email: user.email,
      name,
      role
    });
  }

  async login(email: string, password: string, fallbackRole?: UserRole) {
    try {
      const { data, error } = await this.supabase.signIn(email, password);
      if (error) throw error;
      if (data.user) {
        this.setUserFromSession(data.user);
        this.redirectUser();
      }
    } catch (e) {
      console.warn('Login failed, using demo fallback session.', e);
      // Fallback for Demo purposes if API fails or credentials are invalid
      const mockUser = {
        id: 'demo-user-' + Date.now(),
        email: email,
        user_metadata: {
          name: email.split('@')[0],
          role: fallbackRole || 'driver'
        }
      };
      this.setUserFromSession(mockUser);
      this.redirectUser();
    }
  }

  async register(email: string, password: string, role: UserRole, name: string) {
    try {
      const { data, error } = await this.supabase.signUp(email, password, { role, name });
      if (error) throw error;
      if (data.user) {
        this.setUserFromSession(data.user);
        this.redirectUser();
      }
    } catch (e) {
      console.warn('Registration failed, using demo fallback session.', e);
      // Fallback for Demo
      const mockUser = {
        id: 'demo-user-' + Date.now(),
        email: email,
        user_metadata: {
          name: name,
          role: role
        }
      };
      this.setUserFromSession(mockUser);
      this.redirectUser();
    }
  }

  async logout() {
    await this.supabase.signOut();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private redirectUser() {
    const role = this.currentUser()?.role;
    if (role === 'driver') this.router.navigate(['/driver']);
    else if (role === 'mechanic') this.router.navigate(['/mechanic']);
    else if (role === 'admin') this.router.navigate(['/admin']);
  }
}