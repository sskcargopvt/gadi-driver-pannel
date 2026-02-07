import { Component, signal } from '@angular/core';
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
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p class="text-gray-500 text-sm">Please select your role to login.</p>
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

          <!-- Login Form -->
          <form (submit)="login($event)" class="space-y-5">
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
                <input type="password" [(ngModel)]="password" name="password" required
                       class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium text-gray-800 placeholder:text-gray-400"
                       placeholder="••••••••">
              </div>
            </div>

            <div class="flex items-center justify-between text-xs pt-1">
               <label class="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-gray-900 transition">
                 <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"> 
                 <span>Remember me</span>
               </label>
               <a href="#" class="text-blue-600 hover:text-blue-800 font-bold transition">Forgot Password?</a>
            </div>

            <button type="submit" 
                    [class]="getButtonClass()"
                    class="w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 mt-4 group">
              <span>Sign In as {{selectedRole() | titlecase}}</span>
              <span class="material-icons text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </form>
          
          <div class="mt-8 flex items-center gap-4">
             <div class="h-px bg-gray-200 flex-1"></div>
             <span class="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Or continue with</span>
             <div class="h-px bg-gray-200 flex-1"></div>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-4">
             <button class="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:bg-gray-100">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-5 h-5" alt="Google">
                <span class="text-sm font-semibold text-gray-600">Google</span>
             </button>
             <button class="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:bg-gray-100">
                <span class="material-icons text-gray-800 text-xl">apple</span>
                <span class="text-sm font-semibold text-gray-600">Apple</span>
             </button>
          </div>
          
          <div class="mt-8 text-center text-sm text-gray-500">
             Don't have an account? <a href="#" class="text-blue-600 font-bold hover:underline">Sign up for Gaadi Dost</a>
          </div>

        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  selectedRole = signal<UserRole>('driver');
  email = '';
  password = '';

  constructor(private auth: AuthService) {}

  selectRole(role: UserRole) {
    this.selectedRole.set(role);
    // Clear form or set defaults
    this.email = ''; 
    this.password = '';
  }

  getButtonClass() {
    const role = this.selectedRole();
    if (role === 'driver') return 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-200';
    if (role === 'mechanic') return 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-200';
    return 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 shadow-slate-200';
  }

  getPlaceholderEmail() {
    const role = this.selectedRole();
    if (role === 'driver') return 'driver@gaadi-dost.com';
    if (role === 'mechanic') return 'mechanic@gaadi-dost.com';
    return 'admin@gaadi-dost.com';
  }

  login(event: Event) {
    event.preventDefault();
    if (!this.email) {
      // If user hit simple login without typing, simulate based on role
      if (this.selectedRole() === 'driver') this.email = 'driver@gaadi.com';
      if (this.selectedRole() === 'mechanic') this.email = 'mechanic@gaadi.com';
      if (this.selectedRole() === 'admin') this.email = 'admin@gaadi.com';
    }

    const name = this.email.split('@')[0];
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1) + (this.email.includes('.') ? '' : ' User');
    
    this.auth.login(this.selectedRole(), formattedName);
  }
}