import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Plus,
  Layers,
  Home,
  Users,
  Bug,
  AlertTriangle,
  Heart,
  Navigation,
  CheckCircle2,
  Download,
  WifiOff,
} from 'lucide-react';
import { Household, Person, Village, VhvMember } from '../types';
import { CARE_CATEGORY_CONFIG } from '../utils/health';

interface CommunityMapProps {
  households: Household[];
  persons: Person[];
  villages: Village[];
  vhvMembers: VhvMember[];
  selectedVillageNo: number;
  focusedHousehold?: Household | null;
  onViewHouseholdDetail: (household: Household) => void;
  onAddHouseholdAtCoords: (lat: number, lng: number) => void;
}

export const CommunityMap: React.FC<CommunityMapProps> = ({
  households,
  persons,
  villages,
  vhvMembers,
  selectedVillageNo,
  focusedHousehold,
  onViewHouseholdDetail,
  onAddHouseholdAtCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);

  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'bedridden' | 'larva'>('all');
  const [downloadingTiles, setDownloadingTiles] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadOfflineTiles = async () => {
    setDownloadingTiles(true);
    setDownloadSuccess(false);
    try {
      if ('caches' in window) {
        const cache = await caches.open('map-tiles-cache');
        const lat = currentVillage.centerLat;
        const lng = currentVillage.centerLng;
        const zoom = 16;
        const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
        const y = Math.floor(
          ((1 -
            Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) /
              Math.PI) /
            2) *
            Math.pow(2, zoom)
        );

        const tileUrls = [];
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            tileUrls.push(`https://a.tile.openstreetmap.org/${zoom}/${x + dx}/${y + dy}.png`);
            tileUrls.push(`https://b.tile.openstreetmap.org/${zoom}/${x + dx}/${y + dy}.png`);
          }
        }

        await cache.addAll(tileUrls.map((url) => new Request(url, { mode: 'no-cors' })));
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      } else {
        alert('Cache API not supported in this browser');
      }
    } catch (err) {
      console.error('Error pre-downloading map tiles:', err);
    } finally {
      setDownloadingTiles(false);
    }
  };

  // Determine center based on selected village or focused household
  const currentVillage = villages.find((v) => v.no === selectedVillageNo) || villages[0] || {
    centerLat: 18.7883,
    centerLng: 98.9853,
  };

  // SVG Custom Pin Generators
  const createPinIcon = (color: string, label: string) => {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="position: relative; width: 32px; height: 42px; transform: translate(-50%, -100%); cursor: pointer;">
          <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16344 0 0 7.16344 0 16C0 27.5 16 42 16 42C16 42 32 27.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="${color}"/>
            <circle cx="16" cy="15" r="9" fill="white"/>
          </svg>
          <div style="position: absolute; top: 6px; left: 0; width: 32px; text-align: center; font-size: 10px; font-weight: bold; color: #1e293b; font-family: sans-serif;">
            ${label}
          </div>
        </div>
      `,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
      popupAnchor: [0, -42],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentVillage.centerLat, currentVillage.centerLng],
        zoom: 16,
      });

      // Standard OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Smart OSM Next',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Handle map clicks to place custom pin
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setClickedCoords({
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
        });

        if (tempMarkerRef.current) {
          tempMarkerRef.current.setLatLng([lat, lng]);
        } else {
          const tempIcon = L.divIcon({
            className: 'temp-pin',
            html: `
              <div style="width: 24px; height: 24px; background: #6366f1; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5); transform: translate(-50%, -50%); animation: bounce 1s infinite;">
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          const m = L.marker([lat, lng], { icon: tempIcon }).addTo(map);
          tempMarkerRef.current = m;
        }
      });
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when village changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (focusedHousehold) {
      mapInstanceRef.current.setView(
        [focusedHousehold.latitude, focusedHousehold.longitude],
        17,
        { animate: true }
      );
    } else if (selectedVillageNo !== 0) {
      mapInstanceRef.current.setView(
        [currentVillage.centerLat, currentVillage.centerLng],
        16,
        { animate: true }
      );
    }
  }, [selectedVillageNo, focusedHousehold, currentVillage]);

  // Render household markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const displayHouses = households.filter((h) => {
      if (selectedVillageNo !== 0 && h.villageNo !== selectedVillageNo) return false;
      if (filterMode === 'larva' && !h.mosquitoLarvaFound) return false;
      if (filterMode === 'bedridden') {
        const hasBedridden = persons.some(
          (p) => p.householdId === h.id && p.careCategory === 'bedridden'
        );
        if (!hasBedridden) return false;
      }
      return true;
    });

    displayHouses.forEach((house) => {
      const houseMembers = persons.filter((p) => p.householdId === house.id);
      const hasBedridden = houseMembers.some((p) => p.careCategory === 'bedridden');
      const hasHomebound = houseMembers.some((p) => p.careCategory === 'homebound');
      const hasChronic = houseMembers.some((p) => p.chronicDiseases.length > 0);

      // Color selection
      let pinColor = '#10b981'; // Green: Normal
      if (hasBedridden || house.mosquitoLarvaFound) {
        pinColor = '#ef4444'; // Red: Bedridden or Larva
      } else if (hasHomebound || hasChronic) {
        pinColor = '#f59e0b'; // Amber: Homebound or Chronic
      }

      const icon = createPinIcon(pinColor, house.houseNo.slice(0, 3));
      const marker = L.marker([house.latitude, house.longitude], { icon });

      // Build popup HTML
      const vhv = vhvMembers.find((v) => v.id === house.vhvMemberId);
      const popupHtml = `
        <div style="font-family: 'Sarabun', sans-serif; width: 220px;">
          <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 2px;">
            บ้านเลขที่ ${house.houseNo}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            หมู่ ${house.villageNo} ${house.villageName}
          </div>
          <div style="font-size: 12px; margin-bottom: 4px;">
            <strong>เจ้าบ้าน:</strong> ${house.headOfHouseholdName}
          </div>
          <div style="font-size: 12px; margin-bottom: 4px;">
            <strong>สมาชิก:</strong> ${houseMembers.length} คน
          </div>
          <div style="font-size: 11px; color: #059669; margin-bottom: 6px;">
            <strong>อสม.:</strong> ${vhv?.name || '-'}
          </div>
          ${
            house.mosquitoLarvaFound
              ? `<div style="font-size: 11px; font-weight: bold; color: #e11d48; margin-bottom: 6px;">⚠️ พบลูกน้ำยุงลาย</div>`
              : ''
          }
          ${
            hasBedridden
              ? `<div style="font-size: 11px; font-weight: bold; color: #be123c; margin-bottom: 6px;">🔴 มีผู้ป่วยติดเตียง</div>`
              : ''
          }
          <button id="btn-detail-${house.id}" style="width: 100%; padding: 6px 10px; background: #059669; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; margin-top: 4px;">
            ดูข้อมูลสมาชิก & เยี่ยมบ้าน
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-detail-${house.id}`);
        if (btn) {
          btn.onclick = () => {
            onViewHouseholdDetail(house);
          };
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [households, persons, selectedVillageNo, filterMode, vhvMembers]);

  return (
    <div className="space-y-4 pb-12">
      {/* Map Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            <span>แผนที่สุขภาพชุมชน GIS (OpenStreetMap)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            คลิกบนจุดหมุดเพื่อดูข้อมูลบ้าน หรือคลิกบนแผนที่เพื่อดึงพิกัดเพิ่มหลังคาเรือนใหม่
          </p>
        </div>

        {/* Filter buttons & Offline Map download */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={handleDownloadOfflineTiles}
            disabled={downloadingTiles}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg font-semibold border border-blue-200 transition-colors disabled:opacity-50"
            title="ดาวน์โหลด Tile แผนที่บริเวณพื้นที่รับผิดชอบไว้ดูแบบออฟไลน์"
          >
            <Download className={`w-3.5 h-3.5 ${downloadingTiles ? 'animate-bounce' : ''}`} />
            <span>{downloadingTiles ? 'กำลังดาวน์โหลดแผนที่...' : 'ดาวน์โหลดแผนที่ออฟไลน์'}</span>
          </button>
          {downloadSuccess && (
            <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 animate-fadeIn">
              ✅ โหลดแผนที่ออฟไลน์สำเร็จ
            </span>
          )}

          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterMode === 'all'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            แสดงทั้งหมด
          </button>
          <button
            onClick={() => setFilterMode('bedridden')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterMode === 'bedridden'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ผู้ป่วยติดเตียงเท่านั้น 🔴
          </button>
          <button
            onClick={() => setFilterMode('larva')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterMode === 'larva'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            พบลูกน้ำยุงลาย ⚠️
          </button>
        </div>
      </div>

      {/* Map Viewport Area */}
      <div className="relative w-full h-[580px] bg-slate-100 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-md border border-slate-200 text-xs space-y-1.5 max-w-[220px]">
          <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider mb-1">
            สัญลักษณ์พิกัดสุขภาพ
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-700">ปกติ / ติดสังคม</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span className="text-slate-700">ติดบ้าน / มีโรคเรื้อรัง</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span className="text-slate-700">ติดเตียง / พบลูกน้ำ</span>
          </div>
        </div>

        {/* Clicked Coords Action Box */}
        {clickedCoords && (
          <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-xs p-3.5 rounded-xl shadow-lg border border-emerald-300 max-w-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                จุดที่คลิกบนแผนที่
              </span>
              <button
                onClick={() => {
                  setClickedCoords(null);
                  if (tempMarkerRef.current && mapInstanceRef.current) {
                    mapInstanceRef.current.removeLayer(tempMarkerRef.current);
                    tempMarkerRef.current = null;
                  }
                }}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="text-[11px] font-mono text-slate-600 mt-1">
              Lat: {clickedCoords.lat}, Lng: {clickedCoords.lng}
            </div>
            <button
              onClick={() => {
                onAddHouseholdAtCoords(clickedCoords.lat, clickedCoords.lng);
                setClickedCoords(null);
              }}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มหลังคาเรือนที่พิกัดนี้</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
