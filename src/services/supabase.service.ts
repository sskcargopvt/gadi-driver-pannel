import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration for Gaadi Dost Backend
const SUPABASE_URL = 'https://tstboympleybwbdwicik.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzdGJveW1wbGV5YndiZHdpY2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NDg0OTcsImV4cCI6MjA4NDIyNDQ5N30.JQZFd3z4yrVeUHG66Pe_FGFnupoG6JfguEP8auY-qUE';

export interface Vehicle {
  id: string;
  registration_number: string;
  type: string;
  status: 'Running' | 'Idle' | 'Stopped' | 'Offline';
  speed: number;
  fuel_level: number;
  battery_level: number;
  ignition: boolean;
  lat: number;
  lng: number;
  last_updated: string;
}

export interface EmergencyRequest {
  id: string;
  type: string;
  status: 'pending' | 'assigned' | 'tracking' | 'completed';
  eta: number;
  location: string;
  lat: number;
  lng: number;
  amount: number;
  created_at: string;
  // Added for mechanic chat
  messages: {sender: 'mechanic'|'driver', text: string, time: Date | string}[];
  // Extended details
  vehicle_reg?: string;
  assigned_mechanic?: string;
}

export interface BookingRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  pickup_location: string;
  drop_location: string;
  goods_type: string;
  weight: string;
  offered_price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'completed';
  pickup_lat: number;
  pickup_lng: number;
  drop_lat: number;
  drop_lng: number;
  created_at: string;
  messages: {sender: 'driver'|'customer', text: string, time: Date | string}[];
}

export interface Load {
  id: string;
  source: string;
  destination: string;
  material: string;
  weight: string;
  expected_price: number;
  contact: string;
  company: string;
  status: 'available' | 'requested';
  ai_assessment?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private simulationInterval: any;
  
  // Mock data stores for demo fallback
  private mockVehicles = signal<Vehicle[]>([
    {
      id: 'v1',
      registration_number: 'KA-01-HH-1234',
      type: 'Truck',
      status: 'Running',
      speed: 85, 
      fuel_level: 18,
      battery_level: 92,
      ignition: true,
      lat: 12.9716,
      lng: 77.5946,
      last_updated: new Date().toISOString()
    },
    {
      id: 'v2',
      registration_number: 'MH-02-AB-9999',
      type: 'Van',
      status: 'Idle',
      speed: 0,
      fuel_level: 34,
      battery_level: 88,
      ignition: false,
      lat: 19.0760,
      lng: 72.8777,
      last_updated: new Date().toISOString()
    }
  ]);

  mockEmergencies = signal<EmergencyRequest[]>([
    {
      id: 'e1',
      type: 'Breakdown',
      status: 'pending',
      eta: 0,
      location: 'Near Highway 44',
      lat: 12.9800,
      lng: 77.6000,
      amount: 1500,
      created_at: new Date().toISOString(),
      messages: [],
      vehicle_reg: 'KA-01-HH-1234'
    }
  ]);

  mockBookings = signal<BookingRequest[]>([
    {
      id: 'b1',
      customer_name: 'Rajesh Kumar',
      customer_phone: '+91 98765 43210',
      pickup_location: 'Whitefield, Bangalore',
      drop_location: 'Electronic City, Bangalore',
      goods_type: 'Furniture (Sofa + Table)',
      weight: '500kg',
      offered_price: 2500,
      status: 'pending',
      pickup_lat: 12.9698,
      pickup_lng: 77.7500,
      drop_lat: 12.8399,
      drop_lng: 77.6770,
      created_at: new Date().toISOString(),
      messages: []
    }
  ]);

  mockLoads = signal<Load[]>([
     { id: 'l1', source: 'Bangalore', destination: 'Chennai', material: 'Textiles', weight: '2 Tons', expected_price: 15000, contact: 'Logistics Co.', company: 'FastTrack Logistics', status: 'available' },
     { id: 'l2', source: 'Bangalore', destination: 'Mysore', material: 'Electronics', weight: '1.5 Tons', expected_price: 8000, contact: 'Tech Movers', company: 'ElectroMove', status: 'available' },
     { id: 'l3', source: 'Bangalore', destination: 'Hyderabad', material: 'Construction Pipes', weight: '5 Tons', expected_price: 25000, contact: 'InfraBuild', company: 'InfraBuild Ltd', status: 'available' },
  ]);

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  // --- Real Implementation ---

  async getVehicles(): Promise<Vehicle[]> {
    try {
      const { data, error } = await this.supabase.from('vehicles').select('*');
      if (error || !data) throw error;
      if (data.length > 0) return data as Vehicle[];
      return this.mockVehicles();
    } catch (e) {
      return this.mockVehicles();
    }
  }

  async getEmergencies(): Promise<EmergencyRequest[]> {
    try {
      const { data, error } = await this.supabase.from('emergency_requests').select('*');
      if (error || !data) throw error;
      if (data.length > 0) {
        const mappedData = data.map((e: any) => ({
           ...e,
           messages: e.messages || []
        }));
        this.mockEmergencies.set(mappedData as EmergencyRequest[]);
        return mappedData as EmergencyRequest[];
      }
    } catch (e) {}
    return this.mockEmergencies();
  }

  async getBookings(): Promise<BookingRequest[]> {
    try {
      const { data, error } = await this.supabase
        .from('booking_requests')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const mappedData: BookingRequest[] = data.map((b: any) => ({
            id: b.id,
            customer_name: b.customer_name || 'Customer',
            customer_phone: b.customer_phone || '',
            pickup_location: b.pickup_location || 'Unknown',
            drop_location: b.drop_location || 'Unknown',
            goods_type: b.goods_type || 'General',
            weight: b.weight || '0kg',
            offered_price: b.offered_price || 0,
            status: b.status || 'pending',
            pickup_lat: b.pickup_lat || 0,
            pickup_lng: b.pickup_lng || 0,
            drop_lat: b.drop_lat || 0,
            drop_lng: b.drop_lng || 0,
            created_at: b.created_at,
            messages: b.messages || []
        }));
        
        this.mockBookings.set(mappedData);
        return mappedData;
      }
    } catch (e) {
      console.warn('Could not fetch real bookings, using mocks', e);
    }
    return this.mockBookings();
  }

  async updateVehicleStatus(id: string, updates: Partial<Vehicle>) {
    this.mockVehicles.update(vehicles => 
      vehicles.map(v => v.id === id ? { ...v, ...updates } : v)
    );
    try { await this.supabase.from('vehicles').update(updates).eq('id', id); } catch (e) {}
  }

  async createEmergency(req: Partial<EmergencyRequest>) {
    const newEmergency: EmergencyRequest = {
      id: crypto.randomUUID(),
      type: req.type || 'General',
      status: 'pending',
      eta: 0,
      location: req.location || 'Unknown',
      lat: req.lat || 0,
      lng: req.lng || 0,
      amount: req.amount || 0,
      created_at: new Date().toISOString(),
      messages: [],
      vehicle_reg: req.vehicle_reg || 'Unknown'
    };
    this.mockEmergencies.update(prev => [...prev, newEmergency]);
    try { await this.supabase.from('emergency_requests').insert(newEmergency); } catch (e) {}
  }

  async updateEmergencyStatus(id: string, status: string, eta?: number, mechanicName?: string) {
    this.mockEmergencies.update(prev => 
      prev.map(e => {
        if (e.id === id) {
          const updated = { ...e, status: status as any };
          if (eta !== undefined) updated.eta = eta;
          if (mechanicName !== undefined) updated.assigned_mechanic = mechanicName;
          return updated;
        }
        return e;
      })
    );
    try { 
      const updates: any = { status };
      if (eta !== undefined) updates.eta = eta;
      if (mechanicName !== undefined) updates.assigned_mechanic = mechanicName;
      await this.supabase.from('emergency_requests').update(updates).eq('id', id); 
    } catch (e) {}
  }

  async sendEmergencyMessage(reqId: string, text: string) {
    const newMessage = { sender: 'mechanic' as const, text, time: new Date() };
    let currentMessages: any[] = [];
    
    // Optimistic Update
    const currentReq = this.mockEmergencies().find(e => e.id === reqId);
    if(currentReq) {
        currentMessages = [...currentReq.messages, newMessage];
    }
    
    this.mockEmergencies.update(prev => prev.map(e => {
        if(e.id === reqId) {
            return { ...e, messages: currentMessages };
        }
        return e;
    }));
    
    // Real Update
    try {
        const { data } = await this.supabase.from('emergency_requests').select('messages').eq('id', reqId).single();
        const existingMsgs = data?.messages || [];
        const updatedMsgs = [...existingMsgs, newMessage];
        await this.supabase.from('emergency_requests').update({ messages: updatedMsgs }).eq('id', reqId);
    } catch (e) {}
  }

  // Driver Booking Logic
  async respondToBooking(id: string, action: 'accept' | 'reject', counterPrice?: number) {
    this.mockBookings.update(prev => prev.map(b => {
      if (b.id !== id) return b;
      
      if (action === 'accept') {
        return { ...b, status: 'accepted' };
      } else if (action === 'reject') {
        return { ...b, status: 'rejected' };
      } else if (counterPrice) {
        return { ...b, status: 'negotiating', offered_price: counterPrice };
      }
      return b;
    }));
    
    try {
      const updatePayload: any = { status: action === 'accept' ? 'accepted' : 'rejected' };
      if (counterPrice) {
         updatePayload.status = 'negotiating';
         updatePayload.offered_price = counterPrice;
      }
      await this.supabase.from('booking_requests').update(updatePayload).eq('id', id);
    } catch(e) {}
  }

  async sendMessage(bookingId: string, text: string) {
    // 1. Optimistic Update
    const newMessage = { sender: 'driver' as const, text, time: new Date() };
    let currentMessages: any[] = [];
    
    // Find current messages from state
    const currentBooking = this.mockBookings().find(b => b.id === bookingId);
    if (currentBooking) {
      currentMessages = [...currentBooking.messages, newMessage];
    }

    this.mockBookings.update(prev => prev.map(b => {
      if (b.id === bookingId) {
        return { ...b, messages: currentMessages };
      }
      return b;
    }));

    // 2. Real Update
    try {
      // First fetch latest to ensure no overwrite, then append
      const { data } = await this.supabase.from('booking_requests').select('messages').eq('id', bookingId).single();
      const existingMsgs = data?.messages || [];
      const updatedMsgs = [...existingMsgs, newMessage];
      
      await this.supabase.from('booking_requests').update({ messages: updatedMsgs }).eq('id', bookingId);
    } catch (e) {
      console.error('Failed to send message to DB', e);
    }
  }

  async requestLoad(loadId: string) {
    this.mockLoads.update(prev => prev.map(l => 
      l.id === loadId ? { ...l, status: 'requested' } : l
    ));
  }

  // Subscribe to Realtime Booking Requests
  subscribeToBookings() {
    this.supabase.channel('public:booking_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_requests' }, (payload) => {
        const newRecord = payload.new as any;
        
        if (payload.eventType === 'INSERT') {
          const newBooking: BookingRequest = {
            id: newRecord.id,
            customer_name: newRecord.customer_name || 'New Customer',
            customer_phone: newRecord.customer_phone || '',
            pickup_location: newRecord.pickup_location || 'Unknown',
            drop_location: newRecord.drop_location || 'Unknown',
            goods_type: newRecord.goods_type || 'General',
            weight: newRecord.weight || '0kg',
            offered_price: newRecord.offered_price || 0,
            status: newRecord.status || 'pending',
            pickup_lat: newRecord.pickup_lat || 0,
            pickup_lng: newRecord.pickup_lng || 0,
            drop_lat: newRecord.drop_lat || 0,
            drop_lng: newRecord.drop_lng || 0,
            created_at: newRecord.created_at || new Date().toISOString(),
            messages: newRecord.messages || []
          };
          
          this.mockBookings.update(prev => {
            if (prev.find(b => b.id === newBooking.id)) return prev;
            return [newBooking, ...prev];
          });

        } else if (payload.eventType === 'UPDATE') {
          this.mockBookings.update(prev => prev.map(b => {
            if (b.id === newRecord.id) {
              return { 
                ...b, 
                ...newRecord,
                messages: newRecord.messages || b.messages 
              };
            }
            return b;
          }));
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to booking_requests');
        }
      });
  }

  subscribeToEmergencies() {
    this.supabase.channel('public:emergency_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_requests' }, (payload) => {
        const newRecord = payload.new as any;
        if (payload.eventType === 'INSERT') {
          const newEmergency: EmergencyRequest = {
            id: newRecord.id,
            type: newRecord.type || 'General',
            status: newRecord.status || 'pending',
            eta: newRecord.eta || 0,
            location: newRecord.location || 'Unknown',
            lat: newRecord.lat || 0,
            lng: newRecord.lng || 0,
            amount: newRecord.amount || 0,
            created_at: newRecord.created_at || new Date().toISOString(),
            messages: newRecord.messages || [],
            vehicle_reg: newRecord.vehicle_reg || 'Unknown',
            assigned_mechanic: newRecord.assigned_mechanic
          };
          this.mockEmergencies.update(prev => {
             if(prev.find(e => e.id === newEmergency.id)) return prev;
             return [...prev, newEmergency];
          });
        } else if (payload.eventType === 'UPDATE') {
           this.mockEmergencies.update(prev => prev.map(e => 
             e.id === newRecord.id ? { ...e, ...newRecord, messages: newRecord.messages || e.messages } : e
           ));
        }
      })
      .subscribe();
  }

  // Simulate Live Tracking updates
  startSimulation() {
    if (this.simulationInterval) return; // Prevent duplicates

    this.simulationInterval = setInterval(() => {
      // Move vehicles
      this.mockVehicles.update(vehicles => 
        vehicles.map(v => {
          if (v.status === 'Running') {
            const newSpeed = Math.max(0, Math.min(120, v.speed + (Math.random() - 0.5) * 20)); 
            const newFuel = Math.max(0, v.fuel_level - (Math.random() * 0.5));
            const newBattery = Math.max(0, v.battery_level - (Math.random() * 0.1));
            return {
              ...v,
              lat: v.lat + (Math.random() - 0.5) * 0.001,
              lng: v.lng + (Math.random() - 0.5) * 0.001,
              speed: newSpeed,
              fuel_level: parseFloat(newFuel.toFixed(1)),
              battery_level: parseFloat(newBattery.toFixed(1))
            };
          }
          return v;
        })
      );

      // Update Emergency Locations (Simulate GPS Drift / Towing for Active Jobs)
      this.mockEmergencies.update(reqs => 
        reqs.map(r => {
           if (r.status === 'assigned' || r.status === 'tracking') {
              return {
                 ...r,
                 lat: r.lat + (Math.random() - 0.5) * 0.0008, // Random jitter to simulate live tracking
                 lng: r.lng + (Math.random() - 0.5) * 0.0008
              };
           }
           return r;
        })
      );
    }, 2000);
  }
}