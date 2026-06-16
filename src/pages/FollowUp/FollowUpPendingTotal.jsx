import React, { useState, useMemo } from 'react';
import { Pencil, Layers, ShieldCheck, Tag } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

const getStageColor = (stage) => {
  switch(stage?.toLowerCase()) {
    case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'qc': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in progress': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'follow up':
    case 'follow-up': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'new': default: return 'bg-amber-100 text-amber-800 border-amber-200';
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

const FollowUpPendingTotal = ({ orders, historyLogs, filters, metalIssues, onUpdateClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Build metal issue map for quick lookup
  const metalIssueMap = useMemo(() => {
    const map = new Map();
    if (metalIssues) {
      metalIssues.forEach(issue => {
        map.set(issue.orderId, issue);
      });
    }
    return map;
  }, [metalIssues]);

  // Map history logs
  const ordersWithLogs = useMemo(() => {
    const logMap = new Map();
    historyLogs.forEach(log => {
      const oid = log.orderId;
      if (!logMap.has(oid)) {
        logMap.set(oid, []);
      }
      logMap.get(oid).push(log);
    });

    logMap.forEach((logs) => {
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });

    return orders.map(order => {
      const logs = logMap.get(order.id) || [];
      const latestLog = logs[0] || null;
      return {
        order,
        latestLog,
        allLogs: logs
      };
    });
  }, [orders, historyLogs]);

  // Total Active Orders filtered
  const filteredOrders = useMemo(() => {
    return ordersWithLogs.filter(item => {
      const o = item.order;
      const l = item.latestLog;

      // Handle both array (multi-select) and string values
      const customerFilter = Array.isArray(filters.customer) ? filters.customer : (filters.customer ? [filters.customer] : []);
      const categoryFilter = Array.isArray(filters.category) ? filters.category : (filters.category ? [filters.category] : []);
      const meltingFilter = Array.isArray(filters.melting) ? filters.melting : (filters.melting ? [filters.melting] : []);
      const stageFilter = Array.isArray(filters.stage) ? filters.stage : (filters.stage ? [filters.stage] : []);
      const flwFilter = Array.isArray(filters.flwStatus) ? filters.flwStatus : (filters.flwStatus ? [filters.flwStatus] : []);
      const karigarFilter = Array.isArray(filters.karigar) ? filters.karigar : (filters.karigar ? [filters.karigar] : []);

      if (customerFilter.length > 0 && !customerFilter.includes(o.company)) return false;
      if (categoryFilter.length > 0 && !categoryFilter.includes(o.category)) return false;
      if (meltingFilter.length > 0 && !meltingFilter.includes(o.melting)) return false;
      if (stageFilter.length > 0 && !stageFilter.includes(o.orderStage)) return false;
      if (flwFilter.length > 0 && !flwFilter.includes(l?.status)) return false;
      if (karigarFilter.length > 0 && !karigarFilter.includes(o.karigar)) return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          String(o.orderNo).toLowerCase().includes(q) ||
          String(o.company).toLowerCase().includes(q) ||
          String(o.karigar).toLowerCase().includes(q) ||
          String(l?.remarks || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ordersWithLogs, filters]);

  // Metrics
  const stageMetrics = useMemo(() => {
    const counts = {};
    filteredOrders.forEach(item => {
      const s = item.order.orderStage || 'New';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]);
  }, [filteredOrders]);

  const statusMetrics = useMemo(() => {
    const counts = {};
    filteredOrders.forEach(item => {
      const s = item.latestLog?.status || 'Pending Call';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]);
  }, [filteredOrders]);

  const typeMetrics = useMemo(() => {
    const counts = {};
    filteredOrders.forEach(item => {
      const t = item.order.orderType || 'Standard';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]);
  }, [filteredOrders]);

  // Chart Compliant Data for Stage Distribution
  const stageChartData = useMemo(() => {
    const colors = ["#6366f1", "#0ea5e9", "#d4a317", "#10b981", "#f43f5e", "#8b5cf6", "#a855f7"];
    return stageMetrics.map(([name, value], idx) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value,
      color: colors[idx % colors.length]
    }));
  }, [stageMetrics]);

  // Chart Compliant Data for Status Distribution
  const statusChartData = useMemo(() => {
    const colors = ["#10b981", "#d4a317", "#6366f1", "#0ea5e9", "#f43f5e", "#8b5cf6", "#a855f7"];
    return statusMetrics.map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [statusMetrics]);

  // Chart Compliant Data for Order Type Distribution
  const typeChartData = useMemo(() => {
    const colors = ["#d4a317", "#10b981", "#f43f5e", "#0ea5e9", "#6366f1", "#8b5cf6", "#a855f7"];
    return typeMetrics.map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [typeMetrics]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const raw = filteredOrders.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    return raw.map(item => ({
      ...item,
      orderType: item.order?.orderType
    }));
  }, [filteredOrders, currentPage, itemsPerPage]);

  const tableHeaders = [
    { label: 'Action', className: 'sticky left-0 bg-gray-50 z-20 shadow-[1px_0_0_#e5e7eb] w-32 min-w-[128px]' },
    { label: 'Order No', className: 'sticky left-32 bg-gray-50 z-20 shadow-[1px_0_0_#e5e7eb] font-bold' },
    "Calling Date", "Next Date Of Call", "Customer Name", "Category Name", "Melting", "Weight", 
    "Total Quantity", "Karigar Now", "Order Rec. Date", "Delivery Date", 
    "Expected Delivery Date", "Karigar Delivery Date", "Metal Issue Status", "Paid Weight", "Metal Issue Type", "Order Stage", "Follow-up Status", 
    "Order Status", "Order Type", "Remarks"
  ];

  const renderRow = (item, idx) => {
    const o = item.order;
    const l = item.latestLog;
    const issue = metalIssueMap.get(o.id);
    
    return (
      <tr key={o.id || idx} className="hover:bg-amber-50/30 transition-colors border-b border-gray-100 group">
        <td className="px-2 py-3 sticky left-0 bg-white group-hover:bg-amber-50 z-10 shadow-[1px_0_0_#e5e7eb] text-center whitespace-nowrap w-32 min-w-[128px]">
          <button
            onClick={() => onUpdateClick(o)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100 transition-all text-xs font-bold shadow-sm"
          >
            <Pencil size={12} />
            <span>Update</span>
          </button>
        </td>
        <td className="px-4 py-3 font-bold text-gray-900 sticky left-32 bg-white group-hover:bg-amber-50 z-10 shadow-[1px_0_0_#e5e7eb] text-center whitespace-nowrap">
          {o.orderNo || '-'}
        </td>
        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
          {(() => {
            if (!issue?.timestamp) return <span className="text-gray-400">-</span>;
            let callingDateStr = null;
            if (l && (l.nextDate || l.nextCallDate)) {
              const nextD = parseDateString(l.nextDate || l.nextCallDate);
              if (nextD && !isNaN(nextD.getTime())) {
                const cDate = new Date(nextD);
                cDate.setDate(cDate.getDate() - 1);
                callingDateStr = cDate.toISOString();
              }
            }
            if (!callingDateStr) {
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
                  ? 'bg-red-100 text-red-800 border-red-200 animate-pulse'
                  : 'bg-blue-100 text-blue-800 border-blue-200'
              }`}>
                {formatTargetDate(callingDateStr)}
                {delayDisplay && <span className="ml-1 text-[9px] text-red-600 font-black">({delayDisplay})</span>}
              </span>
            );
          })()}
        </td>
        <td className="px-4 py-3 text-center text-xs text-red-600 whitespace-nowrap font-bold">
          {l ? formatDate(l.nextDate || l.nextCallDate) : 'Call Pending'}
        </td>
        <td className="px-4 py-3 text-center text-xs font-bold text-gray-800 whitespace-nowrap">{o.company || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{o.category || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{o.melting || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{o.fromWeight || '-'}</td>
        <td className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap">{o.quantity || '-'}</td>
        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">{o.karigar || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{formatDate(o.orderRecDate)}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{formatDate(o.deliveryDate)}</td>
        <td className="px-4 py-3 text-center text-xs font-bold text-gray-800 whitespace-nowrap">{formatDate(o.expectedDeliveryDate)}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">
          {o.karigarDeliveryDate ? formatDate(o.karigarDeliveryDate) : (() => {
            const exp = parseDateString(o.expectedDeliveryDate);
            if (exp && !isNaN(exp.getTime())) {
              const before3Days = new Date(exp);
              before3Days.setDate(before3Days.getDate() - 3);
              return formatDate(before3Days);
            }
            return '-';
          })()}
        </td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
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
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStageColor(o.orderStage)}`}>
            {o.orderStage || 'New'}
          </span>
        </td>
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getFlwColor(l?.status)}`}>
            {l?.status || 'Pending'}
          </span>
        </td>
        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Active</td>
        <td className="px-4 py-3 text-center whitespace-nowrap"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getOrderTypeColor(o.orderType)}`}>{o.orderType || '-'}</span></td>
        <td className="px-4 py-3 text-left text-xs text-gray-500 whitespace-nowrap truncate max-w-[200px]" title={l?.remarks}>{l?.remarks || '-'}</td>
      </tr>
    );
  };

  const renderCard = (item, idx) => {
    const o = item.order;
    const l = item.latestLog;
    const issue = metalIssueMap.get(o.id);
    
    return (
      <div key={o.id || idx} className="bg-white rounded-xl border border-amber-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-amber-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <span className="text-xs font-bold text-gray-900">Order: {o.orderNo || '-'}</span>
          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${getStageColor(o.orderStage)}`}>
            {o.orderStage || 'New'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Customer</span>
            <span className="text-gray-800 font-bold">{o.company || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Karigar</span>
            <span className="text-gray-700 font-semibold">{o.karigar || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Calling Date</span>
            {(() => {
              if (!issue?.timestamp) return <span className="text-gray-400">-</span>;
              let callingDateStr = null;
              if (l && (l.nextDate || l.nextCallDate)) {
                const nextD = parseDateString(l.nextDate || l.nextCallDate);
                if (nextD && !isNaN(nextD.getTime())) {
                  const cDate = new Date(nextD);
                  cDate.setDate(cDate.getDate() - 1);
                  callingDateStr = cDate.toISOString();
                }
              }
              if (!callingDateStr) {
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
                <span className={`px-1 py-0.5 rounded text-[9px] font-bold border inline-block ${
                  isPastDue
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : 'bg-blue-100 text-blue-800 border-blue-200'
                }`}>
                  {formatTargetDate(callingDateStr)}
                  {delayDisplay && <span className="ml-1 text-[8px] text-red-600 font-black">({delayDisplay})</span>}
                </span>
              );
            })()}
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Scheduled Call</span>
            <span className="text-red-600 font-bold">{l ? formatDate(l.nextDate || l.nextCallDate) : 'Pending First Call'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Status</span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold inline-block border ${getFlwColor(l?.status)}`}>
              {l?.status || 'Pending'}
            </span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 mt-1">
          <button
            onClick={() => onUpdateClick(o)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition-all shadow-sm"
          >
            <Pencil size={12} /> Update Call Log
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 flex flex-col h-auto md:h-full min-h-0">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Big Pending Count Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-center items-center min-h-[260px] relative overflow-hidden">
          <div className="absolute -bottom-4 -right-4 p-4 opacity-5 text-amber-500">
            <Layers size={120} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-2 relative z-10 text-center">Total Pending</h3>
          <span className="text-8xl font-black text-amber-500 drop-shadow-sm relative z-10">{filteredOrders.length}</span>
          <p className="text-xs font-bold mt-4 text-slate-500 tracking-wide relative z-10 text-center">ALL ORDERS TO CALL</p>
        </div>

        {/* Order Stage Distribution Metric Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col min-h-[260px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-3.5 bg-amber-500 rounded-full" />
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Order Stage Distribution</h4>
          </div>
          <div className="flex-1 relative min-h-0">
            {stageChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={stageChartData} 
                    cx="50%" 
                    cy="45%" 
                    innerRadius={45} 
                    outerRadius={65} 
                    paddingAngle={4} 
                    dataKey="value" 
                    stroke="none"
                  >
                    {stageChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={8} formatter={(value) => <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wide ml-1">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-wider">No Stage Data</div>
            )}
          </div>
        </div>

        {/* Follow-up Status Distribution Metric Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col min-h-[260px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-3.5 bg-amber-500 rounded-full" />
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Follow-up Status Distribution</h4>
          </div>
          <div className="flex-1 relative min-h-0">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={statusChartData} 
                    cx="50%" 
                    cy="45%" 
                    innerRadius={45} 
                    outerRadius={65} 
                    paddingAngle={4} 
                    dataKey="value" 
                    stroke="none"
                  >
                    {statusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={8} formatter={(value) => <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wide ml-1">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-wider">No Status Data</div>
            )}
          </div>
        </div>

        {/* Order Type Distribution Metric Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col min-h-[260px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-3.5 bg-amber-500 rounded-full" />
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Order Type Distribution</h4>
          </div>
          <div className="flex-1 relative min-h-0">
            {typeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={typeChartData} 
                    cx="50%" 
                    cy="45%" 
                    innerRadius={45} 
                    outerRadius={65} 
                    paddingAngle={4} 
                    dataKey="value" 
                    stroke="none"
                  >
                    {typeChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={8} formatter={(value) => <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wide ml-1">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-wider">No Type Data</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Table view */}
      <div className="flex-1 md:min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible md:overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedOrders}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="2350px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredOrders.length}
          itemsPerPageOptions={[50, 100, 200]}
        />
      </div>

    </div>
  );
};

export default FollowUpPendingTotal;
