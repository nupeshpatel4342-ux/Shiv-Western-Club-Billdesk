import React, { useState } from "react";
import { C } from "../constants";
import { fmt } from "../utils/formatters";
import { Item } from "../types";

export const AddItemModal = ({ onAdd, onClose }: { onAdd: (item: Item) => void, onClose: () => void }) => {
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [sku, setSku] = useState("");

  const submit = () => {
    if (!name.trim() || !price) { alert("Item name aur price required hai!"); return; }
    
    const p = Number(price);
    const dPct = Number(discountPct) || 0;
    const discountAmt = (p * dPct) / 100;
    
    onAdd({ id: Date.now(), name: name.trim(), sku: sku.trim(), qty: Math.max(1, Number(qty)), price: p, discount: discountAmt });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10, 31, 68, 0.6)", zIndex: 300, display: "flex", alignItems: "flex-end", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="sup" onClick={e => e.stopPropagation()}
        style={{ background: C.card, borderRadius: "32px 32px 0 0", padding: "32px 24px 48px", width: "100%", maxWidth: 500, margin: "0 auto", boxShadow: "0 -10px 40px rgba(0,0,0,0.1)" }}>
        <div style={{ width: 40, height: 5, background: C.bg, borderRadius: 10, margin: "0 auto 24px" }} />
        <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, marginBottom: 24, letterSpacing: "-0.8px" }}>Add New Item</h2>

        <label className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 8 }}>Item Description *</label>
        <div style={{ border: `2px solid ${C.bg}`, borderRadius: 16, padding: "14px 18px", marginBottom: 12, background: C.bg, transition: "all 0.2s" }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Italian Slim Fit Chinos" style={{ fontSize: 16, color: C.dark, fontWeight: 600, width: "100%", border: "none", outline: "none", background: "transparent" }} autoFocus />
        </div>

        {/* Quick Select Items */}
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 16, marginBottom: 8, scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {["Shirt", "Jeans", "T-shirt", "Track", "Boxer"].map(item => (
            <button 
              key={item} 
              onClick={() => setName(item)}
              style={{ 
                whiteSpace: "nowrap", 
                padding: "8px 18px", 
                borderRadius: 100, 
                background: name === item ? C.dark : C.bg, 
                color: name === item ? C.accent : C.muted,
                fontSize: 13,
                fontWeight: 800,
                border: `1.5px solid ${name === item ? C.dark : C.border}`,
                transition: "all 0.2s",
                boxShadow: name === item ? "0 4px 12px rgba(10, 31, 68, 0.2)" : "none"
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <label className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 8 }}>SKU / Code (Optional)</label>
        <div style={{ border: `2px solid ${C.bg}`, borderRadius: 16, padding: "14px 18px", marginBottom: 20, background: C.bg }}>
          <input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. SWC-CHN-001" style={{ fontSize: 16, color: C.dark, fontWeight: 600, width: "100%", border: "none", outline: "none", background: "transparent" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 8 }}>Quantity</label>
            <div style={{ display: "flex", alignItems: "center", border: `2px solid ${C.bg}`, borderRadius: 16, overflow: "hidden", background: C.bg }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: "14px 18px", fontSize: 20, color: C.dark, background: "transparent", border: "none", fontWeight: 800 }}>−</button>
              <input type="number" value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))} style={{ textAlign: "center", fontSize: 18, fontWeight: 900, color: C.dark, width: "100%", border: "none", outline: "none", background: "transparent" }} />
              <button onClick={() => setQty(q => q + 1)} style={{ padding: "14px 18px", fontSize: 20, color: C.dark, background: "transparent", border: "none", fontWeight: 800 }}>＋</button>
            </div>
          </div>
          <div>
            <label className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 8 }}>Our Price (₹)</label>
            <div style={{ border: `2px solid ${C.bg}`, borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", gap: 8, background: C.bg }}>
              <span style={{ color: C.muted, fontWeight: 900, fontSize: 16 }}>₹</span>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" style={{ fontSize: 18, color: C.dark, fontWeight: 900, width: "100%", border: "none", outline: "none", background: "transparent" }} />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 8 }}>Discount / Unit (%)</label>
          <div style={{ border: `2px solid ${C.bg}`, borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", gap: 8, background: C.bg }}>
            <span style={{ color: C.muted, fontWeight: 900, fontSize: 16 }}>%</span>
            <input type="number" value={discountPct} onChange={e => setDiscountPct(e.target.value)} placeholder="0" style={{ fontSize: 18, color: C.dark, fontWeight: 900, width: "100%", border: "none", outline: "none", background: "transparent" }} />
          </div>
        </div>

        {name && price && (
          <div style={{ background: C.dark, borderRadius: 16, padding: "14px 20px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${C.accent}` }}>
            <span style={{ fontSize: 13, color: C.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Item Total</span>
            <span className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.accent }}>₹{fmt(qty * Math.max(0, Number(price) - ((Number(price) * (Number(discountPct) || 0)) / 100)))}</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button onClick={onClose} style={{ padding: "18px", borderRadius: 18, border: `2px solid ${C.border}`, fontWeight: 800, fontSize: 15, color: C.muted, background: "none" }}>Cancel</button>
          <button onClick={submit} style={{ padding: "18px", borderRadius: 18, background: C.dark, color: C.accent, fontWeight: 900, fontSize: 15, border: `1.5px solid ${C.accent}`, boxShadow: "0 8px 20px rgba(10, 31, 68, 0.2)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Add Item ＋</button>
        </div>
      </div>
    </div>
  );
};

export const Confirm = ({ msg, onYes, onNo }: { msg: string, onYes: () => void, onNo: () => void }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(10, 31, 68, 0.6)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}>
    <div className="fade" style={{ background: C.card, borderRadius: 28, padding: 32, width: "100%", maxWidth: 340, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", border: `1px solid ${C.border}` }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <span style={{ fontSize: 32 }}>⚠️</span>
      </div>
      <h3 className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.dark, marginBottom: 12 }}>Are you sure?</h3>
      <p style={{ fontSize: 14, color: C.muted, marginBottom: 28, fontWeight: 500, lineHeight: 1.5 }}>{msg}. This action cannot be undone.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button onClick={onNo} style={{ padding: "14px", borderRadius: 16, border: `2px solid ${C.border}`, fontWeight: 800, color: C.muted, background: "none" }}>Cancel</button>
        <button onClick={onYes} style={{ padding: "14px", borderRadius: 16, background: C.red, color: "#fff", fontWeight: 900, border: "none", boxShadow: "0 8px 20px rgba(239, 68, 68, 0.2)" }}>Yes, Delete</button>
      </div>
    </div>
  </div>
);
