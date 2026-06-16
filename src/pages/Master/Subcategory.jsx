import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, RotateCcw, Layers, Trash2, Edit2, ListTree } from 'lucide-react';
import DataTable from '../../components/DataTable';
import ModalForm from '../../components/ModalForm';

const EMPTY_FORM = { subcategory: '' };

const fmtTimestamp = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const SEEDED_SUBCATEGORIES = [
  { id: 'SUBCAT-001', subcategory: 'GOLD CHAIN', timestamp: '2026-06-01T08:00:00.000Z' },
  { id: 'SUBCAT-002', subcategory: 'DIAMOND RING', timestamp: '2026-06-01T08:10:00.000Z' },
  { id: 'SUBCAT-003', subcategory: 'SILVER BANGLE', timestamp: '2026-06-01T08:20:00.000Z' },
];

export default function Subcategory({
  searchQuery: externalSearch,
  onClearFilters,
  filtersOnly = false,
}) {
  const isEmbedded = externalSearch !== undefined;

  const [subcategories, setSubcategories] = useState(() => {
    const saved = localStorage.getItem('master_subcategories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed;
      localStorage.setItem('master_subcategories', JSON.stringify(SEEDED_SUBCATEGORIES));
      return SEEDED_SUBCATEGORIES;
    }
    localStorage.setItem('master_subcategories', JSON.stringify(SEEDED_SUBCATEGORIES));
    return SEEDED_SUBCATEGORIES;
  });

  const [showAddModal, setShowAddModal]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newSubcategory, setNewSubcategory]     = useState({ ...EMPTY_FORM });
  const [editSubcategory, setEditSubcategory]   = useState({ id: '', ...EMPTY_FORM });

  const [localSearch, setLocalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const effectiveSearch = isEmbedded ? (externalSearch || '') : localSearch;

  const persist = (data) => {
    setSubcategories(data);
    localStorage.setItem('master_subcategories', JSON.stringify(data));
    window.dispatchEvent(new StorageEvent('storage', { key: 'master_subcategories', newValue: JSON.stringify(data) }));
  };

  // Sync when another instance persists
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'master_subcategories' && e.newValue) {
        try { setSubcategories(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newSubcategory.subcategory.trim()) { toast.error('Subcategory name is required!'); return; }
    const exists = subcategories.some(c => c.subcategory.trim().toLowerCase() === newSubcategory.subcategory.trim().toLowerCase());
    if (exists) { toast.error('This subcategory already exists!'); return; }
    const nextId = subcategories.length > 0
      ? Math.max(...subcategories.map(c => parseInt(c.id.replace('SUBCAT-', ''), 10) || 0)) + 1
      : 1;
    persist([
      ...subcategories,
      {
        id: `SUBCAT-${String(nextId).padStart(3, '0')}`,
        subcategory: newSubcategory.subcategory.trim(),
        timestamp: new Date().toISOString(),
      },
    ]);
    setNewSubcategory({ ...EMPTY_FORM });
    setShowAddModal(false);
    toast.success('Subcategory added successfully!');
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (!editSubcategory.subcategory.trim()) { toast.error('Subcategory name is required!'); return; }
    const exists = subcategories.some(
      c => c.id !== editSubcategory.id && c.subcategory.trim().toLowerCase() === editSubcategory.subcategory.trim().toLowerCase()
    );
    if (exists) { toast.error('Another subcategory with this name already exists!'); return; }
    persist(subcategories.map(c => c.id === editSubcategory.id ? { ...c, subcategory: editSubcategory.subcategory.trim() } : c));
    setShowEditModal(false);
    toast.success('Subcategory updated!');
  };

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      persist(subcategories.filter(c => c.id !== id));
      toast.success('Subcategory deleted successfully!');
    }
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    if (isEmbedded) onClearFilters?.();
    else toast.success('Filters cleared');
    setCurrentPage(1);
  };

  const filtered = useMemo(() => subcategories.filter(c => {
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      return c.subcategory.toLowerCase().includes(q);
    }
    return true;
  }), [subcategories, effectiveSearch]);

  const totalPages  = Math.ceil(filtered.length / itemsPerPage);
  const paginated   = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tableHeaders = ['Timestamp', 'Serial No', 'Subcategory', 'Action'];

  const renderRow = (c, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    return (
      <tr key={c.id} className="hover:bg-amber-50/30 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{fmtTimestamp(c.timestamp)}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{globalIdx}</td>
        <td className="px-4 py-3 text-center text-xs font-bold text-gray-900 whitespace-nowrap uppercase">{c.subcategory}</td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => { setEditSubcategory({ id: c.id, subcategory: c.subcategory }); setShowEditModal(true); }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => handleDelete(c.id, c.subcategory)}
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

  const renderCard = (c, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    return (
      <div key={c.id} className="bg-white rounded-xl border border-amber-50 shadow-sm p-4 space-y-3 hover:shadow-md hover:border-amber-100 transition-all">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">{globalIdx}</span>
            <span className="text-xs font-bold text-gray-900 uppercase truncate max-w-[200px]">{c.subcategory}</span>
          </div>
        </div>
        <div className="text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div className="flex items-center gap-1.5 text-gray-600">
            <ListTree size={11} className="text-gray-400" />
            <span>{fmtTimestamp(c.timestamp)}</span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={() => { setEditSubcategory({ id: c.id, subcategory: c.subcategory }); setShowEditModal(true); }}
            className="flex-1 flex items-center justify-center gap-1 py-1 px-2 border border-blue-200 text-blue-700 rounded-md text-[10px] font-bold hover:bg-blue-50 transition-all shadow-sm"
          >
            <Edit2 size={10} /> Edit
          </button>
          <button
            onClick={() => handleDelete(c.id, c.subcategory)}
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
        title="Add Subcategory"
        onSubmit={handleAdd}
        submitText="Add Subcategory"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
              Subcategory Name *
            </label>
            <div className="relative">
              <ListTree className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={newSubcategory.subcategory}
                onChange={e => setNewSubcategory({ subcategory: e.target.value })}
                placeholder="Enter subcategory name"
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
        title="Edit Subcategory"
        onSubmit={handleEdit}
        submitText="Save Changes"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
              Subcategory Name *
            </label>
            <div className="relative">
              <ListTree className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={editSubcategory.subcategory}
                onChange={e => setEditSubcategory({ ...editSubcategory, subcategory: e.target.value })}
                placeholder="Enter subcategory name"
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

  return (
    <div className={`${isEmbedded ? '' : 'p-0 sm:p-2 md:p-6 '}space-y-2 md:space-y-6 flex flex-col h-full min-h-0`}>

      {/* Hidden add trigger */}
      <div className="hidden" id="subcategory-add-trigger" onClick={() => setShowAddModal(true)} />

      {/* Standalone toolbar */}
      {!isEmbedded && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search subcategories..."
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
              title="Add Subcategory"
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
            title="Add Subcategory"
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
