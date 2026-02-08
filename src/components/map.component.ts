import { Component, ElementRef, input, effect, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var L: any;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #mapContainer class="w-full h-full rounded-lg shadow-inner bg-gray-200"></div>
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

  constructor() {
    effect(() => {
      const c = this.center();
      if (this.map && typeof L !== 'undefined') {
        this.map.setView([c.lat, c.lng], 13);
      }
    });

    effect(() => {
      const ms = this.markers();
      if (this.map && this.markerLayer && typeof L !== 'undefined') {
        this.markerLayer.clearLayers();
        ms.forEach(m => {
          let color = 'blue';
          if (m.type === 'emergency') color = 'red';
          if (m.type === 'pickup') color = 'green';
          if (m.type === 'drop') color = 'red'; // Drop is usually destination red
          if (m.type === 'vehicle') color = '#2563eb'; // Blue-600

          L.circleMarker([m.lat, m.lng], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
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
      this.map = L.map(this.mapContainer.nativeElement).setView([this.center().lat, this.center().lng], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      this.markerLayer = L.layerGroup().addTo(this.map);
      
      setTimeout(() => {
        this.map.invalidateSize();
      }, 100);
    } catch (e) {
      console.error('Error initializing map:', e);
    }
  }
}