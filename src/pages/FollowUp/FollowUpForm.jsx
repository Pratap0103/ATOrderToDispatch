import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalForm from '../../components/ModalForm';
import CustomDropdown from '../../components/CustomDropdown';
import SearchableDropdown from '../../components/SearchableDropdown';
import DateInput from '../../components/DateInput';
/* deleted import */



const FollowUpForm = ({ isOpen, onClose, onSave, order }) => {
  const karigarOptions = useKarigarOptions();

  const initialFormState = {
    status: '',
    remarks: '',
    nextDate: '',
    karigarName: '',
    karigarDate: '',
    expectedDate: '',
    // Old values — captured at open time for history comparison
    oldKarigarName: '',
    oldKarigarDate: '',
    oldExpectedDate: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Resolve order.karigar to the matching option value
  // Handles: exact value match, or label match (old format "Ramesh (Office)")
  const resolveKarigarValue = (raw) => {
    if (!raw) return '';
    // 1. Exact value match (new format: just the name)
    const byValue = karigarOptions.find(o => o.value === raw);
    if (byValue) return byValue.value;
    // 2. Label match (old format stored full label as value)
    const byLabel = karigarOptions.find(o => o.label === raw);
    if (byLabel) return byLabel.value;
    // 3. Partial: name starts with the raw string (covers "Ramesh" matching "Ramesh Kumar")
    const byPartial = karigarOptions.find(o =>
      o.value.toLowerCase().startsWith(raw.split(' ')[0].toLowerCase())
    );
    if (byPartial) return byPartial.value;
    // 4. Fallback — keep raw value; dropdown will show it even if not in list
    return raw;
  };

  useEffect(() => {
    if (isOpen && order) {
      setFormData({
        ...initialFormState,
        karigarName: resolveKarigarValue(order.karigar),
        karigarDate: order.karigarDeliveryDate || '',
        expectedDate: order.expectedDeliveryDate || '',
        // Snapshot old values at open time
        oldKarigarName: order.karigar || '',
        oldKarigarDate: order.karigarDeliveryDate || '',
        oldExpectedDate: order.expectedDeliveryDate || ''
      });
    }
  }, [isOpen, order, karigarOptions]);

  // Helper: parse DD/MM/YYYY → Date object
  const parseDDMMYYYY = (val) => {
    if (!val) return null;
    const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) return new Date(+match[3], +match[2] - 1, +match[1]);
    return null;
  };

  // Helper: Date object → DD/MM/YYYY
  const formatDDMMYYYY = (d) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleInputChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number' && value && value.includes('.')) {
      const parts = value.split('.');
      if (parts[1].length > 3) {
        value = parts[0] + '.' + parts[1].slice(0, 3);
      }
    }

    if (name === 'karigarDate') {
      // Auto-compute Expected Delivery Date = Karigar Date + 3 days
      const parsed = parseDDMMYYYY(value);
      let autoExpected = '';
      if (parsed) {
        const exp = new Date(parsed);
        exp.setDate(exp.getDate() + 3);
        autoExpected = formatDDMMYYYY(exp);
      }
      setFormData(prev => ({ ...prev, karigarDate: value, expectedDate: autoExpected }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.status) {
      toast.error('Follow-up status is required');
      return;
    }

    // Conditional field validations
    if (['Not Started', 'Prakash', 'Management'].includes(formData.status) && !formData.nextDate) {
      toast.error('Next Date of Follow-up is required');
      return;
    }

    if (formData.status === 'Change Karigar And Dates') {
      if (!formData.karigarName.trim()) {
        toast.error('Karigar Name is required');
        return;
      }
      if (!formData.karigarDate) {
        toast.error('Karigar Delivery Date is required');
        return;
      }
      if (!formData.expectedDate) {
        toast.error('Expected Delivery Date is required');
        return;
      }
    }

    onSave({
      orderNo: order.orderNo,
      orderId: order.id,
      timestamp: new Date().toISOString(),
      ...formData
    });

    onClose();
  };

  if (!order) return null;

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Follow-up Status: ${order.orderNo}`}
      onSubmit={handleSubmit}
      submitText="Save Update"
      cancelText="Cancel"
      maxWidth="max-w-xl"
      maxHeight="95vh"
    >
      <div className="space-y-4">
        {/* Pre-filled Order Info */}
        <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/50 text-xs" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div>
            <span className="text-gray-400 block font-medium">Customer Name</span>
            <span className="text-gray-800 font-bold">{order.company || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Karigar Now</span>
            <span className="text-gray-800 font-bold">{order.karigar || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Category</span>
            <span className="text-gray-800 font-bold">{order.category || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Melting</span>
            <span className="text-gray-800 font-bold">{order.melting || '-'}</span>
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

        {/* Form Inputs */}
        <div className="space-y-3">

          {/* Row 1: Status + Next Date side by side */}
          <div className="grid grid-cols-1 gap-3">
            {/* Status Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <CustomDropdown
                options={[
                  { value: 'Change Karigar And Dates', label: 'Change Karigar And Dates' },
                  { value: 'Ghat Jama Flw-up Done', label: 'Ghat Jama Flw-up Done' },
                  { value: 'Finished Jama', label: 'Finished Jama' },
                  { value: 'Order Cancel', label: 'Order Cancel' },
                  { value: 'Prakash', label: 'Prakash' },
                  { value: 'Management', label: 'Management' },
                ]}
                value={formData.status}
                onChange={(val) => handleInputChange({ target: { name: 'status', value: val } })}
                placeholder="Select Status"
                className="w-full"
                height="h-[38px]"
                rounded="rounded-lg"
              />
            </div>


            {/* Next Date of Follow-up — shown for non-cancel, non-change-karigar statuses */}
            {formData.status &&
              formData.status !== 'Order Cancel' &&
              formData.status !== 'Change Karigar And Dates' &&
              formData.status !== 'Ghat Jama Flw-up Done' &&
              formData.status !== 'Finished Jama' ? (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <DateInput
                  label="Next Date of Follow-up"
                  name="nextDate"
                  value={formData.nextDate}
                  onChange={handleInputChange}
                  required={formData.status === 'Not Started'}
                />
              </div>
            ) : null}
          </div>

          {/* Row 2: Remarks — full width */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Enter follow-up remarks..."
              rows={2}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-medium"
            />
          </div>

          {/* Conditional: Change Karigar Fields */}
          {formData.status === 'Change Karigar And Dates' && (
            <div className="bg-amber-50/20 rounded-xl p-3 border border-amber-100/30 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-600 block">Change Karigar and Schedule Dates</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Karigar Name <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    options={karigarOptions}
                    value={formData.karigarName}
                    onChange={(val) => setFormData(prev => ({ ...prev, karigarName: val }))}
                    placeholder="Select New Karigar"
                    height="h-[38px]"
                    rounded="rounded-lg"
                  />
                </div>

                <DateInput
                  label="Karigar Delivery Date"
                  name="karigarDate"
                  value={formData.karigarDate}
                  onChange={handleInputChange}
                  required={true}
                />

                <DateInput
                  label="Expected Delivery Date"
                  name="expectedDate"
                  value={formData.expectedDate}
                  onChange={handleInputChange}
                  required={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalForm>
  );
};

export default FollowUpForm;
