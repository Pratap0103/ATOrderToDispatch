import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, RotateCcw, Download, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import DataTable from '../../components/DataTable';
import SearchableDropdown from '../../components/SearchableDropdown';
/* deleted import */
import { TabSwitcher } from '../../components/StandardButtons';

const PolishSubmit = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const [filters, setFilters] = useState({
    searchQuery: '',
    startDate: '',
    endDate: '',
    category: [],
    karigar: [],
    melting: [],
    orderType: []
  });

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const loadData = () => {
    const saved = localStorage.getItem('ordersDataV3');
    if (saved) {
      setOrders(JSON.parse(saved));
    }
  };

  // Helper getters
  const getGhatJama = (o) => Number(o.ghatJamaWeight) || 0;
  const getAfterMeena = (o) => Number(o.meenaWeight || o.inhouseAfterMeenaPolish || o.outsideAfterMeenaPolish) || 0;
  const getFinishWeight = (o) => Number(o.inhouseAfterPolishWeight || o.outsideAfterPolishWeight) || 0;
  const getPolishLoss = (o) => Number(o.inhouseMeenaPolishLoss || o.outsideMeenaPolishLoss) || 0;
  const getPolishBalance = (o) => o.polishBalance !== undefined ? Number(o.polishBalance) : (getAfterMeena(o) - getFinishWeight(o) - getPolishLoss(o));
  
  const getType = (o) => o.polishInhouseType || o.polishOutsideType || o.orderType || '-';
  const getRemarks = (o) => o.outsideRemarks || o.qc2Remarks || '-';

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      startDate: '',
      endDate: '',
      category: [],
      karigar: [],
      melting: [],
      orderType: []
    });
    toast.success('Filters cleared');
  };

  const basePendingOrders = useMemo(() => {
    return orders.filter(o => 
      (o.polishInhouseStatus === 'Complete' || o.polishOutsideStatus === 'Complete' || o.banglePolishStatus === 'Complete') && 
      !o.polishSubmitDone
    );
  }, [orders]);

  const baseHistoryOrders = useMemo(() => {
    return orders.filter(o => o.polishSubmitDone === true);
  }, [orders]);

  const activeBaseOrders = activeTab === 'pending' ? basePendingOrders : baseHistoryOrders;

  // Dropdown lists
  const categoriesList = useMemo(() => generateFilterOptions(activeBaseOrders, o => o.category), [activeBaseOrders]);
  const karigarsList = useMemo(() => generateFilterOptions(activeBaseOrders, o => o.karigar || o.karigarName), [activeBaseOrders]);
  const meltingList = useMemo(() => generateFilterOptions(activeBaseOrders, o => o.melting), [activeBaseOrders]);
  const typesList = useMemo(() => generateFilterOptions(activeBaseOrders, o => getType(o)), [activeBaseOrders]);

  const filteredOrders = useMemo(() => {
    return activeBaseOrders.filter(o => {
      // Dates
      if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        const d = new Date(o.orderDate || o.orderRecDate || o.timestamp);
        if (!isNaN(d.getTime()) && (d < start || d > end)) return false;
      }
      
      // Dropdowns
      if (filters.category && filters.category.length > 0 && !filters.category.includes(o.category)) return false;
      if (filters.karigar && filters.karigar.length > 0 && !filters.karigar.includes(o.karigar || o.karigarName)) return false;
      if (filters.melting && filters.melting.length > 0 && !filters.melting.includes(o.melting)) return false;
      if (filters.orderType && filters.orderType.length > 0 && !filters.orderType.includes(getType(o))) return false;

      // Search
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          (o.orderNo || '').toLowerCase().includes(q) ||
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.karigar || o.karigarName || '').toLowerCase().includes(q) ||
          (o.melting || '').toLowerCase().includes(q) ||
          (o.company || o.customerName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeBaseOrders, filters]);

  // Totals
  const totals = useMemo(() => {
    let finishWeight = 0, polishLoss = 0, ghatJama = 0, afterMeena = 0, polishBalance = 0;
    filteredOrders.forEach(o => {
      finishWeight += getFinishWeight(o);
      polishLoss += getPolishLoss(o);
      ghatJama += getGhatJama(o);
      afterMeena += getAfterMeena(o);
      polishBalance += getPolishBalance(o);
    });
    return { finishWeight, polishLoss, ghatJama, afterMeena, polishBalance };
  }, [filteredOrders]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredOrders, currentPage, itemsPerPage]);

  const toggleOrderSelection = (id) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedOrders(newSelected);
  };

  const selectAll = () => {
    if (selectedOrders.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleBulkSubmit = () => {
    if (selectedOrders.size === 0) return;
    const submissionDate = new Date().toISOString();
    const updatedOrders = orders.map(o => {
      if (selectedOrders.has(o.id)) {
        return { ...o, polishSubmitDone: true, polishSubmitTimestamp: submissionDate };
      }
      return o;
    });
    setOrders(updatedOrders);
    localStorage.setItem('ordersDataV3', JSON.stringify(updatedOrders));
    setSelectedOrders(new Set());
    toast.success(`Successfully submitted ${selectedOrders.size} orders!`);
  };

  const downloadExcel = () => {
    const title = activeTab === 'pending' ? 'POLISH DETAILS' : 'POLISH HISTORY DETAILS';
    const headers = [
      'Timestamp', 'Karigar Name', 'Voucher Number', 'Melting', 'Order Number',
      'Ghat Weight', 'After Meena Weight', 'Finish Weight', 'Polish Loss', 'Type',
      'Serial Number', 'Polish Balance'
    ];
    if (activeTab === 'history') headers.push('Done Date');

    const dataRows = filteredOrders.map(o => {
      const row = [
        o.orderDate || o.orderRecDate || '-',
        o.karigar || o.karigarName || '-',
        o.orderNoRef || '-',
        o.melting || '-',
        o.orderNo || o.orderNumber || '-',
        getGhatJama(o).toFixed(3),
        getAfterMeena(o).toFixed(3),
        getFinishWeight(o).toFixed(3),
        getPolishLoss(o).toFixed(3),
        getType(o),
        o.serialNumber || '-',
        getPolishBalance(o).toFixed(3)
      ];
      if (activeTab === 'history') {
        const dateObj = o.polishSubmitTimestamp ? new Date(o.polishSubmitTimestamp) : null;
        row.push(dateObj && !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-GB') : '-');
      }
      return row;
    });

    const summaryTotals = [
      ['Finish Weight', totals.finishWeight.toFixed(3)],
      ['Polish Loss', totals.polishLoss.toFixed(3)],
      ['Ghat Weight', totals.ghatJama.toFixed(3)],
      ['After Meena Weight', totals.afterMeena.toFixed(3)],
      ['Polish Balance', totals.polishBalance.toFixed(3)]
    ];

    const finalDataArray = [headers, ...dataRows, [''], ['']];
    const emptyCells = Array(9).fill('');
    finalDataArray.push([...emptyCells, title]);
    finalDataArray.push([...emptyCells, 'Generated on: ' + new Date().toLocaleString()]);
    
    if (filters.startDate && filters.endDate) {
      finalDataArray.push([...emptyCells, `Date Range: ${filters.startDate} to ${filters.endDate}`]);
    }
    
    finalDataArray.push(['']);
    finalDataArray.push([...emptyCells, 'Summary:']);
    summaryTotals.forEach(tot => finalDataArray.push([...emptyCells, tot[0], tot[1]]));

    const ws = XLSX.utils.aoa_to_sheet(finalDataArray);
    const wscols = headers.map(() => ({ wch: 15 }));
    wscols[9] = { wch: 20 };
    wscols[10] = { wch: 20 };
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Polish Data");
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Polish_${activeTab === 'pending' ? 'Details' : 'History'}_${timestamp}.xlsx`);
  };

  const tableHeaders = [
    ...(activeTab === 'pending' ? [{ 
      label: (
        <div className="flex items-center justify-center">
          <input 
            type="checkbox" 
            checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
            onChange={selectAll}
            className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
          />
        </div>
      ), 
      className: 'sticky left-0 bg-gray-50 shadow-[1px_0_0_#e5e7eb] z-20 w-12 text-center' 
    }] : []),
    { label: 'Timestamp', className: 'text-center whitespace-nowrap' },
    { label: 'Karigar Name', className: 'text-center whitespace-nowrap' },
    { label: 'Voucher Number', className: 'text-center whitespace-nowrap' },
    { label: 'Melting', className: 'text-center whitespace-nowrap' },
    { label: 'Order Number', className: 'text-center font-bold whitespace-nowrap' },
    { label: 'Ghat Weight', className: 'text-center whitespace-nowrap' },
    { label: 'After Meena Weight', className: 'text-center whitespace-nowrap' },
    { label: 'Finish Weight', className: 'text-center whitespace-nowrap font-bold text-amber-700' },
    { label: 'Polish Loss', className: 'text-center whitespace-nowrap text-red-600' },
    { label: 'Type', className: 'text-center whitespace-nowrap' },
    { label: 'Serial Number', className: 'text-center whitespace-nowrap' },
    { label: 'Polish Balance', className: 'text-center whitespace-nowrap font-bold text-blue-700' },
    ...(activeTab === 'history' ? [{ label: 'Done Date', className: 'text-center whitespace-nowrap' }] : [])
  ];

  const renderRow = (order, idx) => (
    <tr key={order.id || idx} className="hover:bg-amber-50/50 transition-colors border-b border-gray-100">
      {activeTab === 'pending' && (
        <td className="px-2 py-3 sticky left-0 bg-white shadow-[1px_0_0_#e5e7eb] z-10 text-center w-12">
          <input 
            type="checkbox"
            checked={selectedOrders.has(order.id)}
            onChange={() => toggleOrderSelection(order.id)}
            className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
          />
        </td>
      )}
      <td className="px-4 py-3 text-center text-xs whitespace-nowrap">{order.orderDate || order.orderRecDate || '-'}</td>
      <td className="px-4 py-3 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">{order.karigar || order.karigarName || '-'}</td>
      <td className="px-4 py-3 text-center text-xs whitespace-nowrap">{order.orderNoRef || '-'}</td>
      <td className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">{order.melting || '-'}</td>
      <td className="px-4 py-3 text-center text-xs font-bold text-gray-900 whitespace-nowrap">{order.orderNo || order.orderNumber || '-'}</td>
      <td className="px-4 py-3 text-center text-xs whitespace-nowrap">{getGhatJama(order).toFixed(3)}</td>
      <td className="px-4 py-3 text-center text-xs whitespace-nowrap">{getAfterMeena(order).toFixed(3)}</td>
      <td className="px-4 py-3 text-center text-xs font-bold text-amber-700 whitespace-nowrap bg-amber-50/30">{getFinishWeight(order).toFixed(3)}</td>
      <td className="px-4 py-3 text-center text-xs font-bold text-red-600 whitespace-nowrap bg-red-50/30">{getPolishLoss(order).toFixed(3)}</td>
      <td className="px-4 py-3 text-center text-xs whitespace-nowrap"><span className="px-2 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">{getType(order)}</span></td>
      <td className="px-4 py-3 text-center text-xs whitespace-nowrap">{order.serialNumber || '-'}</td>
      <td className="px-4 py-3 text-center text-xs font-bold text-blue-700 whitespace-nowrap bg-blue-50/30">{getPolishBalance(order).toFixed(3)}</td>
      {activeTab === 'history' && (
        <td className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap">
          {order.polishSubmitTimestamp ? new Date(order.polishSubmitTimestamp).toLocaleDateString('en-GB') : '-'}
        </td>
      )}
    </tr>
  );

  const renderCard = (order) => (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
      <div className="flex justify-between items-center border-b pb-2">
        <div className="flex items-center gap-2">
          {activeTab === 'pending' && (
            <input 
              type="checkbox"
              checked={selectedOrders.has(order.id)}
              onChange={() => toggleOrderSelection(order.id)}
              className="w-4 h-4 text-amber-600 rounded border-gray-300"
            />
          )}
          <span className="font-bold text-gray-900">Order: {order.orderNo || order.orderNumber}</span>
        </div>
        <span className="px-2 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">{getType(order)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100/50">
        <div className="text-center"><span className="text-gray-400 block uppercase text-[8px] tracking-tight">Karigar</span><span className="font-semibold text-gray-700">{order.karigar || order.karigarName || '-'}</span></div>
        <div className="text-center"><span className="text-gray-400 block uppercase text-[8px] tracking-tight">After Meena</span><span className="font-semibold text-gray-700">{getAfterMeena(order).toFixed(3)}</span></div>
        <div className="text-center"><span className="text-gray-400 block uppercase text-[8px] tracking-tight">Finish Wt</span><span className="font-semibold text-amber-700">{getFinishWeight(order).toFixed(3)}</span></div>
        <div className="text-center"><span className="text-gray-400 block uppercase text-[8px] tracking-tight">Polish Loss</span><span className="font-semibold text-red-600">{getPolishLoss(order).toFixed(3)}</span></div>
        <div className="col-span-2 text-center bg-blue-50 p-1.5 rounded font-bold text-blue-700 border border-blue-200 mt-1">
          Polish Balance: {getPolishBalance(order).toFixed(3)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full min-h-0">
      
      {/* Top action row: Tabs + Search + Submit/Download */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 xl:gap-4 w-full px-2 sm:px-0">
        <div className="flex-shrink-0">
          <TabSwitcher
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setSelectedOrders(new Set());
              setCurrentPage(1);
            }}
            tabs={[
              { id: 'pending', label: `Pending (${basePendingOrders.length})` },
              { id: 'history', label: `History (${baseHistoryOrders.length})` }
            ]}
          />
        </div>

        <div className="flex-1 flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center overflow-visible">
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
            >
              <Filter size={14} />
            </button>
            <button
              onClick={handleClearFilters}
              className="lg:hidden flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:grid lg:grid-cols-4 gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible`}>
            <div className="w-full relative">
              <SearchableDropdown options={categoriesList} isMulti={true} value={filters.category} onChange={(val) => setFilters({ ...filters, category: val })} placeholder="All Categories" className="h-[32px] md:h-[38px]" height="h-[32px] md:h-[38px]" rounded="rounded-lg" />
            </div>
            <div className="w-full relative">
              <SearchableDropdown options={karigarsList} isMulti={true} value={filters.karigar} onChange={(val) => setFilters({ ...filters, karigar: val })} placeholder="All Karigars" className="h-[32px] md:h-[38px]" height="h-[32px] md:h-[38px]" rounded="rounded-lg" />
            </div>
            <div className="w-full relative">
              <SearchableDropdown options={meltingList} isMulti={true} value={filters.melting} onChange={(val) => setFilters({ ...filters, melting: val })} placeholder="All Melting" className="h-[32px] md:h-[38px]" height="h-[32px] md:h-[38px]" rounded="rounded-lg" />
            </div>
            <div className="w-full relative">
              <SearchableDropdown options={typesList} isMulti={true} value={filters.orderType} onChange={(val) => setFilters({ ...filters, orderType: val })} placeholder="All Types" className="h-[32px] md:h-[38px]" height="h-[32px] md:h-[38px]" rounded="rounded-lg" />
            </div>
          </div>

          <button onClick={handleClearFilters} className="hidden lg:flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-[38px] h-[38px] flex-shrink-0 hover:bg-gray-100 transition-colors shadow-sm ml-1">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Date Filters and Action Buttons Row */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 w-full px-2 sm:px-0">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm w-full md:w-auto">
          <label className="text-xs font-semibold text-gray-600">From:</label>
          <input 
            type="date" 
            value={filters.startDate} 
            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
            className="text-xs border-none outline-none bg-transparent"
          />
          <label className="text-xs font-semibold text-gray-600 ml-2">To:</label>
          <input 
            type="date" 
            value={filters.endDate} 
            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
            className="text-xs border-none outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center justify-end gap-2 w-full md:w-auto">
          <button 
            onClick={downloadExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold bg-[#1976d2] text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Download size={16} /> Download
          </button>
          
          {activeTab === 'pending' && (
            <button 
              onClick={handleBulkSubmit}
              disabled={selectedOrders.size === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 md:px-5 md:py-2 text-xs md:text-sm font-bold bg-[#4CAF50] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors shadow-sm"
            >
              <CheckSquare size={16} /> Submit ({selectedOrders.size})
            </button>
          )}
        </div>
      </div>

      {/* Totals Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 px-2 sm:px-0">
        {[
          { label: 'Finish Weight', value: totals.finishWeight, color: 'text-amber-600' },
          { label: 'Polish Loss', value: totals.polishLoss, color: 'text-red-600' },
          { label: 'Ghat Weight', value: totals.ghatJama, color: 'text-amber-600' },
          { label: 'After Meena', value: totals.afterMeena, color: 'text-amber-600' },
          { label: 'Polish Balance', value: totals.polishBalance, color: 'text-blue-600' },
        ].map(tot => (
          <div key={tot.label} className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
            <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wide">{tot.label}</span>
            <span className={`text-sm md:text-lg font-black ${tot.color} mt-1`}>{tot.value.toFixed(3)}</span>
          </div>
        ))}
      </div>

      {/* Main Table view */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedOrders}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1600px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredOrders.length}
          itemsPerPageOptions={[50, 100, 200, 500]}
        />
      </div>
    </div>
  );
};

export default PolishSubmit;
