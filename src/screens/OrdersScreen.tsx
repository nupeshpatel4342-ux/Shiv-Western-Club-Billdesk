import React, { useState, useMemo } from "react";
import { C } from "../constants";
import { Pill } from "../components/Layout";
import { Search, ClipboardList, Eye, MapPin, Phone, Calendar, User, ShoppingBag, X, Printer } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  productId: string;
  productName: string;
  size: string;
  color: string;
  price: number;
  qty?: number;
  status: "Pending" | "Processing" | "Dispatched" | "Delivered" | "Cancelled" | "Reserved" | "Approved" | "Completed";
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const s = search.toLowerCase().trim();
      const matchesSearch = o.customerName.toLowerCase().includes(s) || 
                            o.customerPhone.includes(s) || 
                            o.productName.toLowerCase().includes(s) ||
                            (o.customerAddress && o.customerAddress.toLowerCase().includes(s)) ||
                            o.id.toLowerCase().includes(s);
      const matchesStatus = statusFilter === "All" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const handleStatusChange = async (id: string, status: Order["status"]) => {
    try {
      await onUpdateStatus(id, status);
      // Update the selected order state if modal is open
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const getStatusStyle = (status: Order["status"]) => {
    switch (status) {
      case "Pending":
      case "Reserved":
        return { bg: "#FFF9E6", color: "#B8860B" };
      case "Processing":
        return { bg: "#E6F0FA", color: "#1F75FE" };
      case "Dispatched":
        return { bg: "#F0E6FF", color: "#7F00FF" };
      case "Delivered":
      case "Completed":
      case "Approved":
        return { bg: "#E6F9EC", color: "#00875A" };
      case "Cancelled":
        return { bg: "#FFEBEB", color: "#DE350B" };
      default:
        return { bg: C.bg, color: C.muted };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fade" style={{ padding: "0 0 100px" }}>
      {/* Title Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px", margin: 0 }}>Order Management</h2>
          <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, margin: 0 }}>Monitor customer orders, edit processing/dispatch statuses, and print invoices</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 280, display: "flex", background: C.card, borderRadius: 16, padding: "12px 18px", alignItems: "center", gap: 10, border: `1.5px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}>
          <Search size={18} color={C.muted} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Order ID, name, mobile, address or product..."
            style={{ border: "none", outline: "none", width: "100%", background: "transparent", fontSize: 13, color: C.dark, fontWeight: 600 }}
          />
        </div>

        {/* Status toggles */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }} className="no-scrollbar">
          {["All", "Pending", "Processing", "Dispatched", "Delivered", "Cancelled", "Reserved"].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "10px 18px",
                borderRadius: 12,
                border: `1.5px solid ${statusFilter === st ? C.dark : C.border}`,
                background: statusFilter === st ? C.dark : C.card,
                color: statusFilter === st ? C.accent : C.muted,
                fontWeight: 750,
                fontSize: 11,
                cursor: "pointer",
                transition: "0.2s",
                whiteSpace: "nowrap"
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table Layout */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", border: `2px dashed ${C.border}`, borderRadius: 24, background: C.card }}>
          <ClipboardList size={54} color={C.muted} style={{ marginBottom: 16 }} />
          <h3 className="pf" style={{ fontSize: 17, fontWeight: 800, color: C.dark, margin: 0 }}>No orders found</h3>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 6, fontWeight: 500 }}>Customer checkouts and product reservation logs will appear here.</p>
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 24, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: "16px 20px", fontWeight: 800, color: C.dark, width: 100 }}>Order ID</th>
                  <th style={{ padding: "16px 20px", fontWeight: 800, color: C.dark }}>Customer Details</th>
                  <th style={{ padding: "16px 20px", fontWeight: 800, color: C.dark }}>Delivery Address</th>
                  <th style={{ padding: "16px 20px", fontWeight: 800, color: C.dark }}>Items Ordered</th>
                  <th style={{ padding: "16px 20px", fontWeight: 800, color: C.dark }}>Total Amount</th>
                  <th style={{ padding: "16px 20px", fontWeight: 800, color: C.dark }}>Date</th>
                  <th style={{ padding: "16px 20px", fontWeight: 800, color: C.dark, width: 140 }}>Order Status</th>
                  <th style={{ padding: "16px 20px", fontWeight: 800, color: C.dark, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const style = getStatusStyle(order.status);
                  const totalAmt = order.price * (order.qty || 1);
                  return (
                    <tr key={order.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.2s" }} className="table-row-hover">
                      {/* Order ID */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                        <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: C.muted }}>
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                      </td>

                      {/* Customer Details */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontWeight: 800, color: C.dark }}>{order.customerName}</span>
                          <span style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                            <Phone size={10} /> {order.customerPhone}
                          </span>
                        </div>
                      </td>

                      {/* Delivery Address */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle", maxWidth: 220 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 4, fontSize: 12, color: order.customerAddress ? C.dark : C.muted }}>
                          <MapPin size={12} style={{ flexShrink: 0, marginTop: 2, color: C.accent }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4 }}>
                            {order.customerAddress || "No Address Provided"}
                          </span>
                        </div>
                      </td>

                      {/* Items Ordered */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontWeight: 750, color: C.dark }}>{order.productName}</span>
                          <span style={{ fontSize: 11, color: C.muted }}>
                            Size: <span style={{ color: C.accent, fontWeight: 700 }}>{order.size}</span> | Color: <span style={{ color: C.accent, fontWeight: 700 }}>{order.color}</span> | Qty: <span style={{ fontWeight: 700 }}>{order.qty || 1}</span>
                          </span>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                        <span className="pf" style={{ fontSize: 15, fontWeight: 900, color: C.green }}>
                          ₹{totalAmt.toLocaleString()}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle", color: C.muted, fontSize: 11, fontWeight: 500 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={11} />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as Order["status"])}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 10,
                            border: `1.5px solid ${style.color}33`,
                            background: style.bg,
                            color: style.color,
                            fontSize: 11,
                            fontWeight: 800,
                            outline: "none",
                            cursor: "pointer",
                            transition: "0.2s",
                            width: "100%"
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Reserved">Reserved</option>
                          <option value="Approved">Approved</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "18px 20px", verticalAlign: "middle", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: C.bg,
                            color: C.dark,
                            fontWeight: 750,
                            fontSize: 11,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            transition: "0.2s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = C.border}
                          onMouseLeave={e => e.currentTarget.style.background = C.bg}
                        >
                          <Eye size={12} /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Details Modal (Printable Invoice/Receipt) */}
      <AnimatePresence>
        {selectedOrder && (
          <div 
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.5)",
              padding: 20
            }}
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                background: "#fff",
                borderRadius: 24,
                width: "100%",
                maxWidth: 480,
                boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                overflow: "hidden"
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ background: C.dark, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
                <span className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.accent, letterSpacing: "0.5px" }}>ORDER INVOICE RECIEPT</span>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Printable Area */}
              <div id="printable-order-bill" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Invoice Header */}
                <div style={{ textAlign: "center", borderBottom: `2px dashed ${C.border}`, paddingBottom: 16 }}>
                  <h3 className="pf" style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>SHIV WESTERN CLUB</h3>
                  <p style={{ fontSize: 11, color: "#666", margin: 0 }}>Premium Fashion Store & Club</p>
                  <p style={{ fontSize: 10, color: "#999", marginTop: 2 }}>Order ID: #{selectedOrder.id.toUpperCase()}</p>
                </div>

                {/* Bill Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666", fontWeight: 500 }}>Customer Name:</span>
                    <span style={{ fontWeight: 750, color: "#111" }}>{selectedOrder.customerName}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666", fontWeight: 500 }}>Mobile Number:</span>
                    <span style={{ fontWeight: 750, color: "#111" }}>{selectedOrder.customerPhone}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ color: "#666", fontWeight: 500, flexShrink: 0 }}>Delivery Address:</span>
                    <span style={{ fontWeight: 750, color: "#111", textAlign: "right", maxWidth: 220 }}>
                      {selectedOrder.customerAddress || "N/A"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666", fontWeight: 500 }}>Order Date & Time:</span>
                    <span style={{ fontWeight: 750, color: "#111" }}>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#666", fontWeight: 500 }}>Order Status:</span>
                    <span 
                      style={{ 
                        fontSize: 10, 
                        fontWeight: 850, 
                        padding: "4px 8px", 
                        borderRadius: 6,
                        background: getStatusStyle(selectedOrder.status).bg,
                        color: getStatusStyle(selectedOrder.status).color,
                        textTransform: "uppercase"
                      }}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                {/* Items Ordered Table */}
                <div>
                  <h4 className="pf" style={{ fontSize: 13, fontWeight: 800, color: "#111", borderBottom: `1px solid ${C.border}`, paddingBottom: 6, margin: "0 0 10px" }}>ITEMS ORDERED</h4>
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ color: "#666", borderBottom: `1px solid ${C.border}` }}>
                        <th style={{ textAlign: "left", paddingBottom: 6 }}>Description</th>
                        <th style={{ textAlign: "center", paddingBottom: 6 }}>Qty</th>
                        <th style={{ textAlign: "right", paddingBottom: 6 }}>Price</th>
                        <th style={{ textAlign: "right", paddingBottom: 6 }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ paddingTop: 10, paddingBottom: 10 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontWeight: 750, color: "#111" }}>{selectedOrder.productName}</span>
                            <span style={{ fontSize: 10, color: "#666" }}>Size: {selectedOrder.size} | Color: {selectedOrder.color}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "center", paddingTop: 10, paddingBottom: 10, color: "#111", fontWeight: 600 }}>
                          {selectedOrder.qty || 1}
                        </td>
                        <td style={{ textAlign: "right", paddingTop: 10, paddingBottom: 10, color: "#111", fontWeight: 600 }}>
                          ₹{selectedOrder.price.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right", paddingTop: 10, paddingBottom: 10, color: "#111", fontWeight: 750 }}>
                          ₹{(selectedOrder.price * (selectedOrder.qty || 1)).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Invoice Footer Total */}
                <div style={{ borderTop: `2px dashed ${C.border}`, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="pf" style={{ fontSize: 15, fontWeight: 900, color: "#111" }}>GRAND TOTAL:</span>
                  <span className="pf" style={{ fontSize: 20, fontWeight: 950, color: C.green }}>
                    ₹{(selectedOrder.price * (selectedOrder.qty || 1)).toLocaleString()}
                  </span>
                </div>

                {/* Receipt Footer Message */}
                <div style={{ textAlign: "center", fontSize: 10, color: "#999", marginTop: 8 }}>
                  Thank you for shopping at Shiv Western Club!
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 12, padding: "20px 24px", background: C.bg, borderTop: `1px solid ${C.border}` }} className="no-print">
                <button
                  onClick={handlePrint}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 12,
                    background: C.dark,
                    color: C.accent,
                    border: `1.5px solid ${C.accent}`,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8
                  }}
                >
                  <Printer size={15} /> Print Invoice
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 12,
                    background: "#fff",
                    color: C.dark,
                    border: `1.5px solid ${C.border}`,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer"
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
