import React, { useState, useEffect } from 'react';
import { usePMSStore } from './store/pmsStore';
import { useIsDesktop } from './hooks/useMediaQuery';
import TopHeader from './components/TopHeader';
import NavigationRail from './components/NavigationRail';
import MobileBottomNav from './components/MobileBottomNav';
import RoomGrid from './components/RoomGrid';
import HousekeepingBoard from './components/HousekeepingBoard';
import DailyCollectionsReport from './components/DailyCollectionsReport';
import GuestLookup from './components/GuestLookup';
import WalkInModal from './components/WalkInModal';
import FolioModal from './components/FolioModal';
import PaperInvoice from './components/PaperInvoice';
import GlobalSearchModal from './components/GlobalSearchModal';
import ShiftHandoverModal from './components/ShiftHandoverModal';
import WiFiVoucherModal from './components/WiFiVoucherModal';
import GuestSelfCheckinModal from './components/GuestSelfCheckinModal';
import AuditTrailView from './components/AuditTrailView';
import OwnerAnalyticsDashboard from './components/OwnerAnalyticsDashboard';
import ExpensePnLView from './components/ExpensePnLView';
import SeasonalOverrideModal from './components/SeasonalOverrideModal';
import PropertyOnboardingWizard from './components/PropertyOnboardingWizard';
import LoginScreen from './components/LoginScreen';
import StaffManagementModal from './components/StaffManagementModal';

export default function App() {
  const store = usePMSStore();
  const isDesktop = useIsDesktop();

  // Authentication State: Opens directly to Login Gate
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Tab Navigation: 'grid' | 'collections' | 'guests' | 'analytics' | 'pl' | 'overrides' | 'audit' | 'onboarding' | 'housekeeping'
  const [activeTab, setActiveTab] = useState('grid');

  // Modals state
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInSelectedRoom, setWalkInSelectedRoom] = useState(null);

  const [isFolioOpen, setIsFolioOpen] = useState(false);
  const [folioSelectedRoom, setFolioSelectedRoom] = useState(null);

  const [isPaperInvoiceOpen, setIsPaperInvoiceOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isWiFiModalOpen, setIsWiFiModalOpen] = useState(false);
  const [wiFiModalRoom, setWiFiModalRoom] = useState(null);
  const [wiFiModalBooking, setWiFiModalBooking] = useState(null);

  const [isSelfCheckinModalOpen, setIsSelfCheckinModalOpen] = useState(false);
  const [isSeasonalModalOpen, setIsSeasonalModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isStaffAdminOpen, setIsStaffAdminOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key.toLowerCase() === 'o' && store.currentRole === 'owner') {
        setActiveTab('analytics');
      } else if (e.key.toLowerCase() === 'p' && store.currentRole === 'owner') {
        setActiveTab('pl');
      } else if (e.key.toLowerCase() === 'r' && store.currentRole === 'owner') {
        setIsSeasonalModalOpen(true);
      } else if (e.key.toLowerCase() === 'w' && store.currentRole === 'owner') {
        setIsOnboardingModalOpen(true);
      } else if (e.key.toLowerCase() === 'g' && store.currentRole !== 'housekeeping') {
        setActiveTab('grid');
      } else if (e.key.toLowerCase() === 'd' && store.currentRole !== 'housekeeping') {
        setActiveTab('collections');
      } else if (e.key.toLowerCase() === 'u' && store.currentRole !== 'housekeeping') {
        setActiveTab('guests');
      } else if (e.key.toLowerCase() === 'h') {
        setActiveTab('housekeeping');
      } else if (e.key.toLowerCase() === 'a' && store.currentRole === 'owner') {
        setActiveTab('audit');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, store.currentRole]);

  // Adjust default view upon authentication based on role
  const handleAuthenticateStaff = (staff) => {
    store.actions.quickSwitchStaff(staff.id);
    setIsAuthenticated(true);
    if (staff.role === 'housekeeping') {
      setActiveTab('housekeeping');
    } else if (staff.role === 'owner') {
      setActiveTab('grid');
    } else {
      setActiveTab('grid');
    }
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
  };

  // HANDLERS
  const handleOpenWalkIn = (room = null) => {
    setWalkInSelectedRoom(room);
    setIsWalkInOpen(true);
  };

  const handleOpenCheckout = (room) => {
    setFolioSelectedRoom(room);
    setIsFolioOpen(true);
  };

  const handleOpenWiFi = (room, booking) => {
    setWiFiModalRoom(room);
    setWiFiModalBooking(booking);
    setIsWiFiModalOpen(true);
  };

  const handleMarkClean = (room) => {
    store.actions.advanceHousekeepingStatus(room.id, store.currentStaff.name);
  };

  const handleSaveBooking = (bookingData) => {
    const newBookingId = store.actions.createBooking({
      ...bookingData,
      created_by_staff_name: store.currentStaff.name
    });
    setIsWalkInOpen(false);
    return newBookingId;
  };

  const handleFinalizeCheckout = (roomId, paymentData) => {
    const generatedInvoice = store.actions.checkoutAndGenerateInvoice(roomId, {
      ...paymentData,
      billed_by_staff_name: store.currentStaff.name
    });
    setIsFolioOpen(false);
    if (generatedInvoice) {
      setCurrentInvoice(generatedInvoice);
      setIsPaperInvoiceOpen(true);
    }
  };

  // 1. If not authenticated, render the dedicated PIN keypad login gate
  if (!isAuthenticated) {
    return (
      <LoginScreen
        staffList={store.staffList}
        onAuthenticateStaff={handleAuthenticateStaff}
        property={store.property}
      />
    );
  }

  // 2. Authenticated Real Application
  return (
    <div className="min-h-screen bg-ink text-slate-200 flex flex-col font-sans selection:bg-brass selection:text-ink">
      <div className="flex flex-1 min-h-0">

        {/* Conditional Component Swapping: Sidebar renders ONLY on Desktop (>=768px) */}
        {isDesktop && (
          <NavigationRail
            activeTab={activeTab}
            setActiveTab={(tab) => {
              if (tab === 'shift') {
                setIsShiftModalOpen(true);
              } else if (tab === 'self-checkin') {
                setIsSelfCheckinModalOpen(true);
              } else if (tab === 'overrides') {
                setIsSeasonalModalOpen(true);
              } else if (tab === 'onboarding') {
                setIsOnboardingModalOpen(true);
              } else {
                setActiveTab(tab);
              }
            }}
            onOpenWalkIn={() => handleOpenWalkIn(null)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenStaffAdmin={() => setIsStaffAdminOpen(true)}
            onSignOut={handleSignOut}
            dirtyCount={store.stats.dirtyRooms}
            property={store.property}
            currentStaff={store.currentStaff}
            currentRole={store.currentRole}
          />
        )}

        {/* Scrollable Desk Surface */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header */}
          <TopHeader
            property={store.property}
            properties={store.properties}
            activePropertyId={store.activePropertyId}
            onSwitchProperty={store.actions.switchProperty}
            onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
            isOnline={store.isOnline}
            stats={store.stats}
            onOpenWalkIn={() => handleOpenWalkIn(null)}
            onOpenShiftHandover={() => setIsShiftModalOpen(true)}
            currentShift={store.currentShift}
            currentRole={store.currentRole}
          />

          {/* Main Body (pb-24 on mobile to prevent bottom nav collision, pb-6 on desktop) */}
          <main className="p-3 sm:p-6 pb-24 sm:pb-6 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6 flex-1">
            {/* 1. ROOM GRID (11 ROOMS) */}
            {activeTab === 'grid' && store.currentRole !== 'housekeeping' && (
              <RoomGrid
                rooms={store.rooms}
                bookings={store.bookings}
                guests={store.guests}
                stats={store.stats}
                onNewBooking={handleOpenWalkIn}
                onCheckout={handleOpenCheckout}
                onMarkClean={handleMarkClean}
                onOpenWiFi={handleOpenWiFi}
                onExtendStay={store.actions.extendBookingStay}
              />
            )}

            {/* 2. HOUSEKEEPING BOARD */}
            {activeTab === 'housekeeping' && (
              <HousekeepingBoard
                rooms={store.rooms}
                onAdvanceStatus={store.actions.advanceHousekeepingStatus}
                staffName={store.currentStaff.name}
              />
            )}

            {/* 3. DAILY COLLECTIONS REPORT */}
            {activeTab === 'collections' && store.currentRole !== 'housekeeping' && (
              <DailyCollectionsReport
                invoices={store.invoices}
                stats={store.stats}
                gstConfig={store.gstConfig}
                onUpdateGST={store.actions.updateGSTConfig}
                property={store.property}
                canEditRates={store.roleConfig.canEditRates}
              />
            )}

            {/* 4. GUEST DIRECTORY */}
            {activeTab === 'guests' && store.currentRole !== 'housekeeping' && (
              <GuestLookup
                guests={store.guests}
                bookings={store.bookings}
                rooms={store.rooms}
                onBookReturningGuest={(g) => {
                  handleOpenWalkIn(null);
                }}
              />
            )}

            {/* 5. OWNER ANALYTICS & YIELD (OWNER ONLY) */}
            {activeTab === 'analytics' && store.currentRole === 'owner' && (
              <OwnerAnalyticsDashboard
                stats={store.stats}
                property={store.property}
                heatmapData={store.heatmapData}
                seasonalOverrides={store.seasonalOverrides}
                onOpenOverrides={() => setIsSeasonalModalOpen(true)}
                onOpenExpenses={() => setActiveTab('pl')}
                onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
              />
            )}

            {/* 6. MONTHLY P&L & EXPENSE LEDGER (OWNER ONLY) */}
            {activeTab === 'pl' && store.currentRole === 'owner' && (
              <ExpensePnLView
                expenses={store.expenses}
                stats={store.stats}
                onAddExpense={store.actions.addExpense}
                property={store.property}
              />
            )}

            {/* 7. OPERATIONS AUDIT TRAIL (OWNER ONLY) */}
            {activeTab === 'audit' && store.currentRole === 'owner' && (
              <AuditTrailView
                auditLogs={store.auditLogs}
                property={store.property}
              />
            )}
          </main>
        </div>
      </div>

      {/* Conditional Component Swapping: Mobile Bottom Navigation renders ONLY on Mobile (<768px) */}
      {!isDesktop && (
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'shift') {
              setIsShiftModalOpen(true);
            } else if (tab === 'self-checkin') {
              setIsSelfCheckinModalOpen(true);
            } else if (tab === 'overrides') {
              setIsSeasonalModalOpen(true);
            } else if (tab === 'onboarding') {
              setIsOnboardingModalOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          onOpenWalkIn={() => handleOpenWalkIn(null)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenStaffAdmin={() => setIsStaffAdminOpen(true)}
          onSignOut={handleSignOut}
          dirtyCount={store.stats.dirtyRooms}
          property={store.property}
          currentStaff={store.currentStaff}
          currentRole={store.currentRole}
        />
      )}

      {/* MODALS */}

      {/* 1. Fast Walk-In Modal */}
      <WalkInModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        rooms={store.rooms}
        selectedRoom={walkInSelectedRoom}
        onSaveBooking={handleSaveBooking}
        onLookupPhone={store.actions.findGuestByPhone}
        onCalculateGST={store.actions.calculateGST}
        getRateForRoom={store.actions.getRateForRoom}
      />

      {/* 2. Folio & Checkout Modal */}
      <FolioModal
        isOpen={isFolioOpen}
        onClose={() => setIsFolioOpen(false)}
        room={folioSelectedRoom}
        bookings={store.bookings}
        guests={store.guests}
        property={store.property}
        calculateGST={store.actions.calculateGST}
        onFinalizeCheckout={handleFinalizeCheckout}
        onExtendStay={store.actions.extendBookingStay}
        onPreviewInvoice={(inv) => {
          setCurrentInvoice(inv);
          setIsPaperInvoiceOpen(true);
        }}
      />

      {/* 3. Paper Palette Tax Invoice Modal (#F2EFE6) */}
      <PaperInvoice
        isOpen={isPaperInvoiceOpen}
        onClose={() => setIsPaperInvoiceOpen(false)}
        invoice={currentInvoice}
        property={store.property}
        gstConfig={store.gstConfig}
      />

      {/* 4. Global Search Modal (⌘K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        rooms={store.rooms}
        guests={store.guests}
        bookings={store.bookings}
        onSelectRoom={(room) => {
          setIsSearchOpen(false);
          setActiveTab('grid');
          if (room.status === 'vacant') {
            handleOpenWalkIn(room);
          } else if (room.status === 'occupied') {
            handleOpenCheckout(room);
          }
        }}
      />

      {/* 5. Shift Handover & Cash Reconciliation Modal */}
      <ShiftHandoverModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        currentShift={store.currentShift}
        shiftLogs={store.shiftLogs}
        stats={store.stats}
        onCloseShiftHandover={store.actions.closeShiftHandover}
        property={store.property}
      />

      {/* 6. WiFi Voucher Pass Modal */}
      <WiFiVoucherModal
        isOpen={isWiFiModalOpen}
        onClose={() => setIsWiFiModalOpen(false)}
        room={wiFiModalRoom}
        booking={wiFiModalBooking}
        property={store.property}
      />

      {/* 7. Guest Self-Checkin QR Modal */}
      <GuestSelfCheckinModal
        isOpen={isSelfCheckinModalOpen}
        onClose={() => setIsSelfCheckinModalOpen(false)}
        selfCheckins={store.selfCheckins}
        onConfirmSelfCheckin={store.actions.confirmSelfCheckin}
        onAddSelfCheckin={store.actions.addGuestSelfCheckin}
        rooms={store.rooms}
        property={store.property}
      />

      {/* 8. Seasonal & Dynamic Rate Override Modal */}
      <SeasonalOverrideModal
        isOpen={isSeasonalModalOpen}
        onClose={() => setIsSeasonalModalOpen(false)}
        seasonalOverrides={store.seasonalOverrides}
        onAddOverride={store.actions.addSeasonalOverride}
        onDeleteOverride={store.actions.deleteSeasonalOverride}
        roomTypes={store.roomTypes}
        property={store.property}
      />

      {/* 9. Property Onboarding Setup Wizard */}
      <PropertyOnboardingWizard
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onCompleteOnboarding={(propData) => {
          const newPropId = store.actions.onboardNewProperty(propData);
          setActiveTab('grid');
        }}
      />

      {/* 10. Staff Admin & PIN Management Modal (Owner Only) */}
      <StaffManagementModal
        isOpen={isStaffAdminOpen}
        onClose={() => setIsStaffAdminOpen(false)}
        staffList={store.staffList}
        onAddStaff={(staffData) => { }}
        onUpdateStaffPin={(staffId, newPin) => { }}
        property={store.property}
      />
    </div>
  );
}
