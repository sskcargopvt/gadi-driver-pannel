import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

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
  messages: {sender: 'mechanic'|'driver', text: string, time: Date | string}[];
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
  counter_offer?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'bargaining' | 'completed';
  pickup_lat: number;
  pickup_lng: number;
  drop_lat: number;
  drop_lng: number;
  created_at: string;
  updated_at?: string;
  messages: {sender: 'driver'|'customer', text: string, time: Date | string}[];
  driver_id?: string;
  driver_response?: string;
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
  private bookingChannel: RealtimeChannel | null = null;
  
  // Real-time signals
  liveBookings = signal<BookingRequest[]>([]);
  
  // Legacy/Mock data stores (Synced with liveBookings where possible)
  mockVehicles = signal<Vehicle[]>([
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

  // Alias for backward compatibility, though we prefer liveBookings now
  mockBookings = this.liveBookings;

  mockLoads = signal<Load[]>([
     { id: 'l1', source: 'Bangalore', destination: 'Chennai', material: 'Textiles', weight: '2 Tons', expected_price: 15000, contact: 'Logistics Co.', company: 'FastTrack Logistics', status: 'available' },
     { id: 'l2', source: 'Bangalore', destination: 'Mysore', material: 'Electronics', weight: '1.5 Tons', expected_price: 8000, contact: 'Tech Movers', company: 'ElectroMove', status: 'available' },
     { id: 'l3', source: 'Bangalore', destination: 'Hyderabad', material: 'Construction Pipes', weight: '5 Tons', expected_price: 25000, contact: 'InfraBuild', company: 'InfraBuild Ltd', status: 'available' },
  ]);

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    // Initialize with some mock data if needed or empty
    this.liveBookings.set([
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
  }

  // --- Helper for Test Connection Component ---
  async testConnection() {
    try {
      const { data, error } = await this.supabase.from('vehicles').select('id').limit(1);
      return { success: !error, error };
    } catch (e) {
      return { success: false, error: e };
    }
  }

  // --- Real-Time Booking Methods ---

  subscribeToBookingRequests() {
    if (this.bookingChannel) return;

    // ✅ CHANGED: Use broadcast instead of postgres_changes
    const topic = 'booking_requests';
    this.bookingChannel = this.supabase.channel(topic, { 
      config: { private: true, broadcast: { self: false } }
    });
    
    this.bookingChannel
      // ✅ CHANGED: Listen to 'broadcast' events instead of 'postgres_changes'
      .on('broadcast', { event: '*' }, (payload: any) => {
        console.log('📢 Booking broadcast received:', payload);
        
        // ✅ CHANGED: Normalize payload from DB trigger
        const type = payload.type || payload.event;
        const newRow = payload.new ?? payload.new_row ?? payload.payload;
        const oldRow = payload.old ?? payload.old_row;

        if (type === 'INSERT' && newRow) {
          // New booking request from customer
          const newBooking: BookingRequest = this.mapToBookingRequest(newRow);
          this.liveBookings.update(bookings => [newBooking, ...bookings]);
          // Also show notification if you have that method
          if (this.showNotification) {
              this.showNotification(
                'New Booking Request!', 
                `${newBooking.customer_name} - ${newBooking.pickup_location}`
              );
          }
          console.log('✅ New booking added:', newBooking.id);
        } 
        else if (type === 'UPDATE' && newRow) {
          // Booking updated (customer responded, etc.)
          this.liveBookings.update(bookings =>
            bookings.map(b => b.id === newRow.id ? { ...b, ...this.mapToBookingRequest(newRow) } : b)
          );
          console.log('🔄 Booking updated:', newRow.id);
        } 
        else if (type === 'DELETE' && oldRow) {
          // Booking deleted/cancelled
          this.liveBookings.update(bookings =>
            bookings.filter(b => b.id !== oldRow.id)
          );
          console.log('🗑️ Booking deleted:', oldRow.id);
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to booking_requests topic (broadcast mode)');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - check RLS policies and authentication');
        } else {
          console.log('📡 Channel status:', status);
        }
      });
  }

  unsubscribeFromBookings() {
    if (this.bookingChannel) {
      this.supabase.removeChannel(this.bookingChannel);
      this.bookingChannel = null;
    }
  }

  async createBooking(booking: Partial<BookingRequest>) {
    const newBooking = {
      // Allow Supabase to generate ID or use provided
      ...booking,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('booking_requests')
      .insert(newBooking)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
    return data;
  }

  async acceptBooking(bookingId: string, driverId: string) {
    // Optimistic Update
    this.liveBookings.update(bookings => 
      bookings.map(b => b.id === bookingId ? { ...b, status: 'accepted', driver_id: driverId } : b)
    );

    const { data, error } = await this.supabase
      .from('booking_requests')
      .update({
        status: 'accepted',
        driver_id: driverId,
        driver_response: 'Confirmed! I will pick up on time.',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) {
      console.error('Error accepting booking:', error);
      // Revert if error (simplified)
      this.getBookings(); // Refresh from server
      throw error;
    }
    return data;
  }

  async rejectBooking(bookingId: string) {
    // Optimistic Update
    this.liveBookings.update(bookings => 
      bookings.map(b => b.id === bookingId ? { ...b, status: 'rejected' } : b)
    );

    const { data, error } = await this.supabase
      .from('booking_requests')
      .update({
        status: 'rejected',
        driver_response: 'Not available at this time.',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
       console.error('Error rejecting booking:', error);
       this.getBookings();
       throw error;
    }
    return data;
  }

  async counterOffer(bookingId: string, counterPrice: number) {
    // Optimistic Update
    this.liveBookings.update(bookings => 
      bookings.map(b => b.id === bookingId ? { ...b, status: 'bargaining', counter_offer: counterPrice } : b)
    );

    const { data, error } = await this.supabase
      .from('booking_requests')
      .update({
        status: 'bargaining',
        counter_offer: counterPrice,
        driver_response: `I can do it for ₹${counterPrice}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Error sending counter-offer:', error);
      this.getBookings();
      throw error;
    }
    return data;
  }

  private showNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/741/741407.png' });
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private mapToBookingRequest(row: any): BookingRequest {
    return {
      id: row.id,
      customer_name: row.customer_name || 'Customer',
      customer_phone: row.customer_phone || '',
      pickup_location: row.pickup_location || 'Unknown',
      drop_location: row.drop_location || 'Unknown',
      goods_type: row.goods_type || 'General',
      weight: row.weight || '0kg',
      offered_price: row.offered_price || 0,
      counter_offer: row.counter_offer,
      status: row.status || 'pending',
      pickup_lat: row.pickup_lat || 0,
      pickup_lng: row.pickup_lng || 0,
      drop_lat: row.drop_lat || 0,
      drop_lng: row.drop_lng || 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
      messages: row.messages || [],
      driver_id: row.driver_id,
      driver_response: row.driver_response
    };
  }

  // --- Existing Methods (Refactored to use liveBookings) ---
  
  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string, data: any) {
    return await this.supabase.auth.signUp({ email, password, options: { data } });
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  async getUser() {
    return await this.supabase.auth.getUser();
  }

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
        const mappedData = data.map((e: any) => ({ ...e, messages: e.messages || [] }));
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
        const mappedData = data.map(this.mapToBookingRequest);
        this.liveBookings.set(mappedData);
        return mappedData;
      }
    } catch (e) {
      console.warn('Could not fetch real bookings, using fallback');
    }
    return this.liveBookings();
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
    const currentReq = this.mockEmergencies().find(e => e.id === reqId);
    let currentMessages = currentReq ? [...currentReq.messages, newMessage] : [newMessage];
    
    this.mockEmergencies.update(prev => prev.map(e => 
      e.id === reqId ? { ...e, messages: currentMessages } : e
    ));
    
    try {
        const { data } = await this.supabase.from('emergency_requests').select('messages').eq('id', reqId).single();
        const existingMsgs = data?.messages || [];
        await this.supabase.from('emergency_requests').update({ messages: [...existingMsgs, newMessage] }).eq('id', reqId);
    } catch (e) {}
  }

  // Kept for legacy internal calls, delegates to counterOffer/acceptBooking where possible or does local update
  async respondToBooking(id: string, action: 'accept' | 'reject', driverId: string, counterPrice?: number) {
    if (action === 'accept') {
       if (counterPrice) await this.counterOffer(id, counterPrice);
       else await this.acceptBooking(id, driverId);
    } else {
       await this.rejectBooking(id);
    }
  }

  async sendMessage(bookingId: string, text: string) {
    const newMessage = { sender: 'driver' as const, text, time: new Date() };
    this.liveBookings.update(prev => prev.map(b => 
      b.id === bookingId ? { ...b, messages: [...b.messages, newMessage] } : b
    ));

    try {
      const { data } = await this.supabase.from('booking_requests').select('messages').eq('id', bookingId).single();
      const existingMsgs = data?.messages || [];
      await this.supabase.from('booking_requests').update({ messages: [...existingMsgs, newMessage] }).eq('id', bookingId);
    } catch (e) {
      console.error('Failed to send message to DB', e);
    }
  }

  async requestLoad(loadId: string) {
    this.mockLoads.update(prev => prev.map(l => 
      l.id === loadId ? { ...l, status: 'requested' } : l
    ));
  }

  subscribeToBookings() {
    this.subscribeToBookingRequests(); // Delegate to new method
  }

  subscribeToEmergencies() {
    this.supabase.channel('public:emergency_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_requests' }, (payload) => {
        const newRecord = payload.new as any;
        if (payload.eventType === 'INSERT') {
           this.mockEmergencies.update(prev => [...prev, {
             ...newRecord,
             messages: newRecord.messages || []
           }]);
        } else if (payload.eventType === 'UPDATE') {
           this.mockEmergencies.update(prev => prev.map(e => 
             e.id === newRecord.id ? { ...e, ...newRecord, messages: newRecord.messages || e.messages } : e
           ));
        }
      })
      .subscribe();
  }

  startSimulation() {
    if (this.simulationInterval) return;

    this.simulationInterval = setInterval(() => {
      this.mockVehicles.update(vehicles => 
        vehicles.map(v => {
          if (v.status === 'Running') {
            return {
              ...v,
              lat: v.lat + (Math.random() - 0.5) * 0.001,
              lng: v.lng + (Math.random() - 0.5) * 0.001,
              speed: Math.max(0, Math.min(120, v.speed + (Math.random() - 0.5) * 20)),
              fuel_level: Math.max(0, parseFloat((v.fuel_level - (Math.random() * 0.5)).toFixed(1)))
            };
          }
          return v;
        })
      );
    }, 2000);
  }
}