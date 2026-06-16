import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, RotateCcw, MapPin, Trash2, Edit2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import ModalForm from '../../components/ModalForm';

const SEEDED_LOCATIONS = [
  { id: 'DL-001', location: 'Mumbai',  timestamp: '2026-06-01T08:30:00' },
  { id: 'DL-002', location: 'Kolkata', timestamp: '2026-06-01T09:15:00' },
  { id: 'DL-003', location: 'Raipur',  timestamp: '2026-06-01T10:00:00' },
];

const EMPTY_FORM = { location: '' };

const fmtTimestamp = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

export default function DeliveryLocation({
  searchQuery: externalSearch,
  onClearFilters,
  filtersOnly = false,
}) {
  const isEmbedded = externalSearch !== undefined;

  const [locations, setLocations] = useState(() => {
    const saved = localStorage.getItem('master_delivery_locations');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('master_delivery_locations', JSON.stringify(SEEDED_LOCATIONS));
    return SEEDED_LOCATIONS;
  });

  const [showAddModal, setShowAddModal]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newLocation, setNewLocation]     = useState({ ...EMPTY_FORM });
  const [editLocation, setEditLocation]   = useState({ id: '', ...EMPTY_FORM });

  const [localSearch, setLocalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const effectiveSearch = isEmbedded ? (externalSearch || '') : localSearch;

  const persist = (data) => {
    setLocations(data);
    localStorage.setItem('master_delivery_locations', JSON.stringify(data));
    window.dispatchEvent(new StorageEvent('storage', { key: 'master_delivery_locations', newValue: JSON.stringify(data) }));
  };

  // Sync when another instance persists
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'master_delivery_locations' && e.newValue) {
        try { setLocations(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newLocation.location.trim()) { toast.error('Delivery Location is required!'); return; }
    const exists = locations.some(l => l.location.trim().toLowerCase() === newLocation.location.trim().toLowerCase());
    if (exists) { toast.error('This delivery location already exists!'); return; }
    const nextId = locations.length > 0
      ? Math.max(...locations.map(l => parseInt(l.id.replace('DL-', ''), 10) || 0)) + 1
      : 1;
    persist([
      ...locations,
      {
        id: `DL-${String(nextId).padStart(3, '0')}`,
        location: newLocation.location.trim(),
        timestamp: new Date().toISOString(),
      },
    ]);
    setNewLocation({ ...EMPTY_FORM });
    setShowAddModal(false);
    toast.success('Delivery location added successfully!');
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (!editLocation.location.trim()) { toast.error('Delivery Location is required!'); return; }
    const exists = locations.some(
      l => l.id !== editLocation.id && l.location.trim().toLowerCase() === editLocation.location.trim().toLowerCase()
    );
    if (exists) { toast.error('Another location with this name already exists!'); return; }
    persist(locations.map(l => l.id === editLocation.id ? { ...l, location: editLocation.location.trim() } : l));
    setShowEditModal(false);
    toast.success('Delivery location updated!');
  };

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      persist(locations.filter(l => l.id !== id));
      toast.success('Delivery location deleted successfully!');
    }
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    if (isEmbedded) onClearFilters?.();
    else toast.success('Filters cleared');
    setCurrentPage(1);
  };

  const filtered = useMemo(() => locations.filter(l => {
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      return l.location.toLowerCase().includes(q);
    }
    return true;
  }), [locations, effectiveSearch]);

  const totalPages  = Math.ceil(filtered.length / itemsPerPage);
  const paginated   = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tableHeaders = ['Serial No', 'Timestamp', 'Delivery Location', 'Action'];

  const renderRow = (l, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    return (
      <tr key={l.id} className="hover:bg-amber-50/30 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{globalIdx}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{fmtTimestamp(l.timestamp)}</td>
        <td className="px-4 py-3 text-center text-xs font-bold text-gray-900 whitespace-nowrap uppercase">{l.location}</td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => { setEditLocation({ id: l.id, location: l.location }); setShowEditModal(true); }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => handleDelete(l.id, l.location)}
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

  const renderCard = (l, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    return (
      <div key={l.id} className="bg-white rounded-xl border border-amber-50 shadow-sm p-4 space-y-3 hover:shadow-md hover:border-amber-100 transition-all">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">{globalIdx}</span>
            <span className="text-xs font-bold text-gray-900 uppercase truncate max-w-[200px]">{l.location}</span>
          </div>
        </div>
        <div className="text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div className="flex items-center gap-1.5 text-gray-600">
            <MapPin size={11} className="text-gray-400" />
            <span>{fmtTimestamp(l.timestamp)}</span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={() => { setEditLocation({ id: l.id, location: l.location }); setShowEditModal(true); }}
            className="flex-1 flex items-center justify-center gap-1 py-1 px-2 border border-blue-200 text-blue-700 rounded-md text-[10px] font-bold hover:bg-blue-50 transition-all shadow-sm"
          >
            <Edit2 size={10} /> Edit
          </button>
          <button
            onClick={() => handleDelete(l.id, l.location)}
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
        title="Add Delivery Location"
        onSubmit={handleAdd}
        submitText="Add Location"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
              Delivery Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={newLocation.location}
                onChange={e => setNewLocation({ location: e.target.value })}
                placeholder="Enter delivery location"
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
        title="Edit Delivery Location"
        onSubmit={handleEdit}
        submitText="Save Changes"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">
              Delivery Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={editLocation.location}
                onChange={e => setEditLocation({ ...editLocation, location: e.target.value })}
                placeholder="Enter delivery location"
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

  // ── filtersOnly mode: only the hidden add-trigger + modals (used in Master toolbar) ──
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
      <div className="hidden" id="delivery-location-add-trigger" onClick={() => setShowAddModal(true)} />

      {/* Standalone toolbar */}
      {!isEmbedded && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search delivery locations..."
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
              title="Add Location"
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
            title="Add Delivery Location"
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
