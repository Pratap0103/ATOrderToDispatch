import React, { useRef, useState } from 'react';
import { X, Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

const GhatPrint = ({ order, onClose }) => {
  const printRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      setIsDownloading(true);
      toast.loading('Generating PDF...', { id: 'pdf-toast' });
      const element = printRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        windowHeight: element.scrollHeight,
        windowWidth: element.scrollWidth,
        scrollY: -window.scrollY
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Ghat_Jama_Slip_${order.orderNo || 'Unknown'}.pdf`);
      toast.success('PDF downloaded successfully!', { id: 'pdf-toast' });
    } catch (error) {
      console.error("Error generating PDF", error);
      toast.error('Failed to generate PDF', { id: 'pdf-toast' });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-500/50 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 print:p-0 print:bg-white print:block">
      {/* Container */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200 flex flex-col max-h-[85vh] overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Header - Screen only */}
        <div className="flex-shrink-0 flex justify-between items-center p-2 border-b border-gray-100 bg-gray-50 print:hidden">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest pl-2">Print Slip</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition shadow-sm text-[10px] md:text-xs"
              disabled={isDownloading}
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition shadow-sm text-[10px] md:text-xs"
              disabled={isDownloading}
            >
              <Download size={14} /> {isDownloading ? '...' : 'PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-lg transition"
              title="Close"
              disabled={isDownloading}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-5 print:overflow-visible print:p-0 bg-white hide-scrollbar">
          <div ref={printRef} className="bg-white pb-2">
            <div className="mb-3 md:mb-4 text-center border-b-2 border-gray-800 pb-2 md:pb-3">
            <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-wider uppercase">Ghat Jama Slip</h1>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-0.5">Order Ref: {order.orderNo || '-'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="space-y-1 md:space-y-2">
              <div>
                <h3 className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Customer Info</h3>
                <p className="text-xs md:text-sm font-bold text-gray-900 uppercase">{order.company || '-'}</p>
              </div>
              <div>
                <h3 className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Item Details</h3>
                <p className="text-[10px] md:text-xs font-semibold text-gray-800 uppercase">Category: {order.category || '-'}</p>
                <p className="text-[10px] md:text-xs font-semibold text-gray-800 uppercase">Subcategory: {order.ghatJamaSubcategory || '-'}</p>
              </div>
            </div>
            <div className="space-y-1 md:space-y-2">
              <div>
                <h3 className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Processing Info</h3>
                <p className="text-[10px] md:text-xs font-semibold text-gray-800 uppercase">Issue To: {order.ghatJamaStatus || order.ghatJamaType || '-'}</p>
                <p className="text-[10px] md:text-xs font-semibold text-gray-800 uppercase">Karigar: {order.karigar || '-'}</p>
              </div>
              <div>
                <h3 className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Timestamps</h3>
                <p className="text-[10px] md:text-xs text-gray-600">Generated: {formatDate(new Date())}</p>
                {order.ghatJamaTimestamp && (
                  <p className="text-[10px] md:text-xs text-gray-600">Processed: {formatDate(order.ghatJamaTimestamp)}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-3 md:mb-4 rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-[10px] md:text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 font-bold text-gray-700 uppercase tracking-wider text-[9px]">Description</th>
                  <th className="px-3 py-2 font-bold text-gray-700 uppercase tracking-wider text-[9px] text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-3 py-1.5 md:py-2 font-medium text-gray-600">Total Order Weight</td>
                  <td className="px-3 py-1.5 md:py-2 font-bold text-gray-900 text-right">{order.totalWeight ? `${order.totalWeight} g` : '-'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 md:py-2 font-medium text-gray-600">Ghat Jama Weight</td>
                  <td className="px-3 py-1.5 md:py-2 font-bold text-gray-900 text-right">{order.ghatJamaWeight ? `${order.ghatJamaWeight} g` : '-'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 md:py-2 font-medium text-gray-600">Ghat Melting</td>
                  <td className="px-3 py-1.5 md:py-2 font-bold text-amber-700 text-right">{order.ghatMelting ? `${order.ghatMelting} %` : '-'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 md:py-2 font-medium text-gray-600">Ghat Wastage</td>
                  <td className="px-3 py-1.5 md:py-2 font-bold text-amber-700 text-right">{order.ghatWastage ? `${order.ghatWastage} %` : '-'}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 md:py-3 font-bold text-gray-900 uppercase tracking-wider">Fine Weight</td>
                  <td className="px-3 py-2 md:py-3 font-black text-gray-900 text-sm md:text-base text-right border-l-4 border-amber-400">{order.fineWeight ? `${order.fineWeight} g` : '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4 border-t border-gray-200 pt-3 md:pt-4">
            <div>
              <h3 className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Voucher Number</h3>
              <p className="text-xs md:text-sm font-bold text-gray-800">{order.voucherNumber || '-'}</p>
            </div>
            <div>
              <h3 className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Pieces (PCS)</h3>
              <p className="text-xs md:text-sm font-bold text-gray-800">{order.pcs || '-'}</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-2 md:p-3 bg-gray-50 mb-4 md:mb-6">
            <h3 className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Remarks / Observations</h3>
            <p className="text-[10px] md:text-xs font-medium text-gray-700 min-h-[30px] md:min-h-[40px] whitespace-pre-wrap">{order.ghatJamaRemarks || 'No remarks provided.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 text-center pt-3 md:pt-4 border-t border-dashed border-gray-300">
            <div>
              <div className="w-24 md:w-32 mx-auto border-b border-gray-800 mb-1.5 h-6 md:h-8"></div>
              <p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider">Prepared By</p>
            </div>
            <div>
              <div className="w-24 md:w-32 mx-auto border-b border-gray-800 mb-1.5 h-6 md:h-8"></div>
              <p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Global Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          #root {
            position: absolute;
            left: 0;
            top: 0;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />
    </div>
  );
};

export default GhatPrint;
