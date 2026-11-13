import React, { useState, useEffect, useCallback } from 'react';
import { storage } from './services/storage';
import { Household, Person, HealthScreening, Village, VhvMember, Appointment, Tombstone, AuditLog } from './types';

import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Households } from './components/Households';
import { HouseholdModal } from './components/HouseholdModal';
import { HouseholdDetailModal } from './components/HouseholdDetailModal';
import { Persons } from './components/Persons';
import { PersonModal } from './components/PersonModal';
import { HealthScreeningModal } from './components/HealthScreeningModal';
import { PersonalAppointmentModal } from './components/PersonalAppointmentModal';
import { CommunityMap } from './components/CommunityMap';
import { VhvDirectory } from './components/VhvDirectory';
import { HealthKnowledge } from './components/HealthKnowledge';
import { DataExchangeModal } from './components/DataExchangeModal';
import { SyncSettingsModal } from './components/SyncSettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { BottomNav } from './components/BottomNav';
import { useSwipe } from './hooks/useSwipe';
import { PWAUpdateBanner } from './components/PWAUpdateBanner';

export const App: React.FC = () => {
  // Navigation & Filter state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedVillageNo, setSelectedVillageNo] = useState<number>(0);
  const [displayMode, setDisplayMode] = useState<'auto' | 'pc' | 'tablet' | 'mobile'>('auto');

  const getContainerClass = () => {
    if (displayMode === 'mobile') {
      return 'max-w-sm mx-auto my-6 border-[14px] border-slate-900 rounded-[48px] shadow-2xl bg-white overflow-hidden flex flex-col relative h-[860px] overflow-y-auto';
    }
    if (displayMode === 'tablet') {
      return 'max-w-4xl mx-auto my-6 shadow-2xl rounded-2xl bg-white border border-slate-300 overflow-hidden flex flex-col max-h-[92vh] overflow-y-auto';
    }
    if (displayMode === 'pc') {
      return 'max-w-[1600px] w-full mx-auto flex flex-col min-h-screen bg-slate-50';
    }
    return 'min-h-screen bg-slate-50 flex flex-col text-slate-800';
  };

  const tabList = ['dashboard', 'households', 'persons', 'map', 'vhv', 'knowledge'];
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      const currentIndex = tabList.indexOf(currentTab);
      if (currentIndex !== -1 && currentIndex < tabList.length - 1) {
        setMapFocusedHousehold(null);
        setCurrentTab(tabList[currentIndex + 1]);
      }
    },
    onSwipeRight: () => {
      const currentIndex = tabList.indexOf(currentTab);
      if (currentIndex > 0) {
        setMapFocusedHousehold(null);
        setCurrentTab(tabList[currentIndex - 1]);
      }
    },
    threshold: 50,
  });

  // Data state
  const [isInitializing, setIsInitializing] = useState(true);
  const [villages, setVillages] = useState<Village[]>([]);
  const [vhvMembers, setVhvMembers] = useState<VhvMember[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [screenings, setScreenings] = useState<HealthScreening[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tombstones, setTombstones] = useState<Tombstone[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modal states
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [householdToEdit, setHouseholdToEdit] = useState<Household | null>(null);

  const [isHouseholdDetailOpen, setIsHouseholdDetailOpen] = useState(false);
  const [selectedHouseholdForDetail, setSelectedHouseholdForDetail] = useState<Household | null>(null);

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [defaultHouseholdIdForPerson, setDefaultHouseholdIdForPerson] = useState<string | undefined>(undefined);

  const [isScreeningModalOpen, setIsScreeningModalOpen] = useState(false);
  const [personForScreening, setPersonForScreening] = useState<Person | null>(null);

  const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState(false);
  const [personForAppointments, setPersonForAppointments] = useState<Person | null>(null);

  const [isDataExchangeOpen, setIsDataExchangeOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Map focus helper
  const [mapFocusedHousehold, setMapFocusedHousehold] = useState<Household | null>(null);

  // Load / Reload all data
  const loadData = useCallback(async () => {
    const [v, vhv, h, p, s, a, t, logs] = await Promise.all([
      storage.getVillages(),
      storage.getVhvMembers(),
      storage.getHouseholds(),
      storage.getPersons(),
      storage.getScreenings(),
      storage.getAppointments(),
      storage.getTombstones(),
      storage.getAuditLogs(),
    ]);
    setVillages(v);
    setVhvMembers(vhv);
    setHouseholds(h);
    setPersons(p);
    setScreenings(s);
    setAppointments(a);
    setTombstones(t);
    setAuditLogs(logs);
  }, []);

  useEffect(() => {
    const init = async () => {
      await storage.init();
      await loadData();
      setIsInitializing(false);

    };
    init();
  }, [loadData]);

  // --- Handlers: Household ---
  const handleOpenAddHousehold = () => {
    setHouseholdToEdit(null);
    setIsHouseholdModalOpen(true);
  };

  const handleOpenAddHouseholdAtCoords = (lat: number, lng: number) => {
    setHouseholdToEdit({
      id: '',
      houseNo: '',
      villageNo: selectedVillageNo === 0 ? 1 : selectedVillageNo,
      villageName: `หมู่ที่ ${selectedVillageNo === 0 ? 1 : selectedVillageNo}`,
      subdistrict: 'ตำบลสุขภาพดี',
      district: 'อำเภอเมือง',
      province: 'เชียงใหม่',
      latitude: lat,
      longitude: lng,
      headOfHouseholdName: '',
      vhvMemberId: vhvMembers[0]?.id || 'vhv-1',
      sanitationRating: 'good',
      mosquitoLarvaFound: false,
      waterSource: 'ประปาหมู่บ้าน',
      wasteManagement: 'คัดแยกขยะ',
      createdAt: '',
      updatedAt: '',
    });
    setIsHouseholdModalOpen(true);
  };

  const handleEditHousehold = (household: Household) => {
    setHouseholdToEdit(household);
    setIsHouseholdModalOpen(true);
  };

  const handleSaveHousehold = async (household: Household) => {
    await storage.saveHousehold(household);
    await loadData();
  };

  const handleDeleteHousehold = async (id: string) => {
    await storage.deleteHousehold(id);
    await loadData();
  };

  const handleViewHouseholdDetail = (household: Household) => {
    setSelectedHouseholdForDetail(household);
    setIsHouseholdDetailOpen(true);
  };

  const handleOpenMapAtHousehold = (household: Household) => {
    setMapFocusedHousehold(household);
    setCurrentTab('map');
  };

  // --- Handlers: Person ---
  const handleOpenAddPerson = (householdId?: string) => {
    setPersonToEdit(null);
    setDefaultHouseholdIdForPerson(householdId);
    setIsPersonModalOpen(true);
  };

  const handleEditPerson = (person: Person) => {
    setPersonToEdit(person);
    setDefaultHouseholdIdForPerson(person.householdId);
    setIsPersonModalOpen(true);
  };

  const handleSavePerson = async (person: Person) => {
    await storage.savePerson(person);
    await loadData();
  };

  const handleDeletePerson = async (id: string) => {
    await storage.deletePerson(id);
    await loadData();
  };

  // --- Handlers: Appointments ---
  const handleOpenAppointments = (person: Person) => {
    setPersonForAppointments(person);
    setIsAppointmentsModalOpen(true);
  };

  // --- Handlers: Screening ---
  const handleOpenScreening = (person: Person) => {
    setPersonForScreening(person);
    setIsScreeningModalOpen(true);
  };

  const handleSaveScreening = async (screening: HealthScreening) => {
    await storage.saveScreening(screening);
    await loadData();
  };

  // --- Reset Data ---
  const handleResetData = async () => {
    await storage.resetToDefault();
    await loadData();
  };

  const handleClearData = async () => {
    await storage.clearAllData();
    window.location.reload();
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium animate-pulse">กำลังเริ่มต้นฐานข้อมูล SQLite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={getContainerClass()}>
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setMapFocusedHousehold(null);
          setCurrentTab(tab);
        }}
        villages={villages}
        selectedVillageNo={selectedVillageNo}
        onVillageChange={setSelectedVillageNo}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenDataExchange={() => setIsDataExchangeOpen(true)}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
      />

      {/* Main Container */}
      <main {...swipeHandlers} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            households={households}
            persons={persons}
            screenings={screenings}
            villages={villages}
            selectedVillageNo={selectedVillageNo}
            appointments={appointments}
            vhvMembers={vhvMembers}
            onNavigateTab={setCurrentTab}
            onOpenAddHousehold={handleOpenAddHousehold}
            onOpenAddPerson={() => handleOpenAddPerson()}
            onOpenScreening={handleOpenScreening}
            onOpenAppointments={handleOpenAppointments}
          />
        )}

        {currentTab === 'households' && (
          <Households
            households={households}
            persons={persons}
            vhvMembers={vhvMembers}
            villages={villages}
            selectedVillageNo={selectedVillageNo}
            onAddHousehold={handleOpenAddHousehold}
            onEditHousehold={handleEditHousehold}
            onDeleteHousehold={handleDeleteHousehold}
            onViewHouseholdDetail={handleViewHouseholdDetail}
            onOpenMapAtHousehold={handleOpenMapAtHousehold}
          />
        )}

        {currentTab === 'persons' && (
          <Persons
            persons={persons}
            households={households}
            villages={villages}
            selectedVillageNo={selectedVillageNo}
            onAddPerson={() => handleOpenAddPerson()}
            onEditPerson={handleEditPerson}
            onDeletePerson={handleDeletePerson}
            onOpenScreening={handleOpenScreening}
            onOpenAppointments={handleOpenAppointments}
          />
        )}

        {currentTab === 'map' && (
          <CommunityMap
            households={households}
            persons={persons}
            villages={villages}
            vhvMembers={vhvMembers}
            selectedVillageNo={selectedVillageNo}
            focusedHousehold={mapFocusedHousehold}
            onViewHouseholdDetail={handleViewHouseholdDetail}
            onAddHouseholdAtCoords={handleOpenAddHouseholdAtCoords}
          />
        )}

        {currentTab === 'vhv' && (
          <VhvDirectory
            vhvMembers={vhvMembers}
            households={households}
            persons={persons}
            screenings={screenings}
            villages={villages}
            selectedVillageNo={selectedVillageNo}
          />
        )}

        {currentTab === 'knowledge' && <HealthKnowledge />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>Smart OSM Next • ระบบสารสนเทศสุขภาพชุมชนและการจัดการงาน อสม.</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          เชื่อมโยงข้อมูลปฐมภูมิ • มาตรฐานกระทรวงสาธารณสุข • พร้อมระบบทำงานออฟไลน์ (Offline-First)
        </p>
      </footer>

      {/* Household Modal (Add/Edit) */}
      <HouseholdModal
        isOpen={isHouseholdModalOpen}
        householdToEdit={householdToEdit}
        villages={villages}
        vhvMembers={vhvMembers}
        onClose={() => setIsHouseholdModalOpen(false)}
        onSave={handleSaveHousehold}
      />

      {/* Household Detail Modal */}
      <HouseholdDetailModal
        isOpen={isHouseholdDetailOpen}
        household={selectedHouseholdForDetail}
        persons={persons}
        vhvMembers={vhvMembers}
        onClose={() => setIsHouseholdDetailOpen(false)}
        onAddMember={(hId) => {
          setIsHouseholdDetailOpen(false);
          handleOpenAddPerson(hId);
        }}
        onEditMember={(p) => {
          setIsHouseholdDetailOpen(false);
          handleEditPerson(p);
        }}
        onDeleteMember={handleDeletePerson}
        onScreenMember={(p) => {
          setIsHouseholdDetailOpen(false);
          handleOpenScreening(p);
        }}
        onOpenAppointments={(p) => {
          setIsHouseholdDetailOpen(false);
          handleOpenAppointments(p);
        }}
      />

      {/* Person Modal (Add/Edit) */}
      <PersonModal
        isOpen={isPersonModalOpen}
        personToEdit={personToEdit}
        defaultHouseholdId={defaultHouseholdIdForPerson}
        households={households}
        villages={villages}
        onClose={() => setIsPersonModalOpen(false)}
        onSave={handleSavePerson}
      />

      {/* Health Screening Modal */}
      <HealthScreeningModal
        isOpen={isScreeningModalOpen}
        person={personForScreening}
        household={
          personForScreening
            ? households.find((h) => h.id === personForScreening.householdId)
            : null
        }
        vhvMembers={vhvMembers}
        onClose={() => setIsScreeningModalOpen(false)}
        onSave={handleSaveScreening}
      />

      {/* Personal Appointment Modal */}
      <PersonalAppointmentModal
        isOpen={isAppointmentsModalOpen}
        person={personForAppointments}
        household={
          personForAppointments
            ? households.find((h) => h.id === personForAppointments.householdId)
            : null
        }
        vhvMembers={vhvMembers}
        onClose={() => {
          setIsAppointmentsModalOpen(false);
          setPersonForAppointments(null);
        }}
        onAppointmentsChange={loadData}
      />

      {/* Data Exchange Modal (Excel / JSON) */}
      <DataExchangeModal
        isOpen={isDataExchangeOpen}
        onClose={() => setIsDataExchangeOpen(false)}
        onDataReload={loadData}
      />

      {/* Sync Settings Modal */}
      <SyncSettingsModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onResetData={handleResetData}
        onClearData={handleClearData}
        households={households}
        persons={persons}
        screenings={screenings}
        tombstones={tombstones}
        logs={auditLogs}
      />

      {/* PWA Service Worker Update Banner */}
      <PWAUpdateBanner />

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          setMapFocusedHousehold(null);
          setCurrentTab(tab);
        }}
      />
    </div>
  );
};

export default App;
