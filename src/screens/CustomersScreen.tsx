import React, { useState, useMemo, useEffect } from "react";
import { C } from "../constants";
import { Bill } from "../types";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Pill } from "../components/Layout";
import { Search, UserCheck, ShieldAlert, Award, FileText, Smartphone } from "lucide-react";
import { motion } from "motion/react";

interface CustomerLedger {
  id: string;
  uid: string;
  name: string;
  phone: string;
  password?: string;
  address?: string;
  totalPurchase: number;
  loyaltyPoints: number;
  purchaseHistory: string[];
}

export const CustomersScreen = ({
  bills
}: {
  bills: Bill[]
}) => {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLedger | null>(null);

  // Sync customers collection
  useEffect(() => {
    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomerLedger));
      setCustomers(items);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Filter customers by search
  const filtered = useMemo(() => {
    return customers.filter(c => {
      const s = search.toLowerCase().trim();
      if (!s) return true;
      return c.name.toLowerCase().includes(s) || c.phone.includes(s) || (c.address && c.address.toLowerCase().includes(s));
    });
  }, [customers, search]);

  // Customer bills
  const selectedCustomerBills = useMemo(() => {
    if (!selectedCustomer) return [];
    return bills.filter(b => b.customerObj.phone.replace(/\D/g, "") === selectedCustomer.phone.replace(/\D/g, ""));
  }, [selectedCustomer, bills]);

  return (
    <div className="fade" style={{ padding: "0 0 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px", margin: 0 }}>Customer Management</h2>
          <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, margin: 0 }}>Registered club members and purchase ledgers</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, lg: { gridTemplateColumns: "1.5fr 1fr" } } as any}>
        
        {/* Left column - Customers list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", background: C.card, borderRadius: 18, padding: "12px 18px", alignItems: "center", gap: 12, border: `1.5px solid ${C.border}` }}>
            <Search size={18} color={C.muted} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search customer by name, mobile, or address..." 
              style={{ border: "none", outline: "none", width: "100%", background: "transparent", fontSize: 14, color: C.dark, fontWeight: 600 }}
            />
          </div>

          <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Customer Details</th>
                  <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Address</th>
                  <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Loyalty Points</th>
                  <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Total Purchase</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "30px 18px", textAlign: "center", color: C.muted }}>Loading customers...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "30px 18px", textAlign: "center", color: C.muted }}>No customers found.</td>
                  </tr>
                ) : (
                  filtered.map(c => (
                    <tr 
                      key={c.id} 
                      onClick={() => setSelectedCustomer(c)}
                      style={{ 
                        borderBottom: `1px solid ${C.border}`, 
                        cursor: "pointer", 
                        background: selectedCustomer?.id === c.id ? `${C.accent}11` : "transparent",
                        transition: "0.2s" 
                      }}
                    >
                      <td style={{ padding: "16px 18px" }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: 0 }}>{c.name}</p>
                        <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>Mobile: {c.phone} {c.password ? `| Pwd: ${c.password}` : ""}</p>
                      </td>
                      <td style={{ padding: "16px 18px", fontSize: 13, color: C.muted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.address || "No Address"}
                      </td>
                      <td style={{ padding: "16px 18px", fontSize: 13, fontWeight: 700, color: C.accent, textAlign: "right" }}>
                        {c.loyaltyPoints || 0} pts
                      </td>
                      <td style={{ padding: "16px 18px", fontSize: 15, fontWeight: 800, color: C.green, textAlign: "right" }}>
                        ₹{(c.totalPurchase || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column - Customer Ledger details / Purchase History */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {selectedCustomer ? (
            <div style={{ background: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <UserCheck size={20} color={C.accent} />
                </div>
                <div>
                  <h4 className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.dark, margin: 0 }}>{selectedCustomer.name}</h4>
                  <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>Member Ledger Account</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Phone Number</label>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.dark, margin: "2px 0 0" }}>{selectedCustomer.phone}</p>
                </div>
                {selectedCustomer.password && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Portal Password</label>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.dark, margin: "2px 0 0" }}><code>{selectedCustomer.password}</code></p>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Address</label>
                  <p style={{ fontSize: 13, color: C.dark, margin: "2px 0 0", lineHeight: 1.4 }}>{selectedCustomer.address || "Not Provided"}</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, background: C.bg, padding: 12, borderRadius: 12, textAlign: "center" }}>
                  <Award size={18} color={C.accent} style={{ margin: "0 auto 4px" }} />
                  <p style={{ fontSize: 9, color: C.muted, margin: 0 }}>Points Balance</p>
                  <p className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.dark, margin: "2px 0 0" }}>{selectedCustomer.loyaltyPoints || 0}</p>
                </div>
                <div style={{ flex: 1, background: C.bg, padding: 12, borderRadius: 12, textAlign: "center" }}>
                  <Smartphone size={18} color={C.green} style={{ margin: "0 auto 4px" }} />
                  <p style={{ fontSize: 9, color: C.muted, margin: 0 }}>Total Revenue</p>
                  <p className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.green, margin: "2px 0 0" }}>₹{(selectedCustomer.totalPurchase || 0).toLocaleString()}</p>
                </div>
              </div>

              <h5 className="pf" style={{ fontSize: 13, fontWeight: 850, color: C.dark, marginBottom: 12 }}>Purchase Invoices ({selectedCustomerBills.length})</h5>
              {selectedCustomerBills.length === 0 ? (
                <p style={{ color: C.muted, fontSize: 12 }}>No bills registered for this customer yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 250, overflowY: "auto" }}>
                  {selectedCustomerBills.map(bill => (
                    <div key={bill.id} style={{ display: "flex", justifyContent: "space-between", padding: 10, background: C.bg, borderRadius: 10, fontSize: 13 }}>
                      <div>
                        <span style={{ fontWeight: 700, color: C.dark }}>Bill #{bill.id}</span>
                        <span style={{ color: C.muted, fontSize: 11, marginLeft: 8 }}>{bill.date}</span>
                      </div>
                      <span className="pf" style={{ fontWeight: 800, color: C.green }}>₹{bill.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: C.card, borderRadius: 20, padding: 40, border: `1px dashed ${C.border}`, textAlign: "center" }}>
              <UserCheck size={36} color={C.muted} style={{ margin: "0 auto 12px" }} />
              <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Select a customer to view their ledger detail and purchase history.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
