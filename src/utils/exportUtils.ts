import React from "react";
import { Bill, Settings } from "../types";
import XLSX from "xlsx-js-style";

declare global {
  interface Window {
    html2canvas: any;
    jspdf: any;
  }
}

const loadHtml2Canvas = () => new Promise<any>((resolve, reject) => {
  if (window.html2canvas) { resolve(window.html2canvas); return; }
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
  s.onload = () => resolve(window.html2canvas);
  s.onerror = reject;
  document.head.appendChild(s);
});

const loadJsPDF = () => new Promise<any>((resolve, reject) => {
  if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  s.onload = () => resolve(window.jspdf.jsPDF);
  s.onerror = reject;
  document.head.appendChild(s);
});

const escapeHtml = (value: string = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildInvoiceHtmlDocument = (bill: Bill, settings: Settings) => {
  const itemsHtml = bill.items.map((it, idx) => {
    const lineTotal = it.qty * Math.max(0, it.price - (it.discount || 0));
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(it.name)}</td>
        <td>${it.qty}</td>
        <td>₹${it.price}</td>
        <td>${it.discount ? `₹${it.discount}` : "-"}</td>
        <td>₹${lineTotal}</td>
      </tr>
    `;
  }).join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Inter", "Segoe UI", Arial, sans-serif;
      color: #1f2937;
      background: #ffffff;
    }
    .invoice {
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      overflow: visible;
    }
    .header {
      background: linear-gradient(135deg, #0a1f44 0%, #183b7a 100%);
      color: #fff;
      padding: 18px 20px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
    }
    .title { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.3px; }
    .sub { margin: 4px 0 0; font-size: 12px; opacity: 0.9; }
    .content { padding: 20px; }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
    }
    .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 700;
    }
    .value {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 12px;
    }
    th {
      text-align: left;
      background: #eef2ff;
      border-bottom: 1px solid #dbeafe;
      color: #1e3a8a;
      padding: 10px 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    thead { display: table-header-group; }
    tr, td, th { page-break-inside: avoid; }
    td {
      border-bottom: 1px solid #f1f5f9;
      padding: 9px 8px;
      color: #334155;
    }
    .totals {
      margin-top: 16px;
      margin-left: auto;
      width: 280px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      background: #f8fafc;
    }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .row.total {
      margin-top: 6px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
      font-size: 18px;
      font-weight: 800;
      color: #0a1f44;
    }
    .footer {
      margin-top: 22px;
      padding-top: 14px;
      border-top: 1px dashed #cbd5e1;
      text-align: center;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <section class="invoice">
    <div class="header">
      <div>
        <h1 class="title">${escapeHtml(settings.shopName || "Invoice")}</h1>
        <p class="sub">${escapeHtml(settings.address || "-")}</p>
        <p class="sub">📞 ${escapeHtml(settings.phone || "-")} ${settings.email ? `| ✉️ ${escapeHtml(settings.email)}` : ""}</p>
      </div>
      <div style="text-align:right;">
        <p class="label" style="color:#bfdbfe;margin:0 0 2px;">Invoice No</p>
        <p class="value" style="color:#fff;margin:0;">#${escapeHtml(bill.id)}</p>
        <p class="sub">${escapeHtml(bill.date)} ${escapeHtml(bill.time)}</p>
      </div>
    </div>
    <div class="content">
      <div class="meta-grid">
        <div class="card">
          <div class="label">Billed To</div>
          <div class="value">${escapeHtml(bill.customerObj.name)}</div>
          <div style="margin-top:4px;font-size:12px;color:#475569;">${escapeHtml(bill.customerObj.phone || "-")}</div>
        </div>
        <div class="card">
          <div class="label">Payment</div>
          <div class="value">${escapeHtml(bill.paymentMethod)}</div>
          <div style="margin-top:4px;font-size:12px;color:#475569;">Status: ${escapeHtml(bill.paymentStatus)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 34px;">#</th>
            <th>Item</th>
            <th style="width: 56px;">Qty</th>
            <th style="width: 74px;">Price</th>
            <th style="width: 84px;">Discount</th>
            <th style="width: 84px;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div class="totals">
        <div class="row"><span>Subtotal</span><strong>₹${bill.subtotal}</strong></div>
        ${bill.discount > 0 ? `<div class="row"><span>Discount</span><strong>-₹${bill.discount}</strong></div>` : ""}
        <div class="row total"><span>Total</span><span>₹${bill.total}</span></div>
      </div>

      <div class="footer">
        <div>Thank you for shopping with us.</div>
        ${settings.gstId ? `<div style="margin-top:4px;">GSTIN: ${escapeHtml(settings.gstId)}</div>` : ""}
      </div>
    </div>
  </section>
</body>
</html>
  `;
};

const buildTempInvoice = (bill: Bill, settings: Settings) => {
  const el = document.createElement("div");
  el.style.cssText = "width:400px;background:#fff;padding:24px;font-family:sans-serif;position:fixed;left:-9999px;top:0;z-index:-1;";
  
  const itemsHtml = bill.items.map(it => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
      <div>
        <div style="font-size:14px;font-weight:700;">${it.name}</div>
        <div style="font-size:10px;color:#666;">Qty: ${it.qty} x ₹${it.price} ${it.discount ? `<span style="color:#e63946;">(-₹${it.discount}/unit)</span>` : ""}</div>
      </div>
      <div style="font-size:14px;font-weight:700;">₹${it.qty * Math.max(0, it.price - (it.discount || 0))}</div>
    </div>
  `).join("");

  el.innerHTML = `
    <div style="text-align:center;margin-bottom:20px;">
      <h1 style="margin:0;font-size:24px;">${settings.shopName}</h1>
      <p style="margin:4px 0;font-size:12px;color:#666;">${settings.address}</p>
      <p style="margin:2px 0;font-size:12px;color:#666;">📞 ${settings.phone}</p>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:20px;padding:12px;background:#f9f9f9;border-radius:8px;">
      <div>
        <div style="font-size:10px;color:#666;text-transform:uppercase;">Invoice</div>
        <div style="font-size:16px;font-weight:700;">#${bill.id}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:10px;color:#666;text-transform:uppercase;">Date & Time</div>
        <div style="font-size:14px;">${bill.date} ${bill.time}</div>
      </div>
    </div>
    <div style="margin-bottom:20px;">
      <div style="font-size:10px;color:#666;text-transform:uppercase;margin-bottom:4px;">Billed To</div>
      <div style="font-size:16px;font-weight:700;">${bill.customerObj.name}</div>
      <div style="font-size:12px;color:#666;">${bill.customerObj.phone}</div>
    </div>
    <div style="margin-bottom:20px;">${itemsHtml}</div>
    <div style="padding:16px;background:#f0f7f4;border-radius:12px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:12px;color:#666;">Subtotal</span>
        <span style="font-size:14px;font-weight:700;">₹${bill.subtotal}</span>
      </div>
      ${bill.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-size:12px;color:#666;">Discount</span><span style="font-size:14px;font-weight:700;color:#e63946;">-₹${bill.discount}</span></div>` : ""}
      <div style="height:1px;background:#ddd;margin:8px 0;"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;font-weight:700;">Total</span>
        <span style="font-size:24px;font-weight:900;color:#2d6a4f;">₹${bill.total}</span>
      </div>
    </div>
    <div style="margin-top:32px;padding-top:20px;border-top:1px dashed #ddd;text-align:center;">
      <div style="font-size:14px;font-weight:800;color:#333;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Thank You For Shopping!</div>
      <div style="font-size:12px;color:#555;font-weight:600;margin-bottom:4px;">${settings.shopName}</div>
      <div style="font-size:10px;color:#777;margin-bottom:2px;">${settings.address}</div>
      <div style="font-size:10px;color:#777;margin-bottom:2px;">📞 ${settings.phone} ${settings.email ? `| ✉️ ${settings.email}` : ""}</div>
      ${settings.gstId ? `<div style="font-size:10px;color:#777;margin-bottom:8px;">GSTIN: ${settings.gstId}</div>` : ""}
      <div style="font-size:9px;color:#999;margin-top:12px;">Computer Generated Invoice</div>
    </div>
  `;
  document.body.appendChild(el);
  return el;
};

export const doWhatsApp = async (bill: Bill, settings: Settings, setLoading?: (loading: boolean) => void, invoiceRef?: React.RefObject<HTMLDivElement | null>) => {
  const raw = (bill.customerObj.phone || bill.mobile || "").replace(/\D/g, "");
  const phone = raw.length >= 10 ? (raw.length === 10 ? "91" + raw : raw.startsWith("0") ? "91" + raw.slice(1) : raw) : "";
  
  if (setLoading) setLoading(true);
  let tempEl: HTMLElement | null = null;
  try {
    const h2c = await loadHtml2Canvas();
    let el = (invoiceRef && invoiceRef.current) ? invoiceRef.current : null;
    
    if (!el) {
      tempEl = buildTempInvoice(bill, settings);
      el = tempEl;
      await new Promise(r => setTimeout(r, 100));
    }
    
    const canvas = await h2c(el, {
      scale: 4,
      useCORS: true,
      backgroundColor: "#FFFFFF",
      windowWidth: 1024,
      logging: false,
      onclone: (clonedDoc) => {
        clonedDoc.documentElement.classList.remove('dark');
        clonedDoc.body.classList.remove('dark');
      }
    });
    
    if (tempEl) document.body.removeChild(tempEl);

    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/png"));
    if (!blob) throw new Error("Canvas to blob failed");

    const fileName = `Invoice_${bill.id}.png`;
    const file = new File([blob], fileName, { type: "image/png" });

    const textMessage = `*${settings.shopName}*\n` +
      `------------------------\n` +
      `*Invoice:* #${bill.id}\n` +
      `*Date & Time:* ${bill.date} ${bill.time}\n` +
      `*Customer:* ${bill.customerObj.name}\n` +
      `*Payment Method:* ${bill.paymentMethod}\n` +
      `------------------------\n` +
      bill.items.map(it => `${it.name} (${it.qty}) - ₹${it.qty * Math.max(0, it.price - (it.discount || 0))}${it.discount ? ` (Disc: ₹${it.discount}/unit)` : ''}`).join('\n') + `\n` +
      `------------------------\n` +
      (bill.discount > 0 ? `*Subtotal:* ₹${bill.subtotal}\n*Discount:* -₹${bill.discount}\n` : '') +
      `*Total Amount:* ₹${bill.total}\n` +
      `------------------------\n` +
      `Thank you for shopping with us!`;
      
    const encodedText = encodeURIComponent(textMessage);

    if (phone) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      
      if (setLoading) setLoading(false);
      
      const waWindow = window.open(`https://wa.me/${phone}?text=${encodedText}`, "_blank");
      if (!waWindow) {
        window.location.href = `https://wa.me/${phone}?text=${encodedText}`;
      }
      return;
    }

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Invoice ${bill.id} – ${settings.shopName}`,
          text: textMessage,
          files: [file],
        });
        if (setLoading) setLoading(false);
        return;
      } catch (e: any) {
        if (e.name === "AbortError") { if (setLoading) setLoading(false); return; }
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    if (setLoading) setLoading(false);

    alert(`✅ Invoice downloaded!\n\nYou can now share it manually.`);

  } catch (err: any) {
    if (tempEl && tempEl.parentNode) document.body.removeChild(tempEl);
    if (setLoading) setLoading(false);
    console.error("WhatsApp error:", err);
    alert("❌ Invoice image generate nahi hui.");
  }
};

export const doReminderWhatsApp = (bill: Bill, settings: Settings) => {
  const raw = (bill.customerObj.phone || bill.mobile || "").replace(/\D/g, "");
  const phone = raw.length >= 10 ? (raw.length === 10 ? "91" + raw : raw.startsWith("0") ? "91" + raw.slice(1) : raw) : "";
  
  const textMessage = `*Payment Reminder: ${settings.shopName}*\n` +
    `------------------------\n` +
    `Hello *${bill.customerObj.name}*,\n\n` +
    `Aapka bill *#${bill.id}* dated *${bill.date} ${bill.time}* ka payment pending hai.\n\n` +
    `*Total Bill:* ₹${bill.total}\n` +
    `*Paid Amount:* ₹${bill.paidAmount}\n` +
    `*Balance (Udhar):* ₹${bill.balance}\n\n` +
    `Kripya jald se jald payment clear karein. Dhanyawad!\n` +
    `------------------------\n` +
    `*${settings.shopName}*`;
    
  const encodedText = encodeURIComponent(textMessage);
  window.open(`https://wa.me/${phone}?text=${encodedText}`, "_blank");
};

export const doPDF = async (bill: Bill, settings: Settings, setLoading?: (loading: boolean) => void, invoiceRef?: React.RefObject<HTMLDivElement | null>) => {
  if (setLoading) setLoading(true);
  let tempEl: HTMLElement | null = null;
  try {
    try {
      const pdfServiceBaseUrl = ((import.meta as any).env?.VITE_PDF_SERVICE_URL || "http://localhost:4173").replace(/\/$/, "");
      const puppeteerResponse = await fetch(`${pdfServiceBaseUrl}/api/render-invoice-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: buildInvoiceHtmlDocument(bill, settings),
          fileName: `Invoice_${bill.id}.pdf`,
        }),
      });

      if (puppeteerResponse.ok) {
        const blob = await puppeteerResponse.blob();
        const fileUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = `Invoice_${bill.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(fileUrl), 3000);
        if (setLoading) setLoading(false);
        return;
      }
    } catch (serviceErr) {
      console.warn("Puppeteer PDF service unavailable. Falling back to jsPDF.", serviceErr);
    }

    const h2c = await loadHtml2Canvas();
    const JsPDF = await loadJsPDF();
    let el = (invoiceRef && invoiceRef.current) ? invoiceRef.current : null;
    
    if (!el) {
      tempEl = buildTempInvoice(bill, settings);
      el = tempEl;
      await new Promise(r => setTimeout(r, 100));
    }
    
    const canvas = await h2c(el, { 
      scale: 4, // High quality scale
      useCORS: true,
      backgroundColor: "#FFFFFF",
      windowWidth: 1024,
      logging: false,
      onclone: (clonedDoc) => {
        clonedDoc.documentElement.classList.remove('dark');
        clonedDoc.body.classList.remove('dark');
      }
    });
    
    if (tempEl) document.body.removeChild(tempEl);

    // Use JPEG with max quality for better performance and smaller file size at high resolution
    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    const doc = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    doc.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    doc.save(`Invoice_${bill.id}.pdf`);
    if (setLoading) setLoading(false);
  } catch (err: any) {
    if (tempEl && tempEl.parentNode) document.body.removeChild(tempEl);
    if (setLoading) setLoading(false);
    console.error(err);
    alert("PDF error: " + err.message);
  }
};


export const doExcelExport = (bills: Bill[]) => {
  if (bills.length === 0) {
    alert("No bills to export!");
    return;
  }

  const headers = ["Bill ID", "Date", "Customer Name", "Customer Phone", "Items Count", "Subtotal", "Discount", "Total", "Paid Amount", "Balance", "Payment Method", "Status", "Created By"];
  
  const data = bills.map(b => [
    b.id,
    b.date,
    b.customerObj.name,
    b.customerObj.phone,
    b.items.length,
    b.subtotal,
    b.discount,
    b.total,
    b.paidAmount,
    b.balance,
    b.paymentMethod,
    b.paymentStatus,
    b.createdBy || "Unknown"
  ]);

  // Calculate totals
  const overallTotal = bills.reduce((acc, b) => acc + b.total, 0);
  const cashTotal = bills.reduce((acc, b) => b.paymentMethod === "CASH" ? acc + b.total : acc, 0);
  const upiTotal = bills.reduce((acc, b) => b.paymentMethod === "UPI" ? acc + b.total : acc, 0);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Styles
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
    fill: { fgColor: { rgb: "0A1F44" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  };

  const dataStyle = {
    font: { sz: 11 },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "CCCCCC" } },
      bottom: { style: "thin", color: { rgb: "CCCCCC" } },
      left: { style: "thin", color: { rgb: "CCCCCC" } },
      right: { style: "thin", color: { rgb: "CCCCCC" } }
    }
  };

  const zebraStyle = {
    ...dataStyle,
    fill: { fgColor: { rgb: "F9FAFB" } } // Very light gray for alternating rows
  };

  const totalStyleBase = {
    font: { bold: true, sz: 16, color: { rgb: "000000" } },
    fill: { fgColor: { rgb: "FFFF00" } }, // Yellow highlight
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  };

  const grandTotalStyle = {
    font: { bold: true, sz: 13, color: { rgb: "000000" } },
    fill: { fgColor: { rgb: "FFE699" } },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      top: { style: "medium", color: { rgb: "000000" } },
      bottom: { style: "medium", color: { rgb: "000000" } },
      left: { style: "medium", color: { rgb: "000000" } },
      right: { style: "medium", color: { rgb: "000000" } }
    }
  };

  const grandTotalStyle = {
    font: { bold: true, sz: 13, color: { rgb: "000000" } },
    fill: { fgColor: { rgb: "FFE699" } },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      top: { style: "medium", color: { rgb: "000000" } },
      bottom: { style: "medium", color: { rgb: "000000" } },
      left: { style: "medium", color: { rgb: "000000" } },
      right: { style: "medium", color: { rgb: "000000" } }
    }
  };

  // Apply styles to data range
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  
  // Auto-calculate column widths
  const colWidths = headers.map((h, i) => {
    let maxLen = h.length;
    data.forEach(row => {
      const val = String(row[i] || "");
      if (val.length > maxLen) maxLen = val.length;
    });
    return { wch: Math.min(maxLen + 4, 40) }; // Cap width at 40
  });
  ws['!cols'] = colWidths;

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[address]) continue;

      if (R === 0) {
        ws[address].s = headerStyle;
      } else {
        ws[address].s = R % 2 === 0 ? zebraStyle : dataStyle;
      }
    }
  }

  // Add grand total directly below all bill rows
  const grandTotalRow = range.e.r + 1;
  const grandTotalLabelAddr = XLSX.utils.encode_cell({ r: grandTotalRow, c: 5 });
  const grandTotalValueAddr = XLSX.utils.encode_cell({ r: grandTotalRow, c: 6 });
  ws[grandTotalLabelAddr] = { v: "GRAND TOTAL (ALL BILLS)", t: "s", s: grandTotalStyle };
  ws[grandTotalValueAddr] = { v: overallTotal, t: "n", s: grandTotalStyle };

  // Keep 4-5 empty lines after grand total and then add highlighted payment summaries
  const totalStartRow = grandTotalRow + 5;

  // Create a proper 2-row summary box for CASH and UPI totals
  const summaryStartCol = 5; // F
  const summaryEndCol = 6;   // G
  const summaryLastRow = totalStartRow + 1;

  const getSummaryBoxStyle = (row: number, col: number, isValue = false) => ({
    ...totalStyleBase,
    alignment: { horizontal: isValue ? "right" : "left", vertical: "center" },
  const getSummaryBoxStyle = (row: number, col: number) => ({
    ...totalStyleBase,
    border: {
      top: { style: row === totalStartRow ? "medium" : "thin", color: { rgb: "000000" } },
      bottom: { style: row === summaryLastRow ? "medium" : "thin", color: { rgb: "000000" } },
      left: { style: col === summaryStartCol ? "medium" : "thin", color: { rgb: "000000" } },
      right: { style: col === summaryEndCol ? "medium" : "thin", color: { rgb: "000000" } }
    }
  });

  // Add Cash Total
  const cashLabelAddr = XLSX.utils.encode_cell({ r: totalStartRow, c: summaryStartCol });
  const cashValueAddr = XLSX.utils.encode_cell({ r: totalStartRow, c: summaryEndCol });
  ws[cashLabelAddr] = { v: "1) CASH TOTAL", t: "s", s: getSummaryBoxStyle(totalStartRow, summaryStartCol) };
  ws[cashValueAddr] = { v: cashTotal, t: "n", z: "#,##0.00", s: getSummaryBoxStyle(totalStartRow, summaryEndCol, true) };
  ws[cashValueAddr] = { v: cashTotal, t: "n", s: getSummaryBoxStyle(totalStartRow, summaryEndCol) };

  // Add UPI Total
  const upiLabelAddr = XLSX.utils.encode_cell({ r: totalStartRow + 1, c: summaryStartCol });
  const upiValueAddr = XLSX.utils.encode_cell({ r: totalStartRow + 1, c: summaryEndCol });
  ws[upiLabelAddr] = { v: "2) UPI TOTAL", t: "s", s: getSummaryBoxStyle(totalStartRow + 1, summaryStartCol) };
  ws[upiValueAddr] = { v: upiTotal, t: "n", z: "#,##0.00", s: getSummaryBoxStyle(totalStartRow + 1, summaryEndCol, true) };
  ws[upiValueAddr] = { v: upiTotal, t: "n", s: getSummaryBoxStyle(totalStartRow + 1, summaryEndCol) };

  // Update range to include new rows
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: totalStartRow + 1, c: range.e.c }
  });

  // Create workbook and save
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bills History");
  
  XLSX.writeFile(wb, `Shiv_Western_Club_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
};
