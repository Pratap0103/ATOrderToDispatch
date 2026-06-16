import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, RotateCcw, Layers, Trash2, Edit2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import ModalForm from '../../components/ModalForm';

export const SEEDED_CATEGORIES = [
  { id: 'CAT-001', category: 'CHAIN', timestamp: '2026-06-01T08:00:00.000Z' },
  { id: 'CAT-002', category: 'NATH / NOSE RING', timestamp: '2026-06-01T08:10:00.000Z' },
  { id: 'CAT-003', category: 'EARRINGS', timestamp: '2026-06-01T08:20:00.000Z' },
  { id: 'CAT-004', category: 'CHANDBALI', timestamp: '2026-06-01T08:30:00.000Z' },
  { id: 'CAT-005', category: 'JHUMKI', timestamp: '2026-06-01T08:40:00.000Z' },
  { id: 'CAT-006', category: 'KANNOTI EARRING', timestamp: '2026-06-01T08:50:00.000Z' },
  { id: 'CAT-007', category: 'TOPS', timestamp: '2026-06-01T09:00:00.000Z' },
  { id: 'CAT-008', category: 'V CHAIN EARRING', timestamp: '2026-06-01T09:10:00.000Z' },
  { id: 'CAT-009', category: 'SET', timestamp: '2026-06-01T09:20:00.000Z' },
  { id: 'CAT-010', category: 'CHAIN SET', timestamp: '2026-06-01T09:30:00.000Z' },
  { id: 'CAT-011', category: 'CHOKER SET', timestamp: '2026-06-01T09:40:00.000Z' },
  { id: 'CAT-012', category: 'BELT BUCKLE', timestamp: '2026-06-01T09:50:00.000Z' },
  { id: 'CAT-013', category: 'CUFFLINKS', timestamp: '2026-06-01T10:00:00.000Z' },
  { id: 'CAT-014', category: 'FANCY HNADE BANGL', timestamp: '2026-06-01T10:10:00.000Z' },
  { id: 'CAT-015', category: 'GAJRA BANGLE', timestamp: '2026-06-01T10:20:00.000Z' },
  { id: 'CAT-016', category: 'ANTIQUE BANGLE', timestamp: '2026-06-01T10:30:00.000Z' },
  { id: 'CAT-017', category: 'YELLOW GOLD', timestamp: '2026-06-01T10:40:00.000Z' },
  { id: 'CAT-018', category: 'ROSE GOLD', timestamp: '2026-06-01T10:50:00.000Z' },
  { id: 'CAT-019', category: 'BINDIYA / MANGTIKA', timestamp: '2026-06-01T11:00:00.000Z' },
  { id: 'CAT-020', category: 'BRACELET', timestamp: '2026-06-01T11:10:00.000Z' },
  { id: 'CAT-021', category: 'GENTS BRACELET / KADA', timestamp: '2026-06-01T11:20:00.000Z' },
  { id: 'CAT-022', category: 'LADIES BRACELET', timestamp: '2026-06-01T11:30:00.000Z' },
  { id: 'CAT-023', category: 'MANGALSUTRA', timestamp: '2026-06-01T11:40:00.000Z' },
  { id: 'CAT-024', category: 'LONG SET', timestamp: '2026-06-01T11:50:00.000Z' },
  { id: 'CAT-025', category: 'PENDENT SET', timestamp: '2026-06-01T12:00:00.000Z' },
  { id: 'CAT-026', category: 'SHORT SET', timestamp: '2026-06-01T12:10:00.000Z' },
  { id: 'CAT-027', category: 'RINGS', timestamp: '2026-06-01T12:20:00.000Z' },
  { id: 'CAT-028', category: 'COUPLE RING', timestamp: '2026-06-01T12:30:00.000Z' },
  { id: 'CAT-029', category: 'GENTS RING', timestamp: '2026-06-01T12:40:00.000Z' },
  { id: 'CAT-030', category: 'LADIES RING', timestamp: '2026-06-01T12:50:00.000Z' },
  { id: 'CAT-031', category: 'PENDANTS', timestamp: '2026-06-01T13:00:00.000Z' },
  { id: 'CAT-032', category: 'DORLA PENDANTS', timestamp: '2026-06-01T13:10:00.000Z' },
  { id: 'CAT-033', category: 'DOUBLE HOOK PENDANTS', timestamp: '2026-06-01T13:20:00.000Z' },
  { id: 'CAT-034', category: 'SINGLE HOOK PENDANTS', timestamp: '2026-06-01T13:30:00.000Z' },
  { id: 'CAT-035', category: 'BANGLES', timestamp: '2026-06-01T13:40:00.000Z' },
  { id: 'CAT-036', category: 'EAR CHAIN KANNOTI', timestamp: '2026-06-01T13:50:00.000Z' },
  { id: 'CAT-037', category: 'MEN\'S COLLECTION', timestamp: '2026-06-01T14:00:00.000Z' },
  { id: 'CAT-038', category: 'WATCH', timestamp: '2026-06-01T14:10:00.000Z' },
  { id: 'CAT-039', category: 'GENTS WATCH', timestamp: '2026-06-01T14:20:00.000Z' },
  { id: 'CAT-040', category: 'LADIES WATCH', timestamp: '2026-06-01T14:30:00.000Z' },
  { id: 'CAT-041', category: 'INDO ITALIAN BANGLE', timestamp: '2026-06-01T14:40:00.000Z' },
  { id: 'CAT-042', category: 'BABY BANGLE', timestamp: '2026-06-01T14:50:00.000Z' },
  { id: 'CAT-043', category: 'PLASTER BANGLE', timestamp: '2026-06-01T15:00:00.000Z' },
  { id: 'CAT-044', category: 'REJI BANGLE', timestamp: '2026-06-01T15:10:00.000Z' },
  { id: 'CAT-045', category: '18K BANGLES', timestamp: '2026-06-01T15:20:00.000Z' },
  { id: 'CAT-046', category: '6 PCS BANGLES', timestamp: '2026-06-01T15:30:00.000Z' },
  { id: 'CAT-047', category: '2 PCS BANGLES', timestamp: '2026-06-01T15:40:00.000Z' },
  { id: 'CAT-048', category: '4 PCS BANGLES', timestamp: '2026-06-01T15:50:00.000Z' },
  { id: 'CAT-049', category: '1 PCS BANGLES', timestamp: '2026-06-01T16:00:00.000Z' },
  { id: 'CAT-050', category: 'MACHINE BANGLES', timestamp: '2026-06-01T16:10:00.000Z' },
  { id: 'CAT-051', category: 'KARDHAN', timestamp: '2026-06-01T16:20:00.000Z' },
  { id: 'CAT-052', category: 'ANTIQUE SET', timestamp: '2026-06-01T16:30:00.000Z' },
  { id: 'CAT-053', category: 'HOLLOW BANGLES', timestamp: '2026-06-01T16:40:00.000Z' },
  { id: 'CAT-054', category: 'JF COIN', timestamp: '2026-06-01T16:50:00.000Z' },
  { id: 'CAT-055', category: '1GM COIN', timestamp: '2026-06-01T17:00:00.000Z' },
  { id: 'CAT-056', category: '5GM COIN', timestamp: '2026-06-01T17:10:00.000Z' },
  { id: 'CAT-057', category: '10GM COIN', timestamp: '2026-06-01T17:20:00.000Z' },
  { id: 'CAT-058', category: 'TURKISH SET', timestamp: '2026-06-01T17:30:00.000Z' },
  { id: 'CAT-059', category: 'TOP SELLER BANGLES', timestamp: '2026-06-01T17:40:00.000Z' },
  { id: 'CAT-060', category: 'FUSION BANGLE', timestamp: '2026-06-01T17:50:00.000Z' },
  { id: 'CAT-061', category: 'V. PACHELI BANGLE', timestamp: '2026-06-01T18:00:00.000Z' }
];

const EMPTY_FORM = { category: '' };

const fmtTimestamp = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

export default function Category({
  searchQuery: externalSearch,
  onClearFilters,
  filtersOnly = false,
}) {
  const isEmbedded = externalSearch !== undefined;

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('master_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      const hasChain = parsed.some(c => c.category === 'CHAIN');
      if (!hasChain) {
        localStorage.setItem('master_categories', JSON.stringify(SEEDED_CATEGORIES));
        return SEEDED_CATEGORIES;
      }
      return parsed;
    }
    localStorage.setItem('master_categories', JSON.stringify(SEEDED_CATEGORIES));
    return SEEDED_CATEGORIES;
  });

  const [showAddModal, setShowAddModal]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newCategory, setNewCategory]     = useState({ ...EMPTY_FORM });
  const [editCategory, setEditCategory]   = useState({ id: '', ...EMPTY_FORM });

  const [localSearch, setLocalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const effectiveSearch = isEmbedded ? (externalSearch || '') : localSearch;

  const persist = (data) => {
    setCategories(data);
    localStorage.setItem('master_categories', JSON.stringify(data));
    window.dispatchEvent(new StorageEvent('storage', { key: 'master_categories', newValue: JSON.stringify(data) }));
  };

  // Sync when another instance persists
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'master_categories' && e.newValue) {
        try { setCategories(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCategory.category.trim()) { toast.error('Category name is required!'); return; }
    const exists = categories.some(c => c.category.trim().toLowerCase() === newCategory.category.trim().toLowerCase());
    if (exists) { toast.error('This category already exists!'); return; }
    const nextId = categories.length > 0
      ? Math.max(...categories.map(c => parseInt(c.id.replace('CAT-', ''), 10) || 0)) + 1
      : 1;
    persist([
      ...categories,
      {
        id: `CAT-${String(nextId).padStart(3, '0')}`,
        category: newCategory.category.trim(),
        timestamp: new Date().toISOString(),
      },
    ]);
    setNewCategory({ ...EMPTY_FORM });
    setShowAddModal(false);
    toast.success('Category added successfully!');
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (!editCategory.category.trim()) { toast.error('Category name is required!'); return; }
    const exists = categories.some(
      c => c.id !== editCategory.id && c.category.trim().toLowerCase() === editCategory.category.trim().toLowerCase()
    );
    if (exists) { toast.error('Another category with this name already exists!'); return; }
    persist(categories.map(c => c.id === editCategory.id ? { ...c, category: editCategory.category.trim() } : c));
    setShowEditModal(false);
    toast.success('Category updated!');
  };

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      persist(categories.filter(c => c.id !== id));
      toast.success('Category deleted successfully!');
    }
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    if (isEmbedded) onClearFilters?.();
    else toast.success('Filters cleared');
    setCurrentPage(1);
  };

  const filtered = useMemo(() => categories.filter(c => {
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      return c.category.toLowerCase().includes(q);
    }
    return true;
  }), [categories, effectiveSearch]);

  const totalPages  = Math.ceil(filtered.length / itemsPerPage);
  const paginated   = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tableHeaders = ['Serial No', 'Timestamp', 'Category', 'Action'];

  const renderRow = (c, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    return (
      <tr key={c.id} className="hover:bg-amber-50/30 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{globalIdx}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{fmtTimestamp(c.timestamp)}</td>
        <td className="px-4 py-3 text-center text-xs font-bold text-gray-900 whitespace-nowrap uppercase">{c.category}</td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => { setEditCategory({ id: c.id, category: c.category }); setShowEditModal(true); }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => handleDelete(c.id, c.category)}
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
            <span className="text-xs font-bold text-gray-900 uppercase truncate max-w-[200px]">{c.category}</span>
          </div>
        </div>
        <div className="text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Layers size={11} className="text-gray-400" />
            <span>{fmtTimestamp(c.timestamp)}</span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={() => { setEditCategory({ id: c.id, category: c.category }); setShowEditModal(true); }}
            className="flex-1 flex items-center justify-center gap-1 py-1 px-2 border border-blue-200 text-blue-700 rounded-md text-[10px] font-bold hover:bg-blue-50 transition-all shadow-sm"
          >
            <Edit2 size={10} /> Edit
          </button>
          <button
            onClick={() => handleDelete(c.id, c.category)}
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
        title="Add Category"
        onSubmit={handleAdd}
        submitText="Add Category"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
              Category Name *
            </label>
            <div className="relative">
              <Layers className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={newCategory.category}
                onChange={e => setNewCategory({ category: e.target.value })}
                placeholder="Enter category name"
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
        title="Edit Category"
        onSubmit={handleEdit}
        submitText="Save Changes"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
              Category Name *
            </label>
            <div className="relative">
              <Layers className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={editCategory.category}
                onChange={e => setEditCategory({ ...editCategory, category: e.target.value })}
                placeholder="Enter category name"
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
      <div className="hidden" id="category-add-trigger" onClick={() => setShowAddModal(true)} />

      {/* Standalone toolbar */}
      {!isEmbedded && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search categories..."
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
              title="Add Category"
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
            title="Add Category"
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
