import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { TabSwitcher } from '../../components/StandardButtons';
import SearchableDropdown from '../../components/SearchableDropdown';
/* deleted import */
import FollowUpPendingToday from './FollowUpPendingToday';
import FollowUpPendingTotal from './FollowUpPendingTotal';
import FollowUpHistory from './FollowUpHistory';
import FollowUpForm from './FollowUpForm';
/* deleted import */
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

const FollowUp = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [orders, setOrders] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [metalIssues, setMetalIssues] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState({
    searchQuery: '',
    customer: [],
    category: [],
    stage: [],
    karigar: [],
    flwStatus: ''
  });

  const [historyFilters, setHistoryFilters] = useState({
    searchQuery: '',
    orderNo: ''
  });

  // Load datasets (called on mount and whenever localStorage changes)
  const loadData = () => {
    const savedOrders = localStorage.getItem('ordersDataV3');
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    const savedLogs = localStorage.getItem('followUpHistoryDataV3');
    if (savedLogs) setHistoryLogs(JSON.parse(savedLogs));
    const savedIssues = localStorage.getItem('metalIssuesDataV3');
    if (savedIssues) setMetalIssues(JSON.parse(savedIssues));
  };

  useEffect(() => {
    loadData();
    // Re-sync whenever any other page (e.g. MetalIssue) updates localStorage
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleClearFilters = () => {
    setFilters({ searchQuery: '', customer: [], category: [], stage: [], karigar: [], flwStatus: '' });
    toast.success('Filters cleared');
  };

  const handleClearHistoryFilters = () => {
    setHistoryFilters({ searchQuery: '', orderNo: '' });
    toast.success('Filters cleared');
  };

  // Build latest-log map for quick lookup
  const latestLogMap = useMemo(() => {
    const map = new Map();
    historyLogs.forEach(log => {
      const existing = map.get(log.orderId);
      if (!existing || new Date(log.timestamp) > new Date(existing.timestamp)) {
        map.set(log.orderId, log);
      }
    });
    return map;
  }, [historyLogs]);

  // Active orders (not Delivered or Order Cancel, AND Metal Issue is complete)
  const activeOrders = useMemo(() => {
    const issuedIds = new Set(metalIssues.map(issue => issue.orderId));
    return orders.filter(o => {
      const s = o.orderStage?.toLowerCase() || '';
      const isDeliveredOrCancelled = s === 'delivered' || s === 'order cancel';

      const log = latestLogMap.get(o.id);
      const latestStatus = log?.status?.toLowerCase();
      const isFinishedOrGhat = latestStatus === 'finished jama' || latestStatus === 'ghat jama flw-up done';

      return !isDeliveredOrCancelled && !isFinishedOrGhat && issuedIds.has(o.id);
    });
  }, [orders, metalIssues, latestLogMap]);

  // Today count: active orders matching calling date logic
  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return activeOrders.filter(o => {
      let dateToCheck = null;
      const log = latestLogMap.get(o.id);

      // If call is scheduled, use nextCall date - 1 day
      if (log) {
        const nextCall = log.nextDate || log.nextCallDate;
        if (nextCall) {
          dateToCheck = parseDateString(nextCall);
          if (dateToCheck && !isNaN(dateToCheck.getTime())) {
            dateToCheck.setDate(dateToCheck.getDate() - 1);
          }
        }
      }

      // If no call scheduled, check Metal Issue to calculate Calling Date
      if (!dateToCheck || isNaN(dateToCheck?.getTime())) {
        const kDate = o?.karigarDeliveryDate ? parseDateString(o.karigarDeliveryDate) : (() => {
          const exp = parseDateString(o?.expectedDeliveryDate);
          if (exp && !isNaN(exp.getTime())) {
            const b3 = new Date(exp);
            b3.setDate(b3.getDate() - 3);
            return b3;
          }
          return null;
        })();
        
        if (kDate && !isNaN(kDate.getTime())) {
          const cDate = new Date(kDate);
          cDate.setDate(cDate.getDate() - 3);
          dateToCheck = cDate;
        }
      }

      if (!dateToCheck || isNaN(dateToCheck.getTime())) return false;

      dateToCheck.setHours(0, 0, 0, 0);
      return dateToCheck <= today;
    }).length;
  }, [activeOrders, latestLogMap]);

  // Total count: all active orders
  const totalCount = useMemo(() => activeOrders.length, [activeOrders]);

  // Dropdown option lists (from all orders, not filtered, for stable lists)
  const customersList = useMemo(() => generateFilterOptions(activeOrders, o => o.company), [activeOrders]);
  const categoriesList = useMemo(() => generateFilterOptions(activeOrders, o => o.category), [activeOrders]);
  const stagesList = useMemo(() => generateFilterOptions(activeOrders, o => o.orderStage), [activeOrders]);
  const karigarsList = useMemo(() => generateFilterOptions(activeOrders, o => o.karigar), [activeOrders]);
  const flwStatusesList = useMemo(() => {
    const statuses = historyLogs.map(l => l.status).filter(Boolean);
    return Array.from(new Set(statuses)).sort();
  }, [historyLogs]);

  // History: order numbers list for dropdown
  const orderNosList = useMemo(() =>
    generateFilterOptions(historyLogs, l => l.orderNo)
  , [historyLogs]);

  // History count (total logs)
  const historyCount = historyLogs.length;

  const handleSaveFollowUpLog = (newLog) => {
    const logEntry = { id: `flw-${Date.now()}`, ...newLog };
    const updatedLogs = [logEntry, ...historyLogs];
    setHistoryLogs(updatedLogs);
    localStorage.setItem('followUpHistoryDataV3', JSON.stringify(updatedLogs));

    const updatedOrders = orders.map(o => {
      if (o.id === newLog.orderId || o.orderNo === newLog.orderNo) {
        let updatedFields = { ...o };
        if (newLog.status === 'Change Karigar And Dates') {
          updatedFields.karigar = newLog.karigarName;
          updatedFields.karigarDeliveryDate = newLog.karigarDate;
          updatedFields.expectedDeliveryDate = newLog.expectedDate;
        }
        if (newLog.status === 'Order Cancel') {
          updatedFields.orderStage = 'Order Cancel';
        }
        if (newLog.status === 'Ghat Jama Flw-up Done') {
          updatedFields.orderStage = 'QC';
        }
        if (newLog.status === 'Finished Jama') {
          updatedFields.orderStage = 'Delivered';
        }
        return syncOrderPlannedDates(o, updatedFields);
      }
      return o;
    });

    setOrders(updatedOrders);
    localStorage.setItem('ordersDataV3', JSON.stringify(updatedOrders));
    toast.success('Follow-up call logged successfully');
  };

  return (
    <div className={`p-0 sm:p-2 md:p-6 space-y-2 md:space-y-4 flex flex-col min-h-0 ${
      activeTab === 'history' 
        ? 'h-full overflow-hidden' 
        : 'h-auto md:h-full overflow-y-auto md:overflow-hidden'
    } custom-scrollbar`}>

      {/* Combined Tab Switcher & Filter Row — matches MetalIssue.jsx */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 xl:gap-4 w-full px-2 sm:px-0 flex-shrink-0">

        {/* Left: Tab Switcher */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          <TabSwitcher
            activeTab={activeTab}
            onTabChange={(tab) => { setActiveTab(tab); handleClearFilters(); }}
            tabs={[
              { id: 'today', label: `Today (${todayCount})` },
              { id: 'total', label: `Total (${totalCount})` },
              { id: 'history', label: `History (${historyCount})` }
            ]}
          />
        </div>

        {/* Right: Filters Group — Today & Total */}
        {(activeTab === 'today' || activeTab === 'total') && (
          <div className="flex-1 flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center overflow-visible">

            {/* Search + Mobile toggle */}
            <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder={activeTab === 'today' ? 'Search today\'s list...' : 'Search active orders...'}
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-amber-500 text-xs md:text-sm h-[32px] md:h-[38px]"
                />
              </div>
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`lg:hidden flex items-center justify-center rounded-lg shadow-sm h-[32px] w-[32px] flex-shrink-0 transition ${showMobileFilters ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
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

            {/* Dropdowns grid */}
            <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:grid ${activeTab === 'today' ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible`}>

              <div className="w-full relative">
                <SearchableDropdown
                  options={customersList}
                  isMulti={true}
                  value={filters.customer}
                  onChange={(val) => setFilters({ ...filters, customer: val })}
                  placeholder="All Customers"
                  height="h-[32px] md:h-[38px]"
                  rounded="rounded-lg"
                />
              </div>

              <div className="w-full relative">
                <SearchableDropdown
                  options={categoriesList}
                isMulti={true}
                  value={filters.category}
                  onChange={(val) => setFilters({ ...filters, category: val })}
                  placeholder="All Categories"
                  height="h-[32px] md:h-[38px]"
                  rounded="rounded-lg"
                />
              </div>

              <div className="w-full relative">
                <SearchableDropdown
                  options={stagesList}
                isMulti={true}
                  value={filters.stage}
                  onChange={(val) => setFilters({ ...filters, stage: val })}
                  placeholder="All Stages"
                  height="h-[32px] md:h-[38px]"
                  rounded="rounded-lg"
                />
              </div>

              {/* Karigar — only in Total tab (5 cols) */}
              {activeTab === 'total' && (
                <div className="w-full relative">
                  <SearchableDropdown
                    options={karigarsList}
                isMulti={true}
                    value={filters.karigar}
                    onChange={(val) => setFilters({ ...filters, karigar: val })}
                    placeholder="All Karigars"
                    height="h-[32px] md:h-[38px]"
                    rounded="rounded-lg"
                  />
                </div>
              )}

              <div className="w-full relative">
                <SearchableDropdown
                  options={flwStatusesList}
                isMulti={true}
                  value={filters.flwStatus}
                  onChange={(val) => setFilters({ ...filters, flwStatus: val })}
                  placeholder="All Follow-ups"
                  height="h-[32px] md:h-[38px]"
                  rounded="rounded-lg"
                />
              </div>

            </div>

            {/* Desktop clear */}
            <button
              onClick={handleClearFilters}
              className="hidden lg:flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-[38px] h-[38px] flex-shrink-0 hover:bg-gray-100 transition-colors shadow-sm ml-1"
              title="Clear Filters"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        )}

        {/* Right: History Filters */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center overflow-visible">

            {/* Search */}
            <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[2]">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search historical logs..."
                  value={historyFilters.searchQuery}
                  onChange={(e) => setHistoryFilters({ ...historyFilters, searchQuery: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-amber-500 text-xs md:text-sm h-[32px] md:h-[38px]"
                />
              </div>
              <button
                onClick={handleClearHistoryFilters}
                className="lg:hidden flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
                title="Clear Filters"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Order No dropdown */}
            <div className="w-full lg:w-[220px] relative overflow-visible">
              <SearchableDropdown
                options={orderNosList}
                isMulti={true}
                value={historyFilters.orderNo}
                onChange={(val) => setHistoryFilters({ ...historyFilters, orderNo: val })}
                placeholder="All Order Numbers"
                height="h-[32px] md:h-[38px]"
                rounded="rounded-lg"
              />
            </div>

            {/* Desktop clear */}
            <button
              onClick={handleClearHistoryFilters}
              className="hidden lg:flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-[38px] h-[38px] flex-shrink-0 hover:bg-gray-100 transition-colors shadow-sm ml-1"
              title="Clear Filters"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0 overflow-visible">
        {activeTab === 'today' && (
          <FollowUpPendingToday
            orders={activeOrders}
            historyLogs={historyLogs}
            filters={filters}
            metalIssues={metalIssues}
            onUpdateClick={(order) => { setSelectedOrder(order); setIsFormOpen(true); }}
          />
        )}

        {activeTab === 'total' && (
          <FollowUpPendingTotal
            orders={activeOrders}
            historyLogs={historyLogs}
            filters={filters}
            metalIssues={metalIssues}
            onUpdateClick={(order) => { setSelectedOrder(order); setIsFormOpen(true); }}
          />
        )}

        {activeTab === 'history' && (
          <FollowUpHistory historyLogs={historyLogs} filters={historyFilters} metalIssues={metalIssues} orders={orders} />
        )}
      </div>

      {/* Update Follow-up Log Popup Modal Form */}
      <FollowUpForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedOrder(null); }}
        onSave={handleSaveFollowUpLog}
        order={selectedOrder}
      />

    </div>
  );
};

export default FollowUp;
