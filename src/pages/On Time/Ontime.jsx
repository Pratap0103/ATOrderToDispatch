import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Filter, RotateCcw, Trophy, Medal, Award, User, Search, Hash } from "lucide-react";
import toast from "react-hot-toast";
import SearchableDropdown from "../../components/SearchableDropdown";
/* deleted import */
import DragScrollTable from "../../components/DragScrollTable";
/* deleted import */

// ── Date Utility Helpers ───────────────────────────────────────────

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
  if (!deliveryDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = parseDateString(deliveryDateStr);
  if (!delivery || isNaN(delivery.getTime())) return 0;
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

const TABLE_COL_HEADERS = [
  "Order Number", "Delivery Late (Days)", "Karigar Delay Days", "Expected Delivery Date", "Is Delivery Late",
  "Order Type", "Stock In Date", "Stock Days", "Production Time", "Metal Issue Date",
  "Flw-up", "QC1", "Meena Inhouse", "Meena Outside", "Polish Inhouse",
  "Polish Outside", "Qc-2", "Qc-3", "RD", "Huid/Label",
  "Karigar Status", "Ready For Dispatch", "Stock In", "Delivery", "Ghat Weight",
  "Karigar Late Status", "Finishing Time", "Bangle Polish", "Order Stage", "Client Name",
  "Category Name", "Melting", "Weight", "Total Weight", "Total Quantity",
  "Karigar Name", "Order Date", "Delivery Date", "Karigar Date"
];

// Standardized pill badges matching index.css / QC1Pending style (Super bold and visible)
const renderStatusBadge = (value) => {
  if (!value || value === '-') return <span className="text-gray-400 font-bold">-</span>;

  const val = String(value).trim().toLowerCase();

  // Success states
  if (['ok', 'pass', 'qc okay', 'yes', 'received', 'complete', 'on time'].includes(val)) {
    return (
      <span className="px-2.5 py-0.5 rounded font-black border bg-emerald-100 text-emerald-850 border-emerald-350 text-[10px] whitespace-nowrap inline-block tracking-tight">
        {value}
      </span>
    );
  }

  // Danger / Alert states
  if (['fail', 'no', 'late', 'delay', 'cancel', 'urgent'].includes(val)) {
    return (
      <span className="px-2.5 py-0.5 rounded font-black border bg-red-100 text-red-850 border-red-350 text-[10px] whitespace-nowrap inline-block tracking-tight">
        {value}
      </span>
    );
  }

  // Warning states
  if (['sent in huid', 'new', 'pending'].includes(val)) {
    return (
      <span className="px-2.5 py-0.5 rounded font-black border bg-amber-100 text-amber-850 border-amber-350 text-[10px] whitespace-nowrap inline-block tracking-tight">
        {value}
      </span>
    );
  }

  // Process / Pipeline states
  if (['qc', 'qc1', 'qc-2', 'qc-3', 'flw-up', 'in progress', 'undefined'].includes(val)) {
    return (
      <span className="px-2.5 py-0.5 rounded font-black border bg-blue-100 text-blue-850 border-blue-350 text-[10px] whitespace-nowrap inline-block tracking-tight">
        {value}
      </span>
    );
  }

  // Default Badge
  return (
    <span className="px-2.5 py-0.5 rounded font-black border bg-gray-100 text-gray-850 border-gray-350 text-[10px] whitespace-nowrap inline-block tracking-tight">
      {value}
    </span>
  );
};

const Dasboard = () => {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [showFiltersSection, setShowFiltersSection] = useState(false);

  // ── Filters State ──────────────────────────────────────────
  const [filters, setFilters] = useState({
    orderNumber: "",
    clientName: "",
    karigarStatus: [],
    orderType: [],
    orderStage: [],
    karigarName: [],
    leftDaysFrom: -500,
    leftDaysTo: 500,
    lateStatus: [],
    overallSearch: ""
  });

  // Load orders from localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('ordersDataV3');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  const nonCloneOrders = useMemo(() => {
    return orders.filter(o => !(o.id && String(o.id).includes('-P')));
  }, [orders]);

  // Compute unique values for dropdown filters dynamically
  const karigarStatusesList = useMemo(() => generateFilterOptions(nonCloneOrders, o => o.karigarStatus || o.kStatus), [nonCloneOrders]);
  const orderTypesList = useMemo(() => generateFilterOptions(nonCloneOrders, o => o.orderType), [nonCloneOrders]);
  const orderStagesList = useMemo(() => generateFilterOptions(nonCloneOrders, o => o.orderStage), [nonCloneOrders]);
  const karigarNamesList = useMemo(() => generateFilterOptions(nonCloneOrders, o => o.karigar || o.karigarName), [nonCloneOrders]);

  const lateStatusesList = useMemo(() => {
    let lateCount = 0;
    let onTimeCount = 0;
    nonCloneOrders.forEach(o => {
      const leftDays = calculateLeftDays(o.expectedDeliveryDate || o.deliveryDate);
      if (leftDays < 0) {
        lateCount += 1;
      } else {
        onTimeCount += 1;
      }
    });
    return [
      { value: "Late Only", label: "Late Only", count: lateCount },
      { value: "On Time Only", label: "On Time Only", count: onTimeCount }
    ];
  }, [nonCloneOrders]);

  // Handle slide filter bounds dynamically
  const minMaxLeftDays = useMemo(() => {
    if (nonCloneOrders.length === 0) return { min: -500, max: 500 };
    const leftDaysVals = nonCloneOrders.map(o => calculateLeftDays(o.expectedDeliveryDate || o.deliveryDate));
    return {
      min: Math.min(...leftDaysVals, -500),
      max: Math.max(...leftDaysVals, 500)
    };
  }, [nonCloneOrders]);

  // Adjust filters range once data loads
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      leftDaysFrom: minMaxLeftDays.min,
      leftDaysTo: minMaxLeftDays.max
    }));
  }, [minMaxLeftDays]);

  // ── Apply Filtering Logic ─────────────────────────────────
  const filteredOrders = useMemo(() => {
    return nonCloneOrders.filter(o => {
      const orderNoStr = String(o.orderNo || o.orderNumber || '').toLowerCase();
      const clientStr = String(o.company || o.customerName || '').toLowerCase();
      const karigarStatusVal = o.karigarStatus || o.kStatus || '';
      const orderTypeVal = o.orderType || '';
      const orderStageVal = o.orderStage || '';
      const karigarNameVal = o.karigar || o.karigarName || '';
      const leftDays = calculateLeftDays(o.expectedDeliveryDate || o.deliveryDate);
      const isLateStr = leftDays < 0 ? "Yes" : "No";

      // Match explicit filters
      if (filters.orderNumber && !orderNoStr.includes(filters.orderNumber.toLowerCase())) return false;
      if (filters.clientName && !clientStr.includes(filters.clientName.toLowerCase())) return false;
      if (filters.karigarStatus && filters.karigarStatus.length > 0 && !filters.karigarStatus.includes(karigarStatusVal)) return false;
      if (filters.orderType && filters.orderType.length > 0 && !filters.orderType.includes(orderTypeVal)) return false;
      if (filters.orderStage && filters.orderStage.length > 0 && !filters.orderStage.includes(orderStageVal)) return false;
      if (filters.karigarName && filters.karigarName.length > 0 && !filters.karigarName.includes(karigarNameVal)) return false;

      // Range slider left days
      if (leftDays < filters.leftDaysFrom || leftDays > filters.leftDaysTo) return false;

      // Late Status
      if (filters.lateStatus && filters.lateStatus.length > 0) {
        if (filters.lateStatus.includes("Late Only") && !filters.lateStatus.includes("On Time Only") && isLateStr !== "Yes") return false;
        if (filters.lateStatus.includes("On Time Only") && !filters.lateStatus.includes("Late Only") && isLateStr !== "No") return false;
      }

      // Overall Search
      if (filters.overallSearch) {
        const query = filters.overallSearch.toLowerCase();
        return Object.values(o).some(val => String(val).toLowerCase().includes(query));
      }

      return true;
    });
  }, [nonCloneOrders, filters]);

  // Clear filters helper
  const handleClearFilters = () => {
    setFilters({
      orderNumber: "",
      clientName: "",
      karigarStatus: [],
      orderType: [],
      orderStage: [],
      karigarName: [],
      leftDaysFrom: minMaxLeftDays.min,
      leftDaysTo: minMaxLeftDays.max,
      lateStatus: [],
      overallSearch: ""
    });
    setCurrentPage(1);
    toast.success("Dashboard filters reset");
  };

  // ── Compute Top KPI Stats ──────────────────────────────────
  const kpiStats = useMemo(() => {
    const total = nonCloneOrders.length;
    let lateCount = 0;
    let onTimeCount = 0;
    const uniqueKarigars = new Set();
    let urgentCount = 0;

    nonCloneOrders.forEach(o => {
      const leftDays = calculateLeftDays(o.expectedDeliveryDate || o.deliveryDate);
      if (leftDays < 0) {
        lateCount += 1;
      } else {
        onTimeCount += 1;
      }

      const karigar = o.karigar || o.karigarName;
      if (karigar) uniqueKarigars.add(karigar);

      if (o.orderType?.toLowerCase().includes('urgent')) {
        urgentCount += 1;
      }
    });

    const onTimeRate = total > 0 ? ((onTimeCount / total) * 100).toFixed(1) : "0.0";

    return {
      total,
      onTimeRate,
      karigarsCount: uniqueKarigars.size,
      urgentCount
    };
  }, [nonCloneOrders]);

  // ── Calculate Order Portfolio dynamic data ──────────────────
  const orderTypeData = useMemo(() => {
    const counts = {};
    nonCloneOrders.forEach(o => {
      const type = o.orderType || "Other";
      counts[type] = (counts[type] || 0) + 1;
    });
    const colors = ["#d4a317", "#10b981", "#f43f5e", "#0ea5e9", "#6366f1", "#8b5cf6"];
    return Object.keys(counts).map((name, idx) => ({
      name,
      value: counts[name],
      color: colors[idx % colors.length]
    }));
  }, [nonCloneOrders]);

  // ── Calculate Production Stages dynamic data ─────────────────
  const orderStageData = useMemo(() => {
    const counts = {};
    nonCloneOrders.forEach(o => {
      const stage = o.orderStage ? o.orderStage.replace('_', ' ').toUpperCase() : "UNDEFINED";
      counts[stage] = (counts[stage] || 0) + 1;
    });
    const colors = ["#d4a317", "#e1ba2e", "#ec4899", "#f43f5e", "#ef4444", "#10b981", "#0ea5e9", "#6366f1", "#8b5cf6", "#a855f7"];
    return Object.keys(counts).map((name, idx) => ({
      name,
      value: counts[name],
      color: colors[idx % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [nonCloneOrders]);

  // ── Calculate Karigar Efficiency Rankings ───────────────────
  const karigarSummary = useMemo(() => {
    const map = {};
    nonCloneOrders.forEach(o => {
      const name = o.karigar || o.karigarName || 'Not Assigned';
      if (!map[name]) {
        map[name] = { name, late: 0, onTime: 0, total: 0, totalDays: 0 };
      }
      const k = map[name];
      k.total += 1;

      const leftDays = calculateLeftDays(o.expectedDeliveryDate || o.deliveryDate);
      if (leftDays < 0) {
        k.late += 1;
      } else {
        k.onTime += 1;
      }

      // Compute average production timeframe if available
      const start = parseDateString(o.orderDate || o.orderRecDate);
      const end = parseDateString(o.expectedDeliveryDate || o.deliveryDate);
      if (start && end) {
        const diff = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
        k.totalDays += diff;
      } else {
        k.totalDays += 7; // fallback
      }
    });

    return Object.values(map).map(k => {
      const latePctVal = k.total > 0 ? (k.late / k.total) * 100 : 0;
      const latePct = latePctVal.toFixed(1) + '%';
      const onTimePctVal = k.total > 0 ? (k.onTime / k.total) * 100 : 0;
      const avgTime = k.total > 0 ? (k.totalDays / k.total).toFixed(1) + ' days' : '7.0 days';
      return {
        name: k.name,
        late: k.late,
        onTime: k.onTime,
        onTimePctVal,
        total: k.total,
        latePct,
        avgTime
      };
    }).sort((a, b) => b.total - a.total);
  }, [nonCloneOrders]);

  // ── Detailed Table Row Map ──────────────────────────────
  const deliveryData = useMemo(() => {
    return filteredOrders.map(o => {
      const leftDays = calculateLeftDays(o.expectedDeliveryDate || o.deliveryDate);
      const karigarDays = calculateLeftDays(o.karigarDeliveryDate);
      const isLateStr = leftDays < 0 ? "Yes" : "No";

      return {
        orderNo: o.orderNo || o.orderNumber || '-',
        delay: leftDays < 0 ? leftDays : 0,
        karigarDelay: karigarDays < 0 ? karigarDays : 0,
        expDelDate: formatDate(o.expectedDeliveryDate || o.deliveryDate),
        isLate: isLateStr,
        type: o.orderType || '-',
        stockInDate: o.receiveInStockTimestamp ? formatDate(o.receiveInStockTimestamp) : '-',
        stockDays: o.stockDays || (o.receiveInStockTimestamp ? "1" : "-"),
        prodTime: o.prodTime || "7 days",
        metalIssue: formatDate(o.metalIssueDate || o.orderDate),
        flwUp: o.followUpStatus || "Ok",
        qc1: o.qc1Status || "Pass",
        meenaIn: o.meenaInhouseStatus || "-",
        meenaOut: o.meenaOutsideStatus || "-",
        polishIn: o.polishInhouseStatus || "-",
        polishOut: o.polishOutsideStatus || "-",
        qc2: o.qc2Status || "Pass",
        qc3: o.qc3Status || "Pass",
        rd: o.receiptStatus || "Ok",
        huid: o.huidStatus || "-",
        kStatus: o.karigarStatus || (karigarDays < 0 ? "Delay" : "On Time"),
        readyDispatch: o.dispatchStatus === 'Done' ? "Yes" : "No",
        stockIn: o.receiveInStockStatus === 'Received' ? "Yes" : "No",
        delivery: o.deliveryStatus || o.status15 || "Pending",
        ghatWt: o.ghatWeight || o.totalWeight || "-",
        kLateStatus: karigarDays < 0 ? "Late" : "On Time",
        finishTime: o.finishTime || "2 days",
        banglePolish: o.banglePolishStatus || "-",
        stage: o.orderStage ? o.orderStage.replace('_', ' ').toUpperCase() : 'NEW',
        client: o.company || o.customerName || "-",
        category: o.category || o.categoryName || "-",
        melting: o.melting || "-",
        weight: o.weight || "-",
        totalWt: o.totalWeight || o.weight || "-",
        qty: o.totalQuantity || "1 PCS",
        karigar: o.karigar || o.karigarName || "-",
        orderDate: formatDate(o.orderDate || o.orderRecDate),
        delDate: formatDate(o.deliveryDate || o.expectedDeliveryDate),
        kDate: formatDate(o.karigarDeliveryDate)
      };
    });
  }, [filteredOrders]);

  // ── CSV Export Ingestion ────────────────────────────────────
  const handleExportExcel = () => {
    if (deliveryData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const deliveryRows = deliveryData.map(r => [
      r.orderNo, r.delay, r.karigarDelay, r.expDelDate, r.isLate,
      r.type, r.stockInDate, r.stockDays, r.prodTime, r.metalIssue,
      r.flwUp, r.qc1, r.meenaIn, r.meenaOut, r.polishIn,
      r.polishOut, r.qc2, r.qc3, r.rd, r.huid,
      r.kStatus, r.readyDispatch, r.stockIn, r.delivery, r.ghatWt,
      r.kLateStatus, r.finishTime, r.banglePolish, r.stage, r.client,
      r.category, r.melting, r.weight, r.totalWt, r.qty,
      r.karigar, r.orderDate, r.delDate, r.kDate
    ]);

    const efficiencyHeaders = ["Karigar", "Late", "On Time", "Total", "Late %", "Avg time"];
    const efficiencyRows = karigarSummary.map(r => [
      r.name, r.late, r.onTime, r.total, r.latePct, r.avgTime
    ]);

    let csvContent = "ON-TIME DELIVERY DETAILED REPORT\n";
    csvContent += TABLE_COL_HEADERS.join(",") + "\n";
    deliveryRows.forEach(row => {
      csvContent += row.map(val => `"${val || ""}"`).join(",") + "\n";
    });

    csvContent += "\n\nKARIGAR EFFICIENCY RANKING\n";
    csvContent += efficiencyHeaders.join(",") + "\n";
    efficiencyRows.forEach(row => {
      csvContent += row.map(val => `"${val || ""}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `OnTime_Delivery_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully!");
  };

  // ── Pagination Calculation ─────────────────────────────────
  const totalPages = Math.ceil(deliveryData.length / itemsPerPage);
  const paginatedDeliveryData = useMemo(() => {
    return deliveryData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [deliveryData, currentPage, itemsPerPage]);

  return (
    <div className="flex-1 overflow-y-auto bg-white space-y-4 p-2 sm:p-4 md:p-6 custom-scrollbar min-h-0">

      {/* ── Top Premium Cards Insights Section (Completely clean typographic layout - NO Icons) ── */}
      <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-4 px-1">

        {/* Total Orders Card */}
        <div className="bg-gradient-to-br from-amber-50/70 via-amber-50 to-amber-100/40 p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-amber-200/60 shadow-sm flex flex-col justify-between h-16 sm:h-28 transition-all hover:shadow-md duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[8px] sm:text-[10px] font-extrabold text-slate-600 uppercase tracking-wider sm:tracking-widest">
              Total Indents
            </span>
            <span className="hidden sm:inline-block text-[9px] font-black text-amber-700 bg-amber-100/60 px-2.5 py-0.5 rounded-full border border-amber-200/40 font-mono">
              Active
            </span>
          </div>
          <div className="text-base sm:text-3xl font-black tracking-tight text-slate-900 font-mono my-0.5 sm:my-1">
            {kpiStats.total}
          </div>
          <div className="hidden sm:block text-[10px] font-bold text-slate-500 leading-none">
            Pipeline database summary
          </div>
        </div>

        {/* On Time Rate Card */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-emerald-50 to-emerald-100/40 p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-emerald-200/60 shadow-sm flex flex-col justify-between h-16 sm:h-28 transition-all hover:shadow-md duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[8px] sm:text-[10px] font-extrabold text-slate-600 uppercase tracking-wider sm:tracking-widest">
              On-Time Sales
            </span>
            <span className="hidden sm:inline-block text-[9px] font-black text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full border border-emerald-200/40 font-mono">
              Sales Rate
            </span>
          </div>
          <div className="text-base sm:text-3xl font-black tracking-tight text-slate-900 font-mono my-0.5 sm:my-1">
            {kpiStats.onTimeRate}%
          </div>
          <div className="hidden sm:block text-[10px] font-bold text-slate-500 leading-none">
            From expected delivery dates
          </div>
        </div>

        {/* Urgent Orders Card */}
        <div className="bg-gradient-to-br from-rose-50/70 via-rose-50 to-rose-100/40 p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-rose-200/60 shadow-sm flex flex-col justify-between h-16 sm:h-28 transition-all hover:shadow-md duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[8px] sm:text-[10px] font-extrabold text-slate-600 uppercase tracking-wider sm:tracking-widest">
              Urgent Focus
            </span>
            <span className="hidden sm:inline-block text-[9px] font-black text-rose-700 bg-rose-100/60 px-2.5 py-0.5 rounded-full border border-rose-200/40 font-mono">
              High Priority
            </span>
          </div>
          <div className="text-base sm:text-3xl font-black tracking-tight text-slate-900 font-mono my-0.5 sm:my-1">
            {kpiStats.urgentCount}
          </div>
          <div className="hidden sm:block text-[10px] font-bold text-slate-500 leading-none">
            High priority dispatch line
          </div>
        </div>

        {/* Unique Karigars Card */}
        <div className="bg-gradient-to-br from-sky-50/70 via-sky-50 to-sky-100/40 p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-sky-200/60 shadow-sm flex flex-col justify-between h-16 sm:h-28 transition-all hover:shadow-md duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[8px] sm:text-[10px] font-extrabold text-slate-600 uppercase tracking-wider sm:tracking-widest">
              Active Team
            </span>
            <span className="hidden sm:inline-block text-[9px] font-black text-sky-700 bg-sky-100/60 px-2.5 py-0.5 rounded-full border border-sky-200/40 font-mono">
              Karigars
            </span>
          </div>
          <div className="text-base sm:text-3xl font-black tracking-tight text-slate-900 font-mono my-0.5 sm:my-1">
            {kpiStats.karigarsCount}
          </div>
          <div className="hidden sm:block text-[10px] font-bold text-slate-500 leading-none">
            Registered craft makers
          </div>
        </div>
      </div>

      {/* ── Mid Section: Filters + Insights (Unified 2-Column Grid to eliminate whitespace gaps) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 overflow-visible">

        {/* Left: Filters Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col overflow-visible h-fit transition-all hover:shadow-md duration-300">
          
          {/* Card Header matching other sections */}
          <div className="flex items-center justify-between mb-4 flex-nowrap">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 bg-amber-500 rounded-full shrink-0" />
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                <span className="hidden sm:inline">On Time Delivery </span>
                <span className="hidden xs:inline sm:hidden">On Time </span>
                Filters
              </h4>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-nowrap">
              <button
                onClick={() => setShowFiltersSection(!showFiltersSection)}
                className="lg:hidden px-2.5 py-1 text-[9px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all active:scale-95 whitespace-nowrap flex items-center gap-1 shadow-sm"
              >
                <Filter size={10} />
                <span>{showFiltersSection ? "Hide" : "Show"}</span>
              </button>
              <button
                onClick={handleClearFilters}
                className={`${showFiltersSection ? 'flex' : 'hidden lg:flex'} px-2.5 py-1 text-[9px] font-extrabold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all active:scale-95 whitespace-nowrap items-center gap-1 shadow-sm`}
                title="Reset all filter fields"
              >
                <RotateCcw size={10} />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>
          
          {/* Card Content (Filters Grid) */}
          <div className={`${showFiltersSection ? 'grid' : 'hidden lg:grid'} grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3.5 overflow-visible`}>
            {/* Order Number Search */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Order Number</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Hash size={11} className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="e.g. JF-01" 
                  value={filters.orderNumber}
                  onChange={(e) => { setFilters({ ...filters, orderNumber: e.target.value }); setCurrentPage(1); }}
                  className="w-full h-8 pl-7 pr-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg text-xs outline-none transition-all font-bold text-slate-800 shadow-inner" 
                />
              </div>
            </div>

            {/* Client Name Search */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Client Name</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Search size={11} className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search client..." 
                  value={filters.clientName}
                  onChange={(e) => { setFilters({ ...filters, clientName: e.target.value }); setCurrentPage(1); }}
                  className="w-full h-8 pl-7 pr-2.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-lg text-xs outline-none transition-all font-bold text-slate-800 shadow-inner" 
                />
              </div>
            </div>

            {/* Karigar Status Dropdown */}
            <div className="space-y-1 overflow-visible">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Karigar Status</label>
              <SearchableDropdown
                options={karigarStatusesList}
                isMulti={true}
                value={filters.karigarStatus}
                onChange={(val) => { setFilters({ ...filters, karigarStatus: val }); setCurrentPage(1); }}
                placeholder="All Karigar Status"
                height="h-8"
                rounded="rounded-lg"
              />
            </div>

            {/* Order Type Dropdown */}
            <div className="space-y-1 overflow-visible">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Order Type</label>
              <SearchableDropdown
                options={orderTypesList}
                isMulti={true}
                value={filters.orderType}
                onChange={(val) => { setFilters({ ...filters, orderType: val }); setCurrentPage(1); }}
                placeholder="All Order Types"
                height="h-8"
                rounded="rounded-lg"
              />
            </div>

            {/* Order Stage Dropdown */}
            <div className="space-y-1 overflow-visible">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Order Stage</label>
              <SearchableDropdown
                options={orderStagesList.map(opt => ({ ...opt, label: opt.label ? opt.label.replace('_', ' ').toUpperCase() : opt.label }))}
                isMulti={true}
                value={filters.orderStage}
                onChange={(val) => { setFilters({ ...filters, orderStage: val }); setCurrentPage(1); }}
                placeholder="All Order Stages"
                height="h-8"
                rounded="rounded-lg"
              />
            </div>

            {/* Karigar Name Dropdown */}
            <div className="space-y-1 overflow-visible">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Karigar Name</label>
              <SearchableDropdown
                options={karigarNamesList}
                isMulti={true}
                value={filters.karigarName}
                onChange={(val) => { setFilters({ ...filters, karigarName: val }); setCurrentPage(1); }}
                placeholder="All Karigar Names"
                height="h-8"
                rounded="rounded-lg"
              />
            </div>

            {/* Late Status */}
            <div className="space-y-1 overflow-visible">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Late Status</label>
              <SearchableDropdown 
                isMulti={true} 
                options={lateStatusesList}
                value={filters.lateStatus}
                onChange={(val) => { setFilters({ ...filters, lateStatus: val }); setCurrentPage(1); }}
                placeholder="Select Late Status"
                height="h-8"
                rounded="rounded-lg"
              />
            </div>

            {/* Left Days Slider - Dynamic & Interactive */}
            <div className="space-y-2 bg-slate-50/50 p-3 border border-slate-200/60 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Sales Range Bounds</span>
                <span className="text-[9px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono">
                  {filters.leftDaysFrom}d to {filters.leftDaysTo}d
                </span>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 w-8 uppercase">From</span>
                  <input 
                    type="range"
                    min={minMaxLeftDays.min}
                    max={minMaxLeftDays.max}
                    value={filters.leftDaysFrom}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFilters(prev => ({ ...prev, leftDaysFrom: Math.min(val, prev.leftDaysTo) }));
                      setCurrentPage(1);
                    }}
                    className="w-full accent-amber-500 bg-slate-200 h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none"
                  />
                  <input type="number" step="0.001" 
                    value={filters.leftDaysFrom}
                    onChange={(e) => { setFilters({ ...filters, leftDaysFrom: Number(e.target.value) }); setCurrentPage(1); }}
                    className="w-16 h-7 text-xs font-black text-slate-700 bg-white border border-slate-200 rounded-lg text-center focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-sm outline-none transition-all" 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 w-8 uppercase">To</span>
                  <input 
                    type="range"
                    min={minMaxLeftDays.min}
                    max={minMaxLeftDays.max}
                    value={filters.leftDaysTo}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFilters(prev => ({ ...prev, leftDaysTo: Math.max(val, prev.leftDaysFrom) }));
                      setCurrentPage(1);
                    }}
                    className="w-full accent-amber-500 bg-slate-200 h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none"
                  />
                  <input type="number" step="0.001" 
                    value={filters.leftDaysTo}
                    onChange={(e) => { setFilters({ ...filters, leftDaysTo: Number(e.target.value) }); setCurrentPage(1); }}
                    className="w-16 h-7 text-xs font-black text-slate-700 bg-white border border-slate-200 rounded-lg text-center focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-sm outline-none transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Portfolio Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col h-full min-h-[260px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-3.5 bg-amber-500 rounded-full" />
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Order Portfolio</h4>
          </div>
          <div className="flex-1 relative min-h-0">
            {orderTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderTypeData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {orderTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={8} formatter={(value) => <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wide ml-1">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-wider">No Portfolio Data</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mid Section: Stages + Leaders (Unified 2-Column Grid to eliminate whitespace gaps) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">

        {/* Left: Production Stages Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col min-h-[260px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-3.5 bg-amber-500 rounded-full" />
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Production Stages Breakdown</h4>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row gap-4 min-h-0">
            {/* Visual Chart */}
            <div className="w-full sm:w-[50%] h-[180px] sm:h-full relative">
              {orderStageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {orderStageData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-wider">No Stage Data</div>
              )}
            </div>

            {/* Scrollable list */}
            <div className="w-full sm:w-[50%] overflow-y-auto max-h-[160px] sm:max-h-full pr-1.5 custom-scrollbar border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-3 flex flex-col gap-2">
              {orderStageData.map((entry, index) => (
                <div key={index} className="flex items-start justify-between p-1.5 hover:bg-slate-50 rounded-lg transition-colors group shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate leading-tight group-hover:text-amber-600">
                      {entry.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-slate-900 bg-slate-100 group-hover:bg-amber-100 group-hover:text-amber-700 px-1.5 py-0.5 rounded font-mono shrink-0">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Karigar Leaderboard Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[260px]">
          <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-amber-600 shrink-0 animate-pulse" />
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Karigar Efficiency Leaderboard</h4>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[250px] custom-scrollbar">
            {/* Desktop Table View */}
            <table className="hidden sm:table w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-50/40 text-slate-500 border-b border-slate-100">
                  <th className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-left border-r border-slate-100/40">Rank</th>
                  <th className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-left border-r border-slate-100/40">
                    <div className="flex items-center gap-1">
                      <User size={10} className="text-slate-400 shrink-0" />
                      <span>Karigar Name</span>
                    </div>
                  </th>
                  <th className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-center border-r border-slate-100/40 text-red-500">Late</th>
                  <th className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-center border-r border-slate-100/40 text-emerald-500">On Time</th>
                  <th className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-center border-r border-slate-100/40">Total</th>
                  <th className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-center border-r border-slate-100/40">Sales Progress</th>
                  <th className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-right">Avg Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {karigarSummary.map((row, idx) => {
                  const initials = row.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                  // Avatars matching ranks or standard style
                  const avatarClass = idx === 0
                    ? "bg-amber-50 border border-amber-200 text-amber-700"
                    : idx === 1
                      ? "bg-slate-100 border border-slate-200 text-slate-600"
                      : idx === 2
                        ? "bg-orange-50 border border-orange-200 text-orange-700"
                        : "bg-slate-50 border border-slate-150 text-slate-500";

                  return (
                    <tr key={row.name} className="hover:bg-amber-50/20 transition-all group">
                      {/* Rank Column */}
                      <td className="px-3 py-1 border-r border-slate-100/50">
                        <div className="flex items-center justify-center">
                          {idx === 0 && <Trophy size={15} className="text-amber-500 animate-bounce shrink-0" style={{ animationDuration: '3s' }} title="Rank 1" />}
                          {idx === 1 && <Medal size={15} className="text-slate-400 shrink-0" title="Rank 2" />}
                          {idx === 2 && <Award size={15} className="text-orange-600 shrink-0" title="Rank 3" />}
                          {idx > 2 && <span className="text-[10px] font-black text-slate-400 font-mono">#{idx + 1}</span>}
                        </div>
                      </td>

                      {/* Avatar & Name */}
                      <td className="px-3 py-1 text-left border-r border-slate-100/50">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${avatarClass}`}>
                            <User size={11} className="shrink-0" />
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-tight truncate group-hover:text-amber-600 font-mono">
                            {row.name}
                          </span>
                        </div>
                      </td>

                      {/* Counts */}
                      <td className="px-3 py-1 text-[11px] font-black text-rose-600 border-r border-slate-100/50 font-mono text-center">{row.late}</td>
                      <td className="px-3 py-1 text-[11px] font-black text-emerald-600 border-r border-slate-100/50 font-mono text-center">{row.onTime}</td>
                      <td className="px-3 py-1 text-[11px] font-black text-slate-800 border-r border-slate-100/50 font-mono text-center">{row.total}</td>

                      {/* Progress bar visual slider */}
                      <td className="px-3 py-1 border-r border-slate-100/50">
                        <div className="flex items-center gap-1 justify-center">
                          <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                            <div
                              style={{ width: `${row.onTimePctVal}%` }}
                              className="bg-emerald-500 h-full rounded-l-full"
                              title={`On Time: ${row.onTime}`}
                            />
                            <div
                              style={{ width: `${100 - row.onTimePctVal}%` }}
                              className="bg-rose-500 h-full rounded-r-full"
                              title={`Late: ${row.late}`}
                            />
                          </div>
                          <span className="text-[9px] font-black text-slate-500 font-mono min-w-[20px] text-right">
                            {row.onTimePctVal.toFixed(0)}%
                          </span>
                        </div>
                      </td>

                      {/* Avg Duration */}
                      <td className="px-3 py-1 text-right text-[11px] font-bold text-slate-400 italic font-mono">{row.avgTime}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Leaderboard Grid */}
            <div className="sm:hidden p-2 space-y-1.5 bg-slate-50/40">
              {karigarSummary.map((row, idx) => (
                <div key={row.name} className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {idx === 0 && <Trophy size={14} className="text-amber-500 shrink-0" />}
                      {idx === 1 && <Medal size={14} className="text-slate-400 shrink-0" />}
                      {idx === 2 && <Award size={14} className="text-orange-600 shrink-0" />}
                      {idx > 2 && <span className="text-[10px] font-black text-slate-400 font-mono">#{idx + 1}</span>}
                      <User size={12} className="text-slate-400 shrink-0" />
                      <span className="text-xs font-black text-slate-800 uppercase font-mono">{row.name}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 font-mono">Avg: {row.avgTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-105 rounded-full h-1 overflow-hidden flex">
                      <div style={{ width: `${row.onTimePctVal}%` }} className="bg-emerald-500 h-full" />
                      <div style={{ width: `${100 - row.onTimePctVal}%` }} className="bg-rose-500 h-full" />
                    </div>
                    <span className="text-[9px] font-black text-slate-500 font-mono shrink-0">{row.onTimePctVal.toFixed(0)}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
                    <div className="bg-rose-50 border border-rose-100 py-1 rounded-lg">
                      <span className="text-[7px] font-bold text-rose-500 uppercase block leading-none">Late</span>
                      <span className="text-[10px] font-black text-rose-700 leading-none">{row.late}</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 py-1 rounded-lg">
                      <span className="text-[7px] font-bold text-emerald-500 uppercase block leading-none">On-Time</span>
                      <span className="text-[10px] font-black text-emerald-700 leading-none">{row.onTime}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-150 py-1 rounded-lg">
                      <span className="text-[7px] font-bold text-slate-500 uppercase block leading-none">Total</span>
                      <span className="text-[10px] font-black text-slate-700 leading-none">{row.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>{/* ── End: Mid Section Stages + Leaders Grid ── */}

      {/* ── Detailed Report Table ──── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

        {/* Table Top Toolbar */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
          <div className="max-w-sm w-full">
            <input
              type="text"
              placeholder="Search detailed record parameters..."
              value={filters.overallSearch}
              onChange={(e) => { setFilters({ ...filters, overallSearch: e.target.value }); setCurrentPage(1); }}
              className="w-full h-[34px] px-3 bg-white border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-lg text-xs outline-none transition-all font-bold text-slate-800"
            />
          </div>

          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <div className="flex items-center justify-center bg-amber-50 border border-amber-200/50 rounded-lg px-3.5 h-[34px] shrink-0 font-mono">
              <span className="text-xs font-black text-amber-700 leading-none">{deliveryData.length.toLocaleString()} Entries found</span>
            </div>

            <button
              onClick={handleExportExcel}
              className="px-4 h-[34px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg font-black text-xs shadow-sm transition-all shrink-0"
            >
              Export Report
            </button>
          </div>
        </div>

        {/* Mobile Card View (Hidden on Desktop) */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 overflow-y-auto max-h-[600px] bg-slate-50/50 scrollbar-hide content-start">
          {paginatedDeliveryData.length > 0 ? (
            paginatedDeliveryData.map((row, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 hover:border-amber-200 transition-colors">
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <span className="text-xs font-black text-slate-900 uppercase font-mono">Order: {row.orderNo}</span>
                  {renderStatusBadge(row.stage)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px] tracking-tight font-black">Client</span>
                    <span className="text-slate-800 font-bold uppercase">{row.client}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px] tracking-tight font-black">Karigar</span>
                    <span className="text-slate-800 font-bold uppercase">{row.karigar}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px] tracking-tight font-black">Expected Delivery</span>
                    <span className="text-slate-800 font-bold font-mono">{row.expDelDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px] tracking-tight font-black">Delivery Late</span>
                    <span className={`font-black font-mono ${row.delay < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{row.delay} Days</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block uppercase text-[8px] tracking-tight font-black">Karigar Delay</span>
                    <span className={`font-black font-mono ${row.karigarDelay < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{row.karigarDelay} Days</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-xs text-slate-400 font-black uppercase tracking-widest">
              No detailed records
            </div>
          )}
        </div>

        {/* Dense Responsive Table */}
        <div className="hidden md:block">
          <DragScrollTable className="max-h-[500px] custom-scrollbar">
          <table className="w-full text-center border-collapse table-auto relative">
            <thead className="sticky top-0 z-20 bg-slate-100 text-slate-900 uppercase tracking-wider border-b border-gray-200 shadow-sm font-extrabold text-[10px]">
              <tr>
                {TABLE_COL_HEADERS.map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 whitespace-nowrap text-center ${i === 0
                        ? "sticky left-0 bg-slate-100 z-20 shadow-[1px_0_0_#e2e8f0] border-r border-slate-200/80"
                        : ""
                      }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedDeliveryData.map((row, idx) => {
                const isUrgent = row.type?.trim().toLowerCase() === 'urgent order';
                const isStock = row.type?.trim().toLowerCase() === 'stock order';
                const rowClass = isUrgent ? 'order-row-urgent' : isStock ? 'order-row-stock' : (idx % 2 === 0 ? "bg-white" : "bg-slate-50/15");
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-amber-50/20 transition-colors group ${rowClass}`}
                  >
                    {/* Sticky Order Number Column */}
                    <td className={`px-4 py-2.5 text-xs font-black text-slate-900 sticky left-0 z-10 shadow-[1px_0_0_#e2e8f0] border-r border-slate-200/80 text-center whitespace-nowrap font-mono transition-colors group-hover:bg-amber-50 ${
                      isUrgent ? '' : isStock ? '' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50')
                    }`}>
                      {row.orderNo}
                    </td>

                  {/* Flat Separated Table Body Cells (No vertical border lines) */}
                  <td className={`px-4 py-2 text-xs font-black text-center font-mono whitespace-nowrap ${row.delay < 0 ? "text-rose-600" : "text-emerald-600"}`}>{row.delay} Days</td>
                  <td className={`px-4 py-2 text-xs font-black text-center font-mono whitespace-nowrap ${row.karigarDelay < 0 ? "text-rose-600" : "text-emerald-600"}`}>{row.karigarDelay} Days</td>
                  <td className="px-4 py-2 text-xs font-extrabold text-slate-700 text-center font-mono whitespace-nowrap">{row.expDelDate}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.isLate)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getOrderTypeColor(row.type)}`}>{row.type || '-'}</span></td>
                  <td className="px-4 py-2 text-xs font-extrabold text-slate-500 text-center font-mono whitespace-nowrap">{row.stockInDate}</td>
                  <td className="px-4 py-2 text-xs font-black text-slate-800 text-center font-mono whitespace-nowrap">{row.stockDays}</td>
                  <td className="px-4 py-2 text-xs font-extrabold text-slate-650 text-center font-mono whitespace-nowrap">{row.prodTime}</td>
                  <td className="px-4 py-2 text-xs font-extrabold text-slate-500 text-center font-mono whitespace-nowrap">{row.metalIssue}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.flwUp)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.qc1)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.meenaIn)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.meenaOut)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.polishIn)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.polishOut)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.qc2)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.qc3)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.rd)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.huid)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.kStatus)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.readyDispatch)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.stockIn)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.delivery)}</td>
                  <td className="px-4 py-2 text-xs font-black text-slate-900 text-center font-mono whitespace-nowrap">{row.ghatWt} g</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.kLateStatus)}</td>
                  <td className="px-4 py-2 text-xs font-extrabold text-slate-500 text-center font-mono whitespace-nowrap">{row.finishTime}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.banglePolish)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">{renderStatusBadge(row.stage)}</td>
                  <td className="px-4 py-2 text-xs font-black text-slate-900 text-center uppercase whitespace-nowrap">{row.client}</td>
                  <td className="px-4 py-2 text-xs font-extrabold text-slate-600 text-center uppercase whitespace-nowrap">{row.category}</td>
                  <td className="px-4 py-2 text-xs font-black text-slate-700 text-center font-mono whitespace-nowrap">{row.melting}</td>
                  <td className="px-4 py-2 text-xs font-extrabold text-slate-600 text-center font-mono whitespace-nowrap">{row.weight}</td>
                  <td className="px-4 py-2 text-xs font-black text-slate-900 text-center font-mono whitespace-nowrap">{row.totalWt} g</td>
                  <td className="px-4 py-2 text-xs font-black text-slate-700 text-center font-mono whitespace-nowrap">{row.qty}</td>
                  <td className="px-4 py-2 text-xs font-black text-slate-950 text-center uppercase whitespace-nowrap font-mono">{row.karigar}</td>
                  <td className="px-4 py-2 text-xs font-extrabold text-slate-500 text-center font-mono whitespace-nowrap">{row.orderDate}</td>
                  <td className="px-4 py-2 text-xs font-extrabold text-slate-500 text-center font-mono whitespace-nowrap">{row.delDate}</td>
                  <td className="px-4 py-2 text-xs font-extrabold text-slate-500 text-center font-mono whitespace-nowrap">{row.kDate}</td>
                </tr>
              );
              })}

              {paginatedDeliveryData.length === 0 && (
                <tr>
                  <td colSpan={TABLE_COL_HEADERS.length} className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    No detailed records matching filter parameters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DragScrollTable>
        </div>

        {/* Table Bottom Pagination Footer (Standard style matching screenshots) */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-4 rounded-b-2xl">
          <div className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap font-medium font-bold">
            Displaying {Math.min(deliveryData.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(deliveryData.length, currentPage * itemsPerPage)} of {deliveryData.length.toLocaleString()} entries
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-gray-700">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 md:px-2 md:py-1 border border-gray-300 rounded-md bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition shadow-sm flex items-center justify-center text-amber-600 font-bold"
              >
                Prior
              </button>
              <div className="flex items-center text-xs md:text-sm font-bold text-gray-650 px-3">
                {currentPage} / {totalPages || 1}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 md:px-2 md:py-1 border border-gray-300 rounded-md bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition shadow-sm flex items-center justify-center text-amber-600 font-bold"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dasboard;
