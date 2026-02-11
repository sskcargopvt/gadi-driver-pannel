import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { SupabaseService, Vehicle } from '../services/supabase.service';
import { MapComponent } from './map.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MapComponent, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-100 relative">
      <!-- Toast Notifications Container -->
      <div class="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        @for (toast of toasts(); track toast.id) {
          <div class="bg-white rounded-xl shadow-xl border-l-4 p-4 pointer-events-auto animate-slide-in flex items-start gap-3 backdrop-blur-sm bg-opacity-95"
               [class.border-red-500]="toast.type === 'danger'"
               [class.border-yellow-500]="toast.type === 'warning'">
             <div class="p-2 rounded-full shrink-0" 
                  [class.bg-red-100]="toast.type === 'danger'" 
                  [class.bg-yellow-100]="toast.type === 'warning'">
               <span class="material-icons text-sm" 
                     [class.text-red-600]="toast.type === 'danger'" 
                     [class.text-yellow-600]="toast.type === 'warning'">
                 {{toast.type === 'danger' ? 'priority_high' : 'warning'}}
               </span>
             </div>
             <div class="flex-1">
               <h4 class="font-bold text-gray-800 text-sm flex justify-between">
                 {{toast.title}}
                 <span class="text-[10px] text-gray-400 font-normal">Just now</span>
               </h4>
               <p class="text-xs text-gray-600 mt-0.5 leading-snug">{{toast.msg}}</p>
             </div>
             <button (click)="removeToast(toast.id)" class="text-gray-400 hover:text-gray-600 transition">
               <span class="material-icons text-sm">close</span>
             </button>
          </div>
        }
      </div>

      <nav class="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-40">
        <div class="container mx-auto flex justify-between items-center">
          <div class="flex items-center gap-3">
             <div class="bg-blue-500 p-2 rounded-lg">
               <span class="material-icons text-white block">local_shipping</span>
             </div>
             <h1 class="text-xl font-bold tracking-tight">Gaadi Dost <span class="text-slate-400 font-normal">Admin</span></h1>
          </div>
          <button (click)="auth.logout()" class="text-sm hover:text-red-300 transition">Logout</button>
        </div>
      </nav>

      <div class="container mx-auto p-6">
        
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 class="text-slate-500 text-sm font-medium uppercase mb-2">Total Vehicles</h3>
            <p class="text-3xl font-bold text-slate-800">{{vehicles().length}}</p>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h3 class="text-slate-500 text-sm font-medium uppercase mb-2">Active Emergencies</h3>
             <p class="text-3xl font-bold text-red-600">{{activeEmergencies().length}}</p>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h3 class="text-slate-500 text-sm font-medium uppercase mb-2">Pending Bookings</h3>
             <p class="text-3xl font-bold text-orange-600">{{pendingBookings().length}}</p>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h3 class="text-slate-500 text-sm font-medium uppercase mb-2">Revenue (Today)</h3>
             <p class="text-3xl font-bold text-green-600">₹12,450</p>
          </div>
        </div>

        <!-- Realtime Operations Center -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
           <!-- Incoming Bookings -->
           <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div class="p-4 border-b border-slate-100 bg-blue-50 flex justify-between items-center">
                <h2 class="font-bold text-blue-900 flex items-center gap-2">
                   <span class="material-icons text-blue-600">assignment</span> Incoming Bookings
                   <span class="bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full">{{pendingBookings().length}}</span>
                </h2>
              </div>
              <div class="h-64 overflow-y-auto">
                 @if (pendingBookings().length === 0) {
                    <div class="h-full flex flex-col items-center justify-center text-gray-400">
                      <p class="text-sm">No pending bookings.</p>
                    </div>
                 }
                 @for (booking of pendingBookings(); track booking.id) {
                   <div class="p-4 border-b border-slate-100 hover:bg-blue-50/50 transition relative">
                     <span class="absolute top-4 right-4 text-xs font-mono text-gray-400">{{booking.created_at | date:'shortTime'}}</span>
                     <div class="font-bold text-gray-800 mb-1">{{booking.customer_name}}</div>
                     <div class="flex items-center text-sm text-gray-600 mb-1">
                        <span class="material-icons text-xs mr-1 text-green-500">circle</span>
                        {{booking.pickup_location}}
                     </div>
                     <div class="flex items-center text-sm text-gray-600">
                        <span class="material-icons text-xs mr-1 text-red-500">location_on</span>
                        {{booking.drop_location}}
                     </div>
                     <div class="mt-2 flex justify-between items-center">
                        <span class="text-blue-600 font-bold">₹{{booking.offered_price}}</span>
                        <span class="text-xs uppercase font-bold px-2 py-1 bg-yellow-100 text-yellow-700 rounded">{{booking.status}}</span>
                     </div>
                   </div>
                 }
              </div>
           </div>

           <!-- Emergency Monitor -->
           <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div class="p-4 border-b border-slate-100 bg-red-50 flex justify-between items-center">
                <h2 class="font-bold text-red-900 flex items-center gap-2">
                   <span class="material-icons text-red-600">warning</span> Emergency Monitor
                   <span class="bg-red-200 text-red-800 text-xs px-2 py-0.5 rounded-full">{{activeEmergencies().length}}</span>
                </h2>
              </div>
              <div class="h-64 overflow-y-auto">
                 @if (activeEmergencies().length === 0) {
                    <div class="h-full flex flex-col items-center justify-center text-gray-400">
                      <span class="material-icons text-4xl mb-2 text-green-100">check_circle</span>
                      <p class="text-sm">All systems normal.</p>
                    </div>
                 }
                 @for (em of activeEmergencies(); track em.id) {
                   <div class="p-4 border-b border-slate-100 hover:bg-red-50/50 transition border-l-4 border-red-500 group">
                     <div class="flex justify-between mb-1">
                        <span class="font-bold text-gray-800">{{em.type}}</span>
                        <span class="text-xs font-bold uppercase px-2 py-0.5 rounded shadow-sm"
                          [class.bg-red-100]="em.status === 'pending'" [class.text-red-700]="em.status === 'pending'"
                          [class.bg-blue-100]="em.status === 'assigned'" [class.text-blue-700]="em.status === 'assigned'"
                          [class.bg-yellow-100]="em.status === 'tracking'" [class.text-yellow-700]="em.status === 'tracking'">
                          {{em.status}}
                        </span>
                     </div>
                     <p class="text-sm text-gray-600 mb-2 flex items-center gap-1">
                        <span class="material-icons text-xs text-gray-400">location_on</span>
                        {{em.location}}
                     </p>
                     
                     <!-- Enhanced Info: Vehicle & Mechanic -->
                     <div class="grid grid-cols-2 gap-2 mt-2">
                        <div class="bg-slate-50 p-2 rounded border border-slate-100 flex items-center gap-2">
                           <div class="bg-white p-1 rounded-full text-slate-500 shadow-sm shrink-0">
                              <span class="material-icons text-xs block">directions_car</span>
                           </div>
                           <div class="overflow-hidden min-w-0">
                              <div class="text-[10px] text-gray-400 font-bold uppercase leading-none mb-0.5">Vehicle</div>
                              <div class="text-xs font-bold text-gray-700 truncate" title="{{em.vehicle_reg}}">
                                {{em.vehicle_reg || 'Unknown'}}
                              </div>
                           </div>
                        </div>

                        <div class="bg-slate-50 p-2 rounded border border-slate-100 flex items-center gap-2">
                           <div class="bg-white p-1 rounded-full shadow-sm shrink-0" [class.text-blue-500]="em.assigned_mechanic" [class.text-gray-300]="!em.assigned_mechanic">
                              <span class="material-icons text-xs block">engineering</span>
                           </div>
                           <div class="overflow-hidden min-w-0">
                              <div class="text-[10px] text-gray-400 font-bold uppercase leading-none mb-0.5">Mechanic</div>
                              <div class="text-xs font-bold truncate" 
                                   [class.text-blue-600]="em.assigned_mechanic" 
                                   [class.text-gray-400]="!em.assigned_mechanic"
                                   [class.italic]="!em.assigned_mechanic">
                                {{em.assigned_mechanic || 'Pending...'}}
                              </div>
                           </div>
                        </div>
                     </div>

                     <div class="text-xs text-gray-400 mt-2 text-right group-hover:text-gray-600 transition font-mono">
                        {{em.created_at | date:'mediumTime'}}
                     </div>
                   </div>
                 }
              </div>
           </div>
        </div>

        <!-- Critical Alerts Section (Vehicle Health) -->
        @if (vehicleAlerts().length > 0) {
          <div class="mb-8 bg-orange-50 border border-orange-100 rounded-2xl p-4 shadow-sm animate-fade-in">
            <h2 class="text-orange-800 font-bold flex items-center gap-2 mb-3">
               <span class="material-icons">car_repair</span> Vehicle Health Alerts ({{vehicleAlerts().length}})
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               @for (alert of vehicleAlerts(); track alert.id) {
                 <div class="bg-white p-3 rounded-xl shadow-sm border-l-4 border-orange-500 flex items-center justify-between">
                    <div>
                      <div class="font-bold text-gray-800">{{alert.reg}}</div>
                      <div class="text-xs text-orange-600 font-medium uppercase">{{alert.type}}</div>
                    </div>
                    <div class="bg-orange-50 text-orange-700 font-mono font-bold text-sm px-2 py-1 rounded">
                      {{alert.val}}
                    </div>
                 </div>
               }
            </div>
          </div>
        }

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Fleet Table -->
          <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                <span class="material-icons text-slate-400">directions_bus</span> Fleet Status
              </h2>
              
              <div class="flex gap-2 text-sm w-full sm:w-auto">
                <!-- Filter Dropdown -->
                <div class="relative w-full sm:w-auto">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-sm pointer-events-none">filter_list</span>
                  <select [ngModel]="filterType()" (ngModelChange)="filterType.set($event)" 
                          class="bg-white border border-slate-200 text-slate-700 rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full font-medium shadow-sm appearance-none cursor-pointer hover:border-blue-300 transition">
                    @for(opt of vehicleTypes(); track opt.value) {
                      <option [value]="opt.value">{{opt.label}}</option>
                    }
                  </select>
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-sm pointer-events-none">expand_more</span>
                </div>

                <!-- Sort Dropdown -->
                <div class="relative w-full sm:w-auto">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-sm pointer-events-none">sort</span>
                  <select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)"
                          class="bg-white border border-slate-200 text-slate-700 rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full font-medium shadow-sm appearance-none cursor-pointer hover:border-blue-300 transition">
                    <option value="default">Sort by: Default</option>
                    <option value="type">Type (A-Z)</option>
                    <option value="speed_desc">Speed (High to Low)</option>
                    <option value="fuel_asc">Fuel (Low to High)</option>
                    <option value="status">Status (Active First)</option>
                  </select>
                  <span class="absolute right-2 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-sm pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th class="px-6 py-3 font-semibold">Vehicle</th>
                    <th class="px-6 py-3 font-semibold">Owner ID</th>
                    <th class="px-6 py-3 font-semibold">Status</th>
                    <th class="px-6 py-3 font-semibold">Speed</th>
                    <th class="px-6 py-3 font-semibold">Fuel</th>
                    <th class="px-6 py-3 font-semibold">Last Updated</th>
                    <th class="px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @if (filteredVehicles().length === 0) {
                     <tr>
                        <td colspan="7" class="px-6 py-10 text-center text-gray-400">
                           <div class="flex flex-col items-center">
                             <span class="material-icons text-4xl mb-2 opacity-30">filter_list_off</span>
                             <span>No vehicles match your filter.</span>
                           </div>
                        </td>
                     </tr>
                  }
                  @for (v of filteredVehicles(); track v.id) {
                    <tr class="hover:bg-slate-50 transition group">
                      <td class="px-6 py-4">
                        <div class="font-bold text-slate-900">{{v.registration_number}}</div>
                        <div class="text-xs font-bold text-slate-500 bg-slate-100 inline-block px-1.5 py-0.5 rounded mt-1">{{v.type}}</div>
                      </td>
                      <td class="px-6 py-4 text-sm text-slate-500 font-mono">
                         {{v.owner_id || '-'}}
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
                          [class.bg-green-100]="v.status === 'Running'"
                          [class.text-green-800]="v.status === 'Running'"
                          [class.bg-yellow-100]="v.status === 'Idle'"
                          [class.text-yellow-800]="v.status === 'Idle'"
                          [class.bg-gray-100]="v.status === 'Offline'"
                          [class.text-gray-800]="v.status === 'Offline'">
                          <span class="w-2 h-2 rounded-full mr-1.5"
                            [class.bg-green-500]="v.status === 'Running'"
                            [class.bg-yellow-500]="v.status === 'Idle'"
                            [class.bg-gray-500]="v.status === 'Offline'"></span>
                          {{v.status}}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm text-slate-600 font-mono">
                        <span [class.text-red-600]="v.speed > 80" [class.font-bold]="v.speed > 80">
                           {{v.speed.toFixed(0)}} km/h
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="w-full bg-slate-200 rounded-full h-1.5 w-24">
                          <div class="h-1.5 rounded-full transition-all duration-500" 
                               [class.bg-blue-500]="v.fuel_level >= 20"
                               [class.bg-red-500]="v.fuel_level < 20"
                               [style.width.%]="v.fuel_level"></div>
                        </div>
                        <span class="text-xs mt-1 block font-mono" 
                              [class.text-slate-400]="v.fuel_level >= 20"
                              [class.text-red-500]="v.fuel_level < 20"
                              [class.font-bold]="v.fuel_level < 20">
                          {{v.fuel_level}}%
                        </span>
                      </td>
                      <td class="px-6 py-4 text-xs text-slate-500">
                         {{v.last_updated | date:'mediumTime'}}
                      </td>
                      <td class="px-6 py-4 text-sm">
                        <button class="text-slate-400 hover:text-blue-600 transition p-2 hover:bg-blue-50 rounded-full">
                          <span class="material-icons text-base">visibility</span>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Live Map Preview -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
            <div class="p-4 border-b border-slate-100 bg-slate-50">
              <h2 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                <span class="material-icons text-blue-500">map</span> Live Map
              </h2>
            </div>
            <div class="flex-1 bg-slate-100 relative">
               <app-map [center]="{lat: 20, lng: 78}" [markers]="mapMarkers()"></app-map>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  auth = inject(AuthService);
  supabase = inject(SupabaseService);
  
  // Realtime Data Signals
  vehicles = signal<Vehicle[]>([]);
  bookings = this.supabase.mockBookings;
  emergencies = this.supabase.mockEmergencies;

  mapMarkers = signal<any[]>([]);

  // Filter/Sort State
  filterType = signal<string>('All');
  sortBy = signal<string>('default');

  // Computed Views
  pendingBookings = computed(() => this.bookings().filter(b => b.status === 'pending' || b.status === 'bargaining'));
  activeEmergencies = computed(() => this.emergencies().filter(e => e.status !== 'completed'));

  // Notification State
  toasts = signal<{id: string, title: string, msg: string, type: 'warning'|'danger'}[]>([]);
  private notifiedAlertIds = new Set<string>();

  // Computed: Unique Vehicle Types for Dropdown with Counts
  vehicleTypes = computed(() => {
    const vs = this.vehicles();
    const typeCounts = vs.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const types = Object.keys(typeCounts).sort();
    
    return [
      { label: `All Types (${vs.length})`, value: 'All' },
      ...types.map(t => ({ label: `${t} (${typeCounts[t]})`, value: t }))
    ];
  });

  // Computed: Filtered & Sorted List
  filteredVehicles = computed(() => {
    let list = [...this.vehicles()]; // Shallow copy

    // 1. Filter
    if (this.filterType() !== 'All') {
      list = list.filter(v => v.type === this.filterType());
    }

    // 2. Sort
    switch (this.sortBy()) {
      case 'speed_desc':
        list.sort((a, b) => b.speed - a.speed);
        break;
      case 'fuel_asc':
        list.sort((a, b) => a.fuel_level - b.fuel_level);
        break;
      case 'status':
        // Priority: Running > Idle > Stopped > Offline
        const priority: Record<string, number> = { 'Running': 1, 'Idle': 2, 'Stopped': 3, 'Offline': 4 };
        list.sort((a, b) => (priority[a.status] || 99) - (priority[b.status] || 99));
        break;
      case 'type':
        list.sort((a, b) => a.type.localeCompare(b.type));
        break;
    }

    return list;
  });

  // Computed Alerts from Vehicles
  vehicleAlerts = computed(() => {
    const list: {id: string, reg: string, type: string, val: string}[] = [];
    this.vehicles().forEach(v => {
      // 1. Low Fuel
      if (v.fuel_level < 20) {
        list.push({
          id: `${v.id}-fuel`,
          reg: v.registration_number,
          type: 'Low Fuel',
          val: `${v.fuel_level}%`
        });
      }
      // 2. Low Battery
      if (v.battery_level < 20) {
        list.push({
          id: `${v.id}-batt`,
          reg: v.registration_number,
          type: 'Low Battery',
          val: `${v.battery_level}%`
        });
      }
      // 3. Overspeeding
      if (v.speed > 80) {
        list.push({
          id: `${v.id}-speed`,
          reg: v.registration_number,
          type: 'Overspeeding',
          val: `${v.speed.toFixed(0)} km/h`
        });
      }
    });
    return list;
  });

  constructor() {
    // Alert Monitoring Effect
    effect(() => {
      const currentAlerts = this.vehicleAlerts();
      
      // 1. Trigger notifications for NEW alerts
      currentAlerts.forEach(alert => {
        if (!this.notifiedAlertIds.has(alert.id)) {
           this.showNotification(alert);
           this.notifiedAlertIds.add(alert.id);
        }
      });
      
      // 2. Clear tracking for alerts that have been resolved
      // This allows the notification to trigger again if the issue re-occurs later
      const currentIds = new Set(currentAlerts.map(a => a.id));
      this.notifiedAlertIds.forEach(id => {
        if (!currentIds.has(id)) {
          this.notifiedAlertIds.delete(id);
        }
      });
    });
  }

  ngOnInit() {
    this.refresh();
    
    // Initialize Realtime Data Fetching
    this.supabase.getBookings();
    this.supabase.getEmergencies();
    
    // Subscribe to Realtime Updates
    this.supabase.subscribeToBookings();
    this.supabase.subscribeToEmergencies();
    this.supabase.startSimulation();

    // Poll for vehicle updates (simulated GPS)
    setInterval(() => this.refresh(), 2000);
  }

  showNotification(alert: any) {
    const type = alert.type === 'Overspeeding' ? 'danger' : 'warning';
    
    const newToast = {
      id: crypto.randomUUID(),
      title: alert.type,
      msg: `${alert.reg} is reporting ${alert.val}`,
      type: type as 'warning'|'danger'
    };
    
    this.toasts.update(prev => [newToast, ...prev]); // Add to top
    
    // Auto dismiss
    setTimeout(() => {
      this.removeToast(newToast.id);
    }, 6000);
    
    // Sound Alert for Danger (Overspeeding)
    if (type === 'danger') {
       this.playAlertSound();
    }
  }

  removeToast(id: string) {
    this.toasts.update(prev => prev.filter(t => t.id !== id));
  }

  playAlertSound() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }

  async refresh() {
    const data = await this.supabase.getVehicles();
    this.vehicles.set(data);
    
    // Update Map Markers 
    const markers = [];
    
    // Add Vehicles
    data.forEach(v => {
      const hasAlert = v.fuel_level < 20 || v.battery_level < 20 || v.speed > 80;
      markers.push({
        lat: v.lat,
        lng: v.lng,
        title: `${v.registration_number} (${v.speed.toFixed(0)} km/h)`,
        type: hasAlert ? 'emergency' : 'vehicle'
      });
    });

    // Add Active Emergencies
    this.activeEmergencies().forEach(e => {
       markers.push({
         lat: e.lat,
         lng: e.lng,
         title: `EMERGENCY: ${e.type}`,
         type: 'emergency'
       });
    });

    this.mapMarkers.set(markers);
  }
}