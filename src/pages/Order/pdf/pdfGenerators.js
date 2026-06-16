import pdfLogo from '../../../Assets/logo.svg';

const parseDateString = (str) => {
    if (!str) return null;
    let match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
        const d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
        if (!isNaN(d.getTime())) return d;
    }
    match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
        const p1 = parseInt(match[1], 10);
        const p2 = parseInt(match[2], 10);
        const y = parseInt(match[3], 10);
        if (p1 > 12) {
            const d = new Date(y, p2 - 1, p1);
            if (!isNaN(d.getTime())) return d;
        } else if (p2 > 12) {
            const d = new Date(y, p1 - 1, p2);
            if (!isNaN(d.getTime())) return d;
        } else {
            const d = new Date(y, p2 - 1, p1);
            if (!isNaN(d.getTime())) return d;
        }
    }
    match = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (match) {
        const p1 = parseInt(match[1], 10);
        const p2 = parseInt(match[2], 10);
        const y = parseInt(match[3], 10);
        if (p1 > 12) {
            const d = new Date(y, p2 - 1, p1);
            if (!isNaN(d.getTime())) return d;
        } else if (p2 > 12) {
            const d = new Date(y, p1 - 1, p2);
            if (!isNaN(d.getTime())) return d;
        } else {
            const d = new Date(y, p2 - 1, p1);
            if (!isNaN(d.getTime())) return d;
        }
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    return null;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const parsed = parseDateString(dateStr);
    if (!parsed || isNaN(parsed.getTime())) return dateStr;
    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const formatTimestamp = (date) => {
    if (!date || isNaN(date.getTime())) return '-';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
};

export const generateKarigarHTML = (order) => {
    return generateBaseHTML(order, 'karigar');
};

export const generateCustomerHTML = (order) => {
    return generateBaseHTML(order, 'customer');
};

const generateBaseHTML = (order, type) => {
    const isCustomer = type === 'customer';

    let displayDeliveryDate = order.deliveryDate ? formatDate(order.deliveryDate) : '-';
    if (!isCustomer && order.expectedDeliveryDate) {
        const expectedDate = new Date(order.expectedDeliveryDate);
        if (!isNaN(expectedDate.getTime())) {
            expectedDate.setDate(expectedDate.getDate() - 3);
            const yyyy = expectedDate.getFullYear();
            const mm = String(expectedDate.getMonth() + 1).padStart(2, '0');
            const dd = String(expectedDate.getDate()).padStart(2, '0');
            displayDeliveryDate = `${dd}/${mm}/${yyyy}`;
        }
    }

    const logoHTML = '';

    const lbl = (t) => `<td style="width:90px;font-size:8px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;padding:1px 6px 1px 0;white-space:nowrap;">${t}</td>`;
    const val = (t) => `<td style="font-size:11px;color:#111827;font-weight:700;padding:1px 0;">${t || '-'}</td>`;

    const customerRows = `<table style="border-collapse:collapse;width:100%;">
    <tr>${lbl('Customer')}${val(order.company)}</tr>
    <tr>${lbl('Mobile')}${val(order.companyNumber)}</tr>
    <tr>${lbl('City')}${val(order.deliveryLocation)}</tr>
    <tr>${lbl('Delivery')}${val(order.deliveryLocation)}</tr>
  </table>`;

    const karigarRows = `<table style="border-collapse:collapse;width:100%;">
    <tr>${lbl('Karigar Name')}${val(order.karigar)}</tr>
    <tr>${lbl('City')}${val('Raipur')}</tr>
  </table>`;

    const infoSection = `
    <div style="display:flex;align-items:stretch;gap:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      <div style="width:150px;flex-shrink:0;padding:4px 14px 4px 0;border-right:2px solid #e5e7eb;display:flex;flex-direction:column;justify-content:center;">
        <div style="font-size:8px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:3px;">Order No.</div>
        <div style="font-size:24px;font-weight:900;color:#111827;letter-spacing:0.5px;line-height:1;">${order.orderNo || '-'}</div>
      </div>
      <div style="flex:1;padding:4px 0 4px 14px;">
        ${isCustomer ? customerRows : karigarRows}
      </div>
    </div>`;

    const headerHTML = `
    <div style="padding:0;border-bottom:2px solid #111827;margin-bottom:6px;position:relative;z-index:10;">
      <div style="text-align:center;padding:5px 0 4px 0;">
        <img src="${pdfLogo}" style="height:90px;max-width:220px;display:inline-block;object-fit:contain;" />
      </div>
      <div style="border-top:1px solid #e5e7eb;padding:4px 0;">
        ${infoSection}
      </div>
    </div>
  `;

    const thStyle = 'border: 1px solid #e5e7eb; padding: 6px 8px; background-color: #f9fafb; color: #4b5563; font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px;';
    const tdStyle = 'border: 1px solid #e5e7eb; padding: 6px 8px; font-weight: normal; color: #111827; font-size: 11px;';

    const tableHTML = `
    <div style="position: relative; z-index: 10; margin-bottom: 10px;">
      <table style="width: 100%; border-collapse: collapse; text-align: center; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <tr>
          <td style="${thStyle}">Order Date</td>
          <td style="${thStyle}">Delivery Date</td>
          <td style="${thStyle}">Category</td>
          <td style="${thStyle}">Qty</td>
          <td style="${thStyle}">Melting</td>
        </tr>
        <tr>
          <td style="${tdStyle}">${formatDate(order.orderRecDate)}</td>
          <td style="${tdStyle}">${displayDeliveryDate}</td>
          <td style="${tdStyle}">${(order.category || '-').toUpperCase()}</td>
          <td style="${tdStyle}">${order.quantity || '-'} PCS</td>
          <td style="${tdStyle}">${order.melting || '-'}</td>
        </tr>
        <tr>
          <td style="${thStyle}">Length</td>
          <td style="${thStyle}">Size</td>
          <td style="${thStyle}" colspan="2">Broadness</td>
          <td style="${thStyle}">Screw</td>
        </tr>
        <tr>
          <td style="${tdStyle}">${order.length || '-'}</td>
          <td style="${tdStyle}">${order.size || '-'}</td>
          <td style="${tdStyle}" colspan="2">${order.broadness || '-'}</td>
          <td style="${tdStyle}">${order.screw || '-'}</td>
        </tr>
        <tr>
          <td style="${thStyle}">Wt</td>
          <td style="${thStyle}">Meena</td>
          <td style="${thStyle}">QC</td>
          <td style="${thStyle}" colspan="2">Order Ref</td>
        </tr>
        <tr>
          <td style="${tdStyle}">${order.fromWeight ? `${order.fromWeight} - ${order.toWeight || ''} gm` : '-'}</td>
          <td style="${tdStyle}">${order.meena || '-'}</td>
          <td style="${tdStyle}">${order.qc || '-'}</td>
          <td style="${tdStyle}" colspan="2">-</td>
        </tr>
      </table>
    </div>
  `;

    const specsHTML = `
    <div style="position: relative; z-index: 10; margin-bottom: 10px;">
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <tr>
          <td style="${thStyle} width: 60%;">Product Specifications</td>
          <td style="${thStyle} width: 40%;">General Specifications</td>
        </tr>
        <tr>
          <td style="${tdStyle} padding: 8px; vertical-align: top;">
            <div style="line-height: 1.6;">
              <div style="display: flex; margin-bottom: 2px;">
                <span style="color: #9ca3af; width: 120px; font-size: 11px; text-transform: uppercase;">Order Stage</span> 
                <span style="font-weight: 500;">${order.orderStage || 'in_process'}</span>
              </div>
              <div style="display: flex; margin-bottom: 4px;">
                <span style="color: #9ca3af; width: 120px; font-size: 11px; text-transform: uppercase;">Order Type</span> 
                <span style="font-weight: 500;">${order.orderType || 'Customer order'}</span>
              </div>
              <div style="display: flex; margin-bottom: 4px;">
                <span style="color: #9ca3af; width: 120px; font-size: 11px; text-transform: uppercase;">Narration 1</span> 
                <span>${(order.narration1 || '-').toUpperCase()}</span>
              </div>
              <div style="display: flex;">
                <span style="color: #9ca3af; width: 120px; font-size: 11px; text-transform: uppercase;">Narration 2</span> 
                <span>${(order.narration2 || '-').toUpperCase()}</span>
              </div>
            </div>
          </td>
          <td style="${tdStyle} padding: 16px; vertical-align: top;">
            <div style="line-height: 2;">
              <div style="display: flex; margin-bottom: 4px;">
                <span style="color: #9ca3af; width: 120px; font-size: 11px; text-transform: uppercase;">Sample Wt</span> 
                <span style="font-weight: 500;">${order.sampleWeight || '-'}</span>
              </div>
              <div style="display: flex;">
                <span style="color: #9ca3af; width: 120px; font-size: 11px; text-transform: uppercase;">Total Wt</span> 
                <span style="font-weight: 500;">${order.totalWeight || '-'}</span>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;

    // Support both new `images[]` array and legacy single `image` field
    const allImages = Array.isArray(order.images) && order.images.length > 0
        ? order.images
        : (order.image ? [order.image] : []);
    const totalImgs = allImages.length;

    const watermarkHTML = `
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); opacity: 0.02; z-index: 0; pointer-events: none;">
      <div style="font-size: 200px; font-family: 'Times New Roman', serif; font-weight: 900; color: #000;">JP</div>
    </div>
  `;

    const footerHTML = ``;

    const pagesHTML = [];

    // Page 1 Images
    const page1Images = allImages.slice(0, 6);
    const totalPage1Imgs = page1Images.length;
    const page1Cols = totalPage1Imgs >= 3 ? 3 : totalPage1Imgs;

    const page1ImageHTML = `
    <div style="position: relative; z-index: 10;">
      ${totalPage1Imgs === 0
            ? `<div style="border: 1px solid #e5e7eb; padding: 25px; text-align: center; background: #fafafa;">
             <div style="font-size: 12px; font-family: Arial, sans-serif; padding: 80px 0; color: #9ca3af; letter-spacing: 1px;">[ NO IMAGE ATTACHED ]</div>
           </div>`
            : `<div style="display: grid; grid-template-columns: repeat(${page1Cols}, 228px); gap: 16px 12px; justify-content: center; margin: 0 auto;">
             ${page1Images.map((src, idx) => `
               <div style="width: 228px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center;">
                 <div style="width: 228px; height: 190px; overflow: hidden; display: block; background: #fafafa; border: 1px solid #e5e7eb;">
                   <img src="${src}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                 </div>
                 <div style="font-size: 9px; font-family: Arial, sans-serif; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; line-height: 1; text-align: center;">
                   ${idx + 1}/${totalImgs}
                 </div>
               </div>
             `).join('')}
           </div>`
        }
    </div>
  `;

    // Construct Page 1
    const page1HTML = `
    <div class="pdf-page" style="padding: 50px 40px; background: white; width: 794px; height: 1123px; box-sizing: border-box; position: relative; overflow: hidden; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      ${watermarkHTML}
      ${logoHTML}
      ${headerHTML}
      ${tableHTML}
      ${specsHTML}
      ${page1ImageHTML}
      ${footerHTML}
    </div>
  `;
    pagesHTML.push(page1HTML);

    // Construct Subsequent Pages if there are more than 6 images
    if (totalImgs > 6) {
        const remainingImages = allImages.slice(6);
        const subPageLimit = 12;
        const numSubPages = Math.ceil(remainingImages.length / subPageLimit);
        for (let p = 0; p < numSubPages; p++) {
            const startIdx = 6 + p * subPageLimit;
            const subImages = allImages.slice(startIdx, startIdx + subPageLimit);
            const totalSubImgs = subImages.length;
            const subCols = totalSubImgs >= 3 ? 3 : totalSubImgs;

            const subImageHTML = `
        <div style="position: relative; z-index: 10;">
          <div style="display: grid; grid-template-columns: repeat(${subCols}, 228px); gap: 16px 12px; justify-content: center; margin: 0 auto;">
            ${subImages.map((src, idx) => {
                const overallIdx = startIdx + idx;
                return `
                <div style="width: 228px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center;">
                  <div style="width: 228px; height: 190px; overflow: hidden; display: block; background: #fafafa; border: 1px solid #e5e7eb;">
                    <img src="${src}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                  </div>
                  <div style="font-size: 9px; font-family: Arial, sans-serif; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; line-height: 1; text-align: center;">
                    ${overallIdx + 1}/${totalImgs}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

            const pageNum = p + 2;

            const subHeaderHTML = `
        <div style="padding: 0 0 15px 0; border-bottom: 2px solid #111827; margin-bottom: 25px; position: relative; z-index: 10;">
          <div style="text-align: center; margin-bottom: 4px;">
            <img src="${pdfLogo}" style="height: 60px; max-width: 160px; display: inline-block; object-fit: contain;" />
            <div style="margin-top: 4px; font-size: 22px; font-weight: 900; color: #111827; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; letter-spacing: 1px;">
              ${order.orderNo || '-'}
            </div>
            <div style="font-size: 11px; color: #6b7280; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin-top: 2px;">
              Additional Images (Page ${pageNum})
            </div>
          </div>
        </div>
      `;

            const subPageHTML = `
        <div class="pdf-page" style="padding: 50px 40px; background: white; width: 794px; height: 1123px; box-sizing: border-box; position: relative; overflow: hidden; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          ${watermarkHTML}
          ${subHeaderHTML}
          <div style="height: 40px;"></div>
          ${subImageHTML}
          ${footerHTML}
        </div>
      `;
            pagesHTML.push(subPageHTML);
        }
    }

    return pagesHTML.join('');
};

