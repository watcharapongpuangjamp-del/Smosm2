import React, { useState, useMemo } from 'react';
import {
  Home,
  Search,
  Plus,
  Filter,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit,
  Eye,
  Bug,
  Droplets,
  ExternalLink,
} from 'lucide-react';
import { Household, Person, VhvMember, Village } from '../types';

interface HouseholdsProps {
  households: Household[];
  persons: Person[];
  vhvMembers: VhvMember[];
  villages: Village[];
  selectedVillageNo: number;
  onAddHousehold: () => void;
  onEditHousehold: (household: Household) => void;
  onDeleteHousehold: (id: string) => void;
  onViewHouseholdDetail: (household: Household) => void;
  onOpenMapAtHousehold: (household: Household) => void;
}

export const Households: React.FC<HouseholdsProps> = ({
  households,
  persons,
  vhvMembers,
  villages,
  selectedVillageNo,
  onAddHousehold,
  onEditHousehold,
  onDeleteHousehold,
  onViewHouseholdDetail,
  onOpenMapAtHousehold,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLarva, setFilterLarva] = useState<'all' | 'found' | 'clean'>('all');
  const [filterSanitation, setFilterSanitation] = useState<'all' | 'good' | 'fair' | 'poor'>('all');

  const filteredHouseholds = useMemo(() => {
    return households.filter((h) => {
      // Village filter
      if (selectedVillageNo !== 0 && h.villageNo !== selectedVillageNo) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesNo = h.houseNo.toLowerCase().includes(term);
        const matchesHead = h.headOfHouseholdName.toLowerCase().includes(term);
        const matchesVillage = h.villageName.toLowerCase().includes(term);
        if (!matchesNo && !matchesHead && !matchesVillage) return false;
      }

      // Larva filter
      if (filterLarva === 'found' && !h.mosquitoLarvaFound) return false;
      if (filterLarva === 'clean' && h.mosquitoLarvaFound) return false;

      // Sanitation filter
      if (filterSanitation !== 'all' && h.sanitationRating !== filterSanitation) return false;

      return true;
    });
  }, [households, selectedVillageNo, searchTerm, filterLarva, filterSanitation]);

  const getVhvName = (id: string) => {
    const vhv = vhvMembers.find((v) => v.id === id);
    return vhv ? vhv.name : 'ยังไม่ได้ระบุ';
  };

  const getMemberCount = (householdId: string) => {
    return persons.filter((p) => p.householdId === householdId).length;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            ระบบจัดการหลังคาเรือน (Households)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            ข้อมูลพิกัด GIS, เจ้าบ้าน, อสม. ประจำบ้าน, สุขาภิบาล และการสำรวจลูกน้ำยุงลาย
          </p>
        </div>

        <button
          onClick={onAddHousehold}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มหลังคาเรือนใหม่</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาตามบ้านเลขที่, ชื่อเจ้าบ้าน, หรือชื่อหมู่บ้าน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Larva Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">ลูกน้ำยุงลาย:</span>
          <select
            value={filterLarva}
            onChange={(e) => setFilterLarva(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">ทั้งหมด</option>
            <option value="found">พบลูกน้ำยุงลาย ⚠️</option>
            <option value="clean">ไม่พบลูกน้ำ ✅</option>
          </select>
        </div>

        {/* Sanitation Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">สุขาภิบาล:</span>
          <select
            value={filterSanitation}
            onChange={(e) => setFilterSanitation(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">ทั้งหมด</option>
            <option value="good">ดี</option>
            <option value="fair">พอใช้</option>
            <option value="poor">ต้องปรับปรุง</option>
          </select>
        </div>
      </div>

      {/* Household Cards Grid */}
      {filteredHouseholds.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">ไม่พบบ้านเลขที่ตรงกับเงื่อนไข</h3>
          <p className="text-xs text-slate-500 mt-1">ลองเปลี่ยนคำค้นหา หรือกดปุ่มเพิ่มหลังคาเรือนใหม่</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHouseholds.map((house) => {
            const memberCount = getMemberCount(house.id);
            const vhvName = getVhvName(house.vhvMemberId);

            return (
              <div
                key={house.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-3">
                  {/* Top line: House No & Larva Warning */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">
                          บ้านเลขที่ {house.houseNo}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          หมู่ {house.villageNo}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {house.villageName} ต.{house.subdistrict} อ.{house.district}
                      </p>
                    </div>

                    {house.mosquitoLarvaFound ? (
                      <span
                        title="พบลูกน้ำยุงลาย! ต้องกำจัดแหล่งเพาะพันธุ์"
                        className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 animate-pulse"
                      >
                        <Bug className="w-3.5 h-3.5" />
                        <span>พบลูกน้ำ</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ปลอดลูกน้ำ</span>
                      </span>
                    )}
                  </div>

                  {/* Head of House & Members */}
                  <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1.5 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">เจ้าบ้าน:</span>
                      <span className="font-semibold text-slate-800">{house.headOfHouseholdName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">สมาชิกในบ้าน:</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {memberCount} คน
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">อสม. ผู้ดูแล:</span>
                      <span className="font-medium text-slate-700">{vhvName}</span>
                    </div>
                  </div>

                  {/* Sanitation & GPS summary */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <span>สุขาภิบาล:</span>
                      <span
                        className={`font-semibold ${
                          house.sanitationRating === 'good'
                            ? 'text-emerald-600'
                            : house.sanitationRating === 'fair'
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {house.sanitationRating === 'good'
                          ? 'ดี'
                          : house.sanitationRating === 'fair'
                          ? 'พอใช้'
                          : 'ต้องปรับปรุง'}
                      </span>
                    </span>

                    <button
                      onClick={() => onOpenMapAtHousehold(house)}
                      className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 hover:underline"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{house.latitude.toFixed(4)}, {house.longitude.toFixed(4)}</span>
                    </button>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onViewHouseholdDetail(house)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 py-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>สมาชิก & รายละเอียด</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditHousehold(house)}
                      title="แก้ไขข้อมูลหลังคาเรือน"
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-white rounded-md transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`ยืนยันการลบบ้านเลขที่ ${house.houseNo} หรือไม่?`)) {
                          onDeleteHousehold(house.id);
                        }
                      }}
                      title="ลบหลังคาเรือน"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
