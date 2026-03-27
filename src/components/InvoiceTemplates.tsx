import React from "react";
import { C } from "../constants";
import { fmt, numToWords } from "../utils/formatters";
import { Bill, Settings } from "../types";
import { Divider, Pill } from "./Layout";

export const StandardTemplate = ({ bill, settings, invRef }: { bill: Bill, settings: Settings, invRef: React.RefObject<HTMLDivElement | null> }) => (
  <div ref={invRef} style={{ minWidth: 600, background: C.card, borderRadius: 24, padding: 32, marginBottom: 32, position: "relative", overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
    <div style={{ position: "absolute", top: -20, right: -20, width: 128, height: 128, borderRadius: "50%", opacity: 0.05, background: C.accent }} />
    
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {settings.logo && (
          <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, background: "#fff", flexShrink: 0 }}>
            <img src={settings.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        )}
        <div>
          <h1 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, marginBottom: 4, letterSpacing: "-0.5px" }}>{settings.shopName}</h1>
          <p style={{ fontSize: 12, fontWeight: 500, color: C.muted, maxWidth: 250, lineHeight: 1.4 }}>{settings.address}</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginTop: 4 }}>📞 {settings.phone}</p>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <Pill bg={C.dark} color={C.accent}>INVOICE</Pill>
        <p className="pf" style={{ fontSize: 18, fontWeight: 900, color: C.dark, marginTop: 8 }}>#{bill.id}</p>
        <p style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginTop: 4 }}>{bill.date} &middot; {bill.time}</p>
      </div>
    </div>

    <Divider my={24} />

    <div style={{ marginBottom: 32 }}>
      <p className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Billed To</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="pf" style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>{bill.customerObj.name}</p>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.muted, marginTop: 4 }}>📞 {bill.customerObj.phone}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Payment</p>
          <Pill bg={C.bg} color={C.dark} small>{bill.paymentMethod}</Pill>
        </div>
      </div>
      {bill.customerObj.address && <p style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginTop: 8 }}>📍 {bill.customerObj.address}</p>}
    </div>

    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.5fr 0.8fr 0.8fr 1fr", padding: "10px 0", borderBottom: `2px solid ${C.dark}`, marginBottom: 12 }}>
        <span className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.dark, textTransform: "uppercase", letterSpacing: "1px" }}>Item Description</span>
        <span className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.dark, textTransform: "uppercase", textAlign: "center", letterSpacing: "1px" }}>Qty</span>
        <span className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.dark, textTransform: "uppercase", textAlign: "right", letterSpacing: "1px" }}>MRP</span>
        <span className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.dark, textTransform: "uppercase", textAlign: "right", letterSpacing: "1px" }}>Discount</span>
        <span className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.dark, textTransform: "uppercase", textAlign: "right", letterSpacing: "1px" }}>Amount</span>
      </div>
      {bill.items.map(it => (
        <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 0.5fr 0.8fr 0.8fr 1fr", padding: "16px 0", borderBottom: `1px solid ${C.bg}` }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{it.name}</p>
            {it.sku && <p style={{ fontSize: 11, fontWeight: 500, color: C.muted }}>#{it.sku}</p>}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.dark, textAlign: "center" }}>{it.qty}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.muted, textAlign: "right" }}>₹{fmt(it.price)}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.accent, textAlign: "right" }}>{it.discount ? `-₹${fmt(it.discount)}` : "-"}</span>
          <span className="pf" style={{ fontSize: 14, fontWeight: 800, color: C.dark, textAlign: "right" }}>₹{fmt(it.qty * Math.max(0, it.price - (it.discount || 0)))}</span>
        </div>
      ))}
    </div>

    <div style={{ borderRadius: 16, padding: 24, background: C.bg }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>Subtotal</span>
        <span className="pf" style={{ fontSize: 14, fontWeight: 800, color: C.dark }}>₹{fmt(bill.subtotal)}</span>
      </div>
      {bill.discount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>Discount</span>
          <span className="pf" style={{ fontSize: 14, fontWeight: 800, color: C.accent }}>−₹{fmt(bill.discount)}</span>
        </div>
      )}
      <Divider my={16} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="pf" style={{ fontSize: 14, fontWeight: 900, color: C.dark, textTransform: "uppercase", letterSpacing: "0.5px" }}>Grand Total</span>
        <span className="pf" style={{ fontSize: 28, fontWeight: 900, color: C.dark }}>₹{fmt(bill.total)}</span>
      </div>
      <p style={{ fontSize: 10, fontWeight: 600, fontStyle: "italic", marginTop: 12, textAlign: "right", color: C.muted, textTransform: "capitalize" }}>
        {numToWords(bill.total)} Rupees Only
      </p>
    </div>

    {settings.upiQrCode && (
      <div style={{ marginTop: 24, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <p className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Scan to Pay via UPI</p>
        <div style={{ background: "#fff", padding: 12, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
          <img src={settings.upiQrCode} alt="UPI QR" style={{ width: 112, height: 112, display: "block" }} />
        </div>
      </div>
    )}

    <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px dashed ${C.border}`, textAlign: "center" }}>
      <p className="pf" style={{ fontSize: 14, fontWeight: 800, color: C.dark, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Thank You For Shopping!</p>
      <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>{settings.shopName}</p>
      <p style={{ fontSize: 10, fontWeight: 500, color: C.muted, marginBottom: 2 }}>{settings.address}</p>
      <p style={{ fontSize: 10, fontWeight: 500, color: C.muted, marginBottom: 2 }}>📞 {settings.phone} {settings.email ? `| ✉️ ${settings.email}` : ""}</p>
      {settings.gstId && <p style={{ fontSize: 10, fontWeight: 500, color: C.muted, marginBottom: 8 }}>GSTIN: {settings.gstId}</p>}
      <p style={{ fontSize: 9, fontWeight: 500, color: C.muted, marginTop: 12, opacity: 0.7 }}>Computer Generated Invoice</p>
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
