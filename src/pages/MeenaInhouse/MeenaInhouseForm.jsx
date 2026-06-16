import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
/* deleted import */
import CustomDropdown from '../../components/CustomDropdown';

const MeenaInhouseForm = ({ isOpen, onClose, onSave, order }) => {
  const initialFormState = {
    meenaInhouseStatus: '',
    inhouseChillaiWeight: '',
    inhouseAfterMeenaPolish: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isOpen && order) {
      setFormData({
        meenaInhouseStatus: order.meenaInhouseType || '',
        inhouseChillaiWeight: order.inhouseChillaiWeight || '',
        inhouseAfterMeenaPolish: order.inhouseAfterMeenaPolish || '',
      });
    } else if (!isOpen) {
      setFormData(initialFormState);
    }
  }, [isOpen, order]);

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
    if (!formData.meenaInhouseStatus) {
      toast.error('Issue To is required');
      return;
    }

    onSave({
      ...order,
      meenaInhouseStatus: 'Complete',
      meenaInhouseType: formData.meenaInhouseStatus,
      inhouseChillaiWeight: formData.inhouseChillaiWeight,
      inhouseAfterMeenaPolish: formData.inhouseAfterMeenaPolish,
      meenaInhouseTimestamp: new Date().toISOString(),
    });

    onClose();
  };

  if (!order) return null;

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={`Meena Inhouse — Order: ${order.orderNo || order.orderNumber}`}
      onSubmit={handleSubmit}
      submitText="Save Meena Inhouse"
      cancelText="Cancel"
      maxWidth="max-w-xl"
      maxHeight="90vh"
    >
      <div className="space-y-4">
        {/* Pre-filled Order Info */}
        <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Order No</span>
            <span className="text-gray-900 font-bold">{order.orderNo || order.orderNumber || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Customer Name</span>
            <span className="text-gray-900 font-bold">{order.company || order.customerName || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Karigar Name</span>
            <span className="text-gray-900 font-bold">{order.karigar || order.karigarName || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Category</span>
            <span className="text-gray-900 font-bold">{order.category || order.categoryName || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Melting</span>
            <span className="text-gray-900 font-bold">{order.melting || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Total Weight</span>
            <span className="text-gray-900 font-bold">{order.totalWeight || order.weight || '-'}</span>
          </div>
          {order.ghatJamaWeight && (
            <div>
              <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Ghat Jama Weight</span>
              <span className="text-gray-900 font-bold">{order.ghatJamaWeight} g</span>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-3">

          {/* Issue To */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Issue To <span className="text-red-500">*</span>
            </label>
            <CustomDropdown
              options={[
                { value: 'Polish Inhouse', label: 'Polish Inhouse' },
                { value: 'Polish Outside', label: 'Polish Outside' },
                { value: 'Bangle Polish', label: 'Bangle Polish' },
                { value: 'E-Polish', label: 'E-Polish' }
              ]}
              value={formData.meenaInhouseStatus}
              onChange={(val) => handleInputChange({ target: { name: 'meenaInhouseStatus', value: val } })}
              placeholder="Select Status"
              className="w-full text-xs"
              height="h-[34px]"
              rounded="rounded-lg"
            />
          </div>

          {/* Chillai Weight */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Inhouse Chillai Weight
            </label>
            <input
              type="number"
              step="0.001"
              name="inhouseChillaiWeight"
              value={formData.inhouseChillaiWeight}
              onChange={handleInputChange}
              onKeyDown={preventInvalidDecimalChars}
              placeholder="e.g. 12.500"
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium"
            />
          </div>

          {/* After Meena Polish Weight */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Inhouse After Meena Weight
            </label>
            <input
              type="number"
              step="0.001"
              name="inhouseAfterMeenaPolish"
              value={formData.inhouseAfterMeenaPolish}
              onChange={handleInputChange}
              onKeyDown={preventInvalidDecimalChars}
              placeholder="e.g. 12.450"
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium"
            />
          </div>

        </div>
      </div>
    </ModalForm>
  );
};

export default MeenaInhouseForm;
