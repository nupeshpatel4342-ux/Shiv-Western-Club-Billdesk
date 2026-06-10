import React, { useState, useMemo } from "react";
import { C } from "../constants";
import { Pill } from "../components/Layout";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { Search, ClipboardList, Check, X, Tag, User, Clock, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  productId: string;
  productName: string;
  size: string;
  color: string;
  price: number;
  status: "Pending" | "Approved" | "Cancelled" | "Reserved" | "Completed";
  createdAt: number;
}

export const OrdersScreen = ({
  orders,
  onUpdateStatus
}: {
  orders: Order[],
  onUpdateStatus: (id: string, newStatus: Order["status"]) => Promise<void>
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const s = search.toLowerCase().trim();
      const matchesSearch = o.customerName.toLowerCase().includes(s) || 
                            o.customerPhone.includes(s) || 
                            o.productName.toLowerCase().includes(s);
      const matchesStatus = statusFilter === "All" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const handleStatusChange = async (id: string, status: Order["status"]) => {
    const confirmation = window.confirm(`Are you sure you want to mark this reservation as ${status.toUpperCase()}?`);
    if (confirmation) {
      try {
        await onUpdateStatus(id, status);
        alert(`Reservation status updated to ${status}!`);
      } catch (err) {
        alert("Failed to update status.");
      }
    }
  };

  return (
    <div className="fade" style={{ padding: "0 0 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px", margin: 0 }}>Customer Reservations</h2>
          <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, margin: 0 }}>Review and manage clothing item reservation requests</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 260, display: "flex", background: C.card, borderRadius: 14, padding: "10px 16px", alignItems: "center", gap: 10, border: `1.5px solid ${C.border}` }}>
          <Search size={16} color={C.muted} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer name, phone or product..."
            style={{ border: "none", outline: "none", width: "100%", background: "transparent", fontSize: 13, color: C.dark, fontWeight: 600 }}
          />
        </div>

        {/* Status toggles */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }} className="no-scrollbar">
          {["All", "Reserved", "Approved", "Completed", "Cancelled"].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: `1.5px solid ${statusFilter === st ? C.dark : C.border}`,
                background: statusFilter === st ? C.dark : C.card,
                color: statusFilter === st ? C.accent : C.muted,
                fontWeight: 700,
                fontSize: 11,
                cursor: "pointer",
                transition: "0.2s"
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", border: `2px dashed ${C.border}`, borderRadius: 20, background: C.card }}>
          <ClipboardList size={48} color={C.muted} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>No reservations found</p>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Pending customer orders and reserve requests will show up here.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filtered.map(order => (
            <div 
              key={order.id} 
              style={{ 
                background: C.card, 
                borderRadius: 20, 
                padding: 20, 
                border: `1.5px solid ${order.status === "Reserved" ? C.accent : C.border}`, 
                boxShadow: "0 4px 12px rgba(0,0,0,0.01)",
                display: "flex",
                flexDirection: "column",
                gap: 14
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: C.dark, margin: 0 }}>{order.productName}</h4>
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 3, fontWeight: 600 }}>Size: <span style={{ color: C.accent }}>{order.size}</span> | Color: <span style={{ color: C.accent }}>{order.color}</span></p>
                </div>
                <span className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.green }}>₹{order.price.toLocaleString()}</span>
              </div>

              <div style={{ background: C.bg, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.dark }}>
                  <User size={13} color={C.muted} />
                  <strong>{order.customerName}</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.muted }}>
                  <Clock size={13} color={C.muted} />
                  <span>{order.customerPhone} | {new Date(order.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${C.bg}` }}>
                <span 
                  style={{ 
                    fontSize: 10, 
                    fontWeight: 800, 
                    padding: "4px 10px", 
                    borderRadius: 100,
                    background: order.status === "Reserved" || order.status === "Pending" ? `${C.accent}15` : order.status === "Approved" ? `${C.green}15` : order.status === "Completed" ? `${C.green}30` : `${C.red}15`,
                    color: order.status === "Reserved" || order.status === "Pending" ? C.accent : order.status === "Approved" || order.status === "Completed" ? C.green : C.red,
                    textTransform: "uppercase"
                  }}
                >
                  {order.status}
                </span>

                {/* Reservation Action Buttons */}
                <div style={{ display: "flex", gap: 6 }}>
                  {(order.status === "Reserved" || order.status === "Pending") && (
                    <>
                      <button 
                        onClick={() => handleStatusChange(order.id, "Approved")}
                        style={{ padding: "6px 12px", borderRadius: 8, background: C.greenLight, color: C.green, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <Check size={12} /> Approve
                      </button>
                      <button 
                        onClick={() => handleStatusChange(order.id, "Cancelled")}
                        style={{ padding: "6px 12px", borderRadius: 8, background: "#FFF0F0", color: C.red, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <X size={12} /> Cancel
                      </button>
                    </>
                  )}
                  {order.status === "Approved" && (
                    <button 
                      onClick={() => handleStatusChange(order.id, "Completed")}
                      style={{ padding: "6px 12px", borderRadius: 8, background: C.dark, color: C.accent, border: `1px solid ${C.accent}`, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <CheckCircle size={12} /> Deliver/Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
