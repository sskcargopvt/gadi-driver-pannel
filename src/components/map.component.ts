import { Component, ElementRef, input, effect, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var L: any;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #mapContainer class="w-full h-full rounded-lg shadow-inner bg-gray-200 z-0 relative"></div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
  `]
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  center = input<{lat: number, lng: number}>({ lat: 20.5937, lng: 78.9629 }); 
  markers = input<{lat: number, lng: number, title: string, type: 'vehicle'|'emergency'|'pickup'|'drop'}[]>([]);
  
  private map: any;
  private markerLayer: any;
  private isInitialized = false;

  constructor() {
    // Effect to handle Center updates (Live Tracking)
    effect(() => {
      const c = this.center();
      if (this.map && typeof L !== 'undefined' && this.isInitialized) {
        // Use panTo for smooth animation which maintains user's zoom level
        this.map.panTo([c.lat, c.lng], { animate: true, duration: 1.0 });
      }
    });

    // Effect to handle Marker updates
    effect(() => {
      const ms = this.markers();
      if (this.map && this.markerLayer && typeof L !== 'undefined') {
        this.markerLayer.clearLayers();
        ms.forEach(m => {
          let color = '#2563eb'; // blue-600
          if (m.type === 'emergency') color = '#dc2626'; // red-600
          if (m.type === 'pickup') color = '#16a34a'; // green-600
          if (m.type === 'drop') color = '#dc2626'; // red-600
          
          // Vehicle marker is slightly larger
          const radius = m.type === 'vehicle' ? 10 : 8;
          const fillOpacity = m.type === 'vehicle' ? 0.9 : 0.8;

          L.circleMarker([m.lat, m.lng], {
            radius: radius,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: fillOpacity
          }).bindPopup(m.title).addTo(this.markerLayer);
        });
      }
    });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    if (!this.mapContainer) return;
    
    // Safety check: ensure Leaflet is loaded
    if (typeof L === 'undefined') {
      console.warn('Leaflet not loaded yet. Retrying in 500ms...');
      setTimeout(() => this.initMap(), 500);
      return;
    }

    // Prevent double initialization
    if (this.map) {
      this.map.remove();
    }

    try {
      this.map = L.map(this.mapContainer.nativeElement, {
        zoomControl: false // Custom position
      }).setView([this.center().lat, this.center().lng], 13);

      L.control.zoom({ position: 'bottomright' }).addTo(this.map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      this.markerLayer = L.layerGroup().addTo(this.map);
      this.isInitialized = true;
      
      // Fix for map not sizing correctly initially
      setTimeout(() => {
        this.map.invalidateSize();
      }, 100);
    } catch (e) {
      console.error('Error initializing map:', e);
    }
  }
}