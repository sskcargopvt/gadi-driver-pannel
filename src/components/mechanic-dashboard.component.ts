import { Component, inject, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { SupabaseService, EmergencyRequest } from '../services/supabase.service';
import { AiService } from '../services/ai.service';
import { MapComponent } from './map.component';

@Component({
  selector: 'app-mechanic-dashboard',
  standalone: true,
  imports: [CommonModule, MapComponent, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <!-- Header with Tabs -->
      <header class="bg-orange-600 text-white shadow-lg sticky top-0 z-50">
        <div class="p-4 flex justify-between items-center">
          <div>
            <h1 class="text-xl font-bold flex items-center gap-2">
              <span class="material-icons">build_circle</span> Mechanic Pro
            </h1>
            <p class="text-xs opacity-90 text-orange-100">{{isOnline() ? 'Online • Ready for Jobs' : 'Offline • Invisible'}}</p>
          </div>
          <button (click)="auth.logout()" class="p-2 bg-orange-700 rounded-lg hover:bg-orange-800 transition">
            <span class="material-icons">logout</span>
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex overflow-x-auto bg-orange-700 text-sm">
          <button (click)="setActiveTab('status')" 
            class="flex-1 py-3 px-4 font-medium transition focus:outline-none flex justify-center items-center gap-2"
            [class.bg-white]="activeTab() === 'status'"
            [class.text-orange-800]="activeTab() === 'status'"
            [class.text-orange-100]="activeTab() !== 'status'">
            <span class="material-icons text-sm">dashboard</span> Status
          </button>
          
          <button (click)="setActiveTab('requests')" 
            class="flex-1 py-3 px-4 font-medium transition focus:outline-none relative flex justify-center items-center gap-2"
            [class.bg-white]="activeTab() === 'requests'"
            [class.text-orange-800]="activeTab() === 'requests'"
            [class.text-orange-100]="activeTab() !== 'requests'">
            <span class="material-icons text-sm">list_alt</span> Requests
            @if(pendingRequests().length > 0) {
              <span class="absolute top-1 right-2 w-5 h-5 bg-white text-orange-600 text-xs flex items-center justify-center rounded-full animate-pulse font-bold shadow-sm">
                {{pendingRequests().length}}
              </span>
            }
          </button>

          <button (click)="setActiveTab('active')" 
            class="flex-1 py-3 px-4 font-medium transition focus:outline-none relative flex justify-center items-center gap-2"
            [class.bg-white]="activeTab() === 'active'"
            [class.text-orange-800]="activeTab() === 'active'"
            [class.text-orange-100]="activeTab() !== 'active'">
            <span class="material-icons text-sm">work</span> Active Job
            @if(activeJob()) {
               <span class="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
            }
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto pb-20">
        
        <!-- Tab 1: Status & AI Tools -->
        @if (activeTab() === 'status') {
           <div class="p-4 space-y-4 animate-fade-in">
             <!-- Status Card -->
             <div class="bg-white rounded-2xl shadow p-5 border-l-4" 
                  [class.border-green-500]="isOnline()" [class.border-gray-400]="!isOnline()">
                <div class="flex justify-between items-center mb-4">
                  <h2 class="font-bold text-gray-800 text-lg">Availability</h2>
                  <div class="form-check form-switch">
                    <button (click)="toggleOnline()" 
                            class="relative inline-flex items-center h-8 rounded-full w-14 transition-colors focus:outline-none"
                            [class.bg-green-500]="isOnline()"
                            [class.bg-gray-300]="!isOnline()">
                      <span class="inline-block w-6 h-6 transform bg-white rounded-full transition-transform ml-1"
                            [class.translate-x-6]="isOnline()"></span>
                    </button>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                   <div class="bg-orange-50 p-3 rounded-xl text-center">
                      <div class="text-2xl font-bold text-orange-700">₹4,250</div>
                      <div class="text-xs text-orange-500 uppercase font-bold">Today's Earnings</div>
                   </div>
                   <div class="bg-blue-50 p-3 rounded-xl text-center">
                      <div class="text-2xl font-bold text-blue-700">3</div>
                      <div class="text-xs text-blue-500 uppercase font-bold">Jobs Done</div>
                   </div>
                </div>
             </div>

             <!-- AI Diagnostic Tool -->
             <div class="bg-white rounded-2xl shadow p-5">
                <h2 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <span class="material-icons text-purple-600">psychology</span> AI Diagnostic Assistant
                </h2>
                <div class="space-y-3">
                   <textarea placeholder="Describe symptoms (e.g. 'Clicking sound when turning key, lights dim')" 
                             [(ngModel)]="symptoms" rows="3"
                             class="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
                   <button (click)="diagnose()" [disabled]="loadingAi()"
                           class="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition shadow-lg shadow-purple-200">
                     {{loadingAi() ? 'Analyzing Engine...' : 'Diagnose Problem'}}
                   </button>
                </div>

                @if (aiResult()) {
                  <div class="mt-6 animate-fade-in-up">
                    <div class="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-3">
                       <div class="flex justify-between items-center mb-2">
                          <span class="text-xs font-bold text-purple-500 uppercase">Probable Causes</span>
                          <span class="text-xs font-bold px-2 py-1 rounded bg-white border border-purple-200"
                                [class.text-red-500]="aiResult().urgency === 'High'"
                                [class.text-yellow-600]="aiResult().urgency === 'Medium'">
                             {{aiResult().urgency}} Priority
                          </span>
                       </div>
                       <ul class="list-disc list-inside text-sm text-gray-700 space-y-1 mb-3">
                          @for(cause of aiResult().causes; track cause) {
                             <li>{{cause}}</li>
                          }
                       </ul>
                       <div class="bg-white p-3 rounded-lg border border-purple-100">
                          <span class="block text-xs text-gray-400 font-bold uppercase mb-1">Quick Fix Recommendation</span>
                          <p class="text-sm font-medium text-gray-800">{{aiResult().recommendation}}</p>
                       </div>
                    </div>
                  </div>
                }
             </div>
           </div>
        }

        <!-- Tab 2: Job Requests -->
        @if (activeTab() === 'requests') {
           <div class="p-4 space-y-4 animate-fade-in">
              @if (pendingRequests().length === 0) {
                 <div class="flex flex-col items-center justify-center py-20 text-gray-400 opacity-60">
                    <span class="material-icons text-6xl mb-4">verified</span>
                    <p>All caught up! Waiting for calls...</p>
                 </div>
              }

              @for (req of pendingRequests(); track req.id) {
                 <div class="bg-white rounded-2xl shadow-lg border-l-4 border-red-500 overflow-hidden relative">
                    <div class="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                       EMERGENCY
                    </div>
                    <div class="p-5">
                       <h3 class="font-bold text-xl text-gray-800 mb-1">{{req.type}}</h3>
                       <p class="text-sm text-gray-500 mb-4 flex items-center gap-1">
                          <span class="material-icons text-sm">location_on</span> {{req.location}}
                       </p>
                       
                       <div class="bg-red-50 rounded-xl p-3 mb-4 flex items-center gap-3">
                          <div class="bg-white p-2 rounded-full shadow-sm">
                             <span class="material-icons text-red-500">warning</span>
                          </div>
                          <div class="text-sm text-red-800">
                             <strong>Reported:</strong> Vehicle stopped on highway shoulder. Needs immediate towing or jumpstart.
                          </div>
                       </div>

                       <div class="flex gap-3">
                          <button (click)="acceptJob(req)" 
                                  class="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-green-200 shadow-md">
                             Accept Job
                          </button>
                          <button class="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200">
                             Ignore
                          </button>
                       </div>
                    </div>
                 </div>
              }
           </div>
        }

        <!-- Tab 3: Active Job -->
        @if (activeTab() === 'active') {
           @if (activeJob(); as job) {
              <div class="h-full flex flex-col animate-fade-in">
                 
                 <!-- Map Area -->
                 <div class="h-64 relative bg-gray-200 shadow-inner">
                    <app-map [center]="{lat: job.lat, lng: job.lng}"
                             [markers]="[{lat: job.lat, lng: job.lng, title: job.type, type: 'emergency'}]">
                    </app-map>
                    <!-- Floating Info Card -->
                    <div class="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg border border-gray-100 flex items-center justify-between">
                       <div>
                          <div class="text-xs text-gray-500 uppercase font-bold">Customer Location</div>
                          <div class="font-bold text-gray-800 text-sm truncate w-48">{{job.location}}</div>
                       </div>
                       <button class="bg-blue-600 text-white p-2 rounded-full shadow-lg">
                          <span class="material-icons">directions</span>
                       </button>
                    </div>
                 </div>

                 <!-- Action Area -->
                 <div class="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-5 flex flex-col">
                    <div class="flex justify-center mb-2">
                       <div class="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                    </div>

                    <div class="flex justify-between items-center mb-6">
                       <div>
                          <h2 class="font-bold text-xl text-gray-800">{{job.type}}</h2>
                          <div class="text-green-600 font-bold text-sm flex items-center gap-1">
                             <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> In Progress
                          </div>
                       </div>
                       <button (click)="completeJob(job)" class="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-200">
                          Mark Complete
                       </button>
                    </div>

                    <!-- Chat Interface -->
                    <div class="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex flex-col overflow-hidden">
                       <div class="bg-white border-b border-gray-100 p-3 flex items-center gap-2 shadow-sm">
                          <span class="material-icons text-orange-500">forum</span>
                          <span class="font-bold text-gray-700 text-sm">Driver Chat</span>
                       </div>
                       
                       <div #chatContainer class="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
                          @for(msg of job.messages; track msg.time) {
                             <div [class.text-right]="msg.sender === 'mechanic'" class="animate-fade-in-up">
                                <div class="inline-block px-4 py-2 rounded-2xl text-sm max-w-[85%] text-left shadow-sm relative"
                                     [class.bg-orange-500]="msg.sender === 'mechanic'"
                                     [class.text-white]="msg.sender === 'mechanic'"
                                     [class.rounded-br-none]="msg.sender === 'mechanic'"
                                     [class.bg-white]="msg.sender === 'driver'"
                                     [class.text-gray-800]="msg.sender === 'driver'"
                                     [class.rounded-bl-none]="msg.sender === 'driver'"
                                     [class.border]="msg.sender === 'driver'"
                                     [class.border-gray-200]="msg.sender === 'driver'">
                                   <div>{{msg.text}}</div>
                                   <div class="text-[10px] mt-1 opacity-75 text-right font-mono"
                                        [class.text-orange-100]="msg.sender === 'mechanic'"
                                        [class.text-gray-400]="msg.sender === 'driver'">
                                      {{msg.time | date:'shortTime'}}
                                   </div>
                                </div>
                             </div>
                          }
                          @if(job.messages.length === 0) {
                             <div class="text-center text-gray-400 text-xs py-10 flex flex-col items-center">
                                <span class="material-icons mb-2 text-gray-300 text-3xl">chat_bubble_outline</span>
                                Start messaging the driver...
                             </div>
                          }
                       </div>

                       <div class="p-2 bg-white border-t border-gray-200 flex gap-2">
                          <input type="text" [(ngModel)]="chatInput" (keyup.enter)="sendMessage(job.id)"
                                 placeholder="Message driver..."
                                 class="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:bg-white transition">
                          <button (click)="sendMessage(job.id)" [disabled]="!chatInput.trim()"
                                  class="bg-orange-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-orange-700 disabled:opacity-50 transition shadow-md">
                             <span class="material-icons text-sm">send</span>
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           } @else {
              <div class="flex flex-col items-center justify-center h-full text-gray-400 p-10 text-center">
                 <img src="https://cdn-icons-png.flaticon.com/512/6283/6283287.png" class="w-32 opacity-20 mb-4" alt="No job">
                 <h3 class="text-lg font-bold text-gray-500">No Active Job</h3>
                 <p class="text-sm mb-6">Go to Requests tab to accept a new job.</p>
                 <button (click)="setActiveTab('requests')" class="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg">
                    Find Jobs
                 </button>
              </div>
           }
        }

      </main>
    </div>
  `,
  styles: [`
    @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
    .animate-fade-in { animation: fade-in-up 0.2s ease-out forwards; }
  `]
})
export class MechanicDashboardComponent {
  auth = inject(AuthService);
  supabase = inject(SupabaseService);
  ai = inject(AiService);

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  activeTab = signal<'status' | 'requests' | 'active'>('status');
  isOnline = signal(true);
  
  // AI Tool
  symptoms = '';
  loadingAi = signal(false);
  aiResult = signal<any>(null);
  
  // Chat
  chatInput = '';

  // Data
  requests = this.supabase.mockEmergencies;
  pendingRequests = computed(() => this.requests().filter(r => r.status === 'pending'));
  
  // Active job with sorted messages for chat
  activeJob = computed(() => {
    const job = this.requests().find(r => r.status === 'assigned' || r.status === 'tracking');
    if (job) {
       // Ensure chronological order
       const sortedMessages = [...job.messages].sort((a, b) => {
         return new Date(a.time).getTime() - new Date(b.time).getTime();
       });
       return { ...job, messages: sortedMessages };
    }
    return null;
  });

  private previousPendingCount = 0;

  constructor() {
    this.supabase.getEmergencies();
    this.supabase.subscribeToEmergencies();
    this.supabase.startSimulation(); // Start the live tracking simulation
    
    // Initialize previousPendingCount to avoid playing sound on first load if requests exist
    this.previousPendingCount = this.pendingRequests().length;

    // Auto-scroll chat
    effect(() => {
       const job = this.activeJob();
       if (job && job.messages) {
          setTimeout(() => this.scrollToBottom(), 100);
       }
    });

    // Sound Alert for New Requests
    effect(() => {
       const currentCount = this.pendingRequests().length;
       if (currentCount > this.previousPendingCount) {
          this.playNotificationSound();
       }
       this.previousPendingCount = currentCount;
    });
  }

  setActiveTab(tab: 'status' | 'requests' | 'active') {
    this.activeTab.set(tab);
  }

  toggleOnline() {
    this.isOnline.update(v => !v);
  }

  async diagnose() {
    if (!this.symptoms) return;
    this.loadingAi.set(true);
    this.aiResult.set(await this.ai.diagnoseIssue(this.symptoms));
    this.loadingAi.set(false);
  }

  async acceptJob(req: EmergencyRequest) {
    const name = this.auth.currentUser()?.name || 'Mechanic';
    await this.supabase.updateEmergencyStatus(req.id, 'assigned', undefined, name);
    this.setActiveTab('active');
  }

  async completeJob(req: EmergencyRequest) {
    if(confirm('Mark this job as completed?')) {
       await this.supabase.updateEmergencyStatus(req.id, 'completed');
       this.setActiveTab('status');
    }
  }

  sendMessage(reqId: string) {
    if (this.chatInput.trim()) {
      this.supabase.sendEmergencyMessage(reqId, this.chatInput);
      this.chatInput = '';
    }
  }

  scrollToBottom() {
    if (this.chatContainer) {
      try {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      } catch(e) {}
    }
  }

  playNotificationSound() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
    audio.volume = 0.6;
    audio.play().catch(e => console.error('Audio play blocked', e));
  }
}