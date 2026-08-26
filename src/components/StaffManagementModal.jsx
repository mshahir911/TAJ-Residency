import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Key,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Sparkles,
  Lock,
  ArrowLeft,
  Clock
} from 'lucide-react';

export default function StaffManagementModal({
  isOpen,
  onClose,
  staffList = [],
  onAddStaff,
  onRemoveStaff,
  onUpdateStaffPin,
  property
}) {
  // Esc key listener for back-navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('receptionist');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shift, setShift] = useState('Day Shift (06:00 - 14:00)');
  const [pin, setPin] = useState('2003');

  const [editingStaffId, setEditingStaffId] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (typeof onAddStaff === 'function') {
      onAddStaff({
        name,
        role,
        roleLabel: role === 'owner' ? 'Hotel Owner / GM' : (role === 'housekeeping' ? 'Housekeeping' : 'Receptionist (Shift Staff)'),
        email: email || `${name.toLowerCase().replace(/\s+/g, '')}@tajresidency.com`,
        phone,
        shift,
        pin,
        password: pin,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      });
    }

    setIsAdding(false);
    setName('');
    setEmail('');
    setPhone('');
    setSuccessMsg(`Created new staff login for ${name} (PIN: ${pin})`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleSavePin = (staffId) => {
    if (newPin.length >= 3 && typeof onUpdateStaffPin === 'function') {
      onUpdateStaffPin(staffId, newPin);
      setEditingStaffId(null);
      setNewPin('');
      setSuccessMsg('Staff PIN updated successfully.');
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  const handleDeleteStaff = (staff) => {
    if (staff.role === 'owner') return;
    if (window.confirm(`Are you sure you want to remove staff member ${staff.name}?`)) {
      if (typeof onRemoveStaff === 'function') {
        onRemoveStaff(staff.id);
        setSuccessMsg(`Removed staff member ${staff.name}`);
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border-0 sm:border border-brass/50 rounded-none sm:rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh]">
        {/* Header with Mobile Back Button & Safe Area */}
        <div className="shrink-0 p-3 sm:p-4 bg-panel border-b border-brass-soft/30 flex items-center justify-between pt-safe">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-ink hover:bg-panel text-brass hover:text-white border border-brass-soft/40 font-mono text-xs font-bold transition-all shrink-0 active:scale-95"
              title="Close modal"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ink border border-brass flex items-center justify-center text-brass shrink-0 hidden sm:flex">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-white text-sm sm:text-lg leading-tight truncate">
                Staff Admin & PINs
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                {property?.name || 'Taj Residency'} • Manage Access & PINs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {successMsg && (
            <div className="p-3 rounded-xl bg-signal-green/20 border border-signal-green/40 text-signal-green font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add Staff Button */}
          {!isAdding && (
            <div className="flex justify-between items-center">
              <span className="font-mono text-slate-400 text-[11px] uppercase">
                Active Staff Roster ({staffList.length} Team Members)
              </span>
              <button
                onClick={() => setIsAdding(true)}
                className="px-3 py-1.5 rounded-lg bg-brass text-ink font-bold font-mono text-xs flex items-center gap-1.5 shadow-md shadow-brass/20 hover:brightness-110"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Staff Member</span>
              </button>
            </div>
          )}

          {/* Add Staff Form */}
          {isAdding && (
            <form onSubmit={handleCreateStaff} className="p-4 bg-ink rounded-xl border border-brass space-y-3 font-sans">
              <div className="text-[11px] font-mono text-brass uppercase font-bold border-b border-brass-soft/30 pb-1">
                New Staff Onboarding & PIN Setup
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 block">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-bold text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 block">Assigned Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  >
                    <option value="receptionist">Receptionist (Front Desk Shift)</option>
                    <option value="housekeeping">Housekeeping (Lady Staff / Cleaner)</option>
                    <option value="owner">Hotel Owner / GM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 block">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98470..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 block">Assigned Shift Hours</label>
                  <input
                    type="text"
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 block">Login PIN *</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg bg-panel border border-brass-soft text-slate-300 font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-brass text-ink font-bold font-mono text-xs hover:brightness-110"
                >
                  Save & Issue PIN
                </button>
              </div>
            </form>
          )}

          {/* Staff List Table / Cards */}
          <div className="space-y-2">
            {staffList.map(staff => (
              <div
                key={staff.id}
                className="p-3.5 bg-ink rounded-xl border border-brass-soft/30 flex flex-wrap items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={staff.avatar}
                    alt={staff.name}
                    className="w-10 h-10 rounded-xl object-cover border border-brass-soft shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-white text-sm truncate">
                        {staff.name}
                      </span>
                      <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded ${
                        staff.role === 'owner'
                          ? 'bg-brass/20 text-brass'
                          : (staff.role === 'housekeeping' ? 'bg-blue-500/20 text-blue-400' : 'bg-signal-green/20 text-signal-green')
                      }`}>
                        {staff.roleLabel}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {staff.shift} • {staff.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  {editingStaffId === staff.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="New PIN"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="w-20 bg-panel border border-brass rounded px-2 py-1 text-white font-bold text-xs"
                      />
                      <button
                        onClick={() => handleSavePin(staff.id)}
                        className="px-2 py-1 rounded bg-brass text-ink font-bold text-xs"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 rounded bg-panel border border-brass-soft/40 text-slate-300 text-xs">
                        PIN: <strong className="text-brass">{staff.pin}</strong>
                      </div>
                      <button
                        onClick={() => {
                          setEditingStaffId(staff.id);
                          setNewPin(staff.pin);
                        }}
                        className="p-1.5 rounded-lg bg-panel hover:bg-ink text-slate-400 hover:text-white border border-brass-soft/30"
                        title="Reset PIN"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Delete button (non-owner only) */}
                  {staff.role !== 'owner' && (
                    <button
                      onClick={() => handleDeleteStaff(staff)}
                      className="p-1.5 rounded-lg bg-panel hover:bg-signal-red/20 text-slate-400 hover:text-signal-red border border-brass-soft/30 transition-colors"
                      title="Remove Staff Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
