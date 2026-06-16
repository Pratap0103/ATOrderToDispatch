import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, RotateCcw, Tag, Trash2, Edit2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import ModalForm from '../../components/ModalForm';

const SEEDED_STAGES = [
  { id: 'OS-001', stage: 'Pending',              timestamp: '2026-06-01T08:00:00' },
  { id: 'OS-002', stage: 'In Process',            timestamp: '2026-06-01T08:15:00' },
  { id: 'OS-003', stage: 'Ready for Delivery',    timestamp: '2026-06-01T08:30:00' },
  { id: 'OS-004', stage: 'Completed',             timestamp: '2026-06-01T08:45:00' },
  { id: 'OS-005', stage: 'Reject',                timestamp: '2026-06-01T09:00:00' },
];

// Badge colour mapping
const STAGE_BADGE = {
  'Pending':             'bg-yellow-50  text-yellow-700  border-yellow-200',
  'In Process':          'bg-blue-50    text-blue-700    border-blue-200',
  'Ready for Delivery':  'bg-purple-50  text-purple-700  border-purple-200',
  'Completed':           'bg-green-50   text-green-700   border-green-200',
  'Reject':              'bg-red-50     text-red-700     border-red-200',
};

const EMPTY_FORM = { stage: '' };

const fmtTimestamp = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const badgeClass = (stage) =>
  STAGE_BADGE[stage] || 'bg-gray-50 text-gray-700 border-gray-200';

export default function OrderStage({
  searchQuery: externalSearch,
  onClearFilters,
  filtersOnly = false,
}) {
  const isEmbedded = externalSearch !== undefined;

  const [stages, setStages] = useState(() => {
    const saved = localStorage.getItem('master_order_stages');
    if (saved) {
      // Migrate 'In Progress' → 'In Process' in existing data
      const parsed = JSON.parse(saved);
      const migrated = parsed.map(s => s.stage === 'In Progress' ? { ...s, stage: 'In Process' } : s);
      const changed = migrated.some((s, i) => s.stage !== parsed[i].stage);
      if (changed) {
        localStorage.setItem('master_order_stages', JSON.stringify(migrated));
        return migrated;
      }
      return parsed;
    }
    localStorage.setItem('master_order_stages', JSON.stringify(SEEDED_STAGES));
    return SEEDED_STAGES;
  });

  const [showAddModal,  setShowAddModal]  = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newStage,  setNewStage]  = useState({ ...EMPTY_FORM });
  const [editStage, setEditStage] = useState({ id: '', ...EMPTY_FORM });

  const [localSearch,  setLocalSearch]  = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const effectiveSearch = isEmbedded ? (externalSearch || '') : localSearch;

  const persist = (data) => {
    setStages(data);
    localStorage.setItem('master_order_stages', JSON.stringify(data));
    window.dispatchEvent(new StorageEvent('storage', { key: 'master_order_stages', newValue: JSON.stringify(data) }));
  };

  // Sync when another instance persists
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'master_order_stages' && e.newValue) {
        try { setStages(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newStage.stage.trim()) { toast.error('Order Stage is required!'); return; }
    const exists = stages.some(s => s.stage.trim().toLowerCase() === newStage.stage.trim().toLowerCase());
    if (exists) { toast.error('This order stage already exists!'); return; }
    const nextId = stages.length > 0
      ? Math.max(...stages.map(s => parseInt(s.id.replace('OS-', ''), 10) || 0)) + 1
      : 1;
    persist([
      ...stages,
      {
        id: `OS-${String(nextId).padStart(3, '0')}`,
        stage: newStage.stage.trim(),
        timestamp: new Date().toISOString(),
      },
    ]);
    setNewStage({ ...EMPTY_FORM });
    setShowAddModal(false);
    toast.success('Order stage added successfully!');
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (!editStage.stage.trim()) { toast.error('Order Stage is required!'); return; }
    const exists = stages.some(
      s => s.id !== editStage.id && s.stage.trim().toLowerCase() === editStage.stage.trim().toLowerCase()
    );
    if (exists) { toast.error('Another stage with this name already exists!'); return; }
    persist(stages.map(s => s.id === editStage.id ? { ...s, stage: editStage.stage.trim() } : s));
    setShowEditModal(false);
    toast.success('Order stage updated!');
  };

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      persist(stages.filter(s => s.id !== id));
      toast.success('Order stage deleted successfully!');
    }
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    if (isEmbedded) onClearFilters?.();
    else toast.success('Filters cleared');
    setCurrentPage(1);
  };

  const filtered = useMemo(() =>
    stages.filter(s => {
      if (effectiveSearch) {
        return s.stage.toLowerCase().includes(effectiveSearch.toLowerCase());
      }
      return true;
    }),
    [stages, effectiveSearch]
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated  = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tableHeaders = ['Serial No', 'Timestamp', 'Order Stage', 'Action'];

  const renderRow = (s, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    return (
      <tr key={s.id} className="hover:bg-amber-50/30 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{globalIdx}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{fmtTimestamp(s.timestamp)}</td>
        <td className="px-4 py-3 text-center whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass(s.stage)}`}>
            {s.stage}
          </span>
        </td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => { setEditStage({ id: s.id, stage: s.stage }); setShowEditModal(true); }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => handleDelete(s.id, s.stage)}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderCard = (s, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    return (
      <div key={s.id} className="bg-white rounded-xl border border-amber-50 shadow-sm p-4 space-y-3 hover:shadow-md hover:border-amber-100 transition-all">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">{globalIdx}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass(s.stage)}`}>
              {s.stage}
            </span>
          </div>
        </div>
        <div className="text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Tag size={11} className="text-gray-400" />
            <span>{fmtTimestamp(s.timestamp)}</span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={() => { setEditStage({ id: s.id, stage: s.stage }); setShowEditModal(true); }}
            className="flex-1 flex items-center justify-center gap-1 py-1 px-2 border border-blue-200 text-blue-700 rounded-md text-[10px] font-bold hover:bg-blue-50 transition-all shadow-sm"
          >
            <Edit2 size={10} /> Edit
          </button>
          <button
            onClick={() => handleDelete(s.id, s.stage)}
            className="flex-1 flex items-center justify-center gap-1 py-1 px-2 border border-red-200 text-red-700 rounded-md text-[10px] font-bold hover:bg-red-50 transition-all shadow-sm"
          >
            <Trash2 size={10} /> Delete
          </button>
        </div>
      </div>
    );
  };

  const modals = (
    <>
      {/* Add Modal */}
      <ModalForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Order Stage"
        onSubmit={handleAdd}
        submitText="Add Stage"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
              Order Stage *
            </label>
            <div className="relative">
              <Tag className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={newStage.stage}
                onChange={e => setNewStage({ stage: e.target.value })}
                placeholder="Enter order stage name"
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]"
                required
                autoFocus
              />
            </div>
          </div>
        </div>
      </ModalForm>

      {/* Edit Modal */}
      <ModalForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Order Stage"
        onSubmit={handleEdit}
        submitText="Save Changes"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
              Order Stage *
            </label>
            <div className="relative">
              <Tag className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={editStage.stage}
                onChange={e => setEditStage({ ...editStage, stage: e.target.value })}
                placeholder="Enter order stage name"
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]"
                required
                autoFocus
              />
            </div>
          </div>
        </div>
      </ModalForm>
    </>
  );

  // ── filtersOnly mode (used in Master toolbar) ──
  if (filtersOnly) {
    return (
      <>
        <button
          onClick={handleClearFilters}
          className="hidden lg:flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-[38px] h-[38px] hover:bg-gray-100 transition-colors shadow-sm"
          title="Clear Filters"
        >
          <RotateCcw size={16} />
        </button>
      </>
    );
  }

  // ── Full page ──
  return (
    <div className={`${isEmbedded ? '' : 'p-0 sm:p-2 md:p-6 '}space-y-2 md:space-y-6 flex flex-col h-full min-h-0`}>

      {/* Hidden add trigger */}
      <div className="hidden" id="order-stage-add-trigger" onClick={() => setShowAddModal(true)} />

      {/* Standalone toolbar */}
      {!isEmbedded && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search order stages..."
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-amber-500 text-xs md:text-sm h-[32px] md:h-[38px]"
              />
            </div>
            <button
              onClick={handleClearFilters}
              className="lg:hidden flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
              title="Clear Filters"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="lg:hidden flex items-center justify-center bg-amber-600 text-white rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
              title="Add Stage"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            onClick={handleClearFilters}
            className="hidden lg:flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-[38px] h-[38px] hover:bg-gray-100 transition-colors shadow-sm"
            title="Clear Filters"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="hidden lg:flex bg-amber-600 hover:bg-amber-700 text-white rounded-lg items-center justify-center transition shadow-sm w-[38px] h-[38px] flex-shrink-0"
            title="Add Order Stage"
          >
            <Plus size={18} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginated}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="700px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filtered.length}
          itemsPerPageOptions={[50, 100, 200, 500]}
        />
      </div>

      {modals}
    </div>
  );
}
