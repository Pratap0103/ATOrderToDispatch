import React, { useState, useMemo } from 'react';
import { ClipboardCheck } from 'lucide-react';
import DataTable from '../../components/DataTable';
/* deleted import */

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
  match = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
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

const calculateLeftDays = (deliveryDateStr) => {
  if (!deliveryDateStr) return '-';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = parseDateString(deliveryDateStr);
  if (!delivery || isNaN(delivery.getTime())) return '-';
  const diffTime = delivery - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parsed = parseDateString(dateStr);
  if (!parsed || isNaN(parsed.getTime())) return dateStr;
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const yyyy = parsed.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const getStageColor = (stage) => {
  switch(stage?.toLowerCase()) {
    case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'qc': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in progress': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'new': default: return 'bg-amber-100 text-amber-800 border-amber-200';
  }
};

const BanglePolishPending = ({ orders, onActionClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const tableHeaders = [
    { label: 'Action', className: 'sticky left-0 bg-gray-50 z-20 shadow-[1px_0_0_#e5e7eb] w-32 min-w-[128px]' },
    { label: 'Order No', className: 'sticky left-32 bg-gray-50 z-20 shadow-[1px_0_0_#e5e7eb] font-bold' },
    "Planned Date",
    "LEFT Days",
    "Karigar Name",
    "Melting",
    "Metal Issue Type",
    "Total Weight",
    "Order Type",
    "Customer Name",
    "Category",
    "Order Rec. Date",
    "Delivery Date",
    "Expected Delivery Date",
    "Karigar Delivery Date"
  ];

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    return orders.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [orders, currentPage, itemsPerPage]);

  const renderRow = (order, idx) => {
    const leftDays = calculateLeftDays(order.expectedDeliveryDate || order.deliveryDate);
    return (
      <tr key={order.id || idx} className="hover:bg-amber-50/30 transition-colors border-b border-gray-100 group">
        <td className="px-2 py-3 sticky left-0 bg-white group-hover:bg-amber-50 z-10 shadow-[1px_0_0_#e5e7eb] text-center whitespace-nowrap w-32 min-w-[128px]">
          <button
            onClick={() => onActionClick(order)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-xs font-bold shadow-sm"
          >
            <ClipboardCheck size={12} />
            <span>Process</span>
          </button>
        </td>
        <td className="px-4 py-3 font-bold text-gray-900 sticky left-32 bg-white group-hover:bg-amber-50 z-10 shadow-[1px_0_0_#e5e7eb] text-center whitespace-nowrap">
          {order.orderNo || order.orderNumber || '-'}
        </td>
        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
          {order.currentStagePlannedDate ? (
            <span className={`px-2 py-1 rounded font-bold border ${
              new Date() > new Date(order.currentStagePlannedDate)
                ? 'bg-red-100 text-red-800 border-red-200 animate-pulse'
                : 'bg-blue-100 text-blue-800 border-blue-200'
            }`}>
              {formatTargetDate(order.currentStagePlannedDate)}
            </span>
          ) : <span className="text-gray-400">-</span>}
        </td>
        <td className="px-4 py-3 text-center whitespace-nowrap font-medium text-xs">
          <span className={`px-2.5 py-1 rounded-full font-bold border ${leftDays < 0 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
            {leftDays} Days
          </span>
        </td>
        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">{order.karigar || order.karigarName || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.melting || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-amber-600 font-semibold whitespace-nowrap">{order.metalIssueType || '-'}</td>
        <td className="px-4 py-3 text-center text-xs font-bold text-gray-900 whitespace-nowrap">{order.totalWeight || order.weight || '-'} {order.totalWeight ? 'g' : ''}</td>
        <td className="px-4 py-3 text-center whitespace-nowrap"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getOrderTypeColor(order.orderType)}`}>{order.orderType || '-'}</span></td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap font-bold">{order.company || order.customerName || '-'}</td>        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.category || '-'}</td>

        
                <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{formatDate(order.orderRecDate || order.orderDate)}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{formatDate(order.deliveryDate)}</td>
        <td className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap">{formatDate(order.expectedDeliveryDate || order.expectedDate)}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{formatDate(order.karigarDeliveryDate)}</td>
      </tr>
    );
  };

  const renderCard = (order, idx) => {
    const leftDays = calculateLeftDays(order.expectedDeliveryDate || order.deliveryDate);
    return (
      <div key={order.id || idx} className="bg-white rounded-xl border border-amber-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-amber-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <span className="text-xs font-bold text-gray-900">Order: {order.orderNo || order.orderNumber || '-'}</span>
          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${getStageColor(order.orderStage)}`}>
            {order.orderStage || 'New'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Customer</span>
            <span className="text-gray-700 font-bold">{order.company || order.customerName || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Category</span>
            <span className="text-gray-700 font-bold">{order.category || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Karigar</span>
            <span className="text-gray-700 font-semibold">{order.karigar || order.karigarName || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Planned Date</span>
            {order.currentStagePlannedDate ? (
              <span className={`px-1 py-0.5 rounded text-[9px] font-bold border inline-block ${
                new Date() > new Date(order.currentStagePlannedDate)
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : 'bg-blue-100 text-blue-800 border-blue-200'
              }`}>{formatTargetDate(order.currentStagePlannedDate)}</span>
            ) : <span className="text-gray-400">-</span>}
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">LEFT Days</span>
            <span className={`font-bold ${leftDays < 0 ? 'text-red-600' : 'text-green-600'}`}>{leftDays} Days</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Total Weight</span>
            <span className="text-gray-700 font-bold">{order.totalWeight || order.weight || '-'} {order.totalWeight ? 'g' : ''}</span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 mt-1">
          <button
            onClick={() => onActionClick(order)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-sm"
          >
            <ClipboardCheck size={12} /> Process Bangle Polish
          </button>
        </div>
      </div>
    );
  };

  return (
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
      totalResults={orders.length}
      itemsPerPageOptions={[50, 100, 200]}
    />
  );
};

export default BanglePolishPending;
