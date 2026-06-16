import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalForm from '../../../components/ModalForm';
import CustomDropdown from '../../../components/CustomDropdown';

const LabelEdit = ({ isOpen, onClose, onSave, order }) => {
  const initialFormState = {
    huidStatus: '',
    labelingStatus: '',
    sentCompanyName: '',
    sentHuidLabelPcs: '',
    partyName: '',
    labelingNo: '',
    huidRemarks: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isOpen && order) {
      setFormData({
        huidStatus: order.huidStatus === 'Sent In Huid' ? 'Sent To Huid' : (order.huidStatus || ''),
        labelingStatus: order.labelingStatus || '',
        sentCompanyName: order.sentCompanyName || order.partyName || '',
        sentHuidLabelPcs: order.sentHuidLabelPcs !== undefined && order.sentHuidLabelPcs !== null ? order.sentHuidLabelPcs : (order.labelingNo || ''),
        huidRemarks: order.huidRemarks || '',
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
    preventDefaultAndSave(e);
  };

  const preventDefaultAndSave = (e) => {
    e.preventDefault();
    if (!formData.huidStatus) {
      toast.error('HUID Status is required');
      return;
    }
    if (!formData.labelingStatus) {
      toast.error('Labeling Status is required');
      return;
    }
    if (formData.huidStatus === 'Sent To Huid' && formData.labelingStatus === 'Yes') {
      if (!formData.sentCompanyName) {
        toast.error('Party Name is required');
        return;
      }
    }

    onSave({
      ...order,
      huidStatus: formData.huidStatus,
      labelingStatus: formData.labelingStatus,
      sentCompanyName: formData.huidStatus === 'Sent To Huid' ? formData.sentCompanyName : '',
      sentHuidLabelPcs: Number(formData.sentHuidLabelPcs),
      partyName: formData.huidStatus === 'Sent To Huid' ? formData.sentCompanyName : '',
      labelingNo: formData.sentHuidLabelPcs,
      huidRemarks: formData.huidRemarks,
    });

    onClose();
  };

  if (!order) return null;

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Huid/Label Details — Order: ${order.orderNo || order.orderNumber}`}
      onSubmit={handleSubmit}
      submitText="Save Changes"
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
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Melting</span>
            <span className="text-gray-900 font-bold">{order.melting || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium uppercase text-[9px] tracking-wide">Total Weight</span>
            <span className="text-gray-900 font-bold">{order.totalWeight || order.weight || '-'} g</span>
          </div>
        </div>        {/* Inputs */}
        <div className="space-y-3">
          {/* Huid Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Huid Status <span className="text-red-500">*</span>
            </label>
            <CustomDropdown
              options={[
                { value: 'Sent To Huid', label: 'Sent To Huid' },
                { value: 'Huid Complete', label: 'Huid Complete' },
                { value: 'No HUID', label: 'No HUID' }
              ]}
              value={formData.huidStatus}
              onChange={(val) => handleInputChange({ target: { name: 'huidStatus', value: val } })}
              placeholder="Select Huid Status"
              className="w-full text-xs"
              height="h-[34px]"
              rounded="rounded-lg"
            />
          </div>

          {/* Labeling Status (Always shown) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Labeling Status <span className="text-red-500">*</span>
            </label>
            <CustomDropdown
              options={[
                { value: 'Yes', label: 'Yes' },
                { value: 'No', label: 'No' }
              ]}
              value={formData.labelingStatus}
              onChange={(val) => handleInputChange({ target: { name: 'labelingStatus', value: val } })}
              placeholder="Select Labeling Status"
              className="w-full text-xs"
              height="h-[34px]"
              rounded="rounded-lg"
            />
          </div>

          {/* Conditional: Sent To Huid and Labeling Yes */}
          {formData.huidStatus === 'Sent To Huid' && formData.labelingStatus === 'Yes' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Party Name <span className="text-red-500">*</span>
              </label>
              <CustomDropdown
                options={[
                  { value: 'Raipur', label: 'Raipur' },
                  { value: 'Kolkata', label: 'Kolkata' },
                  { value: 'Mumbai', label: 'Mumbai' }
                ]}
                value={formData.sentCompanyName}
                onChange={(val) => handleInputChange({ target: { name: 'sentCompanyName', value: val } })}
                placeholder="Select Party Name"
                className="w-full text-xs"
                height="h-[34px]"
                rounded="rounded-lg"
              />
            </div>
          )}

          {/* Sent Huid/Label Pcs */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Pcs <span className="text-red-500">*</span>
            </label>
            <input required
              type="number" step="0.001"
              name="sentHuidLabelPcs"
              value={formData.sentHuidLabelPcs}
              onChange={handleInputChange}
              placeholder="e.g. 2"
              min="0"
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium"
            />
          </div>

          {/* Remarks */}
          {(formData.huidStatus === 'Huid Complete' || formData.huidStatus === 'No HUID') && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Remarks
              </label>
              <input
                type="text"
                name="huidRemarks"
                value={formData.huidRemarks}
                onChange={handleInputChange}
                placeholder="e.g. Complete, awaiting verification, etc."
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium"
              />
            </div>
          )}
        </div>
      </div>
    </ModalForm>
  );
};

export default LabelEdit;
