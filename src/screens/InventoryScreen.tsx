import React, { useState, useMemo, useEffect } from "react";
import { C } from "../constants";
import { CatalogProduct, Settings } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc, doc, setDoc, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { Pill } from "../components/Layout";
import { Search, ShieldAlert, History, ArrowUpRight, ArrowDownRight, Save, Edit, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  change: number;
  type: "addition" | "sale" | "adjustment";
  updatedBy: string;
  timestamp: number;
  reason?: string;
}

export const InventoryScreen = ({
  products,
  settings,
  isAdmin,
  userProfile
}: {
  products: CatalogProduct[],
  settings: Settings,
  isAdmin: boolean,
  userProfile: any
}) => {
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "set">("add");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync inventory logs
  useEffect(() => {
    const q = query(collection(db, "inventory_history"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryLog));
      setLogs(items);
      setLoadingLogs(false);
    }, (err) => {
      console.error(err);
      setLoadingLogs(false);
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const s = search.toLowerCase().trim();
      if (!s) return true;
      return p.name.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s));
    });
  }, [products, search]);

  const lowStockProducts = useMemo(() => {
    // Treat undefined stock as 0. Alert limit is < 5.
    return products.filter(p => {
      const stock = (p as any).stock !== undefined ? (p as any).stock : 0;
      return stock < 5;
    });
  }, [products]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || adjustAmount === "") return;

    setIsSaving(true);
    const amountVal = Number(adjustAmount);
    const currentStock = selectedProduct.stock !== undefined ? selectedProduct.stock : 0;
    
    let newStock = currentStock;
    if (adjustType === "add") {
      newStock = currentStock + amountVal;
    } else {
      newStock = amountVal;
    }

    if (newStock < 0) {
      alert("Stock levels cannot fall below zero!");
      setIsSaving(false);
      return;
    }

    const changeAmt = newStock - currentStock;

    try {
      // 1. Update product stock in products collection
      const prodRef = doc(db, "products", selectedProduct.id);
      await setDoc(prodRef, {
        ...selectedProduct,
        stock: newStock
      });

      // 2. Log in inventory_history
      const logData = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        previousStock: currentStock,
        newStock: newStock,
        change: changeAmt,
        type: "adjustment",
        updatedBy: userProfile?.displayName || userProfile?.email || "Staff",
        timestamp: Date.now(),
        reason: reason.trim() || (adjustType === "add" ? "Manual Restock" : "Manual Adjustment")
      };

      await addDoc(collection(db, "inventory_history"), logData);

      // Reset state
      setSelectedProduct(null);
      setAdjustAmount("");
      setReason("");
      alert("Stock adjusted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update stock levels.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fade" style={{ padding: "0 0 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px", margin: 0 }}>Inventory Management</h2>
          <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, margin: 0 }}>Stock tracking and update log history</p>
        </div>
      </div>

      {/* Alerts & Critical Metrics */}
      {lowStockProducts.length > 0 && (
        <div style={{ background: "#FFF0F0", border: `1px solid ${C.red}44`, borderRadius: 16, padding: "16px 20px", display: "flex", gap: 14, marginBottom: 24 }}>
          <ShieldAlert color={C.red} size={24} style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: C.red, margin: 0 }}>Low Stock Alert ({lowStockProducts.length} items)</h4>
            <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 8px" }}>The following products have fewer than 5 units left and need restocked:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {lowStockProducts.map(p => (
                <span key={p.id} style={{ background: "#fff", border: `1px solid ${C.red}22`, padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700, color: C.dark }}>
                  {p.name} ({(p as any).stock !== undefined ? (p as any).stock : 0})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main split dashboard grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, lg: { gridTemplateColumns: "2fr 1fr" } } as any}>
        
        {/* Left Side: Product Stock list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", background: C.card, borderRadius: 18, padding: "12px 18px", alignItems: "center", gap: 12, border: `1.5px solid ${C.border}` }}>
            <Search size={18} color={C.muted} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search inventory by product name or SKU..." 
              style={{ border: "none", outline: "none", width: "100%", background: "transparent", fontSize: 14, color: C.dark, fontWeight: 600 }}
            />
          </div>

          <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Product & SKU</th>
                  <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Category</th>
                  <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Current Stock</th>
                  <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Status</th>
                  <th style={{ padding: "14px 18px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const stock = (p as any).stock !== undefined ? (p as any).stock : 0;
                  const isLow = stock < 5;
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "0.2s" }}>
                      <td style={{ padding: "16px 18px" }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: 0 }}>{p.name}</p>
                        <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>SKU: {p.sku}</p>
                      </td>
                      <td style={{ padding: "16px 18px", fontSize: 13, color: C.muted }}>{(p as any).category || "General Wear"}</td>
                      <td style={{ padding: "16px 18px", fontSize: 15, fontWeight: 800, color: isLow ? C.red : C.dark, textAlign: "right" }}>{stock} units</td>
                      <td style={{ padding: "16px 18px", textAlign: "right" }}>
                        <Pill bg={stock === 0 ? C.red : isLow ? C.orange : C.green} color="#fff" small>
                          {stock === 0 ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                        </Pill>
                      </td>
                      <td style={{ padding: "16px 18px", textAlign: "center" }}>
                        <button 
                          onClick={() => setSelectedProduct(p)}
                          style={{ background: C.bg, border: "none", color: C.dark, fontWeight: 700, fontSize: 12, padding: "6px 12px", borderRadius: 8, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                        >
                          <Edit size={12} /> Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Stock Update Log History */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
            <h4 className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.dark, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <History size={18} color={C.accent} />
              Stock Update Logs
            </h4>
            
            {loadingLogs ? (
              <p style={{ color: C.muted, fontSize: 13 }}>Loading history...</p>
            ) : logs.length === 0 ? (
              <p style={{ color: C.muted, fontSize: 12 }}>No stock modifications logged yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
                {logs.map(log => (
                  <div key={log.id} style={{ borderBottom: `1px solid ${C.bg}`, paddingBottom: 10, display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: log.change > 0 ? `${C.green}15` : `${C.red}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      {log.change > 0 ? <ArrowUpRight size={14} color={C.green} /> : <ArrowDownRight size={14} color={C.red} />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.dark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.productName}</p>
                      <p style={{ fontSize: 11, color: C.muted, margin: "2px 0" }}>
                        Qty: {log.change > 0 ? `+${log.change}` : log.change} ({log.previousStock} → {log.newStock})
                      </p>
                      {log.reason && <p style={{ fontSize: 10, color: C.accent, fontWeight: 700, margin: "2px 0 0" }}>💬 {log.reason}</p>}
                      <p style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>By: {log.updatedBy} | {new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Adjust Stock Dialog Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: C.card, borderRadius: 24, padding: 24, width: "100%", maxWidth: 380, border: `1.5px solid ${C.accent}`, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
            >
              <h3 className="pf" style={{ fontSize: 18, fontWeight: 900, color: C.dark, marginBottom: 8 }}>Adjust Stock Level</h3>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Product: <strong>{selectedProduct.name}</strong></p>
              
              <form onSubmit={handleAdjustStock} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", background: C.bg, borderRadius: 10, padding: 4 }}>
                  <button type="button" onClick={() => setAdjustType("add")} style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer", background: adjustType === "add" ? C.dark : "transparent", color: adjustType === "add" ? C.accent : C.muted }}>Add Stock</button>
                  <button type="button" onClick={() => setAdjustType("set")} style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer", background: adjustType === "set" ? C.dark : "transparent", color: adjustType === "set" ? C.accent : C.muted }}>Set Custom</button>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Quantity / Amount</label>
                  <input 
                    type="number"
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                    required
                    placeholder={adjustType === "add" ? "e.g. 10 (or -5 to deduct)" : "e.g. 50 (fixed total)"}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 14, fontWeight: 700, color: C.dark }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Reason for Adjustment</label>
                  <input 
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Periodic restock / Correction"
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.dark }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button 
                    type="button" 
                    onClick={() => setSelectedProduct(null)} 
                    style={{ flex: 1, background: "none", border: `1.5px solid ${C.border}`, padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", color: C.dark }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    style={{ flex: 1, background: C.dark, color: C.accent, border: `1.5px solid ${C.accent}`, padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                  >
                    {isSaving ? "Saving..." : "Save Change ✓"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
