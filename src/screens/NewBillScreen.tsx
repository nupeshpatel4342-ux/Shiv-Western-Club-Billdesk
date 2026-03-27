import React, { useState } from "react";
import { C } from "../constants";
import { fmt } from "../utils/formatters";
import { Item, Bill, Settings } from "../types";
import { AddItemModal, Confirm } from "../components/Modals";
import { Divider, Pill } from "../components/Layout";

export const NewBillScreen = ({ onGenerate, settings, bills = [], initialBill, onCancel }: { onGenerate: (bill: Bill) => void, settings: Settings, bills?: Bill[], initialBill?: Bill | null, onCancel?: () => void }) => {
  const [customer, setCustomer] = useState(initialBill ? initialBill.customerObj : { name: "", phone: "", address: "" });
  const [items, setItems] = useState<Item[]>(initialBill ? initialBill.items : []);
  const [discount, setDiscount] = useState(initialBill ? initialBill.discount : 0);
  const [paidAmount, setPaidAmount] = useState<number | "">(initialBill ? initialBill.paidAmount : "");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI" | "MIXED">(initialBill ? (initialBill.paymentMethod as any) : "CASH");
  const [isCredit, setIsCredit] = useState(initialBill ? initialBill.balance > 0 : false);
  const [showAdd, setShowAdd] = useState(false);
  const [showClear, setShowClear] = useState(false);

  const subtotal = items.reduce((s, i) => s + (i.qty * Math.max(0, i.price - (i.discount || 0))), 0);
  const total = Math.max(0, subtotal - discount);
  const actualPaid = isCredit ? (Number(paidAmount) || 0) : total;
  const balance = total - actualPaid;

  const handleGenerate = () => {
    if (!customer.name.trim() || !customer.phone.trim()) { alert("Customer name aur phone required hai!"); return; }
    if (items.length === 0) { alert("Kam se kam ek item add karein!"); return; }
    
    const now = new Date();
    
    let newId = "";
    if (!initialBill) {
      let maxId = 0;
      bills.forEach(b => {
        // Only consider purely numeric IDs for the sequence to ignore old timestamp-based IDs
        if (/^\d+$/.test(b.id)) {
          const num = parseInt(b.id, 10);
          if (num > maxId) maxId = num;
        }
      });
      newId = String(maxId + 1).padStart(3, '0');
    }

    const bill: Bill = {
      id: initialBill ? initialBill.id : newId,
      date: initialBill ? initialBill.date : now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      time: initialBill ? initialBill.time : now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
      timestamp: initialBill ? initialBill.timestamp : now.getTime(),
      customer: customer.name,
      mobile: customer.phone,
      customerObj: customer,
      items,
      subtotal,
      discountPct: subtotal > 0 ? (discount / subtotal) * 100 : 0,
      discountAmt: discount,
      discount,
      grand: total,
      total,
      paidAmount: actualPaid,
      balance,
      paymentStatus: balance <= 0 ? "PAID" : "UNPAID",
      paymentMethod: isCredit && actualPaid === 0 ? "UDHAR" : paymentMethod
    };
    onGenerate(bill);
  };

  return (
    <div className="fade" style={{ padding: "20px 18px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {settings.logo && (
            <img src={settings.logo} alt="Logo" style={{ width: 44, height: 44, borderRadius: 12, objectFit: "contain", background: "#fff", border: `1px solid ${C.border}` }} />
          )}
          <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px" }}>{initialBill ? "Edit Bill" : "New Bill"}</h2>
        </div>
        <button onClick={() => setShowClear(true)} style={{ color: C.accent, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", border: "none", background: "none" }}>{initialBill ? "Cancel Edit" : "Clear All"}</button>
      </div>

      {/* Customer Info */}
      <div style={{ background: C.card, borderRadius: 20, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: 24, border: `1px solid ${C.border}` }}>
        <p className="pf" style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 18 }}>Customer Details</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={{ borderBottom: `1.5px solid ${C.border}`, padding: "8px 0" }}>
            <input value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="Customer Name *" style={{ fontSize: 15, fontWeight: 600, color: C.dark, width: "100%" }} />
          </div>
          <div style={{ borderBottom: `1.5px solid ${C.border}`, padding: "8px 0" }}>
            <input value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="Mobile Number *" style={{ fontSize: 15, fontWeight: 600, color: C.dark, width: "100%" }} />
          </div>
        </div>
        <div style={{ borderBottom: `1.5px solid ${C.border}`, padding: "8px 0" }}>
          <input value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} placeholder="Address (Optional)" style={{ fontSize: 14, color: C.muted, width: "100%" }} />
        </div>
      </div>

      {/* Items List */}
      <div style={{ background: C.card, borderRadius: 20, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: 24, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <p className="pf" style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px" }}>Items ({items.length})</p>
          <button onClick={() => setShowAdd(true)} style={{ background: C.dark, color: C.accent, padding: "10px 18px", borderRadius: 100, fontSize: 12, fontWeight: 800, border: "none" }}>ADD ITEM ＋</button>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", border: `2px dashed ${C.border}`, borderRadius: 16 }}>
            <span style={{ fontSize: 36 }}>🛍️</span>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 10, fontWeight: 500 }}>Koi item nahi hai. Add karein!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {items.map((it, idx) => (
              <div key={it.id} className="sli" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: idx === items.length - 1 ? "none" : `1px solid ${C.bg}` }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{it.name}</p>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 2, fontWeight: 500 }}>{it.qty} x ₹{fmt(it.price)} {it.discount ? <span style={{ color: C.red }}>(-₹{fmt(it.discount)}/unit)</span> : ""} {it.sku && <span style={{ color: C.accent, fontWeight: 700, marginLeft: 6 }}>#{it.sku}</span>}</p>
                </div>
                <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 14 }}>
                  <span className="pf" style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>₹{fmt(it.qty * Math.max(0, it.price - (it.discount || 0)))}</span>
                  <button onClick={() => setItems(items.filter(i => i.id !== it.id))} style={{ color: C.red, fontSize: 20, background: "none", border: "none", padding: 0 }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Type & Summary */}
      <div style={{ background: C.card, borderRadius: 24, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: 24, border: `1px solid ${C.border}` }}>
        {/* Payment Type Toggle */}
        <div style={{ display: "flex", background: C.bg, borderRadius: 14, padding: 4, marginBottom: 24 }}>
          <button onClick={() => setIsCredit(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, fontSize: 12, fontWeight: 800, background: !isCredit ? C.dark : "transparent", color: !isCredit ? C.accent : C.muted, transition: "0.2s", border: "none", textTransform: "uppercase", letterSpacing: "0.5px" }}>Full Paid</button>
          <button onClick={() => setIsCredit(true)} style={{ flex: 1, padding: "12px", borderRadius: 12, fontSize: 12, fontWeight: 800, background: isCredit ? C.accent : "transparent", color: isCredit ? C.dark : C.muted, transition: "0.2s", border: "none", textTransform: "uppercase", letterSpacing: "0.5px" }}>Credit (Udhar)</button>
        </div>

        {/* Payment Method Selector */}
        <div style={{ marginBottom: 24 }}>
          <p className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Payment Method</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {(["CASH", "CARD", "UPI", "MIXED"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                style={{
                  padding: "10px 4px",
                  borderRadius: 12,
                  fontSize: 10,
                  fontWeight: 800,
                  background: paymentMethod === m ? C.dark : C.bg,
                  color: paymentMethod === m ? C.accent : C.muted,
                  border: `1px solid ${paymentMethod === m ? C.dark : C.border}`,
                  transition: "0.2s"
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>Subtotal</span>
          <span className="pf" style={{ fontWeight: 700, color: C.dark, fontSize: 16 }}>₹{fmt(subtotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>Discount (₹)</span>
          <div style={{ borderBottom: `1.5px solid ${C.border}`, width: 100, textAlign: "right" }}>
            <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} style={{ textAlign: "right", fontSize: 16, fontWeight: 800, color: C.accent, width: "100%" }} placeholder="0" />
          </div>
        </div>
        
        {isCredit && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "12px 16px", background: C.bg, borderRadius: 14 }}>
            <span style={{ color: C.dark, fontSize: 13, fontWeight: 700 }}>Paid Amount (₹)</span>
            <div style={{ borderBottom: `2px solid ${C.green}`, width: 100, textAlign: "right" }}>
              <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value === "" ? "" : Number(e.target.value))} style={{ textAlign: "right", fontSize: 16, fontWeight: 800, color: C.green, width: "100%" }} placeholder="0" />
            </div>
          </div>
        )}

        <Divider my={20} />
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCredit ? 12 : 0 }}>
          <div>
            <p className="pf" style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px" }}>{isCredit ? "Total Bill" : "Grand Total"}</p>
            <Pill bg={C.greenLight} color={C.green} small>TAX INCLUDED</Pill>
          </div>
          <span className="pf" style={{ fontSize: 32, fontWeight: 900, color: C.dark, letterSpacing: "-1px" }}>₹{fmt(total)}</span>
        </div>

        {isCredit && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${C.border}` }}>
            <span className="pf" style={{ color: C.accent, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px" }}>Balance (Udhar)</span>
            <span className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.accent }}>₹{fmt(balance)}</span>
          </div>
        )}
      </div>

      <button onClick={handleGenerate} className="spin-on-click"
        style={{ width: "100%", background: C.dark, color: C.bg, padding: "20px", borderRadius: 16, fontSize: 18, fontWeight: 800, boxShadow: `0 8px 24px rgba(10, 31, 68, 0.25)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, border: "none" }}>
        <span className="pf" style={{ letterSpacing: "0.5px" }}>{initialBill ? "UPDATE INVOICE" : "GENERATE INVOICE"}</span>
        <span style={{ fontSize: 22 }}>🧾</span>
      </button>

      {showAdd && <AddItemModal onAdd={it => setItems([...items, it])} onClose={() => setShowAdd(false)} />}
      {showClear && <Confirm msg={initialBill ? "Edit cancel karein?" : "Saara data clear karein?"} onYes={() => { 
        setItems([]); 
        setCustomer({ name: "", phone: "", address: "" }); 
        setDiscount(0); 
        setShowClear(false); 
        if (onCancel) onCancel();
      }} onNo={() => setShowClear(false)} />}
    </div>
  );
};
