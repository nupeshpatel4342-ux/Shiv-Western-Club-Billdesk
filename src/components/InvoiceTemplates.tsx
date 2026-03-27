import React from "react";
import { C } from "../constants";
import { fmt, numToWords } from "../utils/formatters";
import { Bill, Settings } from "../types";
import { Divider, Pill } from "./Layout";

export const StandardTemplate = ({ bill, settings, invRef }: { bill: Bill, settings: Settings, invRef: React.RefObject<HTMLDivElement | null> }) => (
  <div ref={invRef} className="bg-card rounded-3xl p-6 md:p-8 shadow-sm mb-8 relative overflow-hidden border border-border" style={{ background: C.card, borderColor: C.border }}>
    <div className="absolute -top-5 -right-5 w-32 h-32 rounded-full opacity-5" style={{ background: C.accent }} />
    
    <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6 md:gap-0">
      <div className="flex gap-4 items-start">
        {settings.logo && (
          <div className="w-14 h-14 rounded-xl overflow-hidden border bg-white flex-shrink-0" style={{ borderColor: C.border }}>
            <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
        )}
        <div>
          <h1 className="pf text-xl md:text-2xl font-black mb-1 tracking-tight" style={{ color: C.dark }}>{settings.shopName}</h1>
          <p className="text-xs font-medium max-w-[200px] leading-relaxed" style={{ color: C.muted }}>{settings.address}</p>
          <p className="text-xs font-semibold mt-1" style={{ color: C.muted }}>📞 {settings.phone}</p>
        </div>
      </div>
      <div className="text-left md:text-right">
        <Pill bg={C.dark} color={C.accent}>INVOICE</Pill>
        <p className="pf text-base md:text-lg font-black mt-2" style={{ color: C.dark }}>#{bill.id}</p>
        <p className="text-xs font-medium mt-1" style={{ color: C.muted }}>{bill.date} &middot; {bill.time}</p>
      </div>
    </div>

    <Divider my={24} />

    <div className="mb-8">
      <p className="pf text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: C.muted }}>Billed To</p>
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0">
        <div>
          <p className="pf text-base md:text-lg font-extrabold" style={{ color: C.dark }}>{bill.customerObj.name}</p>
          <p className="text-xs md:text-sm font-medium mt-1" style={{ color: C.muted }}>📞 {bill.customerObj.phone}</p>
        </div>
        <div className="text-left md:text-right">
          <p className="pf text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>Payment</p>
          <Pill bg={C.bg} color={C.dark} small>{bill.paymentMethod}</Pill>
        </div>
      </div>
      {bill.customerObj.address && <p className="text-xs font-medium mt-2" style={{ color: C.muted }}>📍 {bill.customerObj.address}</p>}
    </div>

    <div className="mb-8 overflow-x-auto">
      <div className="min-w-[500px]">
        <div className="grid grid-cols-[1.5fr_0.5fr_0.8fr_0.8fr_1fr] py-2.5 border-b-2 mb-3" style={{ borderColor: C.dark }}>
          <span className="pf text-[10px] font-extrabold uppercase tracking-widest" style={{ color: C.dark }}>Item Description</span>
          <span className="pf text-[10px] font-extrabold uppercase tracking-widest text-center" style={{ color: C.dark }}>Qty</span>
          <span className="pf text-[10px] font-extrabold uppercase tracking-widest text-right" style={{ color: C.dark }}>MRP</span>
          <span className="pf text-[10px] font-extrabold uppercase tracking-widest text-right" style={{ color: C.dark }}>Discount</span>
          <span className="pf text-[10px] font-extrabold uppercase tracking-widest text-right" style={{ color: C.dark }}>Amount</span>
        </div>
        {bill.items.map(it => (
          <div key={it.id} className="grid grid-cols-[1.5fr_0.5fr_0.8fr_0.8fr_1fr] py-4 border-b" style={{ borderColor: C.bg }}>
            <div>
              <p className="text-sm font-bold" style={{ color: C.dark }}>{it.name}</p>
              {it.sku && <p className="text-[11px] font-medium" style={{ color: C.muted }}>#{it.sku}</p>}
            </div>
            <span className="text-sm font-semibold text-center" style={{ color: C.dark }}>{it.qty}</span>
            <span className="text-sm font-semibold text-right" style={{ color: C.muted }}>₹{fmt(it.price)}</span>
            <span className="text-sm font-semibold text-right" style={{ color: C.accent }}>{it.discount ? `-₹${fmt(it.discount)}` : "-"}</span>
            <span className="pf text-sm font-extrabold text-right" style={{ color: C.dark }}>₹{fmt(it.qty * Math.max(0, it.price - (it.discount || 0)))}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="rounded-2xl p-5 md:p-6" style={{ background: C.bg }}>
      <div className="flex justify-between mb-2.5">
        <span className="text-xs md:text-sm font-semibold" style={{ color: C.muted }}>Subtotal</span>
        <span className="pf text-sm md:text-base font-extrabold" style={{ color: C.dark }}>₹{fmt(bill.subtotal)}</span>
      </div>
      {bill.discount > 0 && (
        <div className="flex justify-between mb-2.5">
          <span className="text-xs md:text-sm font-semibold" style={{ color: C.muted }}>Discount</span>
          <span className="pf text-sm md:text-base font-extrabold" style={{ color: C.accent }}>−₹{fmt(bill.discount)}</span>
        </div>
      )}
      <Divider my={16} />
      <div className="flex justify-between items-center">
        <span className="pf text-sm md:text-base font-black uppercase tracking-wide" style={{ color: C.dark }}>Grand Total</span>
        <span className="pf text-2xl md:text-3xl font-black" style={{ color: C.dark }}>₹{fmt(bill.total)}</span>
      </div>
      <p className="text-[10px] font-semibold italic mt-3 text-right capitalize" style={{ color: C.muted }}>
        {numToWords(bill.total)} Rupees Only
      </p>
    </div>

    {settings.upiQrCode && (
      <div className="mt-6 text-center flex flex-col items-center">
        <p className="pf text-[10px] font-extrabold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Scan to Pay via UPI</p>
        <div className="bg-white p-3 rounded-2xl border shadow-sm" style={{ borderColor: C.border }}>
          <img src={settings.upiQrCode} alt="UPI QR" className="w-24 h-24 md:w-28 md:h-28 block" />
        </div>
      </div>
    )}

    <div className="mt-8 pt-6 border-t border-dashed text-center" style={{ borderColor: C.border }}>
      <p className="pf text-sm font-extrabold uppercase tracking-wide mb-2" style={{ color: C.dark }}>Thank You For Shopping!</p>
      <p className="text-[11px] font-semibold mb-1" style={{ color: C.muted }}>{settings.shopName}</p>
      <p className="text-[10px] font-medium mb-0.5" style={{ color: C.muted }}>{settings.address}</p>
      <p className="text-[10px] font-medium mb-0.5" style={{ color: C.muted }}>📞 {settings.phone} {settings.email ? `| ✉️ ${settings.email}` : ""}</p>
      {settings.gstId && <p className="text-[10px] font-medium mb-2" style={{ color: C.muted }}>GSTIN: {settings.gstId}</p>}
      <p className="text-[9px] font-medium mt-3 opacity-70" style={{ color: C.muted }}>Computer Generated Invoice</p>
    </div>
  </div>
);

export const MinimalTemplate = ({ bill, settings, invRef }: { bill: Bill, settings: Settings, invRef: React.RefObject<HTMLDivElement | null> }) => (
  <div ref={invRef} style={{ minWidth: 600, background: C.card, padding: 32, marginBottom: 32, position: "relative", overflow: "hidden", border: `1px solid ${C.border}` }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, borderBottom: `2px solid ${C.dark}`, paddingBottom: 24 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {settings.logo && (
          <div style={{ width: 48, height: 48 }}>
            <img src={settings.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        )}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.dark, marginBottom: 4, textTransform: "uppercase", letterSpacing: "1px" }}>{settings.shopName}</h1>
          <p style={{ fontSize: 11, color: C.muted, maxWidth: 200 }}>{settings.address}</p>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{settings.phone} {settings.email ? `| ${settings.email}` : ""}</p>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <h2 style={{ fontSize: 24, fontWeight: 300, color: C.dark, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8 }}>Invoice</h2>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>#{bill.id}</p>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{bill.date} &middot; {bill.time}</p>
      </div>
    </div>

    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Bill To</p>
        <p style={{ fontSize: 16, fontWeight: 600, color: C.dark }}>{bill.customerObj.name}</p>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{bill.customerObj.phone}</p>
        {bill.customerObj.address && <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{bill.customerObj.address}</p>}
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Payment Method</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{bill.paymentMethod}</p>
      </div>
    </div>

    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.5fr 0.8fr 0.8fr 1fr", padding: "8px 0", borderBottom: `1px solid ${C.dark}`, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.dark, textTransform: "uppercase", letterSpacing: "1px" }}>Description</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.dark, textTransform: "uppercase", textAlign: "center", letterSpacing: "1px" }}>Qty</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.dark, textTransform: "uppercase", textAlign: "right", letterSpacing: "1px" }}>MRP</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.dark, textTransform: "uppercase", textAlign: "right", letterSpacing: "1px" }}>Discount</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.dark, textTransform: "uppercase", textAlign: "right", letterSpacing: "1px" }}>Amount</span>
      </div>
      {bill.items.map(it => (
        <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 0.5fr 0.8fr 0.8fr 1fr", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: C.dark }}>{it.name}</p>
            {it.sku && <p style={{ fontSize: 10, color: C.muted }}>#{it.sku}</p>}
          </div>
          <span style={{ fontSize: 13, color: C.dark, textAlign: "center" }}>{it.qty}</span>
          <span style={{ fontSize: 13, color: C.muted, textAlign: "right" }}>₹{fmt(it.price)}</span>
          <span style={{ fontSize: 13, color: C.dark, textAlign: "right" }}>{it.discount ? `-₹${fmt(it.discount)}` : "-"}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.dark, textAlign: "right" }}>₹{fmt(it.qty * Math.max(0, it.price - (it.discount || 0)))}</span>
        </div>
      ))}
    </div>

    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 40 }}>
      <div style={{ width: "60%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 12, color: C.muted }}>Subtotal</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>₹{fmt(bill.subtotal)}</span>
        </div>
        {bill.discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12, color: C.muted }}>Discount</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>−₹{fmt(bill.discount)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `2px solid ${C.dark}`, marginTop: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.dark, textTransform: "uppercase" }}>Total</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>₹{fmt(bill.total)}</span>
        </div>
        <p style={{ fontSize: 10, color: C.muted, fontStyle: "italic", marginTop: 8, textAlign: "right" }}>
          {numToWords(bill.total)} Rupees Only
        </p>
      </div>
    </div>

    {settings.upiQrCode && (
      <div style={{ marginTop: 20, marginBottom: 32, display: "flex", gap: 16, alignItems: "center" }}>
        <img src={settings.upiQrCode} alt="UPI QR" style={{ width: 80, height: 80, border: `1px solid ${C.border}`, padding: 4 }} />
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.dark, textTransform: "uppercase", letterSpacing: "1px" }}>Scan to Pay</p>
          <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Pay easily via any UPI app.</p>
        </div>
      </div>
    )}

    <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: C.dark, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Thank You For Your Business</p>
      {settings.gstId && <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>GSTIN: {settings.gstId}</p>}
      <p style={{ fontSize: 9, color: C.muted, opacity: 0.7 }}>Computer Generated Invoice</p>
    </div>
  </div>
);

export const ModernTemplate = ({ bill, settings, invRef }: { bill: Bill, settings: Settings, invRef: React.RefObject<HTMLDivElement | null> }) => (
  <div ref={invRef} style={{ minWidth: 600, background: C.card, borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.08)", marginBottom: 32, overflow: "hidden", border: `1px solid ${C.border}` }}>
    {/* Header */}
    <div style={{ background: C.dark, color: C.card, padding: "40px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {settings.logo && (
          <div style={{ width: 64, height: 64, borderRadius: 12, background: "#fff", padding: 4 }}>
            <img src={settings.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        )}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>{settings.shopName}</h1>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{settings.address}</p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{settings.phone} {settings.email ? `| ${settings.email}` : ""}</p>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: C.accent, letterSpacing: "1px", textTransform: "uppercase" }}>Invoice</h2>
        <p style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>#{bill.id}</p>
      </div>
    </div>

    <div style={{ padding: 32 }}>
      {/* Info Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 40, background: C.bg, padding: 24, borderRadius: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Invoice To</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>{bill.customerObj.name}</p>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{bill.customerObj.phone}</p>
          {bill.customerObj.address && <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{bill.customerObj.address}</p>}
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Date & Time:</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{bill.date} {bill.time}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Payment Method:</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{bill.paymentMethod}</span>
          </div>
          {settings.gstId && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>GSTIN:</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{settings.gstId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.5fr 0.8fr 0.8fr 1fr", padding: "12px 16px", background: C.dark, color: C.card, borderRadius: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Description</span>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", textAlign: "center", letterSpacing: "1px" }}>Qty</span>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", textAlign: "right", letterSpacing: "1px" }}>MRP</span>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", textAlign: "right", letterSpacing: "1px" }}>Discount</span>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", textAlign: "right", letterSpacing: "1px" }}>Amount</span>
        </div>
        {bill.items.map((it, idx) => (
          <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 0.5fr 0.8fr 0.8fr 1fr", padding: "16px", background: idx % 2 === 0 ? C.card : C.bg, borderRadius: 8 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{it.name}</p>
              {it.sku && <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>#{it.sku}</p>}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: C.dark, textAlign: "center" }}>{it.qty}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: C.muted, textAlign: "right" }}>₹{fmt(it.price)}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: C.accent, textAlign: "right" }}>{it.discount ? `-₹${fmt(it.discount)}` : "-"}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.dark, textAlign: "right" }}>₹{fmt(it.qty * Math.max(0, it.price - (it.discount || 0)))}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
        <div style={{ width: "40%" }}>
          {settings.upiQrCode && (
            <div style={{ display: "flex", gap: 16, alignItems: "center", background: C.bg, padding: 16, borderRadius: 12 }}>
              <img src={settings.upiQrCode} alt="UPI QR" style={{ width: 72, height: 72, borderRadius: 8 }} />
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.dark, textTransform: "uppercase", letterSpacing: "0.5px" }}>Scan to Pay</p>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>UPI Accepted</p>
              </div>
            </div>
          )}
        </div>
        <div style={{ width: "50%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>Subtotal</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>₹{fmt(bill.subtotal)}</span>
          </div>
          {bill.discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>Discount</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>−₹{fmt(bill.discount)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px", background: C.dark, color: C.card, borderRadius: 8, marginTop: 12, alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Total</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: C.accent }}>₹{fmt(bill.total)}</span>
          </div>
          <p style={{ fontSize: 11, color: C.muted, fontStyle: "italic", marginTop: 8, textAlign: "right" }}>
            {numToWords(bill.total)} Rupees Only
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.dark, letterSpacing: "0.5px" }}>Thank You For Shopping!</p>
        <p style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>Computer Generated Invoice</p>
      </div>
    </div>
  </div>
);
