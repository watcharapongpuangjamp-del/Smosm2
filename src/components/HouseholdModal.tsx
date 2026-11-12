import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Home, Check, AlertCircle } from 'lucide-react';
import { Household, Village, VhvMember } from '../types';

interface HouseholdModalProps {
  isOpen: boolean;
  householdToEdit?: Household | null;
  villages: Village[];
  vhvMembers: VhvMember[];
  onClose: () => void;
  onSave: (household: Household) => void;
}

export const HouseholdModal: React.FC<HouseholdModalProps> = ({
  isOpen,
  householdToEdit,
  villages,
  vhvMembers,
  onClose,
  onSave,
}) => {
  const [houseNo, setHouseNo] = useState('');
  const [villageNo, setVillageNo] = useState<number>(1);
  const [villageName, setVillageName] = useState('');
  const [subdistrict, setSubdistrict] = useState('ตำบลสุขภาพดี');
  const [district, setDistrict] = useState('อำเภอเมือง');
  const [province, setProvince] = useState('เชียงใหม่');
  const [headOfHouseholdName, setHeadOfHouseholdName] = useState('');
  const [vhvMemberId, setVhvMemberId] = useState('');
  const [latitude, setLatitude] = useState<number>(18.7883);
  const [longitude, setLongitude] = useState<number>(98.9853);
  const [sanitationRating, setSanitationRating] = useState<'good' | 'fair' | 'poor'>('good');
  const [mosquitoLarvaFound, setMosquitoLarvaFound] = useState(false);
  const [waterSource, setWaterSource] = useState('ประปาหมู่บ้าน');
  const [wasteManagement, setWasteManagement] = useState('คัดแยกขยะและทิ้งจุดรวม');
  const [notes, setNotes] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    if (householdToEdit) {
      setHouseNo(householdToEdit.houseNo);
      setVillageNo(householdToEdit.villageNo);
      setVillageName(householdToEdit.villageName);
      setSubdistrict(householdToEdit.subdistrict);
      setDistrict(householdToEdit.district);
      setProvince(householdToEdit.province);
      setHeadOfHouseholdName(householdToEdit.headOfHouseholdName);
      setVhvMemberId(householdToEdit.vhvMemberId);
      setLatitude(householdToEdit.latitude);
      setLongitude(householdToEdit.longitude);
      setSanitationRating(householdToEdit.sanitationRating);
      setMosquitoLarvaFound(householdToEdit.mosquitoLarvaFound);
      setWaterSource(householdToEdit.waterSource);
      setWasteManagement(householdToEdit.wasteManagement);
      setNotes(householdToEdit.notes || '');
    } else {
      // Default to village 1
      const defaultVil = villages[0] || { no: 1, name: 'บ้านสุขสมบูรณ์', centerLat: 18.7883, centerLng: 98.9853 };
      setHouseNo('');
      setVillageNo(defaultVil.no);
      setVillageName(defaultVil.name);
      setLatitude(defaultVil.centerLat + (Math.random() - 0.5) * 0.005);
      setLongitude(defaultVil.centerLng + (Math.random() - 0.5) * 0.005);
      setHeadOfHouseholdName('');
      setVhvMemberId(vhvMembers[0]?.id || '');
      setSanitationRating('good');
      setMosquitoLarvaFound(false);
      setWaterSource('ประปาหมู่บ้าน');
      setWasteManagement('คัดแยกขยะ');
      setNotes('');
    }
    setGeoError('');
  }, [householdToEdit, isOpen, villages, vhvMembers]);

  if (!isOpen) return null;

  const handleVillageChange = (no: number) => {
    setVillageNo(no);
    const found = villages.find((v) => v.no === no);
    if (found) {
      setVillageName(found.name);
      setSubdistrict(found.subdistrict);
      setDistrict(found.district);
      setProvince(found.province);
      if (!householdToEdit) {
        setLatitude(found.centerLat + (Math.random() - 0.5) * 0.005);
        setLongitude(found.centerLng + (Math.random() - 0.5) * 0.005);
      }
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('อุปกรณ์หรือเบราว์เซอร์ไม่รองรับ GPS');
      return;
    }
    setIsGettingLocation(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
        setIsGettingLocation(false);
      },
      (err) => {
        setGeoError(`ไม่สามารถดึงตำแหน่งได้: ${err.message}`);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseNo.trim()) {
      alert('กรุณากรอกบ้านเลขที่');
      return;
    }
    if (!headOfHouseholdName.trim()) {
      alert('กรุณากรอกชื่อเจ้าบ้านหรือหัวหน้าครอบครัว');
      return;
    }

    const payload: Household = {
      id: householdToEdit?.id || `house-${Date.now()}`,
      houseNo: houseNo.trim(),
      villageNo,
      villageName: villageName || `หมู่ที่ ${villageNo}`,
      subdistrict,
      district,
      province,
      latitude: Number(latitude),
      longitude: Number(longitude),
      headOfHouseholdName: headOfHouseholdName.trim(),
      vhvMemberId: vhvMemberId || (vhvMembers[0]?.id ?? 'vhv-1'),
      sanitationRating,
      mosquitoLarvaFound,
      waterSource,
      wasteManagement,
      notes: notes.trim(),
      createdAt: householdToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-200" />
            <h2 className="text-lg font-bold">
              {householdToEdit ? 'แก้ไขข้อมูลหลังคาเรือน' : 'เพิ่มหลังคาเรือนใหม่'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* House No & Village */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                บ้านเลขที่ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น 12/1 หรือ 45 หมู่ 1"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมู่ที่ <span className="text-rose-500">*</span>
              </label>
              <select
                value={villageNo}
                onChange={(e) => handleVillageChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                {villages.map((v) => (
                  <option key={v.id} value={v.no}>
                    หมู่ {v.no} {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Head of House & Assigned VHV */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อเจ้าบ้าน / หัวหน้าครอบครัว <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น นายประสิทธิ์ สุขเกษม"
                value={headOfHouseholdName}
                onChange={(e) => setHeadOfHouseholdName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                อสม. ผู้รับผิดชอบดูแล
              </label>
              <select
                value={vhvMemberId}
                onChange={(e) => setVhvMemberId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                {vhvMembers.map((vhv) => (
                  <option key={vhv.id} value={vhv.id}>
                    {vhv.name} ({vhv.zoneName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* GPS Coordinates & Current Location */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                พิกัดภูมิศาสตร์ (GIS Latitude & Longitude)
              </span>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{isGettingLocation ? 'กำลังดึงพิกัด...' : 'ใช้พิกัดปัจจุบัน (GPS)'}</span>
              </button>
            </div>

            {geoError && (
              <div className="text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{geoError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Latitude (ละติจูด)</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Longitude (ลองจิจูด)</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono"
                />
              </div>
            </div>
          </div>

          {/* Sanitation & Larva */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ระดับสุขาภิบาลของบ้าน
              </label>
              <select
                value={sanitationRating}
                onChange={(e) => setSanitationRating(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                <option value="good">ดี (ถูกสุขอนามัย น้ำระบายดี ไม่มีแหล่งเพาะพันธุ์เชื้อโรค)</option>
                <option value="fair">พอใช้ (มีของเหลือทิ้งหรือน้ำขังบางจุด)</option>
                <option value="poor">ต้องปรับปรุง (มีขยะสะสม น้ำท่วมขัง)</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="relative flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={mosquitoLarvaFound}
                  onChange={(e) => setMosquitoLarvaFound(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  ตรวจพบลูกน้ำยุงลาย (ดัชนี HI)
                </span>
              </label>
            </div>
          </div>

          {/* Water & Waste */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">แหล่งน้ำบริโภค</label>
              <input
                type="text"
                placeholder="เช่น ประปาหมู่บ้าน, บาดาล, น้ำถังกรอง"
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">การกำจัดขยะ</label>
              <input
                type="text"
                placeholder="เช่น ถังขยะเทศบาล, คัดแยกขยะเปียก/แห้ง"
                value={wasteManagement}
                onChange={(e) => setWasteManagement(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
            <textarea
              rows={2}
              placeholder="บันทึกสภาพความเป็นอยู่, สัตว์เลี้ยง, หรือข้อสังเกตของ อสม."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg outline-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{householdToEdit ? 'บันทึกการแก้ไข' : 'บันทึกหลังคาเรือน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
