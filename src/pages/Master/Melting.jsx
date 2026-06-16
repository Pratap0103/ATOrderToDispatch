import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, RotateCcw, Flame, Trash2, Edit2, Filter } from 'lucide-react';
import DataTable from '../../components/DataTable';
import ModalForm from '../../components/ModalForm';
import SearchableDropdown from '../../components/SearchableDropdown';

export const SEEDED_MELTING = [
  { id: 'MELT-001', melting: '18K', ghatMelting: '75.20', timestamp: '2026-06-01T08:00:00.000Z' },
  { id: 'MELT-002', melting: '20K', ghatMelting: '83.50', timestamp: '2026-06-01T08:10:00.000Z' },
  { id: 'MELT-003', melting: '22K', ghatMelting: '91.80', timestamp: '2026-06-01T08:20:00.000Z' },
  { id: 'MELT-004', melting: '24K', ghatMelting: '99.90', timestamp: '2026-06-01T08:30:00.000Z' },
];

const EMPTY_FORM = { melting: '', ghatMelting: '' };

const fmtTimestamp = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

export default function Melting({
  searchQuery: externalSearch,
  onClearFilters,
  filtersOnly = false,
  filterValue,
  onFilterChange,
}) {
  const isEmbedded = externalSearch !== undefined;

  const [meltingList, setMeltingList] = useState(() => {
    const saved = localStorage.getItem('master_melting');
    if (saved) {
      let parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        // Migrate to add ghatMelting
        let changed = false;
        parsed = parsed.map(m => {
          if (m.ghatMelting === undefined) {
             changed = true;
             const seed = SEEDED_MELTING.find(s => s.melting === m.melting);
             return { ...m, ghatMelting: seed ? seed.ghatMelting : '' };
          }
          return m;
        });
        if (changed) {
          localStorage.setItem('master_melting', JSON.stringify(parsed));
        }
        return parsed;
      }
    }
    localStorage.setItem('master_melting', JSON.stringify(SEEDED_MELTING));
    return SEEDED_MELTING;
  });

  const [showAddModal, setShowAddModal]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newMelting, setNewMelting]       = useState({ ...EMPTY_FORM });
  const [editMelting, setEditMelting]     = useState({ id: '', ...EMPTY_FORM });

  const [localSearch, setLocalSearch] = useState('');
  const [localFilterMelting, setLocalFilterMelting] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const effectiveSearch = isEmbedded ? (externalSearch || '') : localSearch;
  const filterMelting = filterValue !== undefined ? filterValue : localFilterMelting;
  const setFilterMelting = onFilterChange || setLocalFilterMelting;
  const meltingOptions = useMemo(() => window.generateFilterOptions ? window.generateFilterOptions(meltingList, 'melting') : [], [meltingList]);

  const persist = (data) => {
    setMeltingList(data);
    localStorage.setItem('master_melting', JSON.stringify(data));
    window.dispatchEvent(new StorageEvent('storage', { key: 'master_melting', newValue: JSON.stringify(data) }));
  };

  // Sync when another instance persists
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'master_melting' && e.newValue) {
        try { setMeltingList(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newMelting.melting.trim()) { toast.error('Melting value is required!'); return; }
    const exists = meltingList.some(m => m.melting.trim().toLowerCase() === newMelting.melting.trim().toLowerCase());
    if (exists) { toast.error('This melting value already exists!'); return; }
    const nextId = meltingList.length > 0
      ? Math.max(...meltingList.map(m => parseInt(m.id.replace('MELT-', ''), 10) || 0)) + 1
      : 1;
    persist([
      ...meltingList,
      {
        id: `MELT-${String(nextId).padStart(3, '0')}`,
        melting: newMelting.melting.trim(),
        ghatMelting: newMelting.ghatMelting?.trim() || '',
        timestamp: new Date().toISOString(),
      },
    ]);
    setNewMelting({ ...EMPTY_FORM });
    setShowAddModal(false);
    toast.success('Melting value added successfully!');
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (!editMelting.melting.trim()) { toast.error('Melting value is required!'); return; }
    const exists = meltingList.some(
      m => m.id !== editMelting.id && m.melting.trim().toLowerCase() === editMelting.melting.trim().toLowerCase()
    );
    if (exists) { toast.error('Another melting record with this value already exists!'); return; }
    persist(meltingList.map(m => m.id === editMelting.id ? { ...m, melting: editMelting.melting.trim(), ghatMelting: editMelting.ghatMelting?.trim() || '' } : m));
    setShowEditModal(false);
    toast.success('Melting value updated!');
  };

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      persist(meltingList.filter(m => m.id !== id));
      toast.success('Melting value deleted successfully!');
    }
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    setFilterMelting([]);
    if (isEmbedded) onClearFilters?.();
    else toast.success('Filters cleared');
    setCurrentPage(1);
  };

  const filtered = useMemo(() => meltingList.filter(m => {
    if (filterMelting.length > 0 && !filterMelting.includes(m.melting)) return false;
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      return m.melting.toLowerCase().includes(q);
    }
    return true;
  }), [meltingList, effectiveSearch, filterMelting]);

  const totalPages  = Math.ceil(filtered.length / itemsPerPage);
  const paginated   = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tableHeaders = ['Serial No', 'Timestamp', 'Melting', 'Ghat Melting', 'Action'];

  const renderRow = (m, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    return (
      <tr key={m.id} className="hover:bg-amber-50/30 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{globalIdx}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{fmtTimestamp(m.timestamp)}</td>
        <td className="px-4 py-3 text-center text-xs font-bold text-gray-900 whitespace-nowrap uppercase">{m.melting}</td>
        <td className="px-4 py-3 text-center text-xs font-bold text-gray-900 whitespace-nowrap">{m.ghatMelting || '-'}</td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => { setEditMelting({ id: m.id, melting: m.melting, ghatMelting: m.ghatMelting || '' }); setShowEditModal(true); }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => handleDelete(m.id, m.melting)}
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

  const renderCard = (m, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    return (
      <div key={m.id} className="bg-white rounded-xl border border-amber-50 shadow-sm p-4 space-y-3 hover:shadow-md hover:border-amber-100 transition-all">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">{globalIdx}</span>
            <span className="text-xs font-bold text-gray-900 uppercase truncate max-w-[200px]">{m.melting}</span>
            {m.ghatMelting && <span className="text-[10px] font-bold text-gray-500 ml-2">Ghat: {m.ghatMelting}</span>}
          </div>
        </div>
        <div className="text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Flame size={11} className="text-gray-400" />
            <span>{fmtTimestamp(m.timestamp)}</span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={() => { setEditMelting({ id: m.id, melting: m.melting, ghatMelting: m.ghatMelting || '' }); setShowEditModal(true); }}
            className="flex-1 flex items-center justify-center gap-1 py-1 px-2 border border-blue-200 text-blue-700 rounded-md text-[10px] font-bold hover:bg-blue-50 transition-all shadow-sm"
          >
            <Edit2 size={10} /> Edit
          </button>
          <button
            onClick={() => handleDelete(m.id, m.melting)}
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
        title="Add Melting Value"
        onSubmit={handleAdd}
        submitText="Add Melting"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
              Melting Value *
            </label>
            <div className="relative">
              <Flame className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={newMelting.melting}
                onChange={e => setNewMelting({ ...newMelting, melting: e.target.value })}
                placeholder="e.g. 18K, 22K"
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]"
                required
                autoFocus
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
              Ghat Melting
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={newMelting.ghatMelting}
                onChange={e => setNewMelting({ ...newMelting, ghatMelting: e.target.value })}
                placeholder="e.g. 75.20"
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]"
              />
            </div>
          </div>
        </div>
      </ModalForm>

      {/* Edit Modal */}
      <ModalForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Melting Value"
        onSubmit={handleEdit}
        submitText="Save Changes"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
              Melting Value *
            </label>
            <div className="relative">
              <Flame className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={editMelting.melting}
                onChange={e => setEditMelting({ ...editMelting, melting: e.target.value })}
                placeholder="e.g. 18K, 22K"
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]"
                required
                autoFocus
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
              Ghat Melting
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={editMelting.ghatMelting}
                onChange={e => setEditMelting({ ...editMelting, ghatMelting: e.target.value })}
                placeholder="e.g. 75.20"
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]"
              />
            </div>
          </div>
        </div>
      </ModalForm>
    </>
  );

  if (filtersOnly) {
    return (
      <>
        <div className="flex-1 min-w-0 lg:min-w-[160px] relative">
          <SearchableDropdown
            options={meltingOptions}
            isMulti={true}
            value={filterMelting}
            onChange={setFilterMelting}
            placeholder="All Melting"
            className="h-[32px] md:h-[38px]"
            height="h-[32px] md:h-[38px]"
            rounded="rounded-lg"
          />
        </div>
        <button
          onClick={handleClearFilters}
          className="hidden lg:flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-[38px] h-[38px] hover:bg-gray-100 transition-colors shadow-sm flex-shrink-0"
          title="Clear Filters"
        >
          <RotateCcw size={16} />
        </button>
      </>
    );
  }

  return (
    <div className={`${isEmbedded ? '' : 'p-0 sm:p-2 md:p-6 '}space-y-2 md:space-y-6 flex flex-col h-full min-h-0`}>

      {/* Hidden add trigger */}
      <div className="hidden" id="melting-add-trigger" onClick={() => setShowAddModal(true)} />

      {/* Standalone toolbar */}
      {!isEmbedded && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
          <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center lg:flex-1">
            <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search melting values..."
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-amber-500 text-xs md:text-sm h-[32px] md:h-[38px]"
                />
              </div>
              <button
                onClick={handleClearFilters}
                className="flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95 lg:hidden"
                title="Clear Filters"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="lg:hidden flex items-center justify-center bg-amber-600 text-white rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
                title="Add Melting"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="w-full lg:w-[250px] relative">
              <SearchableDropdown
                options={meltingOptions}
                isMulti={true}
                value={filterMelting}
                onChange={setFilterMelting}
                placeholder="All Melting"
                className="h-[32px] md:h-[38px]"
                height="h-[32px] md:h-[38px]"
                rounded="rounded-lg"
              />
            </div>
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
            title="Add Melting Value"
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
