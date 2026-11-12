import React, { useState, useEffect, useCallback } from 'react';
import { storage } from './services/storage';
import { Household, Person, HealthScreening, Village, VhvMember, Appointment } from './types';

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

export const App: React.FC = () => {
  // Navigation & Filter state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedVillageNo, setSelectedVillageNo] = useState<number>(0);

  // Data state
  const [villages, setVillages] = useState<Village[]>([]);
  const [vhvMembers, setVhvMembers] = useState<VhvMember[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [screenings, setScreenings] = useState<HealthScreening[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

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
  const loadData = useCallback(() => {
    setVillages(storage.getVillages());
    setVhvMembers(storage.getVhvMembers());
    setHouseholds(storage.getHouseholds());
    setPersons(storage.getPersons());
    setScreenings(storage.getScreenings());
    setAppointments(storage.getAppointments());
  }, []);

  useEffect(() => {
    loadData();
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

  const handleSaveHousehold = (household: Household) => {
    storage.saveHousehold(household);
    loadData();
  };

  const handleDeleteHousehold = (id: string) => {
    storage.deleteHousehold(id);
    loadData();
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

  const handleSavePerson = (person: Person) => {
    storage.savePerson(person);
    loadData();
  };

  const handleDeletePerson = (id: string) => {
    storage.deletePerson(id);
    loadData();
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

  const handleSaveScreening = (screening: HealthScreening) => {
    storage.saveScreening(screening);
    loadData();
  };

  // --- Reset Data ---
  const handleResetData = () => {
    storage.resetToDefault();
    loadData();
  };

  const handleClearData = () => {
    storage.clearAllData();
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
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
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
      />
    </div>
  );
};

export default App;
