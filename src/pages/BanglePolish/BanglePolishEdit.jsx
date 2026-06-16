import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
/* deleted import */

const BanglePolishEdit = ({ isOpen, onClose, onSave, order }) => {
  const initialFormState = {
    banglePolishWeight: '',
    banglePolishLoss: '',
    banglePolishRemarks: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isOpen && order) {
      setFormData({
        banglePolishWeight: order.banglePolishWeight || '',
        banglePolishLoss: order.banglePolishLoss || '',
        banglePolishRemarks: order.banglePolishRemarks || '',
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

    onSave({
      ...order,
      banglePolishStatus: 'Complete',
      banglePolishWeight: formData.banglePolishWeight,
      banglePolishLoss: formData.banglePolishLoss,
      banglePolishRemarks: formData.banglePolishRemarks,
    });

    onClose();
  };

  if (!order) return null;

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Bangle Polish — Order: ${order.orderNo || order.orderNumber}`}
      onSubmit={handleSubmit}
      submitText="Save Changes"
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
          {/* Bangle Polish Weight */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Bangle Polish Weight
            </label>
            <input
              type="number"
              step="0.001"
              name="banglePolishWeight"
              value={formData.banglePolishWeight}
              onChange={handleInputChange}
              onKeyDown={preventInvalidDecimalChars}
              placeholder="e.g. 12.500"
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium"
            />
          </div>

          {/* Bangle Polish Loss Loss */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Bangle Polish Loss Loss
            </label>
            <input
              type="number"
              step="0.001"
              name="banglePolishLoss"
              value={formData.banglePolishLoss}
              onChange={handleInputChange}
              onKeyDown={preventInvalidDecimalChars}
              placeholder="e.g. 0.050"
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium"
            />
          </div>

          {/* Bangle Polish Remarks */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Bangle Polish Remarks
            </label>
            <textarea
              name="banglePolishRemarks"
              rows="3"
              value={formData.banglePolishRemarks}
              onChange={handleInputChange}
              placeholder="Enter remarks..."
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium resize-none"
            />
          </div>
        </div>
      </div>
    </ModalForm>
  );
};

export default BanglePolishEdit;
