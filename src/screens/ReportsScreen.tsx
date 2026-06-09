import React, { useMemo, useState } from "react";
import { C } from "../constants";
import { Bill, CatalogProduct } from "../types";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval, subDays, format, isWithinInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { Pill } from "../components/Layout";
import { TrendingUp, ShoppingBag, Users, DollarSign, Calendar } from "lucide-react";

export const ReportsScreen = ({
  bills,
  products
}: {
  bills: Bill[],
  products: CatalogProduct[]
}) => {
  const [reportTab, setReportTab] = useState<"sales" | "products" | "profit" | "customers">("sales");

  const now = new Date();

  // Create product mapping for purchase price lookup
  const productMap = useMemo(() => {
    const map: Record<string, CatalogProduct> = {};
    products.forEach(p => {
      map[p.name.toLowerCase().trim()] = p;
      if (p.sku) {
        map[p.sku.toLowerCase().trim()] = p;
      }
    });
    return map;
  }, [products]);

  // Daily Sales (Last 30 days)
  const dailySalesData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(now, 29),
      end: now
    });

    return days.map(date => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayBills = bills.filter(b => {
        const bDate = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
        return isWithinInterval(bDate, { start: dayStart, end: dayEnd });
      });

      const totalSales = dayBills.reduce((sum, b) => sum + b.total, 0);
      
      // Calculate profit for the day
      let totalProfit = 0;
      dayBills.forEach(b => {
        b.items.forEach(it => {
          const matchingProduct = productMap[it.name.toLowerCase().trim()] || (it.sku ? productMap[it.sku.toLowerCase().trim()] : null);
          const purchasePrice = matchingProduct && (matchingProduct as any).purchasePrice !== undefined 
            ? (matchingProduct as any).purchasePrice 
            : it.price * 0.6; // default 40% margin fallback if no purchase price
          
          const unitProfit = Math.max(0, (it.price - (it.discount || 0)) - purchasePrice);
          totalProfit += unitProfit * it.qty;
        });
        totalProfit -= b.discount; // Deduct overall bill discount from profit
      });

      return {
        dateStr: format(date, "dd MMM"),
        Sales: totalSales,
        Profit: Math.max(0, totalProfit),
        count: dayBills.length
      };
    });
  }, [bills, productMap]);

  // Monthly Sales (Current year)
  const monthlySalesData = useMemo(() => {
    const monthlyMap: Record<string, { name: string, Sales: number, Profit: number, count: number }> = {};
    
    // Initialize months
    for (let m = 0; m < 12; m++) {
      const d = new Date(now.getFullYear(), m, 1);
      const mStr = format(d, "MMM");
      monthlyMap[mStr] = { name: mStr, Sales: 0, Profit: 0, count: 0 };
    }

    bills.forEach(b => {
      const bDate = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
      if (bDate.getFullYear() === now.getFullYear()) {
        const mStr = format(bDate, "MMM");
        if (monthlyMap[mStr]) {
          monthlyMap[mStr].Sales += b.total;
          monthlyMap[mStr].count += 1;
          
          // Calculate profit
          b.items.forEach(it => {
            const matchingProduct = productMap[it.name.toLowerCase().trim()] || (it.sku ? productMap[it.sku.toLowerCase().trim()] : null);
            const purchasePrice = matchingProduct && (matchingProduct as any).purchasePrice !== undefined 
              ? (matchingProduct as any).purchasePrice 
              : it.price * 0.6;
            
            const unitProfit = Math.max(0, (it.price - (it.discount || 0)) - purchasePrice);
            monthlyMap[mStr].Profit += unitProfit * it.qty;
          });
          monthlyMap[mStr].Profit -= b.discount;
        }
      }
    });

    return Object.values(monthlyMap);
  }, [bills, productMap]);

  // Product-wise sales
  const productSales = useMemo(() => {
    const map: Record<string, { name: string, qty: number, totalRevenue: number, totalProfit: number }> = {};
    
    bills.forEach(b => {
      b.items.forEach(it => {
        const key = it.name.toLowerCase().trim();
        if (!map[key]) {
          map[key] = { name: it.name, qty: 0, totalRevenue: 0, totalProfit: 0 };
        }
        
        const matchingProduct = productMap[key] || (it.sku ? productMap[it.sku.toLowerCase().trim()] : null);
        const purchasePrice = matchingProduct && (matchingProduct as any).purchasePrice !== undefined 
          ? (matchingProduct as any).purchasePrice 
          : it.price * 0.6;
        
        const itemRevenue = it.qty * Math.max(0, it.price - (it.discount || 0));
        const itemProfit = it.qty * Math.max(0, (it.price - (it.discount || 0)) - purchasePrice);

        map[key].qty += it.qty;
        map[key].totalRevenue += itemRevenue;
        map[key].totalProfit += itemProfit;
      });
    });

    return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [bills, productMap]);

  // Customer leaderboard
  const customerLeaderboard = useMemo(() => {
    const map: Record<string, { name: string, phone: string, billsCount: number, totalSpend: number }> = {};

    bills.forEach(b => {
      const key = b.customerObj.phone.trim() || b.customerObj.name.trim();
      if (!map[key]) {
        map[key] = { 
          name: b.customerObj.name, 
          phone: b.customerObj.phone, 
          billsCount: 0, 
          totalSpend: 0 
        };
      }
      map[key].billsCount += 1;
      map[key].totalSpend += b.total;
    });

    return Object.values(map).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [bills]);

  // Totals calculations
  const totalSalesAllTime = useMemo(() => bills.reduce((sum, b) => sum + b.total, 0), [bills]);
  
  const totalProfitAllTime = useMemo(() => {
    let profit = 0;
    bills.forEach(b => {
      b.items.forEach(it => {
        const matchingProduct = productMap[it.name.toLowerCase().trim()] || (it.sku ? productMap[it.sku.toLowerCase().trim()] : null);
        const purchasePrice = matchingProduct && (matchingProduct as any).purchasePrice !== undefined 
          ? (matchingProduct as any).purchasePrice 
          : it.price * 0.6;
        const unitProfit = Math.max(0, (it.price - (it.discount || 0)) - purchasePrice);
        profit += unitProfit * it.qty;
      });
      profit -= b.discount;
    });
    return Math.max(0, profit);
  }, [bills, productMap]);

  const COLORS = ["#0A1F44", "#D4AF37", "#2D6A4F", "#9B2226", "#6B7280"];

  return (
    <div className="fade" style={{ padding: "0 0 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px", margin: 0 }}>Business Reports</h2>
          <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, margin: 0 }}>Analyze sales, products popularity, and shop profitability</p>
        </div>
      </div>

      {/* Reports Overview Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: C.card, borderRadius: 20, padding: 20, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.green}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DollarSign size={24} color={C.green} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, margin: 0 }}>Total Sales Revenue</p>
            <h3 className="pf" style={{ fontSize: 22, fontWeight: 900, color: C.green, margin: "2px 0 0" }}>₹{totalSalesAllTime.toLocaleString()}</h3>
          </div>
        </div>

        <div style={{ background: C.card, borderRadius: 20, padding: 20, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={24} color={C.accent} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, margin: 0 }}>Total Retail Profit</p>
            <h3 className="pf" style={{ fontSize: 22, fontWeight: 900, color: C.accent, margin: "2px 0 0" }}>₹{totalProfitAllTime.toLocaleString()}</h3>
          </div>
        </div>

        <div style={{ background: C.card, borderRadius: 20, padding: 20, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.dark}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={24} color={C.dark} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, margin: 0 }}>Total Orders Billed</p>
            <h3 className="pf" style={{ fontSize: 22, fontWeight: 900, color: C.dark, margin: "2px 0 0" }}>{bills.length} Invoices</h3>
          </div>
        </div>
      </div>

      {/* Selector Navigation */}
      <div style={{ display: "flex", gap: 10, borderBottom: `1.5px solid ${C.border}`, paddingBottom: 12, marginBottom: 24, overflowX: "auto" }} className="no-scrollbar">
        {[
          { id: "sales", label: "Sales Analysis" },
          { id: "products", label: "Product Performance" },
          { id: "profit", label: "Profitability Ledger" },
          { id: "customers", label: "Customer Leaderboard" }
        ].map(tb => (
          <button
            key={tb.id}
            onClick={() => setReportTab(tb.id as any)}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: reportTab === tb.id ? C.dark : "transparent",
              color: reportTab === tb.id ? C.accent : C.muted,
              fontWeight: 800,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
              transition: "0.2s"
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* REPORT CONTENT VIEWPORT */}
      
      {/* 1. SALES ANALYSIS */}
      {reportTab === "sales" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Daily Trend chart */}
          <div style={{ background: C.card, borderRadius: 24, padding: 24, border: `1px solid ${C.border}` }}>
            <h4 className="pf" style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 20 }}>Daily Sales Trend (Last 30 Days)</h4>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={dailySalesData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.green} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
                  <XAxis dataKey="dateStr" stroke={C.muted} fontSize={11} tickLine={false} />
                  <YAxis stroke={C.muted} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="Sales" stroke={C.green} strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Trend chart */}
          <div style={{ background: C.card, borderRadius: 24, padding: 24, border: `1px solid ${C.border}` }}>
            <h4 className="pf" style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 20 }}>Monthly Sales Performance ({now.getFullYear()})</h4>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={monthlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
                  <XAxis dataKey="name" stroke={C.muted} fontSize={11} tickLine={false} />
                  <YAxis stroke={C.muted} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="Sales" fill={C.dark} radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {monthlySalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? C.dark : C.accent} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCT PERFORMANCE */}
      {reportTab === "products" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Top Selling Products List */}
          <div style={{ background: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
            <h4 className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.dark, marginBottom: 16 }}>Top Selling Products by Revenue</h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Rank & Product</th>
                    <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Qty Sold</th>
                    <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Total Profit</th>
                    <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {productSales.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: C.muted }}>No products sold yet.</td>
                    </tr>
                  ) : (
                    productSales.map((ps, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "14px", fontWeight: 700, fontSize: 13, color: C.dark }}>
                          <span style={{ display: "inline-block", width: 24, height: 24, background: idx < 3 ? C.accent : C.bg, color: idx < 3 ? "#000" : C.muted, borderRadius: 6, textAlign: "center", lineHeight: "24px", fontSize: 11, marginRight: 10 }}>{idx + 1}</span>
                          {ps.name}
                        </td>
                        <td style={{ padding: "14px", textAlign: "right", color: C.muted, fontSize: 13 }}>{ps.qty} units</td>
                        <td style={{ padding: "14px", textAlign: "right", color: C.accent, fontWeight: 700, fontSize: 13 }}>₹{ps.totalProfit.toLocaleString()}</td>
                        <td style={{ padding: "14px", textAlign: "right", color: C.green, fontWeight: 800, fontSize: 14 }}>₹{ps.totalRevenue.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. PROFITABILITY LEDGER */}
      {reportTab === "profit" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Daily Profit trend chart */}
          <div style={{ background: C.card, borderRadius: 24, padding: 24, border: `1px solid ${C.border}` }}>
            <h4 className="pf" style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 20 }}>Daily Profit Trend (Last 30 Days)</h4>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={dailySalesData}>
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.accent} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
                  <XAxis dataKey="dateStr" stroke={C.muted} fontSize={11} tickLine={false} />
                  <YAxis stroke={C.muted} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Net Profit"]} />
                  <Area type="monotone" dataKey="Profit" stroke={C.accent} strokeWidth={2.5} fillOpacity={1} fill="url(#profitGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product margins list */}
          <div style={{ background: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
            <h4 className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.dark, marginBottom: 16 }}>Product Pricing & Retail Margins</h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Product Name</th>
                    <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Cost Price</th>
                    <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Sale Price</th>
                    <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Margin (₹)</th>
                    <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Margin (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: C.muted }}>No products in catalog.</td>
                    </tr>
                  ) : (
                    products.map(p => {
                      const cost = (p as any).purchasePrice || 0;
                      const sale = p.price;
                      const marginAmt = Math.max(0, sale - cost);
                      const marginPct = sale > 0 ? (marginAmt / sale) * 100 : 0;
                      return (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: "14px", fontWeight: 700, fontSize: 13, color: C.dark }}>{p.name}</td>
                          <td style={{ padding: "14px", textAlign: "right", color: C.muted, fontSize: 13 }}>₹{cost.toLocaleString()}</td>
                          <td style={{ padding: "14px", textAlign: "right", color: C.dark, fontWeight: 700, fontSize: 13 }}>₹{sale.toLocaleString()}</td>
                          <td style={{ padding: "14px", textAlign: "right", color: C.green, fontWeight: 800, fontSize: 13 }}>₹{marginAmt.toLocaleString()}</td>
                          <td style={{ padding: "14px", textAlign: "right", color: C.accent, fontWeight: 800, fontSize: 13 }}>{marginPct.toFixed(1)}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. CUSTOMER LEADERBOARD */}
      {reportTab === "customers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Leaderboard Table */}
          <div style={{ background: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
            <h4 className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.dark, marginBottom: 16 }}>Top Customer Spenders</h4>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Customer Info</th>
                    <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Bills Generated</th>
                    <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Loyalty points</th>
                    <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {customerLeaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: C.muted }}>No customer transactions yet.</td>
                    </tr>
                  ) : (
                    customerLeaderboard.map((cust, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "14px", fontWeight: 700, fontSize: 13, color: C.dark }}>
                          <span style={{ display: "inline-block", width: 24, height: 24, background: idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : idx === 2 ? "#CD7F32" : C.bg, color: idx < 3 ? "#000" : C.muted, borderRadius: 6, textAlign: "center", lineHeight: "24px", fontSize: 11, marginRight: 10 }}>{idx + 1}</span>
                          {cust.name}
                          <span style={{ display: "block", fontSize: 10, color: C.muted, fontWeight: 400, marginTop: 2 }}>{cust.phone}</span>
                        </td>
                        <td style={{ padding: "14px", textAlign: "right", color: C.muted, fontSize: 13 }}>{cust.billsCount} transactions</td>
                        <td style={{ padding: "14px", textAlign: "right", color: C.accent, fontWeight: 700, fontSize: 13 }}>{Math.floor(cust.totalSpend / 100)} pts</td>
                        <td style={{ padding: "14px", textAlign: "right", color: C.green, fontWeight: 800, fontSize: 14 }}>₹{cust.totalSpend.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
