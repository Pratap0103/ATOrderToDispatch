import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Upload, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const forceDDMMYYYY = (val) => {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;

  let parts;
  if (str.includes('/')) parts = str.split('/');
  else if (str.includes('-')) parts = str.split('-');
  else if (str.includes('.')) parts = str.split('.');
  else {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
    return str;
  }

  if (parts.length === 3) {
    let p1 = parseInt(parts[0], 10);
    let p2 = parseInt(parts[1], 10);
    let p3 = parseInt(parts[2], 10);

    // Auto-detect year
    if (p3 < 100) p3 += 2000;

    if (p1 > 1000) {
      // YYYY-MM-DD
      return `${String(p3).padStart(2, '0')}/${String(p2).padStart(2, '0')}/${p1}`;
    } else if (p1 > 12) {
      // DD/MM/YYYY
      return `${String(p1).padStart(2, '0')}/${String(p2).padStart(2, '0')}/${p3}`;
    } else if (p2 > 12) {
      // MM/DD/YYYY
      return `${String(p2).padStart(2, '0')}/${String(p1).padStart(2, '0')}/${p3}`;
    } else {
      // Ambiguous, assume DD/MM/YYYY
      return `${String(p1).padStart(2, '0')}/${String(p2).padStart(2, '0')}/${p3}`;
    }
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  return str;
};

const DumpPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const dataBuffer = evt.target.result;
        const wb = XLSX.read(dataBuffer, { type: 'array', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'dd/mm/yyyy' });
        
        // Remove header row assuming the first row is header
        const rows = json.slice(1);
        
        const companies = JSON.parse(localStorage.getItem('master_companies_v3') || '[]');
        const companyPhoneMap = {};
        companies.forEach(c => { companyPhoneMap[c.name] = c.number; });

        const parsedData = rows
          .filter(row => row && row.length > 0 && row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ''))
          .map((row, idx) => {
          // Columns A to Q correspond to index 0 to 16
          const rawOrderNo = String(row[0] || '').trim();
          const customerName = String(row[1] || '').trim();
          const category = String(row[2] || '').trim();
          const melting = String(row[3] || '').trim();
          let fromWeight = '';
          let toWeightRaw = String(row[4] || '').replace(/gm/gi, '').replace(/g/gi, '').trim();
          let toWeight = toWeightRaw; // Col E -> Weight

          // Handle 'manage it' for From/To Weight
          if (toWeightRaw.includes('-')) {
            const parts = toWeightRaw.split('-');
            fromWeight = parts[0].trim();
            toWeight = parts[1].trim();
          } else if (toWeightRaw.toLowerCase().includes('to')) {
            const parts = toWeightRaw.toLowerCase().split('to');
            fromWeight = parts[0].trim();
            toWeight = parts[1].trim();
          }
          const totalQuantity = String(row[5] || '').trim();
          const karigarName = String(row[6] || '').trim();
          const orderDate = forceDDMMYYYY(row[7]);
          let karigarDeliveryDate = forceDDMMYYYY(row[8]);
          const deliveryDate = forceDDMMYYYY(row[9]);
          let expectedDeliveryDate = forceDDMMYYYY(row[10]);
          const leftDays = String(row[11] || '').trim();
          const orderNoReference = String(row[12] || '').trim();
          const orderType = String(row[13] || '').trim();
          const orderStage = String(row[14] || 'New').trim();
          const karigarNotes = String(row[15] || '').trim();
          const totalWeight = String(row[16] || '').replace(/gm/gi, '').replace(/g/gi, '').trim();

          const companyNumber = companyPhoneMap[customerName] || '';

          // If karigarDeliveryDate is blank, calculate it from expectedDeliveryDate - 3 days
          if (!karigarDeliveryDate && expectedDeliveryDate) {
            const parts = expectedDeliveryDate.split('/'); // Guaranteed to be dd/mm/yyyy now
            if (parts.length === 3) {
              const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
              if (!isNaN(d.getTime())) {
                d.setDate(d.getDate() - 3);
                karigarDeliveryDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
              }
            }
          }

          return {
            id: `dump-${Date.now()}-${idx}`,
            orderNo: rawOrderNo,
            leftDays: leftDays,
            company: customerName,
            companyNumber: companyNumber,
            orderType: orderType,
            orderRecDate: orderDate,
            deliveryDate: deliveryDate,
            expectedDeliveryDate: expectedDeliveryDate,
            karigarDeliveryDate: karigarDeliveryDate,
            karigar: karigarName,
            category: category,
            quantity: totalQuantity,
            fromWeight: fromWeight,
            toWeight: toWeight,
            melting: melting,
            meena: '',
            length: '',
            size: '',
            broadness: '',
            screw: '',
            karigarNotes: karigarNotes,
            narration1: '',
            narration2: '',
            qc: '',
            sampleWeight: '',
            orderStage: orderStage,
            totalWeight: totalWeight,
            deliveryLocation: '',
            processStage: '',
            orderNoReference: orderNoReference,
            images: [],
          };
        });

        setData(parsedData);
        if (parsedData.length > 0) {
          toast.success(`Excel file parsed successfully. Found ${parsedData.length} rows.`);
        } else {
          toast.error('No valid data rows found in the Excel file.');
        }
      } catch (error) {
        console.error('Excel Parsing Error:', error);
        toast.error('Error parsing Excel file. Please ensure it matches the required format.');
      } finally {
        // Reset file input so the same file can be uploaded again if needed
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleInputChange = (idx, field, value) => {
    const newData = [...data];
    newData[idx][field] = value;
    setData(newData);
  };

  const MAX_IMAGES = 15;
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
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleImageChange = (idx, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    const row = data[idx];
    const currentCount = row.images.length;
    const remaining = MAX_IMAGES - currentCount;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed per order`);
      e.target.value = '';
      return;
    }

    const toAdd = files.slice(0, remaining);
    Promise.all(
      toAdd.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => compressImage(reader.result).then(resolve);
            reader.readAsDataURL(file);
          })
      )
    ).then((results) => {
      const newData = [...data];
      newData[idx].images = [...newData[idx].images, ...results];
      setData(newData);
    });
    e.target.value = '';
  };

  const handleSave = () => {
    if (data.length === 0) {
      toast.error('No data to save');
      return;
    }

    try {
      const existingOrders = JSON.parse(localStorage.getItem('ordersDataV3') || '[]');
      
      const newOrders = data.map((item, idx) => ({
        ...item,
        id: Date.now().toString() + '-' + idx,
        timestamp: new Date().toISOString(),
        manualOrderStage: item.orderStage || 'New',
      }));

      const updatedOrders = [...newOrders, ...existingOrders];
      localStorage.setItem('ordersDataV3', JSON.stringify(updatedOrders));
      
      toast.success(`${newOrders.length} orders saved successfully`);
      navigate('/order-history');
    } catch (error) {
      console.error(error);
      toast.error('Error saving orders');
    }
  };

  const tableHeaders = [
    "Order No", "Live Left Days", "Company Name", "Company Number", "Order Type",
    "Order Rec. Date", "Delivery Date", "Expected Delivery Date", "Karigar Delivery Date",
    "Karigar Name", "Category", "Quantity", "From Weight", "To Weight", "Melting",
    "Meena", "Length", "Size", "Broadness", "Screw", "Karigar Notes", "Narration 1",
    "Narration 2", "QC", "Sample Weight", "Order Stage", "Total Weight", "Delivery Location",
    "Process Stage", "Order No. Reference", "Images (view)"
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 h-full flex flex-col bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dump Order</h1>
            <p className="text-xs text-gray-500 mt-0.5">Upload an Excel file to bulk add orders</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={data.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${data.length > 0 ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-amber-300 text-amber-50 cursor-not-allowed'}`}
          >
            <Save size={16} />
            Save Orders
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-amber-300 border-dashed rounded-xl cursor-pointer bg-amber-50 hover:bg-amber-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-3 pb-3">
            <Upload className="w-8 h-8 mb-2 text-amber-500" />
            <p className="mb-1 text-sm text-gray-600">
              <span className="font-semibold text-amber-600">Click to upload Excel</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">{fileName || 'No file selected (.xlsx, .xls)'}</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {data.length > 0 && (
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800">Parsed Data ({data.length} rows)</h2>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200 w-12 text-center">#</th>
                  {tableHeaders.map((header, idx) => (
                    <th key={idx} className="px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row, rIdx) => (
                  <tr key={row.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 py-2 text-xs text-gray-500 text-center font-medium bg-gray-50/50">{rIdx + 1}</td>
                    
                    {/* Order No */}
                    <td className="px-2 py-1"><input type="text" className="w-24 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.orderNo} onChange={(e) => handleInputChange(rIdx, 'orderNo', e.target.value)} /></td>
                    {/* Live Left Days */}
                    <td className="px-2 py-1"><input type="text" className="w-20 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.leftDays} onChange={(e) => handleInputChange(rIdx, 'leftDays', e.target.value)} /></td>
                    {/* Company Name */}
                    <td className="px-2 py-1"><input type="text" className="w-32 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.company} onChange={(e) => handleInputChange(rIdx, 'company', e.target.value)} /></td>
                    {/* Company Number */}
                    <td className="px-2 py-1"><input type="text" className="w-28 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.companyNumber} onChange={(e) => handleInputChange(rIdx, 'companyNumber', e.target.value)} /></td>
                    {/* Order Type */}
                    <td className="px-2 py-1"><input type="text" className="w-28 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.orderType} onChange={(e) => handleInputChange(rIdx, 'orderType', e.target.value)} /></td>
                    {/* Order Rec. Date */}
                    <td className="px-2 py-1"><input type="text" className="w-24 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.orderRecDate} onChange={(e) => handleInputChange(rIdx, 'orderRecDate', e.target.value)} /></td>
                    {/* Delivery Date */}
                    <td className="px-2 py-1"><input type="text" className="w-24 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.deliveryDate} onChange={(e) => handleInputChange(rIdx, 'deliveryDate', e.target.value)} /></td>
                    {/* Expected Delivery Date */}
                    <td className="px-2 py-1"><input type="text" className="w-24 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.expectedDeliveryDate} onChange={(e) => handleInputChange(rIdx, 'expectedDeliveryDate', e.target.value)} /></td>
                    {/* Karigar Delivery Date */}
                    <td className="px-2 py-1"><input type="text" className="w-24 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.karigarDeliveryDate} onChange={(e) => handleInputChange(rIdx, 'karigarDeliveryDate', e.target.value)} /></td>
                    {/* Karigar Name */}
                    <td className="px-2 py-1"><input type="text" className="w-28 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.karigar} onChange={(e) => handleInputChange(rIdx, 'karigar', e.target.value)} /></td>
                    {/* Category */}
                    <td className="px-2 py-1"><input type="text" className="w-24 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.category} onChange={(e) => handleInputChange(rIdx, 'category', e.target.value)} /></td>
                    {/* Quantity */}
                    <td className="px-2 py-1"><input type="text" className="w-20 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.quantity} onChange={(e) => handleInputChange(rIdx, 'quantity', e.target.value)} /></td>
                    {/* From Weight */}
                    <td className="px-2 py-1"><input type="text" className="w-20 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.fromWeight} onChange={(e) => handleInputChange(rIdx, 'fromWeight', e.target.value)} /></td>
                    {/* To Weight */}
                    <td className="px-2 py-1"><input type="text" className="w-20 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.toWeight} onChange={(e) => handleInputChange(rIdx, 'toWeight', e.target.value)} /></td>
                    {/* Melting */}
                    <td className="px-2 py-1"><input type="text" className="w-20 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.melting} onChange={(e) => handleInputChange(rIdx, 'melting', e.target.value)} /></td>
                    {/* Meena */}
                    <td className="px-2 py-1"><input type="text" className="w-20 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.meena} onChange={(e) => handleInputChange(rIdx, 'meena', e.target.value)} /></td>
                    {/* Length */}
                    <td className="px-2 py-1"><input type="text" className="w-20 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.length} onChange={(e) => handleInputChange(rIdx, 'length', e.target.value)} /></td>
                    {/* Size */}
                    <td className="px-2 py-1"><input type="text" className="w-20 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.size} onChange={(e) => handleInputChange(rIdx, 'size', e.target.value)} /></td>
                    {/* Broadness */}
                    <td className="px-2 py-1"><input type="text" className="w-24 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.broadness} onChange={(e) => handleInputChange(rIdx, 'broadness', e.target.value)} /></td>
                    {/* Screw */}
                    <td className="px-2 py-1"><input type="text" className="w-20 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.screw} onChange={(e) => handleInputChange(rIdx, 'screw', e.target.value)} /></td>
                    {/* Karigar Notes */}
                    <td className="px-2 py-1"><input type="text" className="w-32 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.karigarNotes} onChange={(e) => handleInputChange(rIdx, 'karigarNotes', e.target.value)} /></td>
                    {/* Narration 1 */}
                    <td className="px-2 py-1"><input type="text" className="w-28 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.narration1} onChange={(e) => handleInputChange(rIdx, 'narration1', e.target.value)} /></td>
                    {/* Narration 2 */}
                    <td className="px-2 py-1"><input type="text" className="w-28 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.narration2} onChange={(e) => handleInputChange(rIdx, 'narration2', e.target.value)} /></td>
                    {/* QC */}
                    <td className="px-2 py-1"><input type="text" className="w-20 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.qc} onChange={(e) => handleInputChange(rIdx, 'qc', e.target.value)} /></td>
                    {/* Sample Weight */}
                    <td className="px-2 py-1"><input type="text" className="w-24 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.sampleWeight} onChange={(e) => handleInputChange(rIdx, 'sampleWeight', e.target.value)} /></td>
                    {/* Order Stage */}
                    <td className="px-2 py-1"><input type="text" className="w-24 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.orderStage} onChange={(e) => handleInputChange(rIdx, 'orderStage', e.target.value)} /></td>
                    {/* Total Weight */}
                    <td className="px-2 py-1"><input type="text" className="w-24 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.totalWeight} onChange={(e) => handleInputChange(rIdx, 'totalWeight', e.target.value)} /></td>
                    {/* Delivery Location */}
                    <td className="px-2 py-1"><input type="text" className="w-32 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.deliveryLocation} onChange={(e) => handleInputChange(rIdx, 'deliveryLocation', e.target.value)} /></td>
                    {/* Process Stage */}
                    <td className="px-2 py-1"><input type="text" className="w-28 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.processStage} onChange={(e) => handleInputChange(rIdx, 'processStage', e.target.value)} /></td>
                    {/* Order No. Reference */}
                    <td className="px-2 py-1"><input type="text" className="w-32 p-1.5 text-xs border border-gray-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" value={row.orderNoReference} onChange={(e) => handleInputChange(rIdx, 'orderNoReference', e.target.value)} /></td>
                    
                    {/* Images */}
                    <td className="px-4 py-1 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {row.images.length > 0 && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            {row.images.length} img
                          </span>
                        )}
                        <label className="cursor-pointer bg-white border border-gray-300 text-gray-600 p-1.5 rounded hover:bg-gray-50 hover:text-amber-600 transition-colors">
                          <Upload size={14} />
                          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageChange(rIdx, e)} />
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DumpPage;
