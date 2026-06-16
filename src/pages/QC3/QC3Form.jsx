import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
import CustomDropdown from '../../components/CustomDropdown';

const QC3Form = ({ isOpen, onClose, onSave, order }) => {
  const initialFormState = {
    qc3Status: '',
    qc3Remarks: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isOpen && order) {
      setFormData({
        qc3Status: order.qc3Status || '',
        qc3Remarks: order.qc3Remarks || '',
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
    if (!formData.qc3Status) {
      toast.error('QC3 Status is required');
      return;
    }

    onSave({
      ...order,
      qc3Status: formData.qc3Status,
      qc3Remarks: formData.qc3Remarks,
      qc3Timestamp: new Date().toISOString(),
    });

    onClose();
  };

  if (!order) return null;

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={`QC3 Check — Order: ${order.orderNo || order.orderNumber}`}
      onSubmit={handleSubmit}
      submitText="Save QC3 Status"
      cancelText="Cancel"
      maxWidth="max-w-xl"
      maxHeight="80vh"
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
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Expected Date</span>
            <span className="text-gray-900 font-bold">{order.expectedDeliveryDate || order.deliveryDate || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Total Weight</span>
            <span className="text-gray-900 font-bold">{order.totalWeight || order.weight || '-'} g</span>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          {/* QC3 Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              QC3 Status <span className="text-red-500">*</span>
            </label>
            <CustomDropdown
              options={[
                { value: 'QC Ok', label: 'QC Ok' },
                { value: 'QC Reject', label: 'QC Reject' }
              ]}
              value={formData.qc3Status}
              onChange={(val) => handleInputChange({ target: { name: 'qc3Status', value: val } })}
              placeholder="Select QC3 Status"
              className="w-full text-xs"
              height="h-[34px]"
              rounded="rounded-lg"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Remarks
            </label>
            <input
              type="text"
              name="qc3Remarks"
              value={formData.qc3Remarks}
              onChange={handleInputChange}
              placeholder="e.g. Approved for delivery, minor scratches, etc."
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium"
            />
          </div>
        </div>
      </div>
    </ModalForm>
  );
};

export default QC3Form;
