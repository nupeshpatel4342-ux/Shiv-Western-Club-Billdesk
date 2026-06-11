import React, { useMemo } from "react";
import { C } from "../constants";
import { Bill, Settings, CatalogProduct } from "../types";
import { fmt } from "../utils/formatters";
import { Pill } from "../components/Layout";
import { Plus, IndianRupee, ClipboardList, ShoppingBag, ArrowUpRight, Clock } from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";

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

export const DashboardScreen = ({
  bills,
  orders = [],
  products = [],
  settings,
  onResetAllData,
  onCreateBill,
  isAdmin
}: {
  bills: Bill[],
  orders: Order[],
  products: CatalogProduct[],
  settings: Settings,
  onResetAllData: () => void,
  onCreateBill: () => void,
  isAdmin: boolean
}) => {
  const now = new Date();

  // Overview metrics
  const metrics = useMemo(() => {
    const totalSales = bills.reduce((acc, b) => acc + (b.total || 0), 0);
    const totalOrders = orders.length;
    const activeProducts = products.filter(p => (p.stock || 0) > 0).length;

    // Calculate today's sales for a helper metric
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayBills = bills.filter(b => {
      const bDate = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
      return bDate >= todayStart && bDate <= todayEnd;
    });
    const todaySales = todayBills.reduce((acc, b) => acc + (b.total || 0), 0);

    return {
      totalSales,
      totalOrders,
      activeProducts,
      todaySales,
      todayCount: todayBills.length
    };
  }, [bills, orders, products]);

  // Sort and limit orders to get the 7 most recent
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 7);
  }, [orders]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ padding: "0 0 100px" }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {settings.logo && (
            <img src={settings.logo} alt="Logo" style={{ width: 44, height: 44, borderRadius: 12, objectFit: "contain", background: "#fff", border: `1px solid ${C.border}` }} />
          )}
          <div>
            <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px", margin: 0 }}>Dashboard</h2>
            <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, margin: 0 }}>{format(now, "EEEE, dd MMMM yyyy")}</p>
          </div>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => {
              if (window.confirm("⚠️ DANGER: KYA AAP SARE BILLS AUR SETTINGS RESET KARNA CHAHTE HAIN? Ye action wapas nahi liya ja sakta.")) {
                onResetAllData();
              }
            }}
            title="Reset Store Database"
            style={{ width: 38, height: 38, borderRadius: 12, background: "#FFF0F0", border: `1.5px solid ${C.red}20`, display: "flex", alignItems: "center", justifyContent: "center", color: C.red, cursor: "pointer", transition: "0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#FFE4E4"}
            onMouseLeave={e => e.currentTarget.style.background = "#FFF0F0"}
          >
            🔄
          </button>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} style={{ marginBottom: 28 }}>
        <button 
          onClick={onCreateBill}
          style={{ width: "100%", background: C.dark, color: C.bg, padding: "18px", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 24px rgba(10, 31, 68, 0.15)", border: `1.5px solid ${C.accent}`, cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 10px 28px rgba(10, 31, 68, 0.25)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(10, 31, 68, 0.15)";
          }}
        >
          <Plus size={22} color={C.accent} strokeWidth={3} />
          <span className="pf" style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.5px" }}>NEW IN-STORE BILLING</span>
        </button>
      </motion.div>

      {/* Overview Metric Cards Grid */}
      <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 }}>
        {/* Total Sales Card */}
        <div style={{ background: C.card, borderRadius: 24, padding: 24, border: `1.5px solid ${C.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.02)", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <p className="pf" style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px", margin: 0 }}>Total Sales</p>
              <h3 className="pf" style={{ fontSize: 28, fontWeight: 900, color: C.dark, marginTop: 6, marginBottom: 0 }}>₹{fmt(metrics.totalSales)}</h3>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.green}12`, display: "flex", alignItems: "center", justifyContent: "center", color: C.green }}>
              <IndianRupee size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted, fontWeight: 650 }}>
            <span style={{ color: C.green, background: `${C.green}15`, padding: "2px 6px", borderRadius: 6, display: "flex", alignItems: "center", gap: 2 }}>
              <ArrowUpRight size={10} /> ₹{fmt(metrics.todaySales)}
            </span>
            <span>recorded today</span>
          </div>
        </div>

        {/* Total Orders Card */}
        <div style={{ background: C.card, borderRadius: 24, padding: 24, border: `1.5px solid ${C.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <p className="pf" style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px", margin: 0 }}>Total Orders</p>
              <h3 className="pf" style={{ fontSize: 28, fontWeight: 900, color: C.dark, marginTop: 6, marginBottom: 0 }}>{metrics.totalOrders}</h3>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>
              <ClipboardList size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted, fontWeight: 650 }}>
            <span style={{ color: C.accent, fontWeight: 800 }}>{orders.filter(o => o.status === "Reserved" || o.status === "Pending").length}</span>
            <span>pending reservations</span>
          </div>
        </div>

        {/* Active Products Card */}
        <div style={{ background: C.card, borderRadius: 24, padding: 24, border: `1.5px solid ${C.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <p className="pf" style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px", margin: 0 }}>Active Products</p>
              <h3 className="pf" style={{ fontSize: 28, fontWeight: 900, color: C.dark, marginTop: 6, marginBottom: 0 }}>{metrics.activeProducts}</h3>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.dark}10`, display: "flex", alignItems: "center", justifyContent: "center", color: C.dark }}>
              <ShoppingBag size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted, fontWeight: 650 }}>
            <span>In stock and available in catalog</span>
          </div>
        </div>
      </motion.div>

      {/* Recent Orders Table Section */}
      <motion.div variants={itemVariants} style={{ background: C.card, borderRadius: 28, border: `1.5px solid ${C.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.01)", overflow: "hidden" }}>
        <div style={{ padding: "24px 28px", borderBottom: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.dark, margin: 0 }}>Recent Orders</h3>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 3, margin: 0 }}>Latest customer reservations queue</p>
          </div>
          <Pill bg={C.dark} color={C.accent} small>Queue Log</Pill>
        </div>

        <div style={{ overflowX: "auto" }}>
          {recentOrders.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <ClipboardList size={40} color={C.muted} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: 0 }}>No orders in queue</p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 4, margin: 0 }}>Customer online orders will appear here automatically.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: `${C.bg}60`, borderBottom: `1.5px solid ${C.border}` }}>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Customer</th>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Product details</th>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Reserved Date</th>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Price</th>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const statusColors = {
                    Pending: { bg: `${C.accent}15`, color: C.accent },
                    Reserved: { bg: `${C.accent}15`, color: C.accent },
                    Approved: { bg: `${C.green}15`, color: C.green },
                    Completed: { bg: `${C.green}30`, color: C.green },
                    Cancelled: { bg: `${C.red}15`, color: C.red }
                  };
                  const colorConfig = statusColors[order.status] || { bg: `${C.muted}15`, color: C.muted };

                  return (
                    <tr key={order.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background-color 0.2s" }} className="hover:bg-slate-50/50">
                      {/* Customer info */}
                      <td style={{ padding: "16px 24px" }}>
                        <p style={{ fontSize: 13, fontWeight: 850, color: C.dark, margin: 0 }}>{order.customerName}</p>
                        <p style={{ fontSize: 11, color: C.muted, marginTop: 2, margin: 0 }}>📞 {order.customerPhone}</p>
                      </td>
                      {/* Product details */}
                      <td style={{ padding: "16px 24px" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: C.dark, margin: 0 }}>{order.productName}</p>
                        <p style={{ fontSize: 11, color: C.muted, marginTop: 2, margin: 0 }}>
                          Size: <span style={{ color: C.accent, fontWeight: 750 }}>{order.size || "M"}</span> | Color: <span style={{ color: C.accent, fontWeight: 750 }}>{order.color || "Multi"}</span>
                        </p>
                      </td>
                      {/* Date */}
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Clock size={12} color={C.muted} />
                          <span style={{ fontSize: 12, color: C.muted, fontWeight: 550 }}>
                            {format(new Date(order.createdAt), "dd MMM, hh:mm a")}
                          </span>
                        </div>
                      </td>
                      {/* Price */}
                      <td style={{ padding: "16px 24px" }}>
                        <span className="pf" style={{ fontSize: 14, fontWeight: 900, color: C.green }}>₹{order.price.toLocaleString("en-IN")}</span>
                      </td>
                      {/* Status */}
                      <td style={{ padding: "16px 24px" }}>
                        <span 
                          style={{ 
                            fontSize: 10, 
                            fontWeight: 800, 
                            padding: "4px 10px", 
                            borderRadius: 100,
                            background: colorConfig.bg,
                            color: colorConfig.color,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                          }}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
