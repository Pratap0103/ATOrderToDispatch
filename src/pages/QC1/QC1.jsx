import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchableDropdown from '../../components/SearchableDropdown';
/* deleted import */
import { TabSwitcher } from '../../components/StandardButtons';
import QC1Pending from './QC1Pending';
import QC1History from './QC1History';
import QCForm from './QCForm';
/* deleted import */

const QC1 = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState({
    searchQuery: '',
    category: [],
    karigar: [],
    melting: [],
    orderType: []
  });

  const [followUpLogs, setFollowUpLogs] = useState([]);
  const [metalIssues, setMetalIssues] = useState([]);

  // Load from localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('ordersDataV3');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
    const savedLogs = localStorage.getItem('followUpHistoryDataV3');
    if (savedLogs) {
      setFollowUpLogs(JSON.parse(savedLogs));
    }
    const savedIssues = localStorage.getItem('metalIssuesDataV3');
    if (savedIssues) {
      setMetalIssues(JSON.parse(savedIssues));
    }
  }, []);

  const handleSaveQC = (updatedOrder) => {
    if (updatedOrder.status3 === 'QC Okay' && updatedOrder.qc1Type === 'Partly Clear' && !updatedOrder.id.includes('-P')) {
      const originalOrder = orders.find(o => o.id === updatedOrder.id);
      if (originalOrder) {
        // Strip any existing serial suffix from orderNo
        const baseOrderNo = originalOrder.orderNo.replace(/-\d+P$/, '');
        
        // Find next suffix
        let maxSuffix = 0;
        orders.forEach(o => {
          if (o.orderNo) {
            const match = o.orderNo.match(new RegExp(`^${baseOrderNo}-(\\d+)P$`));
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxSuffix) {
                maxSuffix = num;
              }
            }
          }
        });
        const nextSuffix = maxSuffix + 1;
        const cloneOrderNo = `${baseOrderNo}-${nextSuffix}P`;
        
        // Create a clone representing the completed/cleared portion
        const cloneOrder = {
          ...originalOrder,
          id: `${originalOrder.id}-P${nextSuffix}`,
          orderNo: cloneOrderNo,
          status3: 'QC Okay',
          qc1Type: 'Partly Clear',
          qcRemarks: updatedOrder.qcRemarks,
          qc1Timestamp: new Date().toISOString()
        };
        
        const prevForSync = { ...originalOrder, status3: undefined, qc1Type: undefined };
        const syncedClone = syncOrderPlannedDates(prevForSync, cloneOrder);
        
        // Update original order status3/qc1Type/remarks to show in Pending
        const resetOriginalOrder = {
          ...originalOrder,
          status3: 'QC Okay',
          qc1Type: 'Partly Clear',
          qcRemarks: updatedOrder.qcRemarks,
          qc1Timestamp: new Date().toISOString()
        };
        
        const updatedList = orders.map(o => o.id === originalOrder.id ? resetOriginalOrder : o);
        updatedList.push(syncedClone);
        
        setOrders(updatedList);
        localStorage.setItem('ordersDataV3', JSON.stringify(updatedList));
        toast.success(`Partly Clear order ${cloneOrderNo} generated and moved to next stage`);
        return;
      }
    }

    saveOrderAndSyncPlannedDates(orders, updatedOrder, setOrders);
    toast.success('QC1 status updated successfully');
  };

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      category: [],
      karigar: [],
      melting: [],
      orderType: []
    });
    toast.success('Filters cleared');
  };

  // Compute latest follow-up status per order
  const latestFollowUpMap = useMemo(() => {
    const map = new Map();
    const sorted = [...followUpLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    sorted.forEach(log => {
      map.set(log.orderId || log.orderNo, log);
    });
    return map;
  }, [followUpLogs]);

  const issueMap = useMemo(() => {
    const map = new Map();
    metalIssues.forEach(issue => {
      map.set(issue.orderId, issue);
    });
    return map;
  }, [metalIssues]);

  const enrichOrder = (o) => {
    const baseId = String(o.id).replace(/-P\d+$/, '');
    const issue = issueMap.get(baseId);
    return {
      ...o,
      metalIssueType: o.metalIssueType || issue?.metalIssueType || '-'
    };
  };

  // Base split without filters
  const basePendingOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.id && String(o.id).includes('-P')) return false;
      if (o.status3 === 'QC Okay' && o.qc1Type === 'Complete') return false;
      const followUpLog = latestFollowUpMap.get(o.id) || latestFollowUpMap.get(o.orderNo);
      const isGhatJamaDone = followUpLog?.status === 'Ghat Jama Flw-up Done';
      return (o.orderStage === 'QC' || o.orderStage === 'QC1') && isGhatJamaDone;
    }).map(enrichOrder);
  }, [orders, latestFollowUpMap, issueMap]);

  const baseHistoryOrders = useMemo(() => {
    return orders.filter(o => o.status3 === 'QC Okay' && (o.qc1Type === 'Complete' || (o.id && String(o.id).includes('-P')))).map(enrichOrder);
  }, [orders, issueMap]);

  const activeBaseOrders = activeTab === 'pending' ? basePendingOrders : baseHistoryOrders;

  const categoriesList = useMemo(() => generateFilterOptions(activeBaseOrders, o => o.category), [activeBaseOrders]);
  const karigarsList = useMemo(() => generateFilterOptions(activeBaseOrders, o => o.karigar), [activeBaseOrders]);
  const meltingList = useMemo(() => generateFilterOptions(activeBaseOrders, o => o.melting), [activeBaseOrders]);
  const typesList = useMemo(() => generateFilterOptions(activeBaseOrders, o => o.orderType), [activeBaseOrders]);

  // Filtered orders list matching search parameters
  


  // Pending: only orders that came from Follow-up "Ghat Jama Flw-up Done" (orderStage === 'QC')
  // and have not yet been marked QC Okay + Complete
  

  // History: completed QC orders
  
  

  // Filtered lists
  const pendingOrders = useMemo(() => {
    return basePendingOrders.filter(o => {
      if (filters.category && filters.category.length > 0 && !filters.category.includes(o.category)) return false;
      if (filters.karigar && filters.karigar.length > 0 && !filters.karigar.includes(o.karigar)) return false;
      if (filters.melting && filters.melting.length > 0 && !filters.melting.includes(o.melting)) return false;
      if (filters.orderType && filters.orderType.length > 0 && !filters.orderType.includes(o.orderType)) return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return Object.values(o).some(val => String(val).toLowerCase().includes(q));
      }
      return true;
    });
  }, [basePendingOrders, filters]);

  const historyOrders = useMemo(() => {
    return baseHistoryOrders.filter(o => {
      if (filters.category && filters.category.length > 0 && !filters.category.includes(o.category)) return false;
      if (filters.karigar && filters.karigar.length > 0 && !filters.karigar.includes(o.karigar)) return false;
      if (filters.melting && filters.melting.length > 0 && !filters.melting.includes(o.melting)) return false;
      if (filters.orderType && filters.orderType.length > 0 && !filters.orderType.includes(o.orderType)) return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return Object.values(o).some(val => String(val).toLowerCase().includes(q));
      }
      return true;
    });
  }, [baseHistoryOrders, filters]);


  // Counts
  const pendingCount = pendingOrders.length;
  const historyCount = historyOrders.length;

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full min-h-0">
      
      {/* Combined Tab Switcher & Filter Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 xl:gap-4 w-full px-2 sm:px-0">
        
        {/* Left: Tab Selection */}
        <div className="flex-shrink-0">
          <TabSwitcher
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={[
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'history', label: `History (${historyCount})` }
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

          {/* Expanded dropdowns */}
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
          <QC1Pending
            orders={pendingOrders}
            onQCClick={(order) => {
              setSelectedOrder(order);
              setIsFormOpen(true);
            }}
          />
        ) : (
          <QC1History
            orders={historyOrders}
            onEditClick={(order) => {
              setSelectedOrder(order);
              setIsFormOpen(true);
            }}
          />
        )}
      </div>

      {/* QC Form Modal */}
      <QCForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedOrder(null);
        }}
        onSave={handleSaveQC}
        order={selectedOrder}
        isEdit={activeTab === 'history'}
      />
    </div>
  );
};

export default QC1;
