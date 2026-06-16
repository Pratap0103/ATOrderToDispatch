import React, { useState, useMemo } from 'react';
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

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parsed = parseDateString(dateStr);
  if (!parsed || isNaN(parsed.getTime())) return dateStr;
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const yyyy = parsed.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
};
const formatTimestamp = (ts) => {
  if (!ts) return '-';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  } catch {
    return ts;
  }
};

const getFlwColor = (status) => {
  switch(status?.toLowerCase()) {
    case 'work started': return 'bg-green-100 text-green-800 border-green-200';
    case 'not started': return 'bg-red-100 text-red-800 border-red-200';
    case 'change karigar and dates': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'ghat jama flw-up done': return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'finished jama': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'order cancel': return 'bg-rose-100 text-rose-800 border-rose-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const FollowUpHistory = ({ historyLogs, filters, metalIssues, orders }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Build metal issue map for quick lookup
  const metalIssueMap = useMemo(() => {
    const map = new Map();
    if (metalIssues) {
      metalIssues.forEach(issue => {
        // Both orderId or orderNo lookup for compatibility
        if (issue.orderId) map.set(issue.orderId, issue);
        if (issue.orderNo) map.set(issue.orderNo, issue);
      });
    }
    return map;
  }, [metalIssues]);

  // Build order map for Order Type lookup
  const orderMap = useMemo(() => {
    const map = new Map();
    if (orders) {
      orders.forEach(o => {
        if (o.id) map.set(o.id, o);
        if (o.orderNo) map.set(o.orderNo, o);
      });
    }
    return map;
  }, [orders]);

  // Apply filters
  const filteredLogs = useMemo(() => {
    // Sort logs so latest is first
    const base = [...historyLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return base.filter(log => {
      if (filters.orderNo && log.orderNo !== filters.orderNo) return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          String(log.orderNo).toLowerCase().includes(q) ||
          String(log.status).toLowerCase().includes(q) ||
          String(log.remarks || '').toLowerCase().includes(q) ||
          String(log.karigarName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [historyLogs, filters]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const raw = filteredLogs.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    return raw.map(log => {
      const order = orderMap.get(log.orderId) || orderMap.get(log.orderNo);
      return {
        ...log,
        orderType: order?.orderType
      };
    });
  }, [filteredLogs, currentPage, itemsPerPage, orderMap]);

  const tableHeaders = [
    { label: 'Order Number', className: 'font-bold' },
    "Done Date", "Status", "Remarks",
    "Order Type",
    "Metal Issue Status", "Paid Weight", "Metal Issue Type",
    "Calling Date", "Next Date Of Call",
    "Old Karigar Name", "Old Karigar Del. Date", "Old Exp. Del. Date",
    "New Karigar Name", "Karigar Del. Date", "Exp. Del. Date",
    "Category",
    "Order Rec. Date",
    "Delivery Date",
    "Expected Delivery Date",
    "Karigar Delivery Date"
  ];

  const renderRow = (log, idx) => {
    const issue = metalIssueMap.get(log.orderId) || metalIssueMap.get(log.orderNo);
    const order = orderMap.get(log.orderId) || orderMap.get(log.orderNo);
    const isKarigarChange = log.status === 'Change Karigar And Dates';
    return (
      <tr key={log.id || idx} className="hover:bg-amber-50/30 transition-colors border-b border-gray-100 group">
        <td className="px-4 py-3 font-bold text-gray-900 text-center whitespace-nowrap">
          {log.orderNo || '-'}
        </td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap font-medium">
          {formatTimestamp(log.timestamp)}
        </td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getFlwColor(log.status)}`}>
            {log.status}
          </span>
        </td>
        <td className="px-4 py-3 text-left text-xs text-gray-700 whitespace-nowrap truncate max-w-[250px]" title={log.remarks}>
          {log.remarks || '-'}
        </td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getOrderTypeColor(order?.orderType)}`}>{order?.orderType || '-'}</span>
        </td>
        <td className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap">
          {issue ? (
            <span className={`px-2 py-0.5 rounded font-bold border ${issue.metalIssueStatus === 'Metal On Delivery' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
              {issue.metalIssueStatus}
            </span>
          ) : '-'}
        </td>
        <td className="px-4 py-3 text-center text-xs font-bold text-gray-800 whitespace-nowrap">
          {issue ? `${issue.paidWeight} g` : '-'}
        </td>
        <td className="px-4 py-3 text-center text-xs font-semibold text-amber-600 whitespace-nowrap">
          {issue?.metalIssueType || '-'}
        </td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          {(() => {
            if (!issue?.timestamp) return <span className="text-gray-400">-</span>;
            let callingDateStr = null;
            if (log && (log.nextDate || log.nextCallDate)) {
              const nextD = parseDateString(log.nextDate || log.nextCallDate);
              if (nextD && !isNaN(nextD.getTime())) {
                const cDate = new Date(nextD);
                cDate.setDate(cDate.getDate() - 1);
                callingDateStr = cDate.toISOString();
              }
            }
            if (!callingDateStr) {
              const kDate = order?.karigarDeliveryDate ? parseDateString(order.karigarDeliveryDate) : (() => {
                const exp = parseDateString(order?.expectedDeliveryDate);
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
                callingDateStr = cDate.toISOString();
              }
            }
            if (!callingDateStr) return <span className="text-gray-400">-</span>;

            let delayDisplay = null;
            let isPastDue = false;
            if (callingDateStr) {
              const tDate = new Date();
              tDate.setHours(0,0,0,0);
              const cDateObj = new Date(callingDateStr);
              cDateObj.setHours(0,0,0,0);
              if (tDate > cDateObj) {
                isPastDue = true;
                const delayObj = calculateDelay(callingDateStr, new Date().toISOString());
                if (delayObj.isDelayed) delayDisplay = delayObj.display;
              }
            }

            return (
              <span className={`px-2 py-1 rounded font-bold border ${
                isPastDue
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : 'bg-blue-100 text-blue-800 border-blue-200'
              }`}>
                {formatTargetDate(callingDateStr)}
                {delayDisplay && <span className="ml-1 text-[9px] text-red-600 font-black">({delayDisplay})</span>}
              </span>
            );
          })()}
        </td>
        <td className="px-4 py-3 text-center text-xs text-red-600 whitespace-nowrap font-bold">
          {log.nextDate ? formatDate(log.nextDate) : '-'}
        </td>

        {/* ── OLD values (before change) ── */}
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          {isKarigarChange ? (
            <span className="text-red-600 font-semibold line-through decoration-red-400">
              {log.oldKarigarName || '-'}
            </span>
          ) : <span className="text-gray-300">—</span>}
        </td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          {isKarigarChange ? (
            <span className="text-red-500 font-medium line-through decoration-red-400">
              {log.oldKarigarDate ? formatDate(log.oldKarigarDate) : '-'}
            </span>
          ) : <span className="text-gray-300">—</span>}
        </td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          {isKarigarChange ? (
            <span className="text-red-500 font-medium line-through decoration-red-400">
              {log.oldExpectedDate ? formatDate(log.oldExpectedDate) : '-'}
            </span>
          ) : <span className="text-gray-300">—</span>}
        </td>

        {/* ── NEW values (after change) ── */}
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          {isKarigarChange ? (
            <span className="text-green-700 font-bold">{log.karigarName || '-'}</span>
          ) : (
            <span className="text-gray-600 font-semibold">{log.karigarName || '-'}</span>
          )}
        </td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          {isKarigarChange ? (
            <span className="text-green-600 font-medium">{log.karigarDate ? formatDate(log.karigarDate) : '-'}</span>
          ) : (
            <span className="text-gray-500">{log.karigarDate ? formatDate(log.karigarDate) : '-'}</span>
          )}
        </td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          {isKarigarChange ? (
            <span className="text-green-600 font-medium">{log.expectedDate ? formatDate(log.expectedDate) : '-'}</span>
          ) : (
            <span className="text-gray-500">{log.expectedDate ? formatDate(log.expectedDate) : '-'}</span>
          )}
        </td>
        
        {/* NEW ADDED COLUMNS */}
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order?.category || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{formatDate(order?.orderRecDate)}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{formatDate(order?.deliveryDate)}</td>
        <td className="px-4 py-3 text-center text-xs font-bold text-gray-800 whitespace-nowrap">{formatDate(order?.expectedDeliveryDate)}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">
          {order?.karigarDeliveryDate ? formatDate(order?.karigarDeliveryDate) : (() => {
            const exp = parseDateString(order?.expectedDeliveryDate);
            if (exp && !isNaN(exp.getTime())) {
              const before3Days = new Date(exp);
              before3Days.setDate(before3Days.getDate() - 3);
              return formatDate(before3Days);
            }
            return '-';
          })()}
        </td>
      </tr>
    );
  };

  const renderCard = (log, idx) => {
    const isKarigarChange = log.status === 'Change Karigar And Dates';
    const order = orderMap.get(log.orderId) || orderMap.get(log.orderNo);
    const issue = metalIssueMap.get(log.orderId) || metalIssueMap.get(log.orderNo);
    return (
      <div key={log.id || idx} className="bg-white rounded-xl border border-amber-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-amber-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <span className="text-xs font-bold text-gray-900">Order: {log.orderNo || '-'}</span>
          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${getFlwColor(log.status)}`}>
            {log.status}
          </span>
        </div>
        <div className="text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50 space-y-1">
          <div>
            <span className="text-gray-400 uppercase text-[8px] tracking-tight block">Timestamp</span>
            <span className="text-gray-700 font-semibold">{formatTimestamp(log.timestamp)}</span>
          </div>
          <div>
            <span className="text-gray-400 uppercase text-[8px] tracking-tight block">Order Type</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getOrderTypeColor(order?.orderType)}`}>{order?.orderType || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 uppercase text-[8px] tracking-tight block">Remarks</span>
            <span className="text-gray-700 font-semibold">{log.remarks || '-'}</span>
          </div>
          {(() => {
            if (issue?.timestamp) {
              let callingDateStr = null;
              if (log && (log.nextDate || log.nextCallDate)) {
                const nextD = parseDateString(log.nextDate || log.nextCallDate);
                if (nextD && !isNaN(nextD.getTime())) {
                  const cDate = new Date(nextD);
                  cDate.setDate(cDate.getDate() - 1);
                  callingDateStr = cDate.toISOString();
                }
              }
              if (!callingDateStr) {
                const kDate = order?.karigarDeliveryDate ? parseDateString(order.karigarDeliveryDate) : (() => {
                  const exp = parseDateString(order?.expectedDeliveryDate);
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
                  callingDateStr = cDate.toISOString();
                }
              }
              if (!callingDateStr) return null;

              let delayDisplay = null;
              let isPastDue = false;
              if (callingDateStr) {
                const tDate = new Date();
                tDate.setHours(0,0,0,0);
                const cDateObj = new Date(callingDateStr);
                cDateObj.setHours(0,0,0,0);
                if (tDate > cDateObj) {
                  isPastDue = true;
                  const delayObj = calculateDelay(callingDateStr, new Date().toISOString());
                  if (delayObj.isDelayed) delayDisplay = delayObj.display;
                }
              }

              return (
                <div>
                  <span className="text-gray-400 uppercase text-[8px] block">Calling Date</span>
                  <span className={`px-1 py-0.5 rounded text-[9px] font-bold border inline-block ${
                    isPastDue
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  }`}>
                    {formatTargetDate(callingDateStr)}
                    {delayDisplay && <span className="ml-1 text-[8px] text-red-600 font-black">({delayDisplay})</span>}
                  </span>
                </div>
              );
            }
            return null;
          })()}
          {log.nextDate && (
            <div>
              <span className="text-gray-400 uppercase text-[8px] block">Next Call</span>
              <span className="text-red-600 font-bold">{formatDate(log.nextDate)}</span>
            </div>
          )}
          {isKarigarChange && (
            <div className="pt-1 border-t border-slate-200/50 mt-1 space-y-1.5">
              <span className="text-[8px] uppercase font-black tracking-widest text-purple-600 block">Karigar Change</span>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div>
                  <span className="text-gray-400 uppercase text-[7px] block">Old Karigar</span>
                  <span className="text-red-500 font-bold line-through">{log.oldKarigarName || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[7px] block">New Karigar</span>
                  <span className="text-green-700 font-bold">{log.karigarName || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[7px] block">Old Del. Date</span>
                  <span className="text-red-400 font-semibold line-through">{log.oldKarigarDate ? formatDate(log.oldKarigarDate) : '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[7px] block">New Del. Date</span>
                  <span className="text-green-600 font-semibold">{log.karigarDate ? formatDate(log.karigarDate) : '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[7px] block">Old Exp. Date</span>
                  <span className="text-red-400 font-semibold line-through">{log.oldExpectedDate ? formatDate(log.oldExpectedDate) : '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[7px] block">New Exp. Date</span>
                  <span className="text-green-600 font-semibold">{log.expectedDate ? formatDate(log.expectedDate) : '-'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 flex flex-col h-full min-h-0">

      {/* Main History Table view */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedLogs}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="2200px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredLogs.length}
          itemsPerPageOptions={[50, 100, 200]}
        />
      </div>

    </div>
  );
};

export default FollowUpHistory;
