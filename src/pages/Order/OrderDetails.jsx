import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Download, Upload, FileText, RotateCcw, Edit, Calendar, Eye, Briefcase, Factory, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import OrderForm from './OrderForm';
import OrderFormEdit from './OrderFormEdit';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import SearchableDropdown from '../../components/SearchableDropdown';
import ModalView from '../../components/ModalView';
import { generateKarigarHTML, generateCustomerHTML } from './pdf/pdfGenerators';
/* deleted import */
/* deleted import */
/* deleted import */
import { SEEDED_KARIGARS } from '../Master/masterdata';

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

const OrderDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (location.state && location.state.filter) {
      setStatusFilter(location.state.filter);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

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

  const karigarTypeMap = useMemo(() => {
    const map = {};
    karigars.forEach(k => {
      map[k.name] = k.type;
    });
    return map;
  }, [karigars]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrderToEdit, setSelectedOrderToEdit] = useState(null);
  const [viewingImages, setViewingImages] = useState(null);
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

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ordersDataV3');
    if (saved) {
      setOrders(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  const saveOrders = (newOrders) => {
    setOrders(newOrders);
    localStorage.setItem('ordersDataV3', JSON.stringify(newOrders));
  };

  const handleAddOrder = (newOrder) => {
    const synced = syncOrderPlannedDates(null, newOrder);
    const updated = [synced, ...orders];
    saveOrders(updated);
    toast.success('Order added successfully');
  };

  const handleEditOrder = (updatedOrder) => {
    const prevOrder = orders.find(o => o.id === updatedOrder.id);
    const synced = syncOrderPlannedDates(prevOrder, updatedOrder);
    const updated = orders.map(o => o.id === updatedOrder.id ? synced : o);
    saveOrders(updated);
    toast.success('Order updated successfully');
  };

  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      const updated = orders.filter(o => o.id !== orderId);
      saveOrders(updated);
      toast.success('Order deleted successfully');
    }
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

  const generatePDF = async (order, type) => {
    const el = document.createElement('div');
    el.style.width = '794px';
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    el.style.top = '0';
    el.innerHTML = type === 'karigar' ? generateKarigarHTML(order) : generateCustomerHTML(order);
    document.body.appendChild(el);

    try {
      const pages = el.querySelectorAll('.pdf-page');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      if (pages.length > 0) {
        for (let i = 0; i < pages.length; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          const canvas = await html2canvas(pages[i], { scale: 3, useCORS: true, logging: false, imageTimeout: 0 });
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
      } else {
        const canvas = await html2canvas(el, { scale: 3, useCORS: true, logging: false, imageTimeout: 0 });
        const imgData = canvas.toDataURL('image/png');
        const calculatedHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, calculatedHeight);
      }

      pdf.save(`${type}_${order.orderNo || 'order'}.pdf`);
      toast.success('PDF downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      document.body.removeChild(el);
    }
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
    setStatusFilter(null);
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const nonCloneOrders = useMemo(() => {
    return orders.filter(o => !(o.id && String(o.id).includes('-P')));
  }, [orders]);

  const categoriesList = useMemo(() => generateFilterOptions(nonCloneOrders, 'category'), [nonCloneOrders]);
  const karigarsList = useMemo(() => {
    const raw = generateFilterOptions(nonCloneOrders, 'karigar');
    return raw.map(opt => {
      const type = karigarTypeMap[opt.value];
      return {
        ...opt,
        label: type ? `${opt.value} (${type})` : opt.value
      };
    });
  }, [nonCloneOrders, karigarTypeMap]);
  const meltingList = useMemo(() => generateFilterOptions(nonCloneOrders, 'melting'), [nonCloneOrders]);
  const typesList = useMemo(() => generateFilterOptions(nonCloneOrders, 'orderType'), [nonCloneOrders]);

  const filteredOrders = useMemo(() => {
    return nonCloneOrders.filter(o => {
      if (statusFilter) {
        const stage = o.orderStage?.toLowerCase() || '';
        if (statusFilter === 'pending') {
          if (stage === 'delivered' || stage === 'order cancel') return false;
        } else if (statusFilter === 'new') {
          if (stage !== 'new') return false;
        } else if (statusFilter === 'inprogress') {
          if (stage === 'new' || stage === 'delivered' || stage === 'order cancel') return false;
        } else if (statusFilter === 'overdue') {
          if (stage === 'delivered' || stage === 'order cancel') return false;
          const left = calculateLeftDays(o.expectedDeliveryDate || o.deliveryDate);
          if (left === '-' || left >= 0) return false;
        } else if (statusFilter === 'completed') {
          if (stage !== 'delivered') return false;
        } else if (statusFilter === 'dispatched') {
          if (o.dispatchStatus !== 'Done') return false;
        }
      }

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
  }, [nonCloneOrders, filters, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tableHeaders = [
    { label: 'Action', className: 'sticky left-0 bg-gray-50 z-20 shadow-[1px_0_0_#e5e7eb] w-[90px] min-w-[90px]' },
    { label: 'Order Number', className: 'sticky left-[90px] bg-gray-50 z-20 shadow-[1px_0_0_#e5e7eb]' },
    "Order No. Reference",
    "Timestamp",
    "Live Left Days",
    "Company Name",
    "Company Number",
    "Order Type",
    "Order Rec. Date",
    "Delivery Date",
    "Expected Delivery Date",
    "Karigar Delivery Date",
    "Karigar Name",
    "Category",
    "Quantity",
    "From Weight",
    "To Weight",
    "Melting",
    "Meena",
    "Length",
    "Size",
    "Broadness",
    "Screw",
    "Karigar Notes",
    "Narration 1",
    "Narration 2",
    "QC",
    "Sample Weight",
    "Order Stage",
    "Total Weight",
    "Delivery Location",
    "Process Stage",
    "Images (view)",
    { label: 'Pdf Download', className: 'sticky right-0 bg-gray-50 z-20 shadow-[-1px_0_0_#e5e7eb]' }
  ];

  const formatTimestamp = (ts, id) => {
    try {
      const date = ts ? new Date(ts) : (id ? new Date(parseInt(id)) : null);
      if (!date || isNaN(date.getTime())) return '-';
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
    } catch {
      return '-';
    }
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
  const renderRow = (order, idx) => {
    const leftDays = calculateLeftDays(order.expectedDeliveryDate);
    return (
      <tr key={order.id || idx} className="hover:bg-amber-50/30 transition-colors border-b border-gray-100 group">
        <td className="px-2 py-3 sticky left-0 bg-white group-hover:bg-amber-50 z-10 shadow-[1px_0_0_#e5e7eb] text-center whitespace-nowrap w-[90px] min-w-[90px]">
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => {
                setSelectedOrderToEdit(order);
                setIsEditModalOpen(true);
              }}
              className="p-1.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200 hover:bg-amber-100 transition-colors"
              title="Edit Order"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => handleDeleteOrder(order.id)}
              className="p-1.5 bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 transition-colors"
              title="Delete Order"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
        <td className="px-4 py-3 font-bold text-gray-900 sticky left-[90px] bg-white group-hover:bg-amber-50 z-10 shadow-[1px_0_0_#e5e7eb] text-center whitespace-nowrap">
          {order.orderNo || '-'}
        </td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">
          {order.orderNoReference || '-'}
        </td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap font-medium">
          {formatTimestamp(order.timestamp, order.id)}
        </td>
        <td className="px-4 py-3 text-center whitespace-nowrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${leftDays < 0 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
            {leftDays} Days
          </span>
        </td>
        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-800 whitespace-nowrap">{order.company || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.companyNumber || '-'}</td>
        <td className="px-4 py-3 text-center whitespace-nowrap"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getOrderTypeColor(order.orderType)}`}>{order.orderType || '-'}</span></td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{formatDate(order.orderRecDate)}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{formatDate(order.deliveryDate)}</td>
        <td className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap">{formatDate(order.expectedDeliveryDate)}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{formatDate(order.karigarDeliveryDate)}</td>
        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">
          {order.karigar ? (
            <div className="inline-flex items-center justify-center gap-1.5">
              <span>{order.karigar}</span>
              {karigarTypeMap[order.karigar] && (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                  karigarTypeMap[order.karigar] === 'Factory' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {karigarTypeMap[order.karigar] === 'Factory' ? <Factory size={9} /> : <Briefcase size={9} />}
                  {karigarTypeMap[order.karigar]}
                </span>
              )}
            </div>
          ) : '-'}
        </td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.category || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.quantity || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.fromWeight || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.toWeight || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-650 whitespace-nowrap">{order.melting || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.meena || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.length || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.size || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.broadness || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.screw || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap truncate max-w-[150px]" title={order.karigarNotes}>{order.karigarNotes || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap truncate max-w-[150px]" title={order.narration1}>{order.narration1 || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap truncate max-w-[150px]" title={order.narration2}>{order.narration2 || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.qc || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.sampleWeight || '-'}</td>
        <td className="px-4 py-3 text-center whitespace-nowrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStageColor(order.manualOrderStage || order.orderStage)}`}>
            {order.manualOrderStage || order.orderStage || 'New'}
          </span>
        </td>
        <td className="px-4 py-3 text-center text-xs font-black text-gray-900 whitespace-nowrap">{order.totalWeight || '-'} g</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{order.deliveryLocation || '-'}</td>
        <td className="px-4 py-3 text-center whitespace-nowrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStageColor(order.orderStage)}`}>
            {order.orderStage?.toLowerCase() === 'in process' ? 'Metal Issue' : order.orderStage || 'New'}
          </span>
        </td>
        <td className="px-4 py-3 text-center whitespace-nowrap">
          <button
            onClick={() => setViewingImages({ orderNo: order.orderNo, images: order.images || [] })}
            className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors text-xs font-bold shadow-sm"
          >
            View
          </button>
        </td>
        <td className="px-4 py-3 sticky right-0 bg-white group-hover:bg-amber-50 z-10 shadow-[-1px_0_0_#e5e7eb] text-center">
          <div className="flex justify-center gap-2">
            <button onClick={() => generatePDF(order, 'karigar')} className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-md transition-colors" title="Karigar PDF">
              <FileText size={16} />
            </button>
            <button onClick={() => generatePDF(order, 'customer')} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Customer PDF">
              <Download size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderCard = (order, idx) => {
    const leftDays = calculateLeftDays(order.expectedDeliveryDate);
    return (
      <div key={order.id || idx} className="bg-white rounded-xl border border-amber-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-amber-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 uppercase truncate max-w-[150px]">Order: {order.orderNo || '-'} {order.orderNoReference ? `(${order.orderNoReference})` : ''}</span>
          </div>
          <div className="flex gap-1">
            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getStageColor(order.orderStage)}`} title="Process Stage">
              {order.orderStage?.toLowerCase() === 'in process' ? 'Metal Issue' : order.orderStage || 'New'}
            </span>
            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getStageColor(order.manualOrderStage || order.orderStage)}`} title="Order Stage">
              {order.manualOrderStage || order.orderStage || 'New'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Customer/Company</span>
            <span className="text-gray-700 font-medium">{order.company || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Company Number</span>
            <span className="text-gray-700 font-medium">{order.companyNumber || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Karigar</span>
            <span className="text-gray-700 font-medium flex items-center gap-1.5">
              {order.karigar || '-'}
              {order.karigar && karigarTypeMap[order.karigar] && (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${
                  karigarTypeMap[order.karigar] === 'Factory' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {karigarTypeMap[order.karigar] === 'Factory' ? <Factory size={8} /> : <Briefcase size={8} />}
                  {karigarTypeMap[order.karigar]}
                </span>
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Expected Delivery</span>
            <span className="text-gray-700 font-medium">{formatDate(order.expectedDeliveryDate)}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Live Left Days</span>
            <span className={`font-bold ${leftDays < 0 ? 'text-red-600' : 'text-green-600'}`}>{leftDays} Days</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100 mt-1">
          <button
            onClick={() => {
              setSelectedOrderToEdit(order);
              setIsEditModalOpen(true);
            }}
            className="flex-1 flex items-center justify-center py-1.5 bg-amber-600 text-white rounded-lg shadow-sm active:scale-95 transition-transform"
            title="Edit Order"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => handleDeleteOrder(order.id)}
            className="flex-1 flex items-center justify-center py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200 shadow-sm active:scale-95 transition-transform hover:bg-red-100"
            title="Delete Order"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setViewingImages({ orderNo: order.orderNo, images: order.images || [] })}
            className="flex-1 flex items-center justify-center py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 active:scale-95 transition-transform"
            title="View Images"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => generatePDF(order, 'karigar')}
            className="flex-1 flex items-center justify-center py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 active:scale-95 transition-transform"
            title="Karigar PDF"
          >
            <FileText size={14} />
          </button>
          <button
            onClick={() => generatePDF(order, 'customer')}
            className="flex-1 flex items-center justify-center py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 active:scale-95 transition-transform"
            title="Customer PDF"
          >
            <Download size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full min-h-0">
      
      {/* Header Filters Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center">
          
          {/* Search bar input & Mobile action buttons in one row */}
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5] flex-nowrap">
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
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); navigate('/dump-order'); }}
              className="lg:hidden flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
              title="Dump Order"
            >
              <Upload size={16} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="lg:hidden flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
              title="Add Order"
            >
              <Plus size={16} />
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

          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); navigate('/dump-order'); }}
            className="hidden lg:flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold shadow-sm hover:shadow-md transition-all text-xs md:text-sm whitespace-nowrap h-[32px] md:h-[38px] flex-shrink-0 lg:ml-2"
          >
            <Upload size={16} />
            Dump Order
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="hidden lg:flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold shadow-sm hover:shadow-md transition-all text-xs md:text-sm whitespace-nowrap h-[32px] md:h-[38px] flex-shrink-0 lg:ml-2"
          >
            <Plus size={16} />
            Add Order
          </button>
        </div>
      </div>

      {statusFilter && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-lg text-xs md:text-sm text-amber-800 font-semibold shadow-sm mx-2 sm:mx-0">
          <div className="flex items-center gap-2">
            <span className="uppercase text-[9px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-black tracking-wider">Active Filter</span>
            <span>Showing only <span className="font-extrabold capitalize text-amber-950">{statusFilter === 'inprogress' ? 'In Progress' : statusFilter === 'overdue' ? 'Over Due' : statusFilter}</span> orders</span>
          </div>
          <button 
            onClick={() => setStatusFilter(null)}
            className="text-amber-700 hover:text-amber-900 hover:underline text-xs font-bold bg-white border border-amber-200 px-2 py-1 rounded shadow-sm hover:bg-amber-100/50 transition-colors"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Table content displaying logs */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedOrders}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="2500px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredOrders.length}
          itemsPerPageOptions={[50, 100, 200, 500, 1000]}
        />
      </div>

      <OrderForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddOrder} 
        orders={orders}
      />
      <OrderFormEdit
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedOrderToEdit(null);
        }}
        onSave={handleEditOrder}
        order={selectedOrderToEdit}
      />

      {/* Modal popup for viewing images */}
      <ModalView
        isOpen={!!viewingImages}
        onClose={() => setViewingImages(null)}
        title={`Images for Order: ${viewingImages?.orderNo}`}
        maxWidth="max-w-xl"
      >
        {viewingImages?.images && viewingImages.images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {viewingImages.images.map((src, idx) => (
              <div key={idx} className="relative w-full aspect-[6/5] overflow-hidden rounded-lg">
                <img
                  src={src}
                  alt={`Order Image ${idx + 1}`}
                  className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform duration-200"
                />
                <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none font-mono">
                  {idx + 1}/{viewingImages.images.length}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-gray-400 font-bold uppercase tracking-wider">No images uploaded for this order</div>
        )}
      </ModalView>
    </div>
  );
};

export default OrderDetails;
