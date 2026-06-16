import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, RotateCcw, Coins, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchableDropdown from '../../components/SearchableDropdown';
/* deleted import */
import MetalIssuePending from './MetalIssuePending';
import MetalIssueHistory from './MetalIssueHistory';
import MetalIssueForm from './MetalIssueForm';
import MetalIssueEdit from './MetalIssueEdit';
import { TabSwitcher } from '../../components/StandardButtons';
/* deleted import */
import { SEEDED_KARIGARS } from '../Master/masterdata';

const parseDateString = (str) => {
  if (!str) return null;
  let match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
    if (!isNaN(d.getTime())) return d;
  }
  match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const p1 = parseInt(match[1], 10);
    const p2 = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    if (p1 > 12) {
      const d = new Date(y, p2 - 1, p1);
      if (!isNaN(d.getTime())) return d;
    } else if (p2 > 12) {
      const d = new Date(y, p1 - 1, p2);
      if (!isNaN(d.getTime())) return d;
    } else {
      const d = new Date(y, p2 - 1, p1);
      if (!isNaN(d.getTime())) return d;
    }
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return null;
};

const toYYYYMMDD = (val) => {
  if (!val) return '';
  const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return val;
};

const toDDMMYYYY = (val) => {
  if (!val) return '';
  const match = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return val;
};

const MetalIssue = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [orders, setOrders] = useState([]);
  const [metalIssues, setMetalIssues] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedIssueToEdit, setSelectedIssueToEdit] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const filterDateRef = React.useRef(null);

  const [filters, setFilters] = useState({
    searchQuery: '',
    category: [],
    karigar: [],
    melting: [],
    orderType: [],
    date: ''
  });

  // Load from localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('ordersDataV3');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
    const savedIssues = localStorage.getItem('metalIssuesDataV3');
    if (savedIssues) {
      setMetalIssues(JSON.parse(savedIssues));
    }
  }, []);

  const [karigars, setKarigars] = useState(() => {
    try {
      const saved = localStorage.getItem('master_karigars_v3');
      return saved ? JSON.parse(saved) : SEEDED_KARIGARS;
    } catch {
      return SEEDED_KARIGARS;
    }
  });

  useEffect(() => {
    const refresh = () => {
      try {
        const saved = localStorage.getItem('master_karigars_v3');
        if (saved) setKarigars(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const officeKarigars = useMemo(() => {
    return new Set(karigars.filter(k => k.type === 'Office').map(k => k.name));
  }, [karigars]);

  const handleSaveMetalIssue = (newIssue) => {
    const updated = [newIssue, ...metalIssues];
    setMetalIssues(updated);
    localStorage.setItem('metalIssuesDataV3', JSON.stringify(updated));

    // Also update orderStage of the order to 'Follow Up' and record metalIssueType
    const updatedOrders = orders.map(o => {
      if (o.id === newIssue.orderId) {
        const nextOrder = { ...o, orderStage: 'Follow Up', metalIssueType: newIssue.metalIssueType };
        return syncOrderPlannedDates(o, nextOrder);
      }
      return o;
    });
    setOrders(updatedOrders);
    localStorage.setItem('ordersDataV3', JSON.stringify(updatedOrders));

    toast.success('Metal issued successfully');
  };

  const handleRevokeMetalIssue = (orderId) => {
    const updated = metalIssues.filter(issue => issue.orderId !== orderId);
    setMetalIssues(updated);
    localStorage.setItem('metalIssuesDataV3', JSON.stringify(updated));

    // Revert orderStage to 'New' and clear metalIssueType
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const nextOrder = { ...o, orderStage: 'New', metalIssueType: '' };
        return syncOrderPlannedDates(o, nextOrder);
      }
      return o;
    });
    setOrders(updatedOrders);
    localStorage.setItem('ordersDataV3', JSON.stringify(updatedOrders));

    toast.success('Metal issue deleted successfully');
  };

  const handleUpdateMetalIssue = (updatedIssue) => {
    const updated = metalIssues.map(issue => issue.orderId === updatedIssue.orderId ? updatedIssue : issue);
    setMetalIssues(updated);
    localStorage.setItem('metalIssuesDataV3', JSON.stringify(updated));

    // Ensure orderStage is set to 'Follow Up' and update metalIssueType
    const updatedOrders = orders.map(o => {
      if (o.id === updatedIssue.orderId) {
        const nextOrder = { ...o, orderStage: 'Follow Up', metalIssueType: updatedIssue.metalIssueType };
        return syncOrderPlannedDates(o, nextOrder);
      }
      return o;
    });
    setOrders(updatedOrders);
    localStorage.setItem('ordersDataV3', JSON.stringify(updatedOrders));

    toast.success('Metal issue updated successfully');
  };

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      category: [],
      karigar: [],
      melting: [],
      orderType: [],
      date: ''
    });
    toast.success('Filters cleared');
  };

  const basePendingOrders = useMemo(() => {
    const issuedIds = new Set(metalIssues.map(issue => issue.orderId));
    return orders.filter(o => 
      !issuedIds.has(o.id) && 
      o.orderStage?.toLowerCase() === 'in process' &&
      o.karigar && 
      officeKarigars.has(o.karigar)
    );
  }, [orders, metalIssues, officeKarigars]);

  const baseHistoryOrders = useMemo(() => {
    const issuedIds = new Set(metalIssues.map(issue => issue.orderId));
    return orders.filter(o => 
      issuedIds.has(o.id) && 
      o.karigar && 
      officeKarigars.has(o.karigar)
    );
  }, [orders, metalIssues, officeKarigars]);

  const activeBaseOrders = activeTab === 'pending' ? basePendingOrders : baseHistoryOrders;

  const categoriesList = useMemo(() => generateFilterOptions(activeBaseOrders, o => o.category), [activeBaseOrders]);
  const karigarsList = useMemo(() => generateFilterOptions(activeBaseOrders, o => o.karigar), [activeBaseOrders]);
  const meltingList = useMemo(() => generateFilterOptions(activeBaseOrders, o => o.melting), [activeBaseOrders]);
  const typesList = useMemo(() => generateFilterOptions(activeBaseOrders, o => o.orderType), [activeBaseOrders]);

  // Filtered orders list matching search parameters
  const filteredOrdersBase = useMemo(() => {
    return orders.filter(o => {
      if (filters.category && filters.category.length > 0 && !filters.category.includes(o.category)) return false;
      if (filters.karigar && filters.karigar.length > 0 && !filters.karigar.includes(o.karigar)) return false;
      if (filters.melting && filters.melting.length > 0 && !filters.melting.includes(o.melting)) return false;
      if (filters.orderType && filters.orderType.length > 0 && !filters.orderType.includes(o.orderType)) return false;
      if (filters.date && o.orderRecDate !== filters.date && o.deliveryDate !== filters.date) return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return Object.values(o).some(val => String(val).toLowerCase().includes(q));
      }
      return true;
    });
  }, [orders, filters]);

  // Split orders based on issue status
  const pendingOrders = useMemo(() => {
    const issuedIds = new Set(metalIssues.map(issue => issue.orderId));
    return filteredOrdersBase.filter(o => 
      !issuedIds.has(o.id) && 
      o.orderStage?.toLowerCase() === 'in process' &&
      o.karigar && 
      officeKarigars.has(o.karigar)
    );
  }, [filteredOrdersBase, metalIssues, officeKarigars]);

  const historyOrdersWithIssues = useMemo(() => {
    const issueMap = new Map(metalIssues.map(issue => [issue.orderId, issue]));
    return filteredOrdersBase
      .filter(o => issueMap.has(o.id) && o.karigar && officeKarigars.has(o.karigar))
      .map(o => ({
        order: o,
        issue: issueMap.get(o.id)
      }));
  }, [filteredOrdersBase, metalIssues, officeKarigars]);

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full min-h-0">
      
      {/* Combined Tab Switcher & Filter Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 xl:gap-4 w-full px-2 sm:px-0">
        
        {/* Left: Tab Selection */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          <TabSwitcher
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={[
              { id: 'pending', label: `Pending (${pendingOrders.length})` },
              { id: 'history', label: `History (${historyOrdersWithIssues.length})` }
            ]}
          />
        </div>

        {/* Right: Filters Group */}
        <div className="flex-1 flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center overflow-visible">
          
          {/* Search bar input */}
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search orders..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-amber-500 text-xs md:text-sm h-[32px] md:h-[38px]"
              />
            </div>
            <button
               onClick={() => setShowMobileFilters(!showMobileFilters)}
               className={`lg:hidden flex items-center justify-center rounded-lg shadow-sm h-[32px] w-[32px] flex-shrink-0 transition ${showMobileFilters ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
               title="Toggle Filters"
            >
              <Filter size={14} />
            </button>
            <button
              onClick={handleClearFilters}
              className="lg:hidden flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
              title="Clear Filters"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Expanded dropdowns and date selectors */}
          <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:grid lg:grid-cols-4 gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible`}>
            
            {/* Category Dropdown */}
            <div className="w-full relative">
              <SearchableDropdown
                options={categoriesList}
                isMulti={true}
                value={filters.category}
                onChange={(val) => setFilters({ ...filters, category: val })}
                placeholder="All Categories"
                className="h-[32px] md:h-[38px]"
                height="h-[32px] md:h-[38px]"
                rounded="rounded-lg"
              />
            </div>

            {/* Karigar Dropdown */}
            <div className="w-full relative">
              <SearchableDropdown
                options={karigarsList}
                isMulti={true}
                value={filters.karigar}
                onChange={(val) => setFilters({ ...filters, karigar: val })}
                placeholder="All Karigars"
                className="h-[32px] md:h-[38px]"
                height="h-[32px] md:h-[38px]"
                rounded="rounded-lg"
              />
            </div>

            {/* Melting Dropdown */}
            <div className="w-full relative">
              <SearchableDropdown
                options={meltingList}
                isMulti={true}
                value={filters.melting}
                onChange={(val) => setFilters({ ...filters, melting: val })}
                placeholder="All Melting"
                className="h-[32px] md:h-[38px]"
                height="h-[32px] md:h-[38px]"
                rounded="rounded-lg"
              />
            </div>

            {/* Order Type Dropdown */}
            <div className="w-full relative">
              <SearchableDropdown
                options={typesList}
                isMulti={true}
                value={filters.orderType}
                onChange={(val) => setFilters({ ...filters, orderType: val })}
                placeholder="All Types"
                className="h-[32px] md:h-[38px]"
                height="h-[32px] md:h-[38px]"
                rounded="rounded-lg"
              />
            </div>

          </div>
          
          <button
            onClick={handleClearFilters}
            className="hidden lg:flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-[38px] h-[38px] flex-shrink-0 hover:bg-gray-100 transition-colors shadow-sm ml-1"
            title="Clear Filters"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Main Table view */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {activeTab === 'pending' ? (
          <MetalIssuePending
            orders={pendingOrders}
            onIssueClick={(order) => {
              setSelectedOrder(order);
              setIsFormOpen(true);
            }}
          />
        ) : (
          <MetalIssueHistory
            ordersWithIssues={historyOrdersWithIssues}
            onEditClick={(item) => {
              setSelectedIssueToEdit(item);
              setIsEditOpen(true);
            }}
          />
        )}
      </div>

      {/* Issue Modal Popup Form */}
      <MetalIssueForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedOrder(null);
        }}
        onSave={handleSaveMetalIssue}
        order={selectedOrder}
      />

      {/* Edit Modal Popup Form */}
      <MetalIssueEdit
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedIssueToEdit(null);
        }}
        onSave={handleUpdateMetalIssue}
        order={selectedIssueToEdit?.order}
        issue={selectedIssueToEdit?.issue}
      />
    </div>
  );
};

export default MetalIssue;
