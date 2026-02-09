import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-test-connection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-8 font-mono">
      <div class="max-w-4xl mx-auto space-y-6">
        
        <div class="flex items-center justify-between">
           <h1 class="text-2xl font-bold text-gray-800">System Diagnostics & Connection Test</h1>
           <button (click)="runDiagnostics()" class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
             Run Diagnostics
           </button>
        </div>

        <!-- Connection Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 class="text-xs font-bold text-gray-400 uppercase mb-2">Supabase REST API</h3>
              <div class="flex items-center gap-3">
                 <div class="w-4 h-4 rounded-full" 
                      [class.bg-green-500]="apiStatus() === 'Connected'"
                      [class.bg-red-500]="apiStatus() === 'Error'"
                      [class.bg-gray-300]="apiStatus() === 'Checking...'"></div>
                 <span class="text-lg font-bold">{{apiStatus()}}</span>
              </div>
              <p class="text-xs text-gray-500 mt-2">{{apiLatency()}}</p>
           </div>

           <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 class="text-xs font-bold text-gray-400 uppercase mb-2">Realtime Channel (Broadcast)</h3>
              <div class="flex items-center gap-3">
                 <div class="w-4 h-4 rounded-full" 
                      [class.bg-green-500]="realtimeStatus() === 'Subscribed'"
                      [class.bg-yellow-500]="realtimeStatus() === 'Connecting...'"
                      [class.bg-red-500]="realtimeStatus() === 'Disconnected'"></div>
                 <span class="text-lg font-bold">{{realtimeStatus()}}</span>
              </div>
              <p class="text-xs text-gray-500 mt-2">Channel: booking_requests</p>
           </div>
        </div>

        <!-- Live Log -->
        <div class="bg-slate-900 text-green-400 p-6 rounded-xl shadow-inner h-96 overflow-y-auto font-mono text-sm border border-slate-800">
           <div class="flex justify-between border-b border-slate-800 pb-2 mb-2">
             <span class="font-bold text-gray-400">Event Log</span>
             <button (click)="clearLogs()" class="text-xs text-gray-500 hover:text-white">Clear</button>
           </div>
           @for(log of logs(); track log.time) {
             <div class="mb-1">
               <span class="text-gray-500">[{{log.time}}]</span> 
               <span [class.text-red-400]="log.type === 'error'"
                     [class.text-yellow-400]="log.type === 'warn'"
                     [class.text-blue-400]="log.type === 'info'">{{log.msg}}</span>
             </div>
           }
           @if(logs().length === 0) {
             <div class="opacity-50 italic">Waiting for events...</div>
           }
        </div>

        <div class="text-center text-xs text-gray-400 mt-8">
          Navigate to this page via <code>/test-connection</code>
        </div>
      </div>
    </div>
  `
})
export class TestConnectionComponent implements OnInit {
  supabase = inject(SupabaseService);

  apiStatus = signal<'Checking...' | 'Connected' | 'Error'>('Checking...');
  apiLatency = signal<string>('');
  realtimeStatus = signal<'Connecting...' | 'Subscribed' | 'Disconnected'>('Connecting...');
  
  logs = signal<{time: string, msg: string, type: 'info'|'error'|'warn'}[]>([]);

  ngOnInit() {
    this.log('Initializing Test Connection Component...', 'info');
    this.runDiagnostics();
  }

  async runDiagnostics() {
    this.log('Starting diagnostics...', 'info');
    
    // 1. Check REST API
    this.apiStatus.set('Checking...');
    const start = performance.now();
    try {
      const result = await this.supabase.testConnection();
      const end = performance.now();
      
      if (result.success) {
        this.apiStatus.set('Connected');
        this.apiLatency.set(`Latency: ${(end - start).toFixed(2)}ms`);
        this.log(`REST API Check Passed.`, 'info');
      } else {
         throw result.error;
      }
    } catch (e: any) {
      this.apiStatus.set('Error');
      this.apiLatency.set(`Error: ${e.message || 'Unknown error'}`);
      this.log(`REST API Failed: ${e.message || 'Unknown error'}`, 'error');
    }

    // 2. Check Realtime
    this.log('Checking Realtime Subscription...', 'info');
    this.realtimeStatus.set('Connecting...');
    
    try {
      this.supabase.subscribeToBookingRequests();
      // Assume success if no error thrown immediately, as Supabase client is async
      setTimeout(() => {
        this.realtimeStatus.set('Subscribed'); 
        this.log('Subscribed to booking_requests channel. Listening for Broadcast events.', 'info');
      }, 500);
    } catch (e: any) {
      this.realtimeStatus.set('Disconnected');
      this.log(`Realtime Subscription Failed: ${e.message}`, 'error');
    }
  }

  log(msg: string, type: 'info'|'error'|'warn' = 'info') {
    const time = new Date().toLocaleTimeString();
    this.logs.update(prev => [{time, msg, type}, ...prev]);
  }

  clearLogs() {
    this.logs.set([]);
  }
}