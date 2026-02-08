import { Component, signal, inject } from '@angular/core';
import { AuthService, UserRole } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Split Layout Container -->
    <div class="min-h-screen flex bg-white font-sans">
      
      <!-- Left Side: Branding & Visuals (Hidden on mobile) -->
      <div class="hidden lg:flex lg:w-1/2 bg-blue-900 relative overflow-hidden items-center justify-center">
         <!-- Abstract Background shapes -->
         <div class="absolute inset-0 opacity-10 pointer-events-none">
            <div class="absolute right-0 top-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div class="absolute left-0 bottom-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
         </div>
         
         <div class="relative z-10 text-white text-center p-12 max-w-lg">
            <div class="mb-8 flex justify-center">
               <div class="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                  <span class="material-icons text-6xl">local_shipping</span>
               </div>
            </div>
            <h1 class="text-5xl font-bold mb-6 tracking-tight">Gaadi Dost</h1>
            <p class="text-xl text-blue-200 leading-relaxed mb-12">
              The ultimate fleet management ecosystem. 
              <br>Connect drivers, mechanics, and admins in real-time.
            </p>
            
            <div class="grid grid-cols-3 gap-6 text-center">
               <div class="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <span class="material-icons text-3xl mb-2 text-blue-300">gps_fixed</span>
                  <div class="text-xs font-bold uppercase tracking-wider opacity-80">Tracking</div>
               </div>
               <div class="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <span class="material-icons text-3xl mb-2 text-green-300">psychology</span>
                  <div class="text-xs font-bold uppercase tracking-wider opacity-80">AI Load</div>
               </div>
               <div class="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <span class="material-icons text-3xl mb-2 text-orange-300">build</span>
                  <div class="text-xs font-bold uppercase tracking-wider opacity-80">Repairs</div>
               </div>
            </div>
         </div>
      </div>

      <!-- Right Side: Auth Form -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div class="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          
          <!-- Mobile Branding (Visible only on small screens) -->
          <div class="text-center mb-8 lg:hidden">
             <div class="inline-flex p-3 bg-blue-100 rounded-xl mb-3">
               <span class="material-icons text-3xl text-blue-800">local_shipping</span>
             </div>
             <h1 class="text-3xl font-bold text-blue-900">Gaadi Dost</h1>
             <p class="text-gray-500">Fleet Management System</p>
          </div>

          <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">{{isRegistering() ? 'Create Account' : 'Welcome Back'}}</h2>
            <p class="text-gray-500 text-sm">
              {{isRegistering() ? 'Join our platform as a new user.' : 'Please select your role to login.'}}
            </p>
          </div>

          <!-- Role Tabs -->
          <div class="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl mb-6">
            <button (click)="selectRole('driver')" 
               [class]="selectedRole() === 'driver' ? 'bg-white text-blue-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'"
               class="py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1">
               <span class="material-icons text-sm" *ngIf="selectedRole() === 'driver'">check</span>
               Driver
            </button>
            <button (click)="selectRole('mechanic')" 
               [class]="selectedRole() === 'mechanic' ? 'bg-white text-orange-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'"
               class="py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1">
               <span class="material-icons text-sm" *ngIf="selectedRole() === 'mechanic'">check</span>
               Mechanic
            </button>
            <button (click)="selectRole('admin')" 
               [class]="selectedRole() === 'admin' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'"
               class="py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1">
               <span class="material-icons text-sm" *ngIf="selectedRole() === 'admin'">check</span>
               Admin
            </button>
          </div>

          <!-- Auth Form -->
          <form (submit)="handleSubmit($event)" class="space-y-5">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">Email Address</label>
              <div class="relative group">
                <span class="material-icons absolute left-3 top-3 text-gray-400 text-lg group-focus-within:text-blue-500 transition-colors">email</span>
                <input type="email" [(ngModel)]="email" name="email" required
                       class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-gray-800 placeholder:text-gray-400"
                       [placeholder]="getPlaceholderEmail()">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">Password</label>
              <div class="relative group">
                <span class="material-icons absolute left-3 top-3 text-gray-400 text-lg group-focus-within:text-blue-500 transition-colors">lock</span>
                <input type="password" [(ngModel)]="password" name="password" required minlength="6"
                       class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-gray-800 placeholder:text-gray-400"
                       placeholder="••••••••">
              </div>
            </div>

            <div class="flex items-center justify-between text-xs pt-1" *ngIf="!isRegistering()">
               <label class="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-gray-900 transition">
                 <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"> 
                 <span>Remember me</span>
               </label>
               <a href="#" class="text-blue-600 hover:text-blue-800 font-bold transition">Forgot Password?</a>
            </div>
            
            <div *ngIf="errorMsg" class="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2">
               <span class="material-icons text-sm">error</span> {{errorMsg}}
            </div>

            <button type="submit" [disabled]="loading"
                    [class]="getButtonClass()"
                    class="w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 mt-4 group disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="!loading">{{isRegistering() ? 'Create Account' : 'Sign In'}} as {{selectedRole() | titlecase}}</span>
              <span *ngIf="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span *ngIf="!loading" class="material-icons text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </form>
          
          <div class="mt-8 flex items-center gap-4">
             <div class="h-px bg-gray-200 flex-1"></div>
             <span class="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Or</span>
             <div class="h-px bg-gray-200 flex-1"></div>
          </div>

          <div class="mt-6 text-center text-sm text-gray-500">
             <ng-container *ngIf="!isRegistering()">
                Don't have an account? 
                <button (click)="toggleMode()" class="text-blue-600 font-bold hover:underline focus:outline-none">Sign up for Gaadi Dost</button>
             </ng-container>
             <ng-container *ngIf="isRegistering()">
                Already have an account? 
                <button (click)="toggleMode()" class="text-blue-600 font-bold hover:underline focus:outline-none">Sign In</button>
             </ng-container>
          </div>

        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  auth = inject(AuthService);
  
  email = '';
  password = '';
  selectedRole = signal<UserRole>('driver');
  isRegistering = signal(false);
  loading = false;
  errorMsg = '';

  selectRole(role: string) {
    this.selectedRole.set(role as UserRole);
  }

  toggleMode() {
    this.isRegistering.update(v => !v);
    this.errorMsg = '';
  }

  getPlaceholderEmail() {
    switch (this.selectedRole()) {
      case 'driver': return 'driver@gaadidost.com';
      case 'mechanic': return 'mechanic@gaadidost.com';
      case 'admin': return 'admin@gaadidost.com';
      default: return 'user@example.com';
    }
  }

  getButtonClass() {
    const base = "w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 mt-4 group disabled:opacity-50 disabled:cursor-not-allowed";
    switch (this.selectedRole()) {
      case 'driver': return `${base} bg-blue-600 hover:bg-blue-700 shadow-blue-200`;
      case 'mechanic': return `${base} bg-orange-600 hover:bg-orange-700 shadow-orange-200`;
      case 'admin': return `${base} bg-slate-800 hover:bg-slate-900 shadow-slate-200`;
      default: return `${base} bg-gray-600`;
    }
  }

  async handleSubmit(event: Event) {
    event.preventDefault();
    if (!this.email || !this.password) {
      this.errorMsg = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    try {
      if (this.isRegistering()) {
        const name = this.email.split('@')[0];
        await this.auth.register(this.email, this.password, this.selectedRole(), name);
      } else {
        await this.auth.login(this.email, this.password, this.selectedRole());
      }
    } catch (e: any) {
      this.errorMsg = e.message || 'Authentication failed';
    } finally {
      this.loading = false;
    }
  }
}
