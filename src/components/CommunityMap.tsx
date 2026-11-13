import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Plus, Navigation, CheckCircle2, Bug } from 'lucide-react';
import { Household, Person, Village, VhvMember } from '../types';

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
  const [filterMode, setFilterMode] = useState<'all' | 'bedridden' | 'larva'>('all');
  const [selectedHouse, setSelectedHouse] = useState<Household | null>(null);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const currentVillage = villages.find((v) => v.no === selectedVillageNo) || villages[0] || {
    centerLat: 18.7883,
    centerLng: 98.9853,
  };

  const center = focusedHousehold 
    ? { lat: focusedHousehold.latitude, lng: focusedHousehold.longitude }
    : { lat: currentVillage.centerLat, lng: currentVillage.centerLng };

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

  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className="space-y-4 pb-12">
      {/* Map Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            <span>แผนที่สุขภาพชุมชน Google Maps GIS</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            คลิกบนหมุดเพื่อดูข้อมูลบ้าน หรือคลิกบนแผนที่เพื่อดึงพิกัดเพิ่มหลังคาเรือนใหม่
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
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
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={center}
            defaultZoom={16}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            style={{ width: '100%', height: '100%' }}
            onClick={(e) => {
              if (e.detail.latLng) {
                const lat = e.detail.latLng.lat;
                const lng = e.detail.latLng.lng;
                setClickedCoords({ lat, lng });
              }
            }}
          >
            {displayHouses.map((house) => {
              const houseMembers = persons.filter((p) => p.householdId === house.id);
              const hasBedridden = houseMembers.some((p) => p.careCategory === 'bedridden');
              const hasHomebound = houseMembers.some((p) => p.careCategory === 'homebound');

              let pinBackground = '#10b981'; // Green
              let glyphColor = '#ffffff';
              if (hasBedridden || house.mosquitoLarvaFound) {
                pinBackground = '#ef4444'; // Red
              } else if (hasHomebound) {
                pinBackground = '#f59e0b'; // Amber
              }

              return (
                <AdvancedMarker
                  key={house.id}
                  position={{ lat: house.latitude, lng: house.longitude }}
                  onClick={() => setSelectedHouse(house)}
                >
                  <Pin background={pinBackground} glyphColor={glyphColor} borderColor="#ffffff">
                    <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{house.houseNo.slice(0, 3)}</span>
                  </Pin>
                </AdvancedMarker>
              );
            })}

            {selectedHouse && (
              <InfoWindow
                position={{ lat: selectedHouse.latitude, lng: selectedHouse.longitude }}
                onCloseClick={() => setSelectedHouse(null)}
              >
                <div style={{ fontFamily: 'Sarabun, sans-serif', width: '200px', padding: '4px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                    บ้านเลขที่ {selectedHouse.houseNo}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                    หมู่ {selectedHouse.villageNo} {selectedHouse.villageName}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <strong>เจ้าบ้าน:</strong> {selectedHouse.headOfHouseholdName}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                    <strong>สมาชิก:</strong> {persons.filter((p) => p.householdId === selectedHouse.id).length} คน
                  </div>
                  {selectedHouse.mosquitoLarvaFound && (
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#e11d48', marginBottom: '6px' }}>
                      ⚠️ พบลูกน้ำยุงลาย
                    </div>
                  )}
                  <button
                    onClick={() => onViewHouseholdDetail(selectedHouse)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    ดูข้อมูลสมาชิก & รายละเอียด
                  </button>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-md border border-slate-200 text-xs space-y-1.5 max-w-[220px]">
          <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider mb-1">
            สัญลักษณ์พิกัดสุขภาพ Google Maps
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
                onClick={() => setClickedCoords(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="text-[11px] font-mono text-slate-600 mt-1">
              Lat: {clickedCoords.lat.toFixed(6)}, Lng: {clickedCoords.lng.toFixed(6)}
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
