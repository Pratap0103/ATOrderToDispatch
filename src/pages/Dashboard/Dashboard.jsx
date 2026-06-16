import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, PenTool, ShoppingBag, Users, FolderCheck, Folder, Hourglass, CheckCircle2, Clock, ChevronRight, Hammer } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { SEEDED_KARIGARS } from '../Master/masterdata';

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [karigars, setKarigars] = useState(() => {
    try {
      const saved = localStorage.getItem('master_karigars_v3');
      return saved ? JSON.parse(saved) : SEEDED_KARIGARS;
    } catch {
      return SEEDED_KARIGARS;
    }
  });

  // Load data from localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('ordersDataV3');
    if (savedOrders) setOrders(JSON.parse(savedOrders));

    const savedCategories = localStorage.getItem('master_categories');
    if (savedCategories) setCategories(JSON.parse(savedCategories));

    const savedCompanies = localStorage.getItem('master_companies');
    if (savedCompanies) setCompanies(JSON.parse(savedCompanies));

    const savedKarigars = localStorage.getItem('master_karigars_v3');
    if (savedKarigars) setKarigars(JSON.parse(savedKarigars));
  }, []);

  // Filter out suffix split clones
  const nonCloneOrders = useMemo(() => {
    return orders.filter(o => !(o.id && String(o.id).includes('-P')));
  }, [orders]);

  // Metric counts
  const karigarsCount = useMemo(() => karigars.length, [karigars]);
  const ordersCount = useMemo(() => nonCloneOrders.length, [nonCloneOrders]);
  
  const clientsCount = useMemo(() => {
    if (companies.length > 0) return companies.length;
    const unique = new Set(nonCloneOrders.map(o => o.company).filter(Boolean));
    return unique.size || 15;
  }, [companies, nonCloneOrders]);

  // Customised Order Status Badges
  const pendingCount = useMemo(() => {
    return nonCloneOrders.filter(o => o.orderStage?.toLowerCase() !== 'delivered' && o.orderStage?.toLowerCase() !== 'order cancel').length;
  }, [nonCloneOrders]);

  const newCount = useMemo(() => {
    return nonCloneOrders.filter(o => o.orderStage?.toLowerCase() === 'new').length;
  }, [nonCloneOrders]);

  const inProgressCount = useMemo(() => {
    return nonCloneOrders.filter(o => {
      const s = o.orderStage?.toLowerCase() || '';
      return s !== 'new' && s !== 'delivered' && s !== 'order cancel';
    }).length;
  }, [nonCloneOrders]);

  const overdueCount = useMemo(() => {
    return nonCloneOrders.filter(o => {
      const s = o.orderStage?.toLowerCase() || '';
      if (s === 'delivered' || s === 'order cancel') return false;
      const left = calculateLeftDays(o.expectedDeliveryDate || o.deliveryDate);
      return left < 0;
    }).length;
  }, [nonCloneOrders]);

  const completedCount = useMemo(() => {
    return nonCloneOrders.filter(o => o.orderStage?.toLowerCase() === 'delivered').length;
  }, [nonCloneOrders]);

  const dispatchedCount = useMemo(() => {
    return nonCloneOrders.filter(o => o.dispatchStatus === 'Done').length;
  }, [nonCloneOrders]);

  // Chart Data: Top Selling Products (Top 5 categories in orders)
  const sellingProductsData = useMemo(() => {
    const counts = {};
    nonCloneOrders.forEach(o => {
      const cat = o.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const colors = ["#4338ca", "#10b981", "#f97316", "#ef4444", "#3b82f6"];
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((item, idx) => ({
        ...item,
        color: colors[idx % colors.length]
      }));
  }, [nonCloneOrders]);

  // Chart Data: Client Orders (Top 5 clients)
  const clientOrdersData = useMemo(() => {
    const counts = {};
    nonCloneOrders.forEach(o => {
      const company = o.company || 'Unknown';
      counts[company] = (counts[company] || 0) + 1;
    });

    const colors = ["#0284c7", "#6366f1", "#10b981", "#f59e0b", "#a855f7"];
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((item, idx) => ({
        ...item,
        color: colors[idx % colors.length]
      }));
  }, [nonCloneOrders]);

  const handleStatusClick = (filterType) => {
    navigate('/order-history', { state: { filter: filterType } });
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 lg:space-y-6 bg-slate-50 h-full overflow-y-auto">

      {/* Top 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        
        {/* Karigars Card (Rose/Red theme) */}
        <div 
          onClick={() => navigate('/master')}
          className="bg-gradient-to-br from-rose-50/70 via-rose-50 to-rose-100/40 p-4 sm:p-5 rounded-2xl border border-rose-200/60 shadow-sm flex flex-col justify-between h-28 sm:h-32 transition-all hover:shadow-md duration-200 relative group cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-655 uppercase tracking-widest">
              Karigars
            </span>
            <span className="text-[9px] font-black text-rose-700 bg-rose-100/60 px-2.5 py-0.5 rounded-full border border-rose-200/40 font-mono">
              Registered
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-mono my-1 leading-none">
            {karigarsCount}
          </div>
          <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
            <span>View master karigars list</span>
            <ChevronRight size={12} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <Hammer size={48} className="opacity-[0.03] absolute right-4 bottom-4 group-hover:scale-110 transition-transform text-rose-950" />
        </div>

        {/* Orders Card (Sky/Blue theme) */}
        <div 
          onClick={() => handleStatusClick('pending')}
          className="bg-gradient-to-br from-sky-50/70 via-sky-50 to-sky-100/40 p-4 sm:p-5 rounded-2xl border border-sky-200/60 shadow-sm flex flex-col justify-between h-28 sm:h-32 transition-all hover:shadow-md duration-200 relative group cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-650 uppercase tracking-widest">
              Orders
            </span>
            <span className="text-[9px] font-black text-sky-700 bg-sky-100/60 px-2.5 py-0.5 rounded-full border border-sky-200/40 font-mono">
              Active Orders
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-mono my-1 leading-none">
            {ordersCount}
          </div>
          <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
            <span>View pending orders queue</span>
            <ChevronRight size={12} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <ShoppingBag size={48} className="opacity-[0.03] absolute right-4 bottom-4 group-hover:scale-110 transition-transform text-sky-950" />
        </div>

        {/* Clients Card (Amber/Orange theme) */}
        <div 
          onClick={() => handleStatusClick('pending')}
          className="bg-gradient-to-br from-amber-50/70 via-amber-50 to-amber-100/40 p-4 sm:p-5 rounded-2xl border border-amber-200/60 shadow-sm flex flex-col justify-between h-28 sm:h-32 transition-all hover:shadow-md duration-200 relative group cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-650 uppercase tracking-widest">
              Clients
            </span>
            <span className="text-[9px] font-black text-amber-700 bg-amber-100/60 px-2.5 py-0.5 rounded-full border border-amber-200/40 font-mono">
              Companies
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-mono my-1 leading-none">
            {clientsCount}
          </div>
          <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
            <span>View client orders history</span>
            <ChevronRight size={12} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <Users size={48} className="opacity-[0.03] absolute right-4 bottom-4 group-hover:scale-110 transition-transform text-amber-950" />
        </div>

      </div>

      {/* Customised Orders Status Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 transition-all hover:shadow-md duration-300">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-3.5 bg-amber-500 rounded-full shrink-0" />
          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
            Customised Orders Status
          </h4>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Pending Orders */}
          <button 
            onClick={() => handleStatusClick('pending')}
            className="flex flex-col items-center justify-center p-3.5 border border-slate-200/80 rounded-xl hover:border-amber-500 hover:bg-amber-50/20 active:scale-95 transition-all duration-200 group shadow-sm relative overflow-hidden min-h-[90px]"
          >
            <FolderCheck size={52} className="absolute -right-2 -bottom-2 text-slate-100 group-hover:text-amber-100 transition-colors z-0" />
            <span className="absolute top-2.5 left-2.5 text-[9px] font-black text-slate-300 group-hover:text-amber-400 uppercase tracking-widest z-0 text-left leading-tight">
              Pending<br/>Orders
            </span>
            <span className="text-4xl font-black text-emerald-500 relative z-10 mt-2">
              {pendingCount}
            </span>
          </button>

          {/* New Orders */}
          <button 
            onClick={() => handleStatusClick('new')}
            className="flex flex-col items-center justify-center p-3.5 border border-slate-200/80 rounded-xl hover:border-amber-500 hover:bg-amber-50/20 active:scale-95 transition-all duration-200 group shadow-sm relative overflow-hidden min-h-[90px]"
          >
            <Folder size={52} className="absolute -right-2 -bottom-2 text-slate-100 group-hover:text-amber-100 transition-colors z-0" />
            <span className="absolute top-2.5 left-2.5 text-[9px] font-black text-slate-300 group-hover:text-amber-400 uppercase tracking-widest z-0 text-left leading-tight">
              New<br/>Orders
            </span>
            <span className="text-4xl font-black text-amber-500 relative z-10 mt-2">
              {newCount}
            </span>
          </button>

          {/* In Progress */}
          <button 
            onClick={() => handleStatusClick('inprogress')}
            className="flex flex-col items-center justify-center p-3.5 border border-slate-200/80 rounded-xl hover:border-amber-500 hover:bg-amber-50/20 active:scale-95 transition-all duration-200 group shadow-sm relative overflow-hidden min-h-[90px]"
          >
            <Hourglass size={52} className="absolute -right-2 -bottom-2 text-slate-100 group-hover:text-amber-100 transition-colors z-0" />
            <span className="absolute top-2.5 left-2.5 text-[9px] font-black text-slate-300 group-hover:text-amber-400 uppercase tracking-widest z-0 text-left leading-tight">
              In<br/>Progress
            </span>
            <span className="text-4xl font-black text-sky-500 relative z-10 mt-2">
              {inProgressCount}
            </span>
          </button>

          {/* Over Due */}
          <button 
            onClick={() => handleStatusClick('overdue')}
            className="flex flex-col items-center justify-center p-3.5 border border-slate-200/80 rounded-xl hover:border-amber-500 hover:bg-amber-50/20 active:scale-95 transition-all duration-200 group shadow-sm relative overflow-hidden min-h-[90px]"
          >
            <Hourglass size={52} className="absolute -right-2 -bottom-2 text-slate-100 group-hover:text-amber-100 transition-colors z-0" />
            <span className="absolute top-2.5 left-2.5 text-[9px] font-black text-slate-300 group-hover:text-amber-400 uppercase tracking-widest z-0 text-left leading-tight">
              Over<br/>Due
            </span>
            <span className="text-4xl font-black text-rose-500 relative z-10 mt-2">
              {overdueCount}
            </span>
          </button>

          {/* Completed */}
          <button 
            onClick={() => handleStatusClick('completed')}
            className="flex flex-col items-center justify-center p-3.5 border border-slate-200/80 rounded-xl hover:border-amber-500 hover:bg-amber-50/20 active:scale-95 transition-all duration-200 group shadow-sm relative overflow-hidden min-h-[90px]"
          >
            <CheckCircle2 size={52} className="absolute -right-2 -bottom-2 text-slate-100 group-hover:text-amber-100 transition-colors z-0" />
            <span className="absolute top-2.5 left-2.5 text-[9px] font-black text-slate-300 group-hover:text-amber-400 uppercase tracking-widest z-0 text-left leading-tight">
              Completed<br/>Orders
            </span>
            <span className="text-4xl font-black text-emerald-500 relative z-10 mt-2">
              {completedCount}
            </span>
          </button>

          {/* Dispatched */}
          <button 
            onClick={() => handleStatusClick('dispatched')}
            className="flex flex-col items-center justify-center p-3.5 border border-slate-200/80 rounded-xl hover:border-amber-500 hover:bg-amber-50/20 active:scale-95 transition-all duration-200 group shadow-sm relative overflow-hidden min-h-[90px]"
          >
            <Clock size={52} className="absolute -right-2 -bottom-2 text-slate-100 group-hover:text-amber-100 transition-colors z-0" />
            <span className="absolute top-2.5 left-2.5 text-[9px] font-black text-slate-300 group-hover:text-amber-400 uppercase tracking-widest z-0 text-left leading-tight">
              Dispatched<br/>Orders
            </span>
            <span className="text-4xl font-black text-purple-500 relative z-10 mt-2">
              {dispatchedCount}
            </span>
          </button>

        </div>
      </div>

      {/* Dynamic Visualizations Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        
        {/* Selling Products Chart (Left) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col min-h-[360px] transition-all hover:shadow-md duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-3.5 bg-amber-500 rounded-full shrink-0" />
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
              Selling Products
            </h4>
          </div>
          
          <div className="flex-1 relative min-h-0 flex flex-col justify-end items-center">
            {sellingProductsData.length > 0 ? (
              <div className="w-full h-[220px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sellingProductsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {sellingProductsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">Top</span>
                  <span className="text-xs font-black text-slate-700 leading-tight">Selling<br/>Products</span>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-bold uppercase tracking-wider">No Sales Data</div>
            )}
            
            {/* Legend Indicators */}
            <div className="w-full grid grid-cols-3 gap-2 mt-4 text-[10px]">
              {sellingProductsData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 font-bold text-slate-605 uppercase truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Client Orders Chart (Right) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col min-h-[360px] transition-all hover:shadow-md duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-3.5 bg-amber-500 rounded-full shrink-0" />
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
              Client Orders
            </h4>
          </div>
          <div className="text-center mb-1">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Top 5 Clients Order</span>
          </div>
          
          <div className="flex-1 relative min-h-0 flex flex-col justify-center items-center">
            {clientOrdersData.length > 0 ? (
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientOrdersData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {clientOrdersData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-bold uppercase tracking-wider">No Client Data</div>
            )}

            {/* Legend Indicators */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 text-[10px]">
              {clientOrdersData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 font-bold text-slate-605 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
