import React, { useState, useEffect } from "react";
import { C } from "../constants";
import { fmt } from "../utils/formatters";
import { Bill, Settings } from "../types";
import { Pill } from "../components/Layout";
import { Trash2, Shirt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { doWhatsApp, doReminderWhatsApp, doExcelExport } from "../utils/exportUtils";
import { InvoiceScreen } from "./InvoiceScreen";


export const HistoryScreen = ({ 
  bills, 
  onView, 
  onEdit, 
  onUpdateBill, 
  onDeleteBill, 
  onDeleteAllBills, 
  settings, 
  isAdmin,
  isDesktop = false
}: { 
  bills: Bill[], 
  onView: (bill: Bill) => void, 
  onEdit: (bill: Bill) => void, 
  onUpdateBill: (bill: Bill) => void, 
  onDeleteBill: (id: string) => void, 
  onDeleteAllBills: () => void, 
  settings: Settings, 
  isAdmin?: boolean,
  isDesktop?: boolean
}) => {
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  useEffect(() => {
    if (bills.length > 0) {
      if (!selectedBill || !bills.some(b => b.id === selectedBill.id)) {
        setSelectedBill(bills[0]);
      } else {
        // Update selection if the selected bill was modified (e.g., paid status updated)
        const updated = bills.find(b => b.id === selectedBill.id);
        if (updated && JSON.stringify(updated) !== JSON.stringify(selectedBill)) {
          setSelectedBill(updated);
        }
      }
    } else {
      setSelectedBill(null);
    }
  }, [bills, selectedBill]);

  const filtered = bills.filter(b => {
    const s = search.toLowerCase().trim();
    if (!s) return true;
    const cleanId = b.id.toLowerCase();
    const searchId = s.startsWith("#") ? s.slice(1) : s;
    
    return cleanId.includes(searchId) || 
           b.customerObj.name.toLowerCase().includes(s) || 
           b.customerObj.phone.includes(s);
  });


  const handleShare = async (e: React.MouseEvent, bill: Bill) => {
    e.stopPropagation();
    setLoadingId(bill.id);
    await doWhatsApp(bill, settings, (loading) => {
      if (!loading) setLoadingId(null);
    });
  };

  const handleReminder = (e: React.MouseEvent, bill: Bill) => {
    e.stopPropagation();
    doReminderWhatsApp(bill, settings);
  };

  const handleMarkAsPaid = (e: React.MouseEvent, bill: Bill) => {
    e.stopPropagation();
    if (window.confirm(`Kya aap is bill (#${bill.id}) ko PAID mark karna chahte hain?`)) {
      onUpdateBill({
        ...bill,
        paidAmount: bill.total,
        balance: 0,
        paymentStatus: "PAID"
      });
    }
  };

  const handleDelete = (e: React.MouseEvent, bill: Bill) => {
    e.stopPropagation();
    if (window.confirm(`⚠️ WARNING: Kya aap is bill (#${bill.id}) ko PERMANENTLY DELETE karna chahte hain? Ye action wapas nahi liya ja sakta.`)) {
      onDeleteBill(bill.id);
    }
  };

  const handleEditClick = (e: React.MouseEvent, bill: Bill) => {
    e.stopPropagation();
    onEdit(bill);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  const renderList = () => (
    <>
      <div style={{ background: C.card, borderRadius: 18, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, border: `1.5px solid ${C.border}`, marginBottom: 28, boxShadow: "0 4px 12px rgba(10, 31, 68, 0.04)" }}>
        <span style={{ fontSize: 20, opacity: 0.6 }}>🔍</span>
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search ID, Name or Mobile..." 
          style={{ flex: 1, fontSize: 15, color: C.dark, border: "none", outline: "none", background: "transparent", fontWeight: 600 }} 
        />
        {search && (
          <button 
            onClick={() => setSearch("")}
            style={{ background: C.bg, border: "none", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}
          >
            ✕
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: "center", padding: "80px 0" }}
        >
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <span style={{ fontSize: 40 }}>📜</span>
          </div>
          <p className="pf" style={{ fontSize: 18, fontWeight: 900, color: C.dark }}>No bills found</p>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 6, fontWeight: 500 }}>Try searching with a different keyword.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <AnimatePresence>
            {filtered.map(b => {
              const isSelected = isDesktop && selectedBill?.id === b.id;
              return (
                <motion.div 
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  layout
                  key={b.id} 
                  onClick={() => isDesktop ? setSelectedBill(b) : onView(b)} 
                  className="sli"
                  style={{ 
                    background: C.card, 
                    borderRadius: 22, 
                    padding: 20, 
                    boxShadow: "0 8px 24px rgba(10, 31, 68, 0.06)", 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: 14, 
                    border: isSelected 
                      ? `2.5px solid ${C.accent}` 
                      : `1px solid ${b.paymentStatus === "UNPAID" ? C.accent + "44" : "transparent"}`, 
                    cursor: "pointer", 
                    position: "relative", 
                    overflow: "hidden" 
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span className="pf" style={{ fontSize: 15, fontWeight: 900, color: C.dark }}>#{b.id}</span>
                        {b.paymentStatus === "PAID" ? (
                          <Pill bg={C.greenLight} color={C.green} small>PAID</Pill>
                        ) : (
                          <Pill bg="#FFF0F0" color={C.accent} small>UDHAR</Pill>
                        )}
                        <Pill bg={C.bg} color={C.muted} small>{b.paymentMethod}</Pill>
                      </div>
                      <p className="pf" style={{ fontSize: 17, fontWeight: 800, color: C.dark, marginBottom: 4 }}>{b.customerObj.name}</p>
                      <p style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{b.date} · {b.time} · {b.items.length} Items</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 8 }}>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleEditClick(e, b)}
                          style={{ background: C.bg, color: C.dark, border: "none", padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}
                        >
                          ✏️ Edit
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1, color: C.red }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleDelete(e, b)}
                          style={{ background: "transparent", color: C.red, border: "none", padding: 6, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.6 }}
                          title="Delete Bill"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                      <p className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.dark }}>₹{fmt(b.total)}</p>
                      {b.paymentStatus === "UNPAID" && (
                        <p style={{ fontSize: 12, fontWeight: 800, color: C.accent, marginTop: 2 }}>Bal: ₹{fmt(b.balance)}</p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, borderTop: `1px solid ${C.bg}`, paddingTop: 14 }}>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => handleShare(e, b)}
                      disabled={loadingId === b.id}
                      style={{ flex: 1, background: "#25D366", color: "#fff", padding: "10px", borderRadius: 12, fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: loadingId === b.id ? 0.6 : 1, border: "none", boxShadow: "0 4px 12px rgba(37,211,102,0.2)" }}
                    >
                      {loadingId === b.id ? "⏳" : "💬"} Share
                    </motion.button>
                    
                    {b.paymentStatus === "UNPAID" ? (
                      <>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => handleReminder(e, b)} 
                          style={{ flex: 1, background: C.accent, color: "#fff", padding: "10px", borderRadius: 12, fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "none", boxShadow: "0 4px 12px rgba(212, 175, 55, 0.2)" }}
                        >
                          🔔 Remind
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => handleMarkAsPaid(e, b)} 
                          style={{ flex: 1, background: C.dark, color: C.accent, padding: "10px", borderRadius: 12, fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "none", boxShadow: "0 4px 12px rgba(10, 31, 68, 0.2)" }}
                        >
                          ✅ Settle
                        </motion.button>
                      </>
                    ) : (
                      <div style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, borderRadius: 12, fontSize: 11, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
                        Payment Completed
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {bills.length > 10 && (
        <div style={{ marginTop: 30, textAlign: "center" }}>
          <button style={{ padding: "10px 20px", borderRadius: 100, border: `1.5px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 700 }}>Load More History</button>
        </div>
      )}
    </>
  );

  return (
    <div className="fade" style={{ padding: isDesktop ? "0 0 100px" : "20px 18px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {settings.logo ? (
            <img src={settings.logo} alt="Logo" style={{ width: 44, height: 44, borderRadius: 12, objectFit: "contain", background: "#fff", border: `1px solid ${C.border}` }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shirt size={24} color={C.accent} />
            </div>
          )}
          <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px" }}>History</h2>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button 
            onClick={() => doExcelExport(bills)}
            style={{ padding: "8px 14px", borderRadius: 12, background: C.bg, border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 800, color: C.dark, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
          >
            📥 Export
          </button>
          {bills.length > 0 && (
            <button 
              onClick={() => {
                if (window.confirm("⚠️ KYA AAP SARE BILLS DELETE KARNA CHAHTE HAIN? Ye action wapas nahi liya ja sakta.")) {
                  onDeleteAllBills();
                }
              }}
              style={{ padding: "8px 14px", borderRadius: 12, background: "#FFF0F0", border: `1px solid ${C.red}22`, fontSize: 11, fontWeight: 800, color: C.red, display: "flex", alignItems: "center", gap: 6 }}
            >
              🗑️ Clear
            </button>
          )}
        </div>
      </div>

      {isDesktop ? (
        <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
          {/* Left: Scrollable List */}
          <div style={{ flex: 1.2, minWidth: 0 }}>
            {renderList()}
          </div>
          
          {/* Right: Selected Invoice Preview */}
          <div style={{ flex: 1.8, minWidth: 0, position: "sticky", top: "20px" }}>
            {selectedBill ? (
              <InvoiceScreen 
                bill={selectedBill} 
                settings={settings} 
                onBack={() => {}} 
                onNew={() => {}}
                hideBack={true}
              />
            ) : (
              <div style={{ background: C.card, borderRadius: 24, padding: "80px 20px", textAlign: "center", border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 14, color: C.muted, fontWeight: 650 }}>Select a bill from the history list to view details.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        renderList()
      )}
    </div>
  );
};

