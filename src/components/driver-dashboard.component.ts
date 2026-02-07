import { Component, inject, signal, computed, OnDestroy, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { SupabaseService, Vehicle, BookingRequest, Load } from '../services/supabase.service';
import { AiService } from '../services/ai.service';
import { MapComponent } from './map.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, MapComponent, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-100 flex flex-col">
      <!-- Header -->
      <header class="bg-blue-800 text-white shadow-lg sticky top-0 z-50">
        <div class="p-4 flex justify-between items-center">
          <div>
            <h1 class="text-xl font-bold">Gaadi Dost Driver</h1>
            <p class="text-xs opacity-80">{{currentVehicle()?.registration_number || 'Loading...'}}</p>
          </div>
          <button (click)="auth.logout()" class="p-2 bg-blue-900 rounded-lg hover:bg-blue-950">
            <span class="material-icons">logout</span>
          </button>
        </div>
        
        <!-- Tab Nav -->
        <div class="flex overflow-x-auto bg-blue-700 text-sm">
          <button (click)="setActiveTab('status')" 
            class="flex-1 py-3 px-4 font-medium transition focus:outline-none"
            [class.bg-white]="activeTab() === 'status'"
            [class.text-blue-800]="activeTab() === 'status'"
            [class.text-blue-100]="activeTab() !== 'status'">
            My Status
          </button>
          
          <button (click)="setActiveTab('requests')" 
            class="flex-1 py-3 px-4 font-medium transition focus:outline-none relative"
            [class.bg-white]="activeTab() === 'requests'"
            [class.text-blue-800]="activeTab() === 'requests'"
            [class.text-blue-100]="activeTab() !== 'requests'">
            Requests
            @if(pendingRequests().length > 0) {
              <span class="absolute top-1 right-2 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full animate-pulse">
                {{pendingRequests().length}}
              </span>
            }
          </button>

          <button (click)="setActiveTab('active')" 
            class="flex-1 py-3 px-4 font-medium transition focus:outline-none relative"
            [class.bg-white]="activeTab() === 'active'"
            [class.text-blue-800]="activeTab() === 'active'"
            [class.text-blue-100]="activeTab() !== 'active'">
            Active Job
            @if(unreadMessageCount() > 0) {
              <span class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce shadow-sm">
                {{unreadMessageCount()}}
              </span>
            } @else if(activeJob()) {
              <span class="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"></span>
            }
          </button>

          <button (click)="setActiveTab('loads')" 
            class="flex-1 py-3 px-4 font-medium transition focus:outline-none"
            [class.bg-white]="activeTab() === 'loads'"
            [class.text-blue-800]="activeTab() === 'loads'"
            [class.text-blue-100]="activeTab() !== 'loads'">
            Load Board
          </button>
        </div>
      </header>

      <main class="flex-1 p-4 pb-20 overflow-y-auto">
        
        <!-- 1. My Status Tab -->
        @if (activeTab() === 'status') {
          @if (currentVehicle(); as vehicle) {
            <div class="space-y-4 animate-fade-in">
              <div class="bg-white rounded-2xl shadow p-4">
                <div class="flex justify-between items-center mb-4">
                  <span class="px-3 py-1 rounded-full text-sm font-medium"
                    [class.bg-green-100]="vehicle.status === 'Running'"
                    [class.text-green-700]="vehicle.status === 'Running'"
                    [class.bg-yellow-100]="vehicle.status === 'Idle'"
                    [class.text-yellow-700]="vehicle.status === 'Idle'"
                    [class.bg-red-100]="vehicle.status === 'Stopped'"
                    [class.text-red-700]="vehicle.status === 'Stopped'">
                    {{vehicle.status}}
                  </span>
                  <span class="font-mono text-2xl font-bold">{{vehicle.speed}} <span class="text-sm font-normal text-gray-500">km/h</span></span>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-slate-50 p-3 rounded-lg text-center">
                    <span class="material-icons text-blue-500 mb-1">local_gas_station</span>
                    <div class="text-lg font-bold">{{vehicle.fuel_level}}%</div>
                    <div class="text-xs text-gray-500">Fuel Level</div>
                  </div>
                  <div class="bg-slate-50 p-3 rounded-lg text-center">
                    <span class="material-icons text-green-500 mb-1">battery_charging_full</span>
                    <div class="text-lg font-bold">{{vehicle.battery_level}}%</div>
                    <div class="text-xs text-gray-500">Battery</div>
                  </div>
                </div>

                <div class="mt-4 flex gap-2">
                  <button (click)="toggleIgnition()" 
                    class="flex-1 py-3 rounded-xl font-bold transition"
                    [class]="vehicle.ignition ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'">
                    {{vehicle.ignition ? 'STOP ENGINE' : 'START ENGINE'}}
                  </button>
                  <button (click)="requestHelp()" class="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold shadow-red-200 shadow-lg animate-pulse">
                    SOS
                  </button>
                </div>
              </div>

              <!-- AI Load Estimator -->
              <div class="bg-white rounded-2xl shadow p-4">
                <h2 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span class="material-icons text-purple-600">psychology</span> AI Load Estimator
                </h2>
                
                <div class="space-y-3">
                  <input type="text" placeholder="Cargo (e.g. 500kg of wood)" 
                        [(ngModel)]="cargoDesc" 
                        class="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <input type="number" placeholder="Distance (km)" 
                        [(ngModel)]="distance" 
                        class="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <button (click)="estimateLoad()" [disabled]="loadingAi()"
                          class="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50">
                    {{loadingAi() ? 'Thinking...' : 'Calculate'}}
                  </button>
                </div>

                @if (aiResult()) {
                  <div class="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 animate-fade-in">
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-sm text-gray-500">Load</span>
                      <span class="font-bold">{{aiResult().loadPercentage}}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div class="bg-purple-600 h-2 rounded-full" [style.width.%]="aiResult().loadPercentage"></div>
                    </div>
                    <p class="text-xs text-gray-600 italic">"{{aiResult().advice}}"</p>
                  </div>
                }
              </div>
            </div>
          }
        }

        <!-- 2. Requests Tab -->
        @if (activeTab() === 'requests') {
          <div class="space-y-4 animate-fade-in">
            @if(pendingRequests().length === 0) {
              <div class="text-center py-10 text-gray-400">
                <span class="material-icons text-5xl mb-2">notifications_off</span>
                <p>No new requests right now.</p>
              </div>
            }

            @for (req of pendingRequests(); track req.id) {
              <div class="bg-white rounded-2xl shadow-lg border-l-4 border-blue-500 overflow-hidden">
                <div class="p-4">
                  <div class="flex justify-between items-start mb-2">
                     <div>
                       <h3 class="font-bold text-lg text-gray-800">{{req.goods_type}}</h3>
                       <p class="text-sm text-gray-500">{{req.weight}}</p>
                     </div>
                     <div class="text-right">
                       <div class="text-xl font-bold text-green-600">₹{{req.offered_price}}</div>
                       <div class="text-xs text-gray-400" *ngIf="req.status === 'negotiating'">Counter Offer Sent</div>
                     </div>
                  </div>
                  
                  <div class="flex items-center gap-2 mb-2 text-sm text-gray-600">
                    <span class="material-icons text-base text-gray-400">location_on</span>
                    <span class="truncate">{{req.pickup_location}}</span>
                  </div>
                  <div class="flex items-center gap-2 mb-4 text-sm text-gray-600">
                    <span class="material-icons text-base text-gray-400">flag</span>
                    <span class="truncate">{{req.drop_location}}</span>
                  </div>

                  @if (bargainingId() === req.id) {
                    <div class="mb-3 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                      <label class="block text-xs font-bold text-yellow-800 mb-1">Your Counter Offer (₹)</label>
                      <div class="flex gap-2">
                        <input type="number" [(ngModel)]="counterOfferAmount" class="flex-1 p-2 border rounded-md" placeholder="Amount">
                        <button (click)="submitCounterOffer(req.id)" class="bg-yellow-600 text-white px-3 rounded-md font-bold">Send</button>
                        <button (click)="bargainingId.set(null)" class="text-gray-500 px-2">Cancel</button>
                      </div>
                    </div>
                  }

                  <div class="grid grid-cols-3 gap-2">
                    <button (click)="respond(req.id, 'accept')" class="bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700">
                      Accept
                    </button>
                    <button (click)="startBargain(req.id)" class="bg-yellow-500 text-white py-2 rounded-lg font-bold hover:bg-yellow-600">
                      Bargain
                    </button>
                    <button (click)="respond(req.id, 'reject')" class="bg-red-100 text-red-600 py-2 rounded-lg font-bold hover:bg-red-200">
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- 3. Active Job Tab -->
        @if (activeTab() === 'active') {
          @if (activeJob(); as job) {
            <div class="h-full flex flex-col animate-fade-in pb-4">
              <!-- Customer Info -->
              <div class="bg-white rounded-xl shadow p-4 mb-4">
                <div class="flex items-center gap-3 mb-3">
                  <div class="bg-blue-100 p-2 rounded-full">
                    <span class="material-icons text-blue-600">person</span>
                  </div>
                  <div>
                    <h2 class="font-bold text-gray-800">{{job.customer_name}}</h2>
                    <p class="text-sm text-gray-500">{{job.customer_phone}}</p>
                  </div>
                  <a href="tel:{{job.customer_phone}}" class="ml-auto bg-green-100 text-green-700 p-2 rounded-full">
                    <span class="material-icons">call</span>
                  </a>
                </div>
                
                <div class="space-y-2 text-sm border-t border-gray-100 pt-3">
                   <div class="flex gap-2">
                      <span class="font-bold text-gray-500 w-16">Pickup:</span>
                      <span class="text-gray-800">{{job.pickup_location}}</span>
                   </div>
                   <div class="flex gap-2">
                      <span class="font-bold text-gray-500 w-16">Drop:</span>
                      <span class="text-gray-800">{{job.drop_location}}</span>
                   </div>
                </div>
              </div>

              <!-- Live Map -->
              <div class="min-h-[200px] bg-gray-200 rounded-xl overflow-hidden shadow mb-4 relative">
                @if(currentVehicle(); as v) {
                  <app-map 
                    [center]="{lat: v.lat, lng: v.lng}"
                    [markers]="[
                      {lat: v.lat, lng: v.lng, title: 'You', type: 'vehicle'},
                      {lat: job.pickup_lat, lng: job.pickup_lng, title: 'Pickup: ' + job.customer_name, type: 'pickup'},
                      {lat: job.drop_lat, lng: job.drop_lng, title: 'Drop Location', type: 'drop'}
                    ]">
                  </app-map>
                }
              </div>

              <!-- Chat Section -->
              <div class="bg-white rounded-xl shadow flex flex-col h-[400px] border border-blue-100">
                <div class="p-3 border-b border-gray-100 bg-gray-50 font-bold text-gray-700 flex items-center justify-between rounded-t-xl">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-blue-600 text-sm">chat</span> Chat with Customer
                  </div>
                  <span class="text-xs text-green-600 font-medium flex items-center gap-1">
                    <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                  </span>
                </div>
                
                <div #chatContainer class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                   @for(msg of job.messages; track msg.time) {
                     <div [class.text-right]="msg.sender === 'driver'" class="animate-fade-in-up">
                        <div class="inline-block px-4 py-2 rounded-2xl text-sm max-w-[85%] text-left shadow-sm relative group transition-all"
                              [class.bg-blue-600]="msg.sender === 'driver'"
                              [class.text-white]="msg.sender === 'driver'"
                              [class.rounded-tr-none]="msg.sender === 'driver'"
                              [class.bg-white]="msg.sender === 'customer'"
                              [class.text-gray-800]="msg.sender === 'customer'"
                              [class.rounded-tl-none]="msg.sender === 'customer'"
                              [class.border]="msg.sender === 'customer'"
                              [class.border-gray-200]="msg.sender === 'customer'">
                          <div>{{msg.text}}</div>
                          <div class="text-[10px] mt-1 opacity-70 text-right font-mono"
                               [class.text-blue-100]="msg.sender === 'driver'"
                               [class.text-gray-400]="msg.sender === 'customer'">
                            {{msg.time | date:'shortTime'}}
                          </div>
                        </div>
                     </div>
                   }
                   @if(job.messages.length === 0) {
                     <div class="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                       <span class="material-icons text-4xl mb-2">forum</span>
                       <p class="text-xs">Start the conversation</p>
                     </div>
                   }
                </div>
                
                <div class="p-3 border-t border-gray-100 bg-white rounded-b-xl flex gap-2">
                  <input type="text" [(ngModel)]="chatInput" (keyup.enter)="sendChat(job.id)"
                         placeholder="Type a message..." 
                         class="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition">
                  <button (click)="sendChat(job.id)" 
                          [disabled]="!chatInput.trim()"
                          class="bg-blue-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg transform active:scale-95">
                    <span class="material-icons text-sm">send</span>
                  </button>
                </div>
              </div>
            </div>
          } @else {
             <div class="text-center py-20 text-gray-400">
                <span class="material-icons text-6xl mb-4">local_shipping</span>
                <p class="text-lg">No active jobs.</p>
                <button (click)="setActiveTab('requests')" class="mt-4 text-blue-600 font-bold underline hover:text-blue-800">Check Requests</button>
             </div>
          }
        }

        <!-- 4. Load Board Tab -->
        @if (activeTab() === 'loads') {
          <div class="space-y-4 animate-fade-in">
             <div class="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
               <h3 class="font-bold text-indigo-900 mb-1">Marketplace Load Board</h3>
               <p class="text-sm text-indigo-700">Find extra loads on your return route.</p>
             </div>

             @for (load of loads(); track load.id) {
               <div class="bg-white rounded-xl shadow p-4 border-l-4 border-indigo-500 relative">
                  @if(load.status === 'requested') {
                    <div class="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm z-10">
                      <div class="text-green-600 font-bold flex items-center gap-2">
                        <span class="material-icons">check_circle</span> Request Sent
                      </div>
                    </div>
                  }
                  
                  <div class="flex justify-between items-start mb-2">
                    <div class="font-bold text-gray-800">{{load.company}}</div>
                    <div class="font-bold text-indigo-600">₹{{load.expected_price}}</div>
                  </div>
                  
                  <div class="flex items-center gap-2 mb-2">
                    <div class="flex-1 bg-gray-100 p-2 rounded text-center">
                       <span class="block text-xs text-gray-400">FROM</span>
                       <span class="font-bold text-sm text-gray-800">{{load.source}}</span>
                    </div>
                    <span class="material-icons text-gray-300">arrow_forward</span>
                    <div class="flex-1 bg-gray-100 p-2 rounded text-center">
                       <span class="block text-xs text-gray-400">TO</span>
                       <span class="font-bold text-sm text-gray-800">{{load.destination}}</span>
                    </div>
                  </div>

                  <div class="text-sm text-gray-600 mb-2">
                    <span class="mr-3">📦 {{load.material}}</span>
                    <span>⚖️ {{load.weight}}</span>
                  </div>

                  @if(load.ai_assessment) {
                    <div class="mb-3 p-2 bg-purple-50 text-purple-700 text-xs rounded border border-purple-100 flex gap-2 items-start animate-fade-in">
                      <span class="material-icons text-sm mt-0.5">psychology</span>
                      <span class="italic">{{load.ai_assessment}}</span>
                    </div>
                  }

                  <button (click)="requestLoad(load.id)" class="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700">
                    Book Load
                  </button>
               </div>
             }
          </div>
        }

      </main>

      <!-- Bilty Link (Visible on all tabs except active job map view maybe) -->
      @if (activeTab() !== 'active') {
        <div class="fixed bottom-4 left-0 right-0 px-4 text-center pointer-events-none">
          <a href="https://www.biltybook.online" target="_blank" class="pointer-events-auto inline-block bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow text-blue-600 text-xs font-bold border border-blue-100">
            Visit Bilty Book ↗
          </a>
        </div>
      }
    </div>
  `
})
export class DriverDashboardComponent implements OnDestroy {
  auth = inject(AuthService);
  supabase = inject(SupabaseService);
  ai = inject(AiService);
  
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  activeTab = signal<'status' | 'requests' | 'active' | 'loads'>('status');
  unreadMessageCount = signal(0);
  private lastMessageCount = 0;
  
  // Track previous pending count to detect new additions
  private previousPendingCount = 0;
  
  currentVehicle = signal<Vehicle | null>(null);
  
  requests = this.supabase.mockBookings;
  pendingRequests = computed(() => this.requests().filter(r => r.status === 'pending' || r.status === 'negotiating'));
  
  // Sort messages chronologically
  activeJob = computed(() => {
    const job = this.requests().find(r => r.status === 'accepted');
    if (job) {
       return { 
         ...job, 
         messages: [...job.messages].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()) 
       };
    }
    return null;
  });
  
  loads = this.supabase.mockLoads;

  // UI State
  bargainingId = signal<string | null>(null);
  counterOfferAmount = 0;
  chatInput = '';
  
  // AI Form
  cargoDesc = '';
  distance = 0;
  loadingAi = signal(false);
  aiResult = signal<any>(null);

  private intervalId: any;

  constructor() {
    this.loadVehicle();
    this.supabase.getBookings().then(() => {
       // Set initial pending count to avoid alert on load
       this.previousPendingCount = this.pendingRequests().length;
    });
    this.supabase.startSimulation();
    this.supabase.subscribeToBookings();
    
    this.intervalId = setInterval(() => {
      this.loadVehicle();
    }, 1500);

    // Effect to monitor chat messages
    effect(() => {
      const job = this.activeJob();
      if (job) {
        const currentCount = job.messages.length;
        if (currentCount > this.lastMessageCount) {
          if (this.activeTab() !== 'active') {
            const newMsgs = currentCount - this.lastMessageCount;
            if (this.lastMessageCount > 0) { 
               this.unreadMessageCount.update(c => c + newMsgs);
            }
          } else {
            setTimeout(() => this.scrollToBottom(), 100);
          }
        }
        this.lastMessageCount = currentCount;
      } else {
        this.lastMessageCount = 0;
      }
    });

    // Effect to monitor new Booking Requests for Sound Alert
    effect(() => {
      const currentPending = this.pendingRequests().length;
      if (currentPending > this.previousPendingCount) {
        // Play sound for new request
        this.playNotificationSound();
      }
      this.previousPendingCount = currentPending;
    });
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  playNotificationSound() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio play blocked', e));
  }

  setActiveTab(tab: 'status' | 'requests' | 'active' | 'loads') {
    this.activeTab.set(tab);
    if (tab === 'active') {
      this.unreadMessageCount.set(0);
      setTimeout(() => this.scrollToBottom(), 100);
    }
    if (tab === 'loads') {
      this.analyzeLoadBoard();
    }
  }

  async analyzeLoadBoard() {
    const v = this.currentVehicle();
    const type = v?.type || 'Truck';
    const currentLoads = this.loads();
    for (const load of currentLoads) {
      if (!load.ai_assessment) {
        this.supabase.mockLoads.update(ls => ls.map(l => l.id === load.id ? {...l, ai_assessment: 'Analyzing...'} : l));
        const assessment = await this.ai.assessLoad(type, load.material, load.weight);
        this.supabase.mockLoads.update(ls => ls.map(l => l.id === load.id ? {...l, ai_assessment: assessment} : l));
      }
    }
  }

  scrollToBottom() {
    if (this.chatContainer) {
      try {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      } catch(e) {}
    }
  }

  async loadVehicle() {
    const vehicles = await this.supabase.getVehicles();
    if (vehicles.length > 0) this.currentVehicle.set(vehicles[0]);
  }

  async toggleIgnition() {
    const v = this.currentVehicle();
    if (v) {
      const newState = !v.ignition;
      await this.supabase.updateVehicleStatus(v.id, { 
        ignition: newState,
        status: newState ? 'Idle' : 'Offline',
        speed: 0
      });
      this.loadVehicle();
    }
  }

  async requestHelp() {
    const v = this.currentVehicle();
    if (v) {
      await this.supabase.createEmergency({
        lat: v.lat,
        lng: v.lng,
        location: `Lat: ${v.lat.toFixed(4)}, Lng: ${v.lng.toFixed(4)}`
      });
      alert('SOS Signal Sent! Admin and nearby mechanics alerted.');
    }
  }

  async estimateLoad() {
    if (!this.cargoDesc) return;
    this.loadingAi.set(true);
    const v = this.currentVehicle();
    const result = await this.ai.estimateLoad(v?.type || 'Truck', this.cargoDesc, this.distance);
    this.aiResult.set(result);
    this.loadingAi.set(false);
  }

  respond(id: string, action: 'accept' | 'reject') {
    this.supabase.respondToBooking(id, action);
    if (action === 'accept') {
      this.setActiveTab('active');
    }
  }

  startBargain(id: string) {
    this.bargainingId.set(id);
    const req = this.requests().find(r => r.id === id);
    this.counterOfferAmount = req ? req.offered_price : 0;
  }

  submitCounterOffer(id: string) {
    if (this.counterOfferAmount > 0) {
      this.supabase.respondToBooking(id, 'accept', this.counterOfferAmount);
      this.bargainingId.set(null);
    }
  }

  sendChat(bookingId: string) {
    if (this.chatInput.trim()) {
      this.supabase.sendMessage(bookingId, this.chatInput);
      this.chatInput = '';
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  requestLoad(loadId: string) {
    this.supabase.requestLoad(loadId);
  }
}