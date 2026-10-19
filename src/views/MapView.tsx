import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Navigation, ExternalLink, Crosshair, RefreshCw, Layers } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ServiceLocation } from '../types';

// Fix Leaflet standard marker icon issues in Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored icons for categories
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const violetIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to dynamically fit map bounds to current active/filtered service markers
const MapBoundsFitter: React.FC<{
  services: ServiceLocation[];
  defaultCenter: [number, number];
  triggerKey: number;
}> = ({ services, defaultCenter, triggerKey }) => {
  const map = useMap();

  useEffect(() => {
    if (!services || services.length === 0) {
      map.setView(defaultCenter, 15, { animate: true });
      return;
    }

    if (services.length === 1) {
      map.setView([services[0].latitude!, services[0].longitude!], 16, { animate: true });
      return;
    }

    const validCoords = services
      .filter(s => typeof s.latitude === 'number' && typeof s.longitude === 'number')
      .map(s => [s.latitude!, s.longitude!] as [number, number]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16,
          animate: true
        });
      }
    }
  }, [services, map, defaultCenter, triggerKey]);

  return null;
};

export const MapView: React.FC = () => {
  // Subscribe to real-time cloud data sync updates
  const [, setSyncTick] = useState(0);
  useEffect(() => {
    return dataService.subscribeSync(() => {
      setSyncTick(t => t + 1);
    });
  }, []);

  const allServices = dataService.getServiceLocations();
  const regions = dataService.getRegions();
  const categories = dataService.getCategories();

  // Combine RW list from regions and services
  const uniqueRWs: string[] = Array.from(new Set([
    ...regions.map(r => r.rwCode),
    ...allServices.map(s => s.rw)
  ].filter(Boolean))).sort();

  // Filters - Default to ACTIVE to focus strictly on real active customer data!
  const [filterRW, setFilterRW] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [focusTrigger, setFocusTrigger] = useState(0);

  // Filter service locations that have coordinates
  const filteredServices = allServices.filter(s => {
    if (!s.latitude || !s.longitude) return false;
    if (filterRW !== 'ALL' && s.rw !== filterRW) return false;
    if (filterCategory !== 'ALL' && s.categoryId !== filterCategory) return false;
    if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
    return true;
  });

  // Count unmapped active services
  const unmappedCount = allServices.filter(s => s.status === 'ACTIVE' && (!s.latitude || !s.longitude)).length;
  const inactiveCount = allServices.filter(s => s.status === 'INACTIVE' && s.latitude && s.longitude).length;

  // Real center of Desa Gedangan, Kec. Tuntang, Kab. Semarang
  const defaultCenter: [number, number] = [-7.3287, 110.4640];

  const getMarkerIcon = (categoryName?: string) => {
    const lower = (categoryName || '').toLowerCase();
    if (lower.includes('umkm')) return blueIcon;
    if (lower.includes('perusahaan') || lower.includes('pt ') || lower.includes('cv ')) return violetIcon;
    if (lower.includes('rumah tangga')) return greenIcon;
    return orangeIcon;
  };

  const handleResetFocus = () => {
    setFocusTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Peta Sebaran Lokasi Layanan (GPS)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualisasi geografis pelanggan persampahan BUMDes Makmur Gedangan berdasarkan RW, RT, dan Kategori.
          </p>
        </div>

        <button
          onClick={handleResetFocus}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs hover:shadow active:scale-95 cursor-pointer self-start sm:self-auto"
          title="Fokuskan peta ke seluruh titik lokasi pelanggan real"
        >
          <Crosshair className="w-3.5 h-3.5 text-emerald-200" />
          <span>Fokus ke Lokasi Real</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2.5 items-center">
          <select
            value={filterRW}
            onChange={(e) => setFilterRW(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500 font-medium"
          >
            <option value="ALL">Semua RW</option>
            {uniqueRWs.map(rw => <option key={rw} value={rw}>{rw}</option>)}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500 font-medium"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500 font-medium bg-emerald-50/50"
          >
            <option value="ACTIVE">Status: Aktif Saja (Lokasi Real)</option>
            <option value="ALL">Status: Semua (Termasuk Nonaktif)</option>
            <option value="INACTIVE">Status: Nonaktif Saja</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          {categories.map((c) => {
            const lower = c.name.toLowerCase();
            let dotColor = 'bg-amber-500';
            if (lower.includes('rumah tangga')) dotColor = 'bg-emerald-500';
            else if (lower.includes('umkm')) dotColor = 'bg-blue-500';
            else if (lower.includes('perusahaan')) dotColor = 'bg-purple-500';

            return (
              <span key={c.id} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></span> {c.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* Map Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[560px] relative">
        <MapContainer
          center={defaultCenter}
          zoom={15}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Dynamic auto-bounds fitter that centers strictly on real locations */}
          <MapBoundsFitter
            services={filteredServices}
            defaultCenter={defaultCenter}
            triggerKey={focusTrigger}
          />

          {filteredServices.map(srv => (
            <Marker
              key={srv.id}
              position={[srv.latitude!, srv.longitude!]}
              icon={getMarkerIcon(srv.categoryName)}
            >
              <Popup>
                <div className="p-1 space-y-1.5 text-xs min-w-[210px]">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-slate-900 text-sm">{srv.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      srv.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {srv.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="font-mono text-emerald-700 font-semibold">{srv.serviceCode}</div>
                  <div className="text-slate-600">Warga: <strong>{srv.customerName}</strong></div>
                  <div className="text-slate-500">{srv.address} ({srv.rt} / {srv.rw})</div>
                  <div className="pt-1 border-t border-slate-200 flex justify-between font-medium">
                    <span>{srv.categoryName}</span>
                    <span className="text-brand-800 font-bold">Rp {srv.tariffAmount?.toLocaleString('id-ID')}/bln</span>
                  </div>

                  {/* Navigasi Google Maps untuk Petugas & Admin */}
                  <div className="pt-2 mt-1.5 border-t border-slate-100 space-y-1.5">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${srv.latitude},${srv.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#ffffff', textDecoration: 'none' }}
                      className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 !text-white rounded-xl text-xs font-bold transition shadow-xs hover:shadow text-center cursor-pointer"
                      title="Buka rute navigasi Google Maps ke rumah pelanggan"
                    >
                      <Navigation className="w-3.5 h-3.5 shrink-0" />
                      <span>Buka Rute di Google Maps</span>
                      <ExternalLink className="w-3 h-3 text-emerald-100 shrink-0 ml-0.5" />
                    </a>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-0.5">
                      <span>GPS: {srv.latitude?.toFixed(4)}, {srv.longitude?.toFixed(4)}</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${srv.latitude},${srv.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#047857', textDecoration: 'none' }}
                        className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline inline-flex items-center gap-0.5"
                        title="Lihat pin titik lokasi di Google Maps"
                      >
                        <span>Lihat Titik</span> ↗
                      </a>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Quick Re-center Button in Map */}
        <div className="absolute top-4 left-14 z-400">
          <button
            onClick={handleResetFocus}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white backdrop-blur-md rounded-xl shadow-md border border-slate-200 text-xs font-bold text-slate-700 hover:text-emerald-700 transition cursor-pointer"
            title="Pusatkan dan fokuskan kamera ke titik sebaran data real"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pusatkan Lokasi</span>
          </button>
        </div>

        {/* Floating summary tag */}
        <div className="absolute top-4 right-4 z-400 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div className="font-bold text-slate-900">{filteredServices.length} Lokasi Terpetakan</div>
          </div>
          {filterStatus === 'ACTIVE' && inactiveCount > 0 && (
            <div className="text-[10px] text-slate-400 mt-0.5">
              {inactiveCount} lokasi nonaktif (dummy) otomatis disembunyikan
            </div>
          )}
          {unmappedCount > 0 && (
            <div className="text-[10px] text-amber-600 font-medium mt-0.5">
              {unmappedCount} pelanggan aktif belum ada GPS
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
