import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
import CustomDropdown from '../../components/CustomDropdown';
/* deleted import */
import { SEEDED_MELTING } from '../Master/Melting';

const MetalIssueEdit = ({ isOpen, onClose, onSave, order, issue }) => {
  const [formData, setFormData] = useState({
    metalIssueStatus: '',
    paidWeight: '',
    metalIssueType: '',
    remarks: '',
  });
  const [purityOptions, setPurityOptions] = useState([]);

  useEffect(() => {
    if (isOpen && issue) {
      setFormData({
        metalIssueStatus: issue.metalIssueStatus || '',
        paidWeight: issue.paidWeight || '',
        metalIssueType: issue.metalIssueType || '',
        remarks: issue.remarks || '',
      });
    }
    const saved = localStorage.getItem('master_melting');
    let meltingData = SEEDED_MELTING;
    if (saved) {
      try {
        meltingData = JSON.parse(saved);
      } catch (e) {}
    }
    const opts = meltingData
      .filter(m => m.ghatMelting || m.melting)
      .map(m => {
        const val = m.ghatMelting || m.melting;
        return { value: val, label: m.ghatMelting ? m.ghatMelting : m.melting };
      });
    setPurityOptions(opts);
  }, [isOpen, issue]);

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
    if (!formData.metalIssueStatus) {
      toast.error('Metal Issue Status is required');
      return;
    }
    if (!formData.paidWeight) {
      toast.error('Paid Weight is required');
      return;
    }
    const weightNum = parseFloat(formData.paidWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error('Paid Weight must be a positive number');
      return;
    }
    if (!formData.metalIssueType) {
      toast.error('Metal Issue Type (Purity) is required');
      return;
    }
    
    // Save updated issue
    onSave({
      ...issue,
      ...formData,
    });
    
    onClose();
  };

  if (!order || !issue) return null;

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Metal Issue for Order: ${order.orderNo}`}
      onSubmit={handleSubmit}
      submitText="Save Changes"
      cancelText="Cancel"
      maxWidth="max-w-xl"
      maxHeight="80vh"
    >
      <div className="space-y-4">
        {/* Pre-filled Order Info */}
        <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/50 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-400 block font-medium">Customer Name</span>
            <span className="text-gray-800 font-bold">{order.company || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Karigar Name</span>
            <span className="text-gray-800 font-bold">{order.karigar || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Melting</span>
            <span className="text-gray-800 font-bold">{order.melting || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Category</span>
            <span className="text-gray-800 font-bold">{order.category || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Total Weight</span>
            <span className="text-gray-800 font-bold">{order.totalWeight || '-'} g</span>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Metal Issue Status <span className="text-red-500">*</span>
            </label>
            <CustomDropdown
              options={[
                { value: 'Metal Issue', label: 'Metal Issue' },
                { value: 'Metal On Delivery', label: 'Metal On Delivery' }
              ]}
              value={formData.metalIssueStatus}
              onChange={(val) => handleInputChange({ target: { name: 'metalIssueStatus', value: val } })}
              placeholder="Select Status"
              className="w-full text-xs"
              height="h-[34px]"
              rounded="rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Paid Weight <span className="text-red-500">*</span>
            </label>
            <input required
              type="number"
              step="0.001"
              name="paidWeight"
              value={formData.paidWeight}
              onChange={handleInputChange}
              onKeyDown={preventInvalidDecimalChars}
              onWheel={(e) => e.target.blur()}
              placeholder="Enter Paid Weight in grams"
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium no-spinners"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Metal Issue Type (Purity) <span className="text-red-500">*</span>
            </label>
            <CustomDropdown
              options={purityOptions}
              value={formData.metalIssueType}
              onChange={(val) => handleInputChange({ target: { name: 'metalIssueType', value: val } })}
              placeholder="Select Type"
              className="w-full text-xs"
              height="h-[34px]"
              rounded="rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Remarks
            </label>
            <input
              type="text"
              name="remarks"
              value={formData.remarks || ''}
              onChange={handleInputChange}
              placeholder="Enter remarks (optional)"
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium"
            />
          </div>
        </div>
      </div>
    </ModalForm>
  );
};

export default MetalIssueEdit;
