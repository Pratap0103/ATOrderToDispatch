import React, { useState, useEffect, useMemo } from 'react';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
import CustomDropdown from '../../components/CustomDropdown';
import SearchableDropdown from '../../components/SearchableDropdown';
import DateInput from '../../components/DateInput';
/* deleted import */
import { SEEDED_CATEGORIES } from '../Master/Category';
import { SEEDED_MELTING } from '../Master/Melting';
import { SEEDED_COMPANIES } from '../Master/CompanyDetails';

const companyNames = [
  "Kalyan Jewellers", "Malabar Gold", "Tanishq", "Joyalukkas", "Bhima Jewellers", 
  "Senco Gold", "PC Jeweller", "TBZ Jewellers", "Thangamayil", "Kirtilals", 
  "Vaibhav Jewellers", "GRT Jewellers", "Lalithaa Jewellery", "Khosla Jewellers", "Reliance Jewels", 
  "Orra", "CaratLane", "BlueStone", "Amrapali", "Gitanjali Gems", 
  "Jos Alukkas", "Karan Kothari", "Manubhai Jewellers", "Neelkanth Jewellers", "Ranka Jewellers", 
  "Tara Jewels", "WHP Jewellers", "Zaveri Bros", "Chandukaka Saraf", "Chintamanis", 
  "D P Jewellers", "PNG Jewellers", "Laxmi Ratan", "Shubh Jewellers", "Garg Jewellers", 
  "Madanlal Jewellers", "Navkar Jewellers", "Surana Jewellers", "Bafna Jewellers", "Kothari Gold", 
  "Mehta Jewellery", "Soni Jewellers", "Bhatia Gems", "Rajesh Exports", "Pukhraj Jewellers", 
  "Kundan Jewellers", "Heera Jewellers", "Moti Jewellers", "Swarna Jewellers", "Ganga Jewellers"
];
const DUMMY_COMPANIES = companyNames.map(name => ({ value: name, label: name }));

const companyPhoneMap = {};
companyNames.forEach((name, index) => {
  companyPhoneMap[name] = `98${String(index + 1).padStart(2, '0')}123456`;
});

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

const compressImage = (base64Str, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};



const getTodayDateString = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const OrderForm = ({ isOpen, onClose, onSave, orders = [] }) => {
  const initialFormState = {
    orderNo: '',
    orderRecDate: getTodayDateString(),
    category: '',
    fromWeight: '',
    melting: '',
    length: '',
    broadness: '',
    karigarNotes: '',
    narration2: '',
    sampleWeight: '',
    expectedDeliveryDate: '',
    karigar: '',
    totalWeight: '',
    company: '',
    companyNumber: '',
    deliveryDate: '',
    quantity: '',
    toWeight: '',
    meena: '',
    size: '',
    screw: '',
    narration1: '',
    qc: '',
    orderType: '',
    karigarDeliveryDate: '',
    orderStage: '',
    deliveryLocation: '',
    images: [],
  };

  const [formData, setFormData] = useState(initialFormState);
  const [companies, setCompanies] = useState(() => {
    const saved = localStorage.getItem('master_companies_v3');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('master_companies_v3', JSON.stringify(SEEDED_COMPANIES));
    return SEEDED_COMPANIES;
  });

  // ── Master: Delivery Locations ──
  const [deliveryLocations, setDeliveryLocations] = useState(() => {
    const saved = localStorage.getItem('master_delivery_locations');
    if (saved) return JSON.parse(saved);
    const defaults = [
      { id: 'DL-001', location: 'Mumbai',  timestamp: '2026-06-01T08:30:00' },
      { id: 'DL-002', location: 'Kolkata', timestamp: '2026-06-01T09:15:00' },
      { id: 'DL-003', location: 'Raipur',  timestamp: '2026-06-01T10:00:00' },
    ];
    localStorage.setItem('master_delivery_locations', JSON.stringify(defaults));
    return defaults;
  });

  // ── Master: Order Stages ──
  const [orderStages, setOrderStages] = useState(() => {
    const saved = localStorage.getItem('master_order_stages');
    if (saved) {
      let parsed = JSON.parse(saved);
      if (parsed.some(s => s.stage === 'New')) {
        parsed = parsed.filter(s => s.stage !== 'New');
        localStorage.setItem('master_order_stages', JSON.stringify(parsed));
      }
      return parsed;
    }
    const defaults = [
      { id: 'OS-001', stage: 'Pending',              timestamp: '2026-06-01T08:00:00' },
      { id: 'OS-002', stage: 'In Process',            timestamp: '2026-06-01T08:15:00' },
      { id: 'OS-003', stage: 'Ready for Delivery',    timestamp: '2026-06-01T08:30:00' },
      { id: 'OS-004', stage: 'Completed',             timestamp: '2026-06-01T08:45:00' },
      { id: 'OS-005', stage: 'Reject',                timestamp: '2026-06-01T09:00:00' },
    ];
    localStorage.setItem('master_order_stages', JSON.stringify(defaults));
    return defaults;
  });

  // ── Master: Categories ──
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('master_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      const hasChain = parsed.some(c => c.category === 'CHAIN');
      if (hasChain) return parsed;
    }
    localStorage.setItem('master_categories', JSON.stringify(SEEDED_CATEGORIES));
    return SEEDED_CATEGORIES;
  });

  // ── Master: Melting ──
  const [meltingList, setMeltingList] = useState(() => {
    const saved = localStorage.getItem('master_melting');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed;
    }
    localStorage.setItem('master_melting', JSON.stringify(SEEDED_MELTING));
    return SEEDED_MELTING;
  });

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('master_companies_v3');
      if (saved) {
        setCompanies(JSON.parse(saved));
      }
      const savedLocations = localStorage.getItem('master_delivery_locations');
      if (savedLocations) {
        setDeliveryLocations(JSON.parse(savedLocations));
      } else {
        const defaults = [
          { id: 'DL-001', location: 'Mumbai',  timestamp: '2026-06-01T08:30:00' },
          { id: 'DL-002', location: 'Kolkata', timestamp: '2026-06-01T09:15:00' },
          { id: 'DL-003', location: 'Raipur',  timestamp: '2026-06-01T10:00:00' },
        ];
        localStorage.setItem('master_delivery_locations', JSON.stringify(defaults));
        setDeliveryLocations(defaults);
      }
      const savedStages = localStorage.getItem('master_order_stages');
      if (savedStages) {
        let parsed = JSON.parse(savedStages);
        if (parsed.some(s => s.stage === 'New')) {
          parsed = parsed.filter(s => s.stage !== 'New');
          localStorage.setItem('master_order_stages', JSON.stringify(parsed));
        }
        setOrderStages(parsed);
      } else {
        const defaults = [
          { id: 'OS-001', stage: 'Pending',              timestamp: '2026-06-01T08:00:00' },
          { id: 'OS-002', stage: 'In Process',            timestamp: '2026-06-01T08:15:00' },
          { id: 'OS-003', stage: 'Ready for Delivery',    timestamp: '2026-06-01T08:30:00' },
          { id: 'OS-004', stage: 'Completed',             timestamp: '2026-06-01T08:45:00' },
          { id: 'OS-005', stage: 'Reject',                timestamp: '2026-06-01T09:00:00' },
        ];
        localStorage.setItem('master_order_stages', JSON.stringify(defaults));
        setOrderStages(defaults);
      }
      const savedCategories = localStorage.getItem('master_categories');
      if (savedCategories) {
        const parsed = JSON.parse(savedCategories);
        const hasChain = parsed.some(c => c.category === 'CHAIN');
        if (hasChain) {
          setCategories(parsed);
        } else {
          localStorage.setItem('master_categories', JSON.stringify(SEEDED_CATEGORIES));
          setCategories(SEEDED_CATEGORIES);
        }
      } else {
        localStorage.setItem('master_categories', JSON.stringify(SEEDED_CATEGORIES));
        setCategories(SEEDED_CATEGORIES);
      }
      // reload melting
      const savedMelting = localStorage.getItem('master_melting');
      if (savedMelting) {
        const parsed = JSON.parse(savedMelting);
        if (parsed.length > 0) setMeltingList(parsed);
        else setMeltingList(SEEDED_MELTING);
      } else {
        setMeltingList(SEEDED_MELTING);
      }
    }
  }, [isOpen]);

  const companyOptions = useMemo(() => {
    return companies.map(c => ({ value: c.name, label: c.name }));
  }, [companies]);

  // ── Dynamic options from Master ──
  const deliveryLocationOptions = useMemo(() =>
    deliveryLocations.map(l => ({ value: l.location, label: l.location })),
    [deliveryLocations]
  );

  const orderStageOptions = useMemo(() =>
    orderStages.map(s => ({ value: s.stage, label: s.stage })),
    [orderStages]
  );

  const categoryOptions = useMemo(() =>
    categories.map(c => ({ value: c.category, label: c.category })),
    [categories]
  );

  const meltingOptions = useMemo(() =>
    meltingList.map(m => ({ value: m.melting, label: m.melting })),
    [meltingList]
  );

  // Karigar options — live from master_karigars_v3 localStorage
  const karigarOptions = useKarigarOptions();


  const companyPhoneMap = useMemo(() => {
    const map = {};
    companies.forEach(c => {
      map[c.name] = c.number;
    });
    return map;
  }, [companies]);
  
  const generateNextOrderNo = (existingOrders) => {
    if (!existingOrders || existingOrders.length === 0) {
      return 'JF-001';
    }

    let maxNum = 0;
    existingOrders.forEach((o) => {
      if (o.orderNo) {
        const match = o.orderNo.match(/^JF-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }
    });

    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(3, '0');
    return `JF-${padded}`;
  };

  useEffect(() => {
    if (isOpen) {
      const nextOrderNo = generateNextOrderNo(orders);
      setFormData((prev) => ({
        ...prev,
        orderNo: nextOrderNo
      }));
    } else {
      setFormData(initialFormState);
    }
  }, [isOpen, orders]);

  const handleInputChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number' && value && value.includes('.')) {
      const parts = value.split('.');
      if (parts[1].length > 3) {
        value = parts[0] + '.' + parts[1].slice(0, 3);
      }
    }
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'company') {
        updated.companyNumber = companyPhoneMap[value] || '';
      }
      if (name === 'expectedDeliveryDate') {
        const expectedDate = parseDateString(value);
        if (expectedDate && !isNaN(expectedDate.getTime())) {
          // Karigar Delivery Date = Expected Delivery Date - 3 days
          const karigarDate = new Date(expectedDate);
          karigarDate.setDate(karigarDate.getDate() - 3);
          const dd = String(karigarDate.getDate()).padStart(2, '0');
          const mm = String(karigarDate.getMonth() + 1).padStart(2, '0');
          const yyyy = karigarDate.getFullYear();
          updated.karigarDeliveryDate = `${dd}/${mm}/${yyyy}`;
        } else {
          updated.karigarDeliveryDate = '';
        }
      }
      if (name === 'deliveryDate') {
        const deliveryDate = parseDateString(value);
        if (deliveryDate && !isNaN(deliveryDate.getTime())) {
          // Auto-fill Expected Delivery Date with same date as Delivery Date
          const ddE = String(deliveryDate.getDate()).padStart(2, '0');
          const mmE = String(deliveryDate.getMonth() + 1).padStart(2, '0');
          const yyyyE = deliveryDate.getFullYear();
          updated.expectedDeliveryDate = `${ddE}/${mmE}/${yyyyE}`;
          // Karigar Delivery Date = Delivery Date - 3 days
          const karigarDate = new Date(deliveryDate);
          karigarDate.setDate(karigarDate.getDate() - 3);
          const dd = String(karigarDate.getDate()).padStart(2, '0');
          const mm = String(karigarDate.getMonth() + 1).padStart(2, '0');
          const yyyy = karigarDate.getFullYear();
          updated.karigarDeliveryDate = `${dd}/${mm}/${yyyy}`;
        } else {
          updated.expectedDeliveryDate = '';
          updated.karigarDeliveryDate = '';
        }
      }
      return updated;
    });
  };

  const MAX_IMAGES = 15;

  const handleImageChange = (e) => {
    const target = e.target;
    const files = Array.from(target.files || []);
    if (!files.length) return;

    const currentCount = formData.images.length;
    const remaining = MAX_IMAGES - currentCount;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      target.value = '';
      return;
    }

    const toAdd = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.error(`Only ${remaining} more image(s) can be added (max ${MAX_IMAGES})`);
    }

    // Read all selected files once and compress them
    Promise.all(
      toAdd.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              compressImage(reader.result).then(resolve);
            };
            reader.readAsDataURL(file);
          })
      )
    ).then((results) => {
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...results] }));
      target.value = ''; // reset so same file can be picked again
    }).catch(() => {
      target.value = '';
    });
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handlePreventInvalidChars = (e) => {
    // Block e, E, +, -
    if (['e', 'E', '+', '-'].includes(e.key)) { e.preventDefault(); return; }
    // Block more than 3 decimal digits
    const val = e.target.value;
    const dotIndex = val.indexOf('.');
    if (dotIndex !== -1 && val.length - dotIndex > 3 && !['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.orderNo) {
      toast.error('Order Number is required');
      return;
    }
    if (!formData.company) {
      toast.error('Company Name is required');
      return;
    }
    if (!formData.companyNumber) {
      toast.error('Mobile Number is required');
      return;
    }
    if (!formData.orderRecDate) {
      toast.error('Order Received Date is required');
      return;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return;
    }
    if (!formData.quantity) {
      toast.error('Quantity is required');
      return;
    }
    if (!formData.fromWeight) {
      toast.error('From Weight is required');
      return;
    }
    if (!formData.toWeight) {
      toast.error('To Weight is required');
      return;
    }
    if (!formData.melting) {
      toast.error('Melting is required');
      return;
    }
    if (!formData.meena) {
      toast.error('Meena is required');
      return;
    }
    if (!formData.orderType) {
      toast.error('Order Type is required');
      return;
    }
    if (!formData.expectedDeliveryDate) {
      toast.error('Expected Delivery Date is required');
      return;
    }
    if (!formData.deliveryDate) {
      toast.error('Delivery Date is required');
      return;
    }

    const orderRecObj = parseDateString(formData.orderRecDate);
    const deliveryObj = parseDateString(formData.deliveryDate);
    if (orderRecObj && deliveryObj && deliveryObj < orderRecObj) {
      toast.error('Delivery Date cannot be before Order Received Date');
      return;
    }
    if (!formData.karigarDeliveryDate) {
      toast.error('Karigar Delivery Date is required');
      return;
    }
    if (!formData.karigar) {
      toast.error('Karigar is required');
      return;
    }
    if (!formData.orderStage) {
      toast.error('Order Stage is required');
      return;
    }
    if (!formData.totalWeight) {
      toast.error('Total Weight is required');
      return;
    }
    if (!formData.deliveryLocation) {
      toast.error('Delivery Location is required');
      return;
    }
    
    onSave({ ...formData, manualOrderStage: formData.orderStage, id: Date.now().toString(), timestamp: new Date().toISOString() });
    setFormData(initialFormState);
    onClose();
  };

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Order"
      onSubmit={handleSubmit}
      submitText="Save Order"
      cancelText="Cancel"
      maxWidth="max-w-4xl"
      maxHeight="80vh"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {/* Row 1 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Order.No <span className="text-red-500">*</span></label>
          <input
            readOnly
            required
            type="text"
            name="orderNo"
            value={formData.orderNo}
            className="w-full p-2 bg-gray-150 border border-gray-200 rounded-lg outline-none text-xs text-gray-500 cursor-not-allowed select-none"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
            <SearchableDropdown
              options={companyOptions}
              value={formData.company}
              onChange={(val) => handleInputChange({ target: { name: 'company', value: val } })}
              placeholder="Select Company"
              className="w-full text-xs"
              height="h-[34px]"
              rounded="rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
            <input required type="text" name="companyNumber" value={formData.companyNumber} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs" />
          </div>
        </div>

        {/* Row 2 */}
        <DateInput
          label="Order Rec.Date"
          name="orderRecDate"
          value={formData.orderRecDate}
          onChange={handleInputChange}
          required={true}
        />
        
        <DateInput
          label="Delivery Date"
          name="deliveryDate"
          value={formData.deliveryDate}
          onChange={handleInputChange}
          required={true}
          minDate={formData.orderRecDate}
        />

        {/* Row 3 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
          <SearchableDropdown
            options={categoryOptions}
            value={formData.category}
            onChange={(val) => handleInputChange({ target: { name: 'category', value: val } })}
            placeholder="Select Category"
            className="w-full text-xs"
            height="h-[34px]"
            rounded="rounded-lg"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
          <input
            required
            type="text"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              // Allow: letters, digits, backspace, delete, arrows, tab, ctrl/cmd shortcuts
              const isAlphaNum = /^[a-zA-Z0-9]$/.test(e.key);
              const isControl = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Home','End'].includes(e.key) || e.ctrlKey || e.metaKey;
              if (!isAlphaNum && !isControl) e.preventDefault();
            }}
            placeholder="e.g. 10 or 10A"
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs"
          />
        </div>

        {/* Row 4 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">From Weight <span className="text-red-500">*</span></label>
          <input required type="number" step="0.001" name="fromWeight" value={formData.fromWeight} onChange={handleInputChange} onKeyDown={handlePreventInvalidChars} onWheel={(e) => e.target.blur()} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none no-spinners text-xs" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">To Weight <span className="text-red-500">*</span></label>
          <input required type="number" step="0.001" name="toWeight" value={formData.toWeight} onChange={handleInputChange} onKeyDown={handlePreventInvalidChars} onWheel={(e) => e.target.blur()} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none no-spinners text-xs" />
        </div>

        {/* Row 5 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Melting <span className="text-red-500">*</span></label>
          <CustomDropdown
            options={meltingOptions}
            value={formData.melting}
            onChange={(val) => handleInputChange({ target: { name: 'melting', value: val } })}
            placeholder="Select Melting"
            className="w-full text-xs"
            height="h-[34px]"
            rounded="rounded-lg"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Meena <span className="text-red-500">*</span></label>
          <CustomDropdown
            options={[
              { value: 'Yes', label: 'Yes' },
              { value: 'No', label: 'No' }
            ]}
            value={formData.meena}
            onChange={(val) => handleInputChange({ target: { name: 'meena', value: val } })}
            placeholder="Select Meena"
            className="w-full text-xs"
            height="h-[34px]"
            rounded="rounded-lg"
          />
        </div>

        {/* Row 6 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Length</label>
          <input type="text" name="length" value={formData.length} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Size</label>
          <input type="text" name="size" value={formData.size} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs" />
        </div>

        {/* Row 7 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Broadness</label>
          <input type="text" name="broadness" value={formData.broadness} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Screw</label>
          <CustomDropdown
            options={[
              { value: 'English', label: 'English' },
              { value: 'Pongli', label: 'Pongli' }
            ]}
            value={formData.screw}
            onChange={(val) => handleInputChange({ target: { name: 'screw', value: val } })}
            placeholder="Select Screw"
            className="w-full text-xs"
            height="h-[34px]"
            rounded="rounded-lg"
          />
        </div>

        {/* Row 8 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Karigar Notes</label>
          <input type="text" name="karigarNotes" value={formData.karigarNotes} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Narration 1</label>
          <input type="text" name="narration1" value={formData.narration1} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs" />
        </div>

        {/* Row 9 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Narration 2</label>
          <input type="text" name="narration2" value={formData.narration2} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">QC</label>
          <input type="text" name="qc" value={formData.qc} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs" />
        </div>

        {/* Row 10 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Sample Weight</label>
          <input type="number" step="0.001" name="sampleWeight" value={formData.sampleWeight} onChange={handleInputChange} onKeyDown={handlePreventInvalidChars} onWheel={(e) => e.target.blur()} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none no-spinners text-xs" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Order Type <span className="text-red-500">*</span></label>
          <CustomDropdown
            options={[
              { value: 'Customer Order', label: 'Customer Order' },
              { value: 'Stock Order', label: 'Stock Order' },
              { value: 'Urgent Order', label: 'Urgent Order' }
            ]}
            value={formData.orderType}
            onChange={(val) => handleInputChange({ target: { name: 'orderType', value: val } })}
            placeholder="Select Type"
            className="w-full text-xs"
            height="h-[34px]"
            rounded="rounded-lg"
          />
        </div>

        {/* Row 11 */}
        <DateInput
          label="Expected Delivery Date"
          name="expectedDeliveryDate"
          value={formData.expectedDeliveryDate}
          onChange={handleInputChange}
          required={true}
          minDate={formData.orderRecDate}
        />

        <DateInput
          label="Karigar Delivery Date"
          name="karigarDeliveryDate"
          value={formData.karigarDeliveryDate}
          onChange={handleInputChange}
          required={true}
          minDate={formData.orderRecDate}
        />

        {/* Row 12 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Karigar <span className="text-red-500">*</span></label>
          <SearchableDropdown
            options={karigarOptions}
            value={formData.karigar}
            onChange={(val) => handleInputChange({ target: { name: 'karigar', value: val } })}
            placeholder="Select Karigar"
            className="w-full text-xs"
            height="h-[34px]"
            rounded="rounded-lg"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Order Stage <span className="text-red-500">*</span></label>
          <CustomDropdown
            options={orderStageOptions}
            value={formData.orderStage}
            onChange={(val) => handleInputChange({ target: { name: 'orderStage', value: val } })}
            placeholder="Select Stage"
            className="w-full text-xs"
            height="h-[34px]"
            rounded="rounded-lg"
          />
        </div>

        {/* Row 13 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Total Weight <span className="text-red-500">*</span></label>
          <input required type="number" step="0.001" name="totalWeight" value={formData.totalWeight} onChange={handleInputChange} onKeyDown={handlePreventInvalidChars} onWheel={(e) => e.target.blur()} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none no-spinners text-xs" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery Location <span className="text-red-500">*</span></label>
          <CustomDropdown
            options={deliveryLocationOptions}
            value={formData.deliveryLocation}
            onChange={(val) => handleInputChange({ target: { name: 'deliveryLocation', value: val } })}
            placeholder="Select Location"
            className="w-full text-xs"
            height="h-[34px]"
            rounded="rounded-lg"
          />
        </div>
      </div>

      {/* Image Upload – multi, max 15 */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-gray-700">
            Upload Images
            <span className="ml-2 text-[10px] font-normal text-gray-400">(max {MAX_IMAGES})</span>
          </label>
          {formData.images.length > 0 && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              {formData.images.length}/{MAX_IMAGES} uploaded
            </span>
          )}
        </div>

        {/* Drop zone — hidden when at max */}
        {formData.images.length < MAX_IMAGES && (
          <div className="flex items-center justify-center w-full mb-3">
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-amber-300 border-dashed rounded-xl cursor-pointer bg-amber-50 hover:bg-amber-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-3 pb-3">
                <Upload className="w-6 h-6 mb-2 text-amber-500" />
                <p className="mb-1 text-xs text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag &amp; drop
                </p>
                <p className="text-[10px] text-gray-400">
                  {MAX_IMAGES - formData.images.length} slot{MAX_IMAGES - formData.images.length !== 1 ? 's' : ''} remaining
                </p>
              </div>
              <input
                key={isOpen ? 'open' : 'closed'}
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
            </label>
          </div>
        )}

        {/* Thumbnail grid with X/total badge */}
        {formData.images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {formData.images.map((src, idx) => (
              <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                <img
                  src={src}
                  alt={`Image ${idx + 1}`}
                  className="w-full h-20 object-cover"
                />
                {/* X/total badge */}
                <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                  {idx + 1}/{formData.images.length}
                </span>
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-[10px] font-black flex items-center justify-center transition-opacity shadow"
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalForm>
  );
};

export default OrderForm;
