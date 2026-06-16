import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
import CustomDropdown from '../../components/CustomDropdown';
import { Printer } from 'lucide-react';

const GhatJamaForm = ({ isOpen, onClose, onSave, order, onPrint }) => {
  const initialFormState = {
    ghatJamaStatus: '',
    ghatJamaSubcategory: '',
    ghatJamaWeight: '',
    voucherNumber: '',
    pcs: '',
    ghatJamaRemarks: '',
    ghatMelting: '',
    ghatWastage: '',
    fineWeight: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [meltingList, setMeltingList] = useState([]);
  const [subcategoryList, setSubcategoryList] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('master_melting');
    if (saved) {
      try {
        setMeltingList(JSON.parse(saved));
      } catch (e) {}
    }
    const savedSub = localStorage.getItem('master_subcategories');
    if (savedSub) {
      try {
        setSubcategoryList(JSON.parse(savedSub));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isOpen && order) {
      let masterGhatMelting = '';
      if (meltingList.length > 0 && order.melting) {
         const m = meltingList.find(x => x.melting?.toLowerCase() === order.melting?.toLowerCase());
         if (m && m.ghatMelting) {
           masterGhatMelting = m.ghatMelting;
         }
      }

      setFormData({
        ghatJamaStatus: order.ghatJamaStatus || '',
        ghatJamaSubcategory: order.ghatJamaSubcategory || '',
        ghatJamaWeight: order.ghatJamaWeight || '',
        voucherNumber: order.voucherNumber || '',
        pcs: order.pcs || order.quantity || '',
        ghatJamaRemarks: order.ghatJamaRemarks || '',
        ghatMelting: order.ghatMelting || masterGhatMelting || '',
        ghatWastage: order.ghatWastage || '',
        fineWeight: order.fineWeight || '',
      });
    } else if (!isOpen) {
      setFormData(initialFormState);
    }
  }, [isOpen, order, meltingList]);

  useEffect(() => {
    const melting = parseFloat(formData.ghatMelting) || 0;
    const wastage = parseFloat(formData.ghatWastage) || 0;
    const weight = parseFloat(formData.ghatJamaWeight) || 0;
    if (melting || wastage || weight) {
      const calculated = ((melting + wastage) * weight / 100).toFixed(3);
      if (formData.fineWeight !== calculated) {
        setFormData(prev => ({ ...prev, fineWeight: calculated }));
      }
    } else {
      if (formData.fineWeight !== '') {
        setFormData(prev => ({ ...prev, fineWeight: '' }));
      }
    }
  }, [formData.ghatMelting, formData.ghatWastage, formData.ghatJamaWeight]);

  const handleInputChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number' && value && value.includes('.')) {
      const parts = value.split('.');
      if (parts[1].length > 3) {
        value = parts[0] + '.' + parts[1].slice(0, 3);
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.ghatJamaStatus) {
      toast.error('Issue To is required');
      return;
    }

    onSave({
      ...order,
      ghatJamaStatus: 'Complete',
      ghatJamaSubcategory: formData.ghatJamaSubcategory,
      ghatJamaType: formData.ghatJamaStatus,
      ghatJamaWeight: formData.ghatJamaWeight,
      voucherNumber: formData.voucherNumber,
      pcs: formData.pcs,
      ghatJamaRemarks: formData.ghatJamaRemarks,
      ghatMelting: formData.ghatMelting,
      ghatWastage: formData.ghatWastage,
      fineWeight: formData.fineWeight,
      ghatJamaTimestamp: new Date().toISOString(),
    });

    onClose();
  };

  if (!order) return null;

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={`Ghat Jama — Order: ${order.orderNo}`}
      onSubmit={handleSubmit}
      submitText="Save Ghat Jama"
      cancelText="Cancel"
      maxWidth="max-w-xl"
      maxHeight="90vh"
      extraFooterAction={
        <button
          type="button"
          onClick={onPrint}
          className="flex-1 px-2 md:px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg text-blue-700 font-bold hover:bg-blue-100 transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          title="Print Form"
        >
          <Printer size={18} />
          <span className="hidden sm:inline">Print</span>
        </button>
      }
    >
      <div className="space-y-4">
        {/* Pre-filled Order Info */}
        <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Order No</span>
            <span className="text-gray-900 font-bold">{order.orderNo || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Customer Name</span>
            <span className="text-gray-900 font-bold">{order.company || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Karigar Name</span>
            <span className="text-gray-900 font-bold">{order.karigar || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Category</span>
            <span className="text-gray-900 font-bold">{order.category || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Melting</span>
            <span className="text-gray-900 font-bold">{order.melting || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Total Weight</span>
            <span className="text-gray-900 font-bold">{order.totalWeight ? `${order.totalWeight} g` : '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">QC1 Status</span>
            <span className="text-emerald-700 font-bold">{order.status3 || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">QC1 Type</span>
            <span className="text-gray-900 font-bold">{order.qc1Type || '-'}</span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-3">

          {/* Issue To and Subcategory */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Issue To <span className="text-red-500">*</span>
              </label>
              <CustomDropdown
                options={[
                  { value: 'Meena Inhouse',   label: 'Meena Inhouse' },
                  { value: 'Meena Outside',   label: 'Meena Outside' },
                  { value: 'Polish Inhouse',  label: 'Polish Inhouse' },
                  { value: 'Polish Outside',  label: 'Polish Outside' },
                  { value: 'Bangle Polish',   label: 'Bangle Polish' },
                  { value: 'E-Polish',        label: 'E-Polish' },
                ]}
                value={formData.ghatJamaStatus}
                onChange={(val) => handleInputChange({ target: { name: 'ghatJamaStatus', value: val } })}
                placeholder="Select Status"
                className="w-full"
                height="h-[38px]"
                rounded="rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Subcategory
              </label>
              <CustomDropdown
                options={subcategoryList.map(s => ({ value: s.subcategory, label: s.subcategory }))}
                value={formData.ghatJamaSubcategory}
                onChange={(val) => handleInputChange({ target: { name: 'ghatJamaSubcategory', value: val } })}
                placeholder="Select Subcategory"
                className="w-full"
                height="h-[38px]"
                rounded="rounded-lg"
              />
            </div>
          </div>

          {/* Ghat Jama Weight & Voucher Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Ghat Jama Weight
              </label>
              <input
                type="text"
                inputMode="decimal"
                name="ghatJamaWeight"
                value={formData.ghatJamaWeight}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d{0,3}$/.test(val)) {
                    setFormData(prev => ({ ...prev, ghatJamaWeight: val }));
                  }
                }}
                placeholder="e.g. 12.500"
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Voucher Number
              </label>
              <input
                type="text"
                name="voucherNumber"
                value={formData.voucherNumber}
                onChange={handleInputChange}
                placeholder="e.g. VCH-001"
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium"
              />
            </div>
          </div>

          {/* Melting, Wastage, Fine Weight */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Ghat Melting
              </label>
              <input
                type="text"
                name="ghatMelting"
                value={formData.ghatMelting}
                readOnly
                placeholder="Auto filled from Master"
                className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg outline-none text-xs font-bold text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Ghat Wastage
              </label>
              <input
                type="text"
                inputMode="decimal"
                name="ghatWastage"
                value={formData.ghatWastage}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d{0,3}$/.test(val)) {
                    setFormData(prev => ({ ...prev, ghatWastage: val }));
                  }
                }}
                placeholder="e.g. 5"
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Fine Weight
              </label>
              <input
                type="text"
                name="fineWeight"
                value={formData.fineWeight}
                readOnly
                placeholder="Auto calculated"
                className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg outline-none text-xs font-bold text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Pcs */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Pcs
            </label>
            <input
              type="text"
              name="pcs"
              value={formData.pcs}
              onChange={handleInputChange}
              placeholder="e.g. 2 PCS"
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              name="ghatJamaRemarks"
              rows="3"
              value={formData.ghatJamaRemarks}
              onChange={handleInputChange}
              placeholder="Enter remarks or observations..."
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium resize-none"
            />
          </div>

        </div>
      </div>
    </ModalForm>
  );
};

export default GhatJamaForm;
