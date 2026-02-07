import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { SupabaseService, EmergencyRequest } from '../services/supabase.service';
import { MapComponent } from './map.component';

@Component({
  selector: 'app-mechanic-dashboard',
  standalone: true,
  imports: [CommonModule, MapComponent],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <header class="bg-orange-600 text-white p-4 shadow-md flex justify-between items-center z-10">
        <h1 class="text-xl font-bold flex items-center gap-2">
          <span class="material-icons">build</span> Mechanic App
        </h1>
        <button (click)="auth.logout()" class="text-sm bg-orange-700 px-3 py-1 rounded">Logout</button>
      </header>

      <main class="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
        
        <!-- Job List -->
        <div class="w-full md:w-96 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <div class="p-4 border-b border-gray-100 bg-orange-50 flex justify-between items-center">
            <h2 class="font-bold text-orange-900">Available Requests</h2>
            <div class="flex items-center gap-1 text-xs text-green-600 font-bold px-2 py-1 bg-green-50 rounded-full animate-pulse">
               <span class="w-2 h-2 bg-green-500 rounded-full"></span> LIVE
            </div>
          </div>

          @if (requests().length === 0) {
            <div class="p-8 text-center text-gray-400">
              <span class="material-icons text-4xl mb-2">check_circle</span>
              <p>No active emergencies nearby.</p>
            </div>
          }

          @for (req of requests(); track req.id) {
            <div class="p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                 [class.bg-blue-50]="selectedRequest()?.id === req.id"
                 (click)="selectRequest(req)">
              <div class="flex justify-between items-start mb-2">
                <span class="font-bold text-gray-800">{{req.type}}</span>
                <span class="text-xs px-2 py-1 rounded-full uppercase font-bold"
                  [class.bg-red-100]="req.status === 'pending'"
                  [class.text-red-700]="req.status === 'pending'"
                  [class.bg-blue-100]="req.status === 'assigned'"
                  [class.text-blue-700]="req.status === 'assigned'"
                  [class.bg-green-100]="req.status === 'completed'"
                  [class.text-green-700]="req.status === 'completed'">
                  {{req.status}}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-2 truncate">{{req.location}}</p>
              <div class="flex justify-between items-center text-xs text-gray-500">
                <span>{{req.created_at | date:'shortTime'}}</span>
                @if (req.status === 'pending') {
                  <button (click)="acceptJob(req, $event)" class="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 transition shadow-sm">
                    Accept
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <!-- Detail/Map View -->
        <div class="flex-1 relative bg-gray-100">
          @if (selectedRequest(); as req) {
            <div class="absolute top-4 left-4 right-4 z-[400] bg-white rounded-lg shadow-lg p-4 md:max-w-md animate-fade-in">
              <h3 class="font-bold text-lg mb-1">{{req.type}}</h3>
              <p class="text-sm text-gray-600 mb-3">{{req.location}}</p>
              
              @if (req.status !== 'pending') {
                <div class="flex items-center gap-2 mb-3">
                   <div class="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                     <div class="bg-green-500 h-full w-2/3 animate-pulse"></div>
                   </div>
                   <span class="text-xs font-bold text-green-600">En Route</span>
                </div>
                
                <div class="flex gap-2">
                  <button (click)="updateStatus(req, 'completed')" class="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700">
                    Mark Complete
                  </button>
                  <button class="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg font-medium">
                    Chat
                  </button>
                </div>
              }
            </div>
            
            <app-map [center]="{lat: req.lat, lng: req.lng}"
                     [markers]="[{lat: req.lat, lng: req.lng, title: req.type, type: 'emergency'}]">
            </app-map>
          } @else {
            <div class="h-full flex items-center justify-center text-gray-400">
              <div class="text-center">
                <span class="material-icons text-6xl opacity-20">map</span>
                <p class="mt-4">Select a request to view location</p>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
  `]
})
export class MechanicDashboardComponent {
  auth = inject(AuthService);
  supabase = inject(SupabaseService);
  
  // Use the shared signal from SupabaseService for Realtime updates
  requests = this.supabase.mockEmergencies;
  selectedRequest = signal<EmergencyRequest | null>(null);

  constructor() {
    // Initial fetch
    this.supabase.getEmergencies();
    // Subscribe to Realtime channel
    this.supabase.subscribeToEmergencies();
  }

  selectRequest(req: EmergencyRequest) {
    this.selectedRequest.set(req);
  }

  async acceptJob(req: EmergencyRequest, event: Event) {
    event.stopPropagation();
    // Update DB
    await this.supabase.updateEmergencyStatus(req.id, 'assigned', 30);
    // Optimistic UI update (handled by signal but good for instant feedback)
    this.selectRequest({ ...req, status: 'assigned' });
  }

  async updateStatus(req: EmergencyRequest, status: string) {
    await this.supabase.updateEmergencyStatus(req.id, status);
    this.selectedRequest.set(null);
  }
}