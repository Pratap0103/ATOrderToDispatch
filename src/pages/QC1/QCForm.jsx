import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
import CustomDropdown from '../../components/CustomDropdown';

const QCForm = ({ isOpen, onClose, onSave, order, isEdit = false }) => {
  const initialFormState = {
    status3: '',
    qc1Type: '',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isOpen && order) {
      if (isEdit) {
        setFormData({
          status3: order.status3 || '',
          qc1Type: order.qc1Type || '',
          remarks: order.qcRemarks || '',
        });
      } else {
        setFormData({
          status3: '',
          qc1Type: '',
          remarks: '',
        });
      }
    }
  }, [isOpen, order, isEdit]);

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
    if (!formData.status3) {
      toast.error('QC1 Status is required');
      return;
    }
    if (!formData.qc1Type) {
      toast.error('QC1 Type is required');
      return;
    }
    
    // Update the order with new QC1 status and type
    onSave({
      ...order,
      status3: formData.status3,
      qc1Type: formData.qc1Type,
      qcRemarks: formData.remarks,
      qc1Timestamp: new Date().toISOString(),
    });
    
    onClose();
  };

  if (!order) return null;

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={`QC1 Check — Order: ${order.orderNo}`}
      onSubmit={handleSubmit}
      submitText="Save QC Status"
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
            <span className="text-gray-400 block font-medium">Metal Issue Type</span>
            <span className="text-amber-600 font-bold">{order?.metalIssueType || '-'}</span>
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
              QC1 Status <span className="text-red-500">*</span>
            </label>
            <CustomDropdown
              options={[
                { value: 'QC Okay', label: 'QC Okay' },
                { value: 'QC Reject', label: 'QC Reject' }
              ]}
              value={formData.status3}
              onChange={(val) => handleInputChange({ target: { name: 'status3', value: val } })}
              placeholder="Select QC Status"
              className="w-full text-xs"
              height="h-[34px]"
              rounded="rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              QC1 Type <span className="text-red-500">*</span>
            </label>
            <CustomDropdown
              options={[
                { value: 'Partly Clear', label: 'Partly Clear' },
                { value: 'Complete', label: 'Complete' }
              ]}
              value={formData.qc1Type}
              onChange={(val) => handleInputChange({ target: { name: 'qc1Type', value: val } })}
              placeholder="Select QC Type"
              className="w-full text-xs"
              height="h-[34px]"
              rounded="rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              name="remarks"
              rows="3"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Enter QC remarks or observations..."
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium resize-none"
            />
          </div>
        </div>
      </div>
    </ModalForm>
  );
};

export default QCForm;
