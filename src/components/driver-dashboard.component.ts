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
    <div class="min-h-screen bg-gray-100 flex flex-col relative">
      <!-- Toast Notification -->
      @if(toast()) {
         <div class="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl text-white text-sm font-bold flex items-center gap-2 animate-fade-in-up transition-all"
              [class.bg-green-600]="toast()?.type === 'success'"
              [class.bg-red-600]="toast()?.type === 'error'">
            <span class="material-icons text-lg">{{toast()?.type === 'success' ? 'check_circle' : 'error'}}</span>
            {{toast()?.msg}}
         </div>
      }

      <!-- Cancellation Modal -->
      @if(showCancelModal()) {
        <div class="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div class="bg-red-50 p-4 border-b border-red-100 flex items-center gap-2">
                 <span class="material-icons text-red-600">warning</span>
                 <h3 class="font-bold text-red-800">Cancel Ride</h3>
              </div>
              <div class="p-5">
                 <p class="text-sm text-gray-600 mb-4">Please select a reason for cancelling this active job. This helps us improve.</p>
                 <select [(ngModel)]="cancelReason" class="w-full p-3 border border-gray-300 rounded-lg mb-4 text-sm focus:ring-2 focus:ring-red-500 outline-none">
                    <option value="" disabled selected>Select a reason...</option>
                    <option value="Vehicle Breakdown">Vehicle Breakdown</option>
                    <option value="Customer No-show">Customer No-show</option>
                    <option value="Accident/Emergency">Accident / Emergency</option>
                    <option value="Incorrect Address">Incorrect Address</option>
                    <option value="Other">Other</option>
                 </select>
                 <div class="flex gap-3">
                    <button (click)="showCancelModal.set(false)" class="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition">Go Back</button>
                    <button (click)="confirmCancellation()" 
                            [disabled]="!cancelReason"
                            class="flex-1 py-3 text-white font-bold bg-red-600 rounded-xl hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200">
                       Confirm Cancel
                    </button>
                 </div>
              </div>
           </div>
        </div>
      }

      <!-- Header -->
      <header class="bg-blue-800 text-white shadow-lg sticky top-0 z-50">
        <div class="p-4 flex justify-between items-center">
          <div>
            <h1 class="text-xl font-bold flex items-center gap-2">
              Gaadi Dost Driver
              <span class="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold shadow animate-pulse" title="Connected: Listening to all incoming booking requests in real time.">LIVE</span>
            </h1>
            <p class="text-xs opacity-80">{{currentVehicle()?.registration_number || 'Loading...'}}</p>
          </div>
          <button (click)="auth.logout()" class="p-2 bg-blue-900 rounded-lg hover:bg-blue-950">
            <span class="material-icons">logout</span>
          </button>
        </div>
        
        <!-- Tab Nav -->
        <div class="flex overflow-x-auto bg-blue-700 text-sm">
          <button (click)="setActiveTab('status')" 
            class="flex-1 py-3 px-4 font-medium transition focus:outline-none whitespace-nowrap"
            [class.bg-white]="activeTab() === 'status'"
            [class.text-blue-800]="activeTab() === 'status'"
            [class.text-blue-100]="activeTab() !== 'status'">
            My Status
          </button>
          
          <button (click)="setActiveTab('requests')" 
            class="flex-1 py-3 px-4 font-medium transition focus:outline-none relative whitespace-nowrap"
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
            class="flex-1 py-3 px-4 font-medium transition focus:outline-none relative whitespace-nowrap"
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
            class="flex-1 py-3 px-4 font-medium transition focus:outline-none whitespace-nowrap"
            [class.bg-white]="activeTab() === 'loads'"
            [class.text-blue-800]="activeTab() === 'loads'"
            [class.text-blue-100]="activeTab() !== 'loads'">
            Loads
          </button>
          
          <button (click)="setActiveTab('team')" 
            class="flex-1 py-3 px-4 font-medium transition focus:outline-none whitespace-nowrap"
            [class.bg-white]="activeTab() === 'team'"
            [class.text-blue-800]="activeTab() === 'team'"
            [class.text-blue-100]="activeTab() !== 'team'">
            Team
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

                <!-- Primary Metrics -->
                <div class="grid grid-cols-2 gap-4 mb-4">
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

                <!-- Detailed Metrics (New) -->
                <h3 class="text-xs font-bold text-gray-500 uppercase mb-3">Vehicle Health</h3>
                <div class="grid grid-cols-2 gap-4">
                   <!-- Tire Pressure -->
                   <div class="bg-white border border-gray-100 p-3 rounded-lg flex flex-col items-center">
                      <span class="material-icons text-gray-400 mb-1">settings_backup_restore</span>
                      <div class="text-lg font-bold text-gray-700" [class.text-red-500]="vehicle.tire_pressure < 30">{{vehicle.tire_pressure}} <span class="text-xs font-normal">PSI</span></div>
                      <div class="text-[10px] text-gray-400 uppercase font-bold">Tire Pressure</div>
                   </div>

                   <!-- Engine Temp -->
                   <div class="bg-white border border-gray-100 p-3 rounded-lg flex flex-col items-center">
                      <span class="material-icons text-gray-400 mb-1">thermostat</span>
                      <div class="text-lg font-bold text-gray-700" [class.text-red-500]="vehicle.engine_temp > 100">{{vehicle.engine_temp.toFixed(0)}}<span class="text-xs font-normal">°C</span></div>
                      <div class="text-[10px] text-gray-400 uppercase font-bold">Engine Temp</div>
                   </div>

                   <!-- Oil Life -->
                   <div class="bg-white border border-gray-100 p-3 rounded-lg flex flex-col items-center">
                      <span class="material-icons text-gray-400 mb-1">water_drop</span>
                      <div class="text-lg font-bold text-gray-700" [class.text-red-500]="vehicle.oil_life < 20">{{vehicle.oil_life}}%</div>
                      <div class="text-[10px] text-gray-400 uppercase font-bold">Oil Life</div>
                   </div>

                   <!-- Last Service -->
                   <div class="bg-white border border-gray-100 p-3 rounded-lg flex flex-col items-center">
                      <span class="material-icons text-gray-400 mb-1">history</span>
                      <div class="text-sm font-bold text-gray-700 mt-1">{{vehicle.last_service_date | date:'MM/yy'}}</div>
                      <div class="text-[10px] text-gray-400 uppercase font-bold mt-1">Last Service</div>
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
                  <span class="material-icons text-purple-600">psychology</span> AI Load & Price Estimator
                </h2>
                
                <div class="space-y-3">
                  <input type="text" placeholder="Cargo (e.g. 500kg of wood)" 
                        [(ngModel)]="cargoDesc" 
                        class="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <input type="number" placeholder="Distance (km)" 
                        [(ngModel)]="distance" 
                        class="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <button (click)="estimateLoad()" [disabled]="loadingAi()"
                          class="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition shadow">
                    {{loadingAi() ? 'Scanning Market Rates...' : 'Calculate & Compare Prices'}}
                  </button>
                </div>

                @if (aiResult()) {
                  <div class="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 animate-fade-in space-y-3">
                    
                    <!-- Load Bar -->
                    <div>
                       <div class="flex justify-between items-center mb-1">
                         <span class="text-xs text-gray-500 font-bold uppercase">Load Usage</span>
                         <span class="font-bold text-purple-700">{{aiResult().loadPercentage}}%</span>
                       </div>
                       <div class="w-full bg-gray-200 rounded-full h-2">
                         <div class="bg-purple-600 h-2 rounded-full transition-all duration-1000" [style.width.%]="aiResult().loadPercentage"></div>
                       </div>
                    </div>

                    <!-- Pricing Grid -->
                    <div class="grid grid-cols-2 gap-3">
                       <div class="bg-white p-2 rounded-lg border border-purple-100 text-center shadow-sm">
                          <div class="text-[10px] text-gray-400 font-bold uppercase">Est. Fuel Cost</div>
                          <div class="text-sm font-bold text-gray-700">₹{{aiResult().estimatedFuelCost}}</div>
                       </div>
                       <div class="bg-white p-2 rounded-lg border border-green-200 text-center shadow-sm relative overflow-hidden">
                          <div class="absolute inset-0 bg-green-50 opacity-50"></div>
                          <div class="relative z-10">
                             <div class="text-[10px] text-green-600 font-bold uppercase">Fair Market Price</div>
                             <div class="text-lg font-bold text-green-700">₹{{aiResult().marketPrice}}</div>
                          </div>
                       </div>
                    </div>
                    
                    <!-- Market Comparison -->
                    @if(aiResult().marketComparison) {
                      <div class="flex items-start gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                         <span class="material-icons text-blue-500 text-sm mt-0.5">query_stats</span>
                         <p class="text-xs text-blue-800 leading-tight">
                           <span class="font-bold">Market Insight:</span> {{aiResult().marketComparison}}
                         </p>
                      </div>
                    }

                    <!-- Safety & Advice -->
                    <div class="flex items-start gap-2">
                       <span class="material-icons text-sm" 
                          [class.text-green-500]="aiResult().safetyRating === 'High'"
                          [class.text-yellow-500]="aiResult().safetyRating === 'Medium'"
                          [class.text-red-500]="aiResult().safetyRating === 'Low'">
                          verified_user
                       </span>
                       <div class="flex-1">
                          <p class="text-xs text-gray-700 font-medium">"{{aiResult().advice}}"</p>
                       </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        }

        <!-- 2. Requests Tab (LIVE) -->
        @if (activeTab() === 'requests') {
          <div class="space-y-4 animate-fade-in">
            <!-- Feed Status -->
            <div class="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
               <div class="flex items-center gap-2">
                 <span class="relative flex h-3 w-3">
                   <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                   <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                 </span>
                 <span class="text-xs font-bold text-gray-600">Live Feed Active</span>
               </div>
               <span class="text-[10px] text-gray-400">Syncing with server...</span>
            </div>

            <!-- Test Tool -->
            <div class="flex justify-end">
              <button (click)="simulateCustomerRequest()" class="bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-800 shadow transition flex items-center gap-2">
                <span class="material-icons text-sm">add_circle</span> Simulate Customer Request
              </button>
            </div>

            @if(pendingRequests().length === 0) {
              <div class="text-center py-10 text-gray-400">
                <span class="material-icons text-5xl mb-2 text-gray-300">notifications_none</span>
                <p>No new requests. Waiting for customers...</p>
              </div>
            }

            @for (booking of pendingRequests(); track booking.id) {
              <div class="bg-white rounded-xl shadow-md border-l-4 overflow-hidden transition-all hover:shadow-lg"
                   [class.border-blue-500]="booking.status === 'pending'"
                   [class.border-yellow-500]="booking.status === 'bargaining'"
                   [class.border-green-500]="booking.status === 'accepted'">
                
                <div class="p-4">
                  <!-- Header -->
                  <div class="flex justify-between items-start mb-3">
                     <div>
                       <h3 class="font-bold text-lg text-gray-900">{{ booking.customer_name }}</h3>
                       <div class="flex items-center gap-2 mt-1">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase"
                                [class.bg-blue-100]="booking.status === 'pending'"
                                [class.text-blue-800]="booking.status === 'pending'"
                                [class.bg-yellow-100]="booking.status === 'bargaining'"
                                [class.text-yellow-800]="booking.status === 'bargaining'"
                                [class.bg-green-100]="booking.status === 'accepted'"
                                [class.text-green-800]="booking.status === 'accepted'">
                            {{booking.status}}
                          </span>
                       </div>
                     </div>
                     <div class="text-right">
                       <div class="text-xl font-bold text-slate-700">₹{{ booking.offered_price }}</div>
                       <div class="text-[10px] text-gray-500 uppercase font-bold">Offer</div>
                     </div>
                  </div>
                  
                  <!-- Details -->
                  <div class="bg-gray-50 rounded-lg p-3 mb-3 text-sm space-y-2 border border-gray-100">
                     <div class="flex items-start gap-2">
                       <span class="material-icons text-gray-400 text-sm mt-0.5">circle</span>
                       <div>
                         <span class="block text-[10px] text-gray-400 font-bold uppercase">Pickup</span>
                         <span class="text-gray-700 leading-tight">{{booking.pickup_location}}</span>
                       </div>
                     </div>
                     <div class="flex items-start gap-2">
                       <span class="material-icons text-gray-400 text-sm mt-0.5">location_on</span>
                       <div>
                         <span class="block text-[10px] text-gray-400 font-bold uppercase">Drop-Off</span>
                         <span class="text-gray-700 leading-tight">{{booking.drop_location}}</span>
                       </div>
                     </div>
                     <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200">
                        <div>
                          <span class="block text-[10px] text-gray-400 font-bold uppercase">Goods</span>
                          <span class="text-gray-700">{{booking.goods_type}}</span>
                        </div>
                        <div>
                          <span class="block text-[10px] text-gray-400 font-bold uppercase">Weight</span>
                          <span class="text-gray-700">{{booking.weight}}</span>
                        </div>
                     </div>
                  </div>

                  <!-- Bargaining State -->
                  @if (booking.status === 'bargaining' && booking.counter_offer) {
                    <div class="mb-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-yellow-800 text-sm">
                       <p class="font-bold flex items-center gap-1">
                         <span class="material-icons text-sm">chat</span> Counter-offer sent: ₹{{ booking.counter_offer }}
                       </p>
                       <p class="text-xs opacity-80 mt-1">Waiting for customer response...</p>
                    </div>
                  }

                  <!-- Counter Offer Input Form -->
                  @if (bargainingId() === booking.id) {
                    <div class="mb-3 bg-slate-100 p-3 rounded-lg border border-slate-200">
                      <label class="block text-xs font-bold text-slate-600 mb-1">Enter your price (₹)</label>
                      <div class="flex gap-2">
                        <input type="number" [(ngModel)]="counterOfferAmount" 
                               class="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                               placeholder="e.g. 3000">
                        <button (click)="submitCounterOffer(booking.id)" 
                                class="bg-blue-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-blue-700 transition">Send</button>
                        <button (click)="bargainingId.set(null)" 
                                class="bg-white text-gray-500 border border-gray-300 px-3 rounded-lg font-bold text-sm hover:bg-gray-50 transition">Cancel</button>
                      </div>
                    </div>
                  }

                  <!-- Actions -->
                  @if (booking.status === 'pending') {
                    <div class="grid grid-cols-3 gap-2">
                      <button (click)="acceptBooking(booking)" 
                              class="bg-green-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-green-700 shadow-sm transition-colors flex justify-center items-center gap-1">
                        <span class="material-icons text-sm">check</span> ACCEPT
                      </button>
                      <button (click)="startBargain(booking.id)" 
                              class="bg-yellow-500 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-yellow-600 shadow-sm transition-colors flex justify-center items-center gap-1">
                        <span class="material-icons text-sm">chat</span> BARGAIN
                      </button>
                      <button (click)="rejectBooking(booking)" 
                              class="bg-red-50 text-red-600 border border-red-100 py-2.5 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors flex justify-center items-center gap-1">
                        <span class="material-icons text-sm">close</span> REJECT
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- 3. Active Job Tab -->
        @if (activeTab() === 'active') {
          @if (activeJob(); as job) {
            <div class="h-full flex flex-col animate-fade-in pb-4">
              <!-- Customer Info & Actions -->
              <div class="bg-white rounded-xl shadow p-4 mb-4">
                <div class="flex items-center gap-3 mb-4">
                  <div class="bg-blue-100 p-2 rounded-full">
                    <span class="material-icons text-blue-600">person</span>
                  </div>
                  <div class="flex-1">
                    <h2 class="font-bold text-gray-800 text-lg">{{job.customer_name}}</h2>
                    <p class="text-sm text-gray-500">{{job.customer_phone}}</p>
                  </div>
                </div>

                <div class="flex gap-2 mb-4">
                   <a href="tel:{{job.customer_phone}}" class="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-green-700 transition flex items-center justify-center gap-2">
                      <span class="material-icons text-sm">call</span> Call Customer
                   </a>
                   <button (click)="showCancelModal.set(true)" class="flex-1 bg-red-50 text-red-600 border border-red-100 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition flex items-center justify-center gap-2">
                      <span class="material-icons text-sm">cancel</span> Cancel Ride
                   </button>
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
               <h3 class="font-bold text-indigo-900 mb-1 flex items-center gap-2">
                 <span class="material-icons text-indigo-600">psychology</span>
                 AI Smart Load Board
               </h3>
               <p class="text-sm text-indigo-700">Find extra loads on your return route. AI automatically assesses suitability for your vehicle.</p>
             </div>

             @for (load of loads(); track load.id) {
               <div class="bg-white rounded-xl shadow-md p-4 border-l-4 border-indigo-500 relative hover:shadow-lg transition-all">
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
                       <span class="block text-xs text-gray-400 font-bold uppercase">FROM</span>
                       <span class="font-bold text-sm text-gray-800">{{load.source}}</span>
                    </div>
                    <span class="material-icons text-gray-300">arrow_forward</span>
                    <div class="flex-1 bg-gray-100 p-2 rounded text-center">
                       <span class="block text-xs text-gray-400 font-bold uppercase">TO</span>
                       <span class="font-bold text-sm text-gray-800">{{load.destination}}</span>
                    </div>
                  </div>

                  <div class="text-sm text-gray-600 mb-3 grid grid-cols-2 gap-2">
                    <span class="flex items-center gap-1"><span class="material-icons text-xs text-gray-400">inventory_2</span> {{load.material}}</span>
                    <span class="flex items-center gap-1"><span class="material-icons text-xs text-gray-400">scale</span> {{load.weight}}</span>
                  </div>

                  <!-- AI Assessment Block -->
                  @if(load.ai_assessment) {
                    <div class="mb-4 p-3 bg-purple-50 text-purple-800 text-xs rounded-xl border border-purple-100 flex gap-2 items-start animate-fade-in shadow-sm">
                      <div class="bg-white p-1 rounded-full shadow-sm shrink-0">
                         <span class="material-icons text-purple-600 text-sm block">auto_awesome</span>
                      </div>
                      <div class="flex-1">
                        <div class="font-bold uppercase text-[10px] text-purple-400 mb-0.5">AI Insight</div>
                        <span class="italic leading-relaxed">{{load.ai_assessment}}</span>
                      </div>
                    </div>
                  } @else {
                    <div class="mb-4 p-2 bg-gray-50 text-gray-400 text-xs rounded-xl flex gap-2 items-center justify-center animate-pulse">
                       <span class="material-icons text-sm">sync</span> Analyzing suitability...
                    </div>
                  }

                  <button (click)="requestLoad(load.id)" class="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-indigo-200 shadow-md transition">
                    Book Load
                  </button>
               </div>
             }
          </div>
        }

        <!-- 5. Team Tab -->
        @if (activeTab() === 'team') {
          <div class="space-y-4 animate-fade-in h-full flex flex-col">
            <!-- Map Section -->
            <div class="h-64 bg-gray-200 rounded-xl shadow-inner overflow-hidden relative shrink-0">
               <app-map [center]="mapCenter()" [markers]="mapMarkers()"></app-map>
            </div>

            <!-- Fleet Table -->
            <div class="bg-white rounded-xl shadow border border-gray-100 overflow-hidden flex-1 overflow-y-auto">
               <div class="p-4 border-b border-gray-100 bg-gray-50">
                  <h2 class="font-bold text-gray-800 flex items-center gap-2">
                     <span class="material-icons text-blue-600">groups</span> Team Vehicles
                  </h2>
               </div>
               <div class="overflow-x-auto">
                 <table class="w-full text-left text-sm">
                    <thead class="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                       <tr>
                          <th class="p-4">Vehicle</th>
                          <th class="p-4">Status</th>
                          <th class="p-4 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                       @for(v of vehicles(); track v.id) {
                          <tr class="hover:bg-blue-50 transition">
                             <td class="p-4">
                                <div class="font-bold text-gray-800">{{v.registration_number}}</div>
                                <div class="text-xs text-gray-500">{{v.type}}</div>
                             </td>
                             <td class="p-4">
                                <span class="px-2 py-1 rounded text-xs font-bold"
                                   [class.bg-green-100]="v.status === 'Running'" [class.text-green-700]="v.status === 'Running'"
                                   [class.bg-yellow-100]="v.status === 'Idle'" [class.text-yellow-700]="v.status === 'Idle'"
                                   [class.bg-gray-100]="v.status === 'Offline'" [class.text-gray-600]="v.status === 'Offline'"
                                   [class.bg-red-100]="v.status === 'Stopped'" [class.text-red-700]="v.status === 'Stopped'">
                                   {{v.status}}
                                </span>
                             </td>
                             <td class="p-4 text-right">
                                <button (click)="locateVehicle(v)" class="text-blue-600 hover:bg-blue-100 p-2 rounded-full transition" title="Locate">
                                   <span class="material-icons">my_location</span>
                                </button>
                             </td>
                          </tr>
                       }
                    </tbody>
                 </table>
               </div>
            </div>
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

  activeTab = signal<'status' | 'requests' | 'active' | 'loads' | 'team'>('status');
  unreadMessageCount = signal(0);
  private lastMessageCount = 0;
  
  // Track previous pending count to detect new additions
  private previousPendingCount = 0;
  
  currentVehicle = signal<Vehicle | null>(null);
  
  // New Signals for Team View
  vehicles = signal<Vehicle[]>([]);
  mapCenter = signal<{lat: number, lng: number}>({lat: 20.5937, lng: 78.9629});
  mapMarkers = signal<{lat: number, lng: number, title: string, type: 'vehicle'|'emergency'|'pickup'|'drop'}[]>([]);
  
  // Use real-time live bookings
  requests = this.supabase.liveBookings;
  
  pendingRequests = computed(() => this.requests().filter(r => r.status === 'pending' || r.status === 'bargaining'));
  
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
  
  // Cancel Ride UI State
  showCancelModal = signal(false);
  cancelReason = '';

  // AI Form
  cargoDesc = '';
  distance = 0;
  loadingAi = signal(false);
  aiResult = signal<any>(null);
  
  // Toast State
  toast = signal<{msg: string, type: 'success'|'error'} | null>(null);

  private intervalId: any;

  constructor() {
    this.loadVehicle();
    
    // Initialize Real-time Feed
    this.supabase.subscribeToBookingRequests();
    this.supabase.getBookings().then(() => {
       // Set initial pending count to avoid alert on load
       this.previousPendingCount = this.pendingRequests().length;
    });

    this.supabase.startSimulation();
    
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
    this.supabase.unsubscribeFromBookings();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  showToast(msg: string, type: 'success'|'error') {
    this.toast.set({msg, type});
    setTimeout(() => this.toast.set(null), 3000);
  }

  playNotificationSound() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio play blocked', e));
  }

  setActiveTab(tab: 'status' | 'requests' | 'active' | 'loads' | 'team') {
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
    
    // Process sequentially to be gentle on API limits
    for (const load of currentLoads) {
      if (!load.ai_assessment) {
        // Show loading state implicitly by absence of data, or explicitly if needed
        const assessment = await this.ai.assessLoad(type, load.material, load.weight);
        
        // Update specific load in the signal
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
    const data = await this.supabase.getVehicles();
    this.vehicles.set(data);
    
    // Logic to maintain currentVehicle state
    if (data.length > 0) {
      if (!this.currentVehicle()) {
        this.currentVehicle.set(data[0]);
      } else {
        const current = this.currentVehicle();
        const updated = data.find(d => d.id === current?.id);
        if (updated) this.currentVehicle.set(updated);
      }
    }

    // Update markers for Team View
    // Only update markers, do NOT reset center automatically to avoid jumping map
    const markers = data.map(v => ({
      lat: v.lat,
      lng: v.lng,
      title: `${v.registration_number} (${v.status})`,
      type: 'vehicle' as const
    }));
    this.mapMarkers.set(markers);
  }

  locateVehicle(v: Vehicle) {
    this.mapCenter.set({ lat: v.lat, lng: v.lng });
    // Switch to Team tab if not active (though the button is usually on the team tab)
    if (this.activeTab() !== 'team') this.setActiveTab('team');
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
        location: `Lat: ${v.lat.toFixed(4)}, Lng: ${v.lng.toFixed(4)}`,
        vehicle_reg: v.registration_number, // Add vehicle registration
        type: 'General Issue' 
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

  async acceptBooking(booking: BookingRequest) {
    try {
      const driverId = this.auth.currentUser()?.id || 'unknown-driver';
      // The service handles the optimistic update on the data model
      await this.supabase.acceptBooking(booking.id, driverId);
      this.showToast('Booking Accepted!', 'success');
      this.setActiveTab('active');
    } catch (e) {
      this.showToast('Failed to accept booking. Please try again.', 'error');
    }
  }

  async rejectBooking(booking: BookingRequest) {
    try {
      await this.supabase.rejectBooking(booking.id);
      this.showToast('Booking Rejected', 'success');
    } catch (e) {
      this.showToast('Failed to reject booking.', 'error');
    }
  }

  startBargain(id: string) {
    this.bargainingId.set(id);
    const req = this.requests().find(r => r.id === id);
    this.counterOfferAmount = req ? req.offered_price : 0;
  }

  async submitCounterOffer(id: string) {
    if (this.counterOfferAmount > 0) {
      try {
        await this.supabase.counterOffer(id, this.counterOfferAmount);
        this.bargainingId.set(null);
        this.showToast('Counter offer sent!', 'success');
      } catch (e) {
        this.showToast('Failed to send counter offer.', 'error');
      }
    }
  }

  async confirmCancellation() {
    const job = this.activeJob();
    if (job && this.cancelReason) {
       try {
         await this.supabase.cancelBooking(job.id, this.cancelReason);
         this.showCancelModal.set(false);
         this.cancelReason = '';
         this.showToast('Ride cancelled successfully.', 'success');
         this.setActiveTab('requests');
       } catch (e) {
         this.showToast('Failed to cancel ride.', 'error');
       }
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
    this.showToast('Load Requested!', 'success');
  }

  async simulateCustomerRequest() {
    try {
      // Generate random location near Bangalore (approx center 12.97, 77.59)
      const latBase = 12.9716;
      const lngBase = 77.5946;
      const r = () => (Math.random() - 0.5) * 0.1; // +/- 0.05 degrees (~5km)

      const pickupLat = latBase + r();
      const pickupLng = lngBase + r();
      const dropLat = latBase + r();
      const dropLng = lngBase + r();

      const goods = ['Furniture', 'Electronics', 'Machinery', 'Textiles', 'Groceries', 'Auto Parts'];
      const randomGood = goods[Math.floor(Math.random() * goods.length)];

      await this.supabase.createBooking({
        customer_name: 'Customer ' + Math.floor(Math.random() * 1000),
        customer_phone: '+91 9' + Math.floor(Math.random() * 1000000000),
        pickup_location: `Lat: ${pickupLat.toFixed(3)}, Lng: ${pickupLng.toFixed(3)}`,
        drop_location: `Lat: ${dropLat.toFixed(3)}, Lng: ${dropLng.toFixed(3)}`,
        goods_type: randomGood,
        weight: (10 + Math.floor(Math.random() * 500)) + 'kg',
        offered_price: 500 + Math.floor(Math.random() * 2500),
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        drop_lat: dropLat,
        drop_lng: dropLng,
        status: 'pending'
      });
      this.showToast('Simulated Request Sent!', 'success');
      // The realtime subscription will pick this up and update the UI
    } catch (e) {
      console.error(e);
      this.showToast('Failed to simulate request', 'error');
    }
  }
}