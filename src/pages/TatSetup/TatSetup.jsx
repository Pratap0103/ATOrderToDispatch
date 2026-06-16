import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Clock, Plus, Trash2, Edit, Sliders } from 'lucide-react';
import { TabSwitcher } from '../../components/StandardButtons';
import ModalForm from '../../components/ModalForm';
import CustomDropdown from '../../components/CustomDropdown';

const STANDARD_TAT_IDS = [
  'tat-1', 'tat-2', 'tat-3', 'tat-4', 'tat-5', 'tat-6', 'tat-7', 'tat-8', 'tat-9',
  'tat-10', 'tat-11', 'tat-12', 'tat-13', 'tat-14', 'tat-15', 'tat-16', 'tat-17', 'tat-18'
];

const STAGE_NAME_OPTIONS = [
  { value: 'Order', label: 'Order' },
  { value: 'Metal Issue', label: 'Metal Issue' },

  { value: 'QC1', label: 'QC1' },
  { value: 'Ghat Jama', label: 'Ghat Jama' },
  { value: 'Meena Inhouse', label: 'Meena Inhouse' },
  { value: 'Meena Outside', label: 'Meena Outside' },
  { value: 'Polish Inhouse', label: 'Polish Inhouse' },
  { value: 'Polish Outside', label: 'Polish Outside' },
  { value: 'Bangle Polish', label: 'Bangle Polish' },
  { value: 'E-Polish', label: 'E-Polish' },
  { value: 'QC2', label: 'QC2' },
  { value: 'Dispatch', label: 'Dispatch' },
  { value: 'RD (Receipt Department)', label: 'RD (Receipt Department)' },
  { value: 'QC3', label: 'QC3' },
  { value: 'HUID/Label', label: 'HUID/Label' },
  { value: 'Receive In Stock', label: 'Receive In Stock' },
  { value: 'Delivery', label: 'Delivery' },
  { value: 'CUSTOM', label: 'Other / Custom Stage...' }
];

const formatTatDuration = (value, type) => {
  const valNum = Number(value) || 0;
  if (type === 'day') {
    return `${valNum} ${valNum === 1 ? 'Day' : 'Days'}`;
  }
  if (type === 'hours') {
    const totalSeconds = Math.round(valNum * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    let parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);
    return parts.length > 0 ? parts.join(' ') : '0h';
  }
  if (type === 'minute') {
    const totalSeconds = Math.round(valNum * 60);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    let parts = [];
    if (m > 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);
    return parts.length > 0 ? parts.join(' ') : '0m';
  }
  return `${valNum}`;
};

const getTatFormFromStage = (stage) => {
  const val = Number(stage.value) || 0;
  const type = stage.type || 'day';
  
  let days = '1';
  let hours = '0';
  let minutes = '0';
  let seconds = '0';
  
  if (type === 'day') {
    days = String(val);
  } else if (type === 'hours') {
    const totalSeconds = Math.round(val * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    hours = String(h);
    minutes = String(m);
    seconds = String(s);
  } else if (type === 'minute') {
    const totalSeconds = Math.round(val * 60);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    minutes = String(m);
    seconds = String(s);
  }
  
  return {
    stageName: stage.stageName || '',
    type,
    days,
    hours,
    minutes,
    seconds
  };
};

const getStageValueFromForm = (form) => {
  const type = form.type;
  if (type === 'day') {
    return Math.max(0, parseFloat(form.days) || 0);
  }
  if (type === 'hours') {
    const h = Math.max(0, parseInt(form.hours, 10) || 0);
    const m = Math.max(0, parseInt(form.minutes, 10) || 0);
    const s = Math.max(0, parseInt(form.seconds, 10) || 0);
    const totalSeconds = h * 3600 + m * 60 + s;
    return totalSeconds / 3600;
  }
  if (type === 'minute') {
    const m = Math.max(0, parseInt(form.minutes, 10) || 0);
    const s = Math.max(0, parseInt(form.seconds, 10) || 0);
    const totalSeconds = m * 60 + s;
    return totalSeconds / 60;
  }
  return 0;
};

const TatSetup = () => {
  const [activeTab, setActiveTab] = useState('shift'); // 'shift', 'tat'
  const [shifts, setShifts] = useState([]);
  const [tatStages, setTatStages] = useState([]);

  // Modal control for adding/editing shift
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [shiftForm, setShiftForm] = useState({
    name: '',
    startTime: '09:00',
    endTime: '18:00',
    isDefault: 'No'
  });

  // Modal control for adding/editing TAT
  const [isTatModalOpen, setIsTatModalOpen] = useState(false);
  const [editingTatStage, setEditingTatStage] = useState(null);
  const [customStageText, setCustomStageText] = useState('');
  const [tatForm, setTatForm] = useState({
    stageName: '',
    type: 'day',
    days: '1',
    hours: '0',
    minutes: '0',
    seconds: '0'
  });

  // Load configuration from local storage
  useEffect(() => {
    const savedShifts = localStorage.getItem('companyShiftsDataV3');
    if (savedShifts) {
      setShifts(JSON.parse(savedShifts));
    } else {
      const defaultShifts = [
        { id: 'shift-1', name: 'General Shift', startTime: '09:00', endTime: '18:00', isDefault: 'Yes' }
      ];
      setShifts(defaultShifts);
      localStorage.setItem('companyShiftsDataV3', JSON.stringify(defaultShifts));
    }

    const savedTats = localStorage.getItem('tatSetupDataV3');
    if (savedTats) {
      const parsedTats = JSON.parse(savedTats).filter(t => t.stageName !== 'Follow Up');
      setTatStages(parsedTats);
      localStorage.setItem('tatSetupDataV3', JSON.stringify(parsedTats));
    } else {
      const defaultTats = [
        { id: 'tat-1', stageName: 'Order', value: 1, type: 'day' },
        { id: 'tat-2', stageName: 'Metal Issue', value: 2, type: 'day' },

        { id: 'tat-4', stageName: 'QC1', value: 1, type: 'day' },
        { id: 'tat-5', stageName: 'Ghat Jama', value: 1, type: 'day' },
        { id: 'tat-6', stageName: 'Meena Inhouse', value: 1, type: 'day' },
        { id: 'tat-7', stageName: 'Meena Outside', value: 2, type: 'day' },
        { id: 'tat-8', stageName: 'Polish Inhouse', value: 1, type: 'day' },
        { id: 'tat-9', stageName: 'Polish Outside', value: 2, type: 'day' },
        { id: 'tat-10', stageName: 'Bangle Polish', value: 1, type: 'day' },
        { id: 'tat-11', stageName: 'E-Polish', value: 1, type: 'day' },
        { id: 'tat-12', stageName: 'QC2', value: 1, type: 'day' },
        { id: 'tat-13', stageName: 'Dispatch', value: 1, type: 'day' },
        { id: 'tat-14', stageName: 'RD (Receipt Department)', value: 1, type: 'day' },
        { id: 'tat-15', stageName: 'QC3', value: 1, type: 'day' },
        { id: 'tat-16', stageName: 'HUID/Label', value: 1, type: 'day' },
        { id: 'tat-17', stageName: 'Receive In Stock', value: 1, type: 'day' },
        { id: 'tat-18', stageName: 'Delivery', value: 1, type: 'day' }
      ];
      setTatStages(defaultTats);
      localStorage.setItem('tatSetupDataV3', JSON.stringify(defaultTats));
    }
  }, []);

  // ── SHIFT FUNCTIONS ───────────────────────────────────────
  const handleOpenShiftModal = (shift = null) => {
    if (shift) {
      setEditingShift(shift);
      setShiftForm({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        isDefault: shift.isDefault
      });
    } else {
      setEditingShift(null);
      setShiftForm({
        name: '',
        startTime: '09:00',
        endTime: '18:00',
        isDefault: shifts.length === 0 ? 'Yes' : 'No'
      });
    }
    setIsShiftModalOpen(true);
  };

  const handleSaveShift = (e) => {
    e.preventDefault();
    if (!shiftForm.name.trim()) {
      toast.error('Shift Name is required');
      return;
    }

    let updatedShifts;
    if (editingShift) {
      updatedShifts = shifts.map(s => {
        if (s.id === editingShift.id) {
          return { ...s, ...shiftForm };
        }
        if (shiftForm.isDefault === 'Yes') {
          return { ...s, isDefault: 'No' };
        }
        return s;
      });
    } else {
      const newShift = {
        id: `shift-${Date.now()}`,
        ...shiftForm
      };
      
      if (newShift.isDefault === 'Yes') {
        updatedShifts = shifts.map(s => ({ ...s, isDefault: 'No' })).concat(newShift);
      } else {
        updatedShifts = [...shifts, newShift];
      }
    }

    if (updatedShifts.length > 0 && !updatedShifts.some(s => s.isDefault === 'Yes')) {
      updatedShifts[0].isDefault = 'Yes';
    }

    setShifts(updatedShifts);
    localStorage.setItem('companyShiftsDataV3', JSON.stringify(updatedShifts));
    
    // Dispatch event to notify other components to re-fetch
    window.dispatchEvent(new Event('companyShiftsUpdated'));

    toast.success(editingShift ? 'Shift updated successfully' : 'Shift added successfully');
    setIsShiftModalOpen(false);
  };

  const handleDeleteShift = (id) => {
    const shiftToDelete = shifts.find(s => s.id === id);
    if (shiftToDelete?.isDefault === 'Yes' && shifts.length > 1) {
      toast.error('Cannot delete the default shift. Please mark another shift as default first.');
      return;
    }

    const updated = shifts.filter(s => s.id !== id);
    if (updated.length > 0 && !updated.some(s => s.isDefault === 'Yes')) {
      updated[0].isDefault = 'Yes';
    }

    setShifts(updated);
    localStorage.setItem('companyShiftsDataV3', JSON.stringify(updated));
    window.dispatchEvent(new Event('companyShiftsUpdated'));
    toast.success('Shift deleted successfully');
  };

  // ── TAT STAGES FUNCTIONS ──────────────────────────────────
  const handleOpenTatModal = (stage = null) => {
    if (stage) {
      setEditingTatStage(stage);
      const initialForm = getTatFormFromStage(stage);
      const isStandardOption = STAGE_NAME_OPTIONS.some(o => o.value === initialForm.stageName && o.value !== 'CUSTOM');
      if (!isStandardOption) {
        setCustomStageText(initialForm.stageName);
        initialForm.stageName = 'CUSTOM';
      } else {
        setCustomStageText('');
      }
      setTatForm(initialForm);
    } else {
      setEditingTatStage(null);
      setCustomStageText('');
      setTatForm({
        stageName: '',
        type: 'day',
        days: '1',
        hours: '0',
        minutes: '0',
        seconds: '0'
      });
    }
    setIsTatModalOpen(true);
  };

  const handleSaveTat = (e) => {
    e.preventDefault();
    
    let resolvedStageName = tatForm.stageName;
    if (resolvedStageName === 'CUSTOM') {
      resolvedStageName = customStageText.trim();
    }

    if (!resolvedStageName || !resolvedStageName.trim()) {
      toast.error('Stage Name is required');
      return;
    }

    const calculatedValue = getStageValueFromForm(tatForm);
    if (calculatedValue <= 0) {
      toast.error('Duration must be greater than 0');
      return;
    }

    let updatedTats;
    if (editingTatStage) {
      updatedTats = tatStages.map(t => t.id === editingTatStage.id ? {
        ...t,
        stageName: resolvedStageName.trim(),
        value: calculatedValue,
        type: tatForm.type
      } : t);
      toast.success('TAT stage updated successfully');
    } else {
      const newStage = {
        id: `tat-${Date.now()}`,
        stageName: resolvedStageName.trim(),
        value: calculatedValue,
        type: tatForm.type
      };
      updatedTats = [...tatStages, newStage];
      toast.success('TAT stage added successfully');
    }

    setTatStages(updatedTats);
    localStorage.setItem('tatSetupDataV3', JSON.stringify(updatedTats));
    
    // Dispatch event so other components know TAT is updated
    window.dispatchEvent(new Event('tatSetupUpdated'));

    setIsTatModalOpen(false);
    setEditingTatStage(null);
    setCustomStageText('');
  };

  const handleDeleteTatStage = (id) => {
    if (confirm('Are you sure you want to delete this custom TAT stage?')) {
      const updated = tatStages.filter(t => t.id !== id);
      setTatStages(updated);
      localStorage.setItem('tatSetupDataV3', JSON.stringify(updated));
      window.dispatchEvent(new Event('tatSetupUpdated'));
      toast.success('TAT stage deleted successfully');
    }
  };

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-4 flex flex-col h-full min-h-0 overflow-y-auto custom-scrollbar">
      
      {/* Main Configurations Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-0">
        
        {/* Title Header - Tab Switcher and Dynamic Action Button in one row */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <TabSwitcher
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={[
              { id: 'shift', label: 'Shift Hours' },
              { id: 'tat', label: 'Stage TAT Settings' }
            ]}
          />

          <div className="flex justify-end w-full sm:w-auto">
            {activeTab === 'shift' && (
              <button
                onClick={() => handleOpenShiftModal()}
                className="w-full sm:w-auto h-[32px] md:h-[38px] px-4 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg font-black text-xs shadow-md transition-all shrink-0 flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add Shift</span>
              </button>
            )}
            {activeTab === 'tat' && (
              <button
                onClick={() => handleOpenTatModal()}
                className="w-full sm:w-auto h-[32px] md:h-[38px] px-4 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg font-black text-xs shadow-md transition-all shrink-0 flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add TAT Setup</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">

        {/* ── TAB 1: SHIFT SETTINGS ─────────────────────────── */}
        {activeTab === 'shift' && (
          <div className="space-y-6">


            {/* Shifts list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.map(shift => (
                <div 
                  key={shift.id} 
                  className={`border rounded-xl p-4 shadow-sm space-y-4 relative overflow-hidden transition-all ${
                    shift.isDefault === 'Yes' 
                      ? 'border-amber-500 bg-amber-50/15' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Default Tag */}
                  {shift.isDefault === 'Yes' && (
                    <div className="absolute right-0 top-0 bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg tracking-wider z-10">
                      Default
                    </div>
                  )}

                  <div className="flex justify-between items-start relative mt-1">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Shift Name</span>
                      <span className="text-sm font-black text-slate-800 uppercase tracking-tight block">{shift.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenShiftModal(shift)}
                        className="p-1.5 text-slate-500 hover:text-amber-605 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Shift"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteShift(shift.id)}
                        className="p-1.5 text-slate-500 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Shift"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 font-mono">
                      <span className="text-[8px] font-bold text-slate-400 block uppercase leading-none mb-1">Start Time</span>
                      <span className="text-slate-800 font-extrabold text-sm">{shift.startTime}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 font-mono">
                      <span className="text-[8px] font-bold text-slate-400 block uppercase leading-none mb-1">End Time</span>
                      <span className="text-slate-800 font-extrabold text-sm">{shift.endTime}</span>
                    </div>
                  </div>
                </div>
              ))}

              {shifts.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs border border-dashed border-slate-200 rounded-2xl">
                  No shifts defined. Click Add Shift to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: STAGE TAT SETTINGS ─────────────────────── */}
        {activeTab === 'tat' && (
          <div className="space-y-6">

            {/* Stages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tatStages.map(stage => (
                <div key={stage.id} className="border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-4 bg-slate-50/10 hover:border-slate-350 transition-colors">
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate block">{stage.stageName}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mt-0.5">Duration SLA</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Display Formatted Time SLA */}
                    <div className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 font-mono text-center min-w-[70px]">
                      <span className="text-slate-800 font-extrabold text-xs">
                        {formatTatDuration(stage.value, stage.type)}
                      </span>
                    </div>

                    {/* Edit and Delete Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenTatModal(stage)}
                        className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit TAT"
                      >
                        <Edit size={15} />
                      </button>
                      {!STANDARD_TAT_IDS.includes(stage.id) && (
                        <button
                          onClick={() => handleDeleteTatStage(stage.id)}
                          className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete TAT"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

    </div>

    {/* ── SHIFT CREATION / EDIT MODAL ────────────────────── */}
      <ModalForm
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        title={editingShift ? 'Edit Company Shift' : 'Add Company Shift'}
        onSubmit={handleSaveShift}
        submitText={editingShift ? 'Update Shift' : 'Create Shift'}
        cancelText="Cancel"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Shift Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              required
              placeholder="e.g. Day Shift, General Shift"
              value={shiftForm.name}
              onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-bold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input 
                type="time"
                required
                value={shiftForm.startTime}
                onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                End Time <span className="text-red-500">*</span>
              </label>
              <input 
                type="time"
                required
                value={shiftForm.endTime}
                onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer select-none">
              <div>
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">Set as Default Shift</span>
                <span className="text-[9px] font-bold text-slate-400 block mt-0.5">This shift will be used for standard TAT calculations</span>
              </div>
              <input 
                type="checkbox"
                checked={shiftForm.isDefault === 'Yes'}
                onChange={(e) => setShiftForm({ ...shiftForm, isDefault: e.target.checked ? 'Yes' : 'No' })}
                disabled={editingShift?.isDefault === 'Yes' && shifts.length > 1}
                className="w-4 h-4 accent-amber-600 cursor-pointer rounded"
              />
            </label>
          </div>
        </div>
      </ModalForm>

      {/* ── TAT CREATION / EDIT MODAL ────────────────────── */}
      <ModalForm
        isOpen={isTatModalOpen}
        onClose={() => {
          setIsTatModalOpen(false);
          setEditingTatStage(null);
          setCustomStageText('');
        }}
        title={editingTatStage ? 'Edit Stage TAT' : 'Add Stage TAT'}
        onSubmit={handleSaveTat}
        submitText={editingTatStage ? 'Save Changes' : 'Add TAT Setup'}
        cancelText="Cancel"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Stage Name <span className="text-red-500">*</span>
            </label>
            <CustomDropdown
              options={STAGE_NAME_OPTIONS}
              value={STAGE_NAME_OPTIONS.some(o => o.value === tatForm.stageName && o.value !== 'CUSTOM') ? tatForm.stageName : (tatForm.stageName ? 'CUSTOM' : '')}
              onChange={(val) => {
                setTatForm(prev => ({ ...prev, stageName: val }));
              }}
              placeholder="Select Stage"
              className="w-full text-xs"
              height="h-[34px]"
              rounded="rounded-lg"
              disabled={editingTatStage && STANDARD_TAT_IDS.includes(editingTatStage.id)}
            />
          </div>

          {tatForm.stageName === 'CUSTOM' && (
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Custom Stage Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                required
                placeholder="Enter custom stage name"
                value={customStageText}
                onChange={(e) => setCustomStageText(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-bold text-slate-800"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Duration Unit <span className="text-red-500">*</span>
            </label>
            <CustomDropdown
              options={[
                { value: 'day', label: 'Days' },
                { value: 'hours', label: 'Hours' },
                { value: 'minute', label: 'Minutes' }
              ]}
              value={tatForm.type}
              onChange={(val) => setTatForm(prev => ({ ...prev, type: val }))}
              placeholder="Select Unit"
              className="w-full"
              height="h-[34px]"
              rounded="rounded-lg"
            />
          </div>

          {/* Conditional inputs based on type */}
          {tatForm.type === 'day' && (
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Days <span className="text-red-500">*</span>
              </label>
              <input type="number" step="0.001"
                min="1"
                required
                value={tatForm.days}
                onChange={(e) => setTatForm({ ...tatForm, days: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-bold text-slate-800"
              />
            </div>
          )}

          {tatForm.type === 'hours' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Hours <span className="text-red-500">*</span>
                </label>
                <input type="number" step="0.001"
                  min="0"
                  required
                  value={tatForm.hours}
                  onChange={(e) => setTatForm({ ...tatForm, hours: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Minutes
                </label>
                <input type="number" step="0.001"
                  min="0"
                  max="59"
                  value={tatForm.minutes}
                  onChange={(e) => setTatForm({ ...tatForm, minutes: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Seconds
                </label>
                <input type="number" step="0.001"
                  min="0"
                  max="59"
                  value={tatForm.seconds}
                  onChange={(e) => setTatForm({ ...tatForm, seconds: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          )}

          {tatForm.type === 'minute' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Minutes <span className="text-red-500">*</span>
                </label>
                <input type="number" step="0.001"
                  min="0"
                  required
                  value={tatForm.minutes}
                  onChange={(e) => setTatForm({ ...tatForm, minutes: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Seconds
                </label>
                <input type="number" step="0.001"
                  min="0"
                  max="59"
                  value={tatForm.seconds}
                  onChange={(e) => setTatForm({ ...tatForm, seconds: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          )}
        </div>
      </ModalForm>

    </div>
  );
};

export default TatSetup;
