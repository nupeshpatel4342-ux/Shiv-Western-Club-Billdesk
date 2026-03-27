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
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    doc.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
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

  const totalStyle = {
    font: { bold: true, sz: 16, color: { rgb: "000000" } },
    fill: { fgColor: { rgb: "FFFF00" } }, // Yellow highlight
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

  // Add 5 empty rows after data
  const totalStartRow = range.e.r + 5;

  // Add Cash Total (Skip 5 columns, so start at column index 5 which is 'F')
  const cashLabelAddr = XLSX.utils.encode_cell({ r: totalStartRow, c: 5 });
  const cashValueAddr = XLSX.utils.encode_cell({ r: totalStartRow, c: 6 });
  ws[cashLabelAddr] = { v: "1) CASH TOTAL", t: 's', s: totalStyle };
  ws[cashValueAddr] = { v: cashTotal, t: 'n', s: totalStyle };

  // Add UPI Total
  const upiLabelAddr = XLSX.utils.encode_cell({ r: totalStartRow + 1, c: 5 });
  const upiValueAddr = XLSX.utils.encode_cell({ r: totalStartRow + 1, c: 6 });
  ws[upiLabelAddr] = { v: "2) UPI TOTAL", t: 's', s: totalStyle };
  ws[upiValueAddr] = { v: upiTotal, t: 'n', s: totalStyle };

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
