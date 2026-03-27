import React, { useMemo } from "react";
import { C } from "../constants";
import { Bill, Settings } from "../types";
import { fmt } from "../utils/formatters";
import { Pill } from "../components/Layout";
import { Plus } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from "recharts";
import { 
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  isWithinInterval, subDays, format, eachDayOfInterval, subMonths, startOfToday
} from "date-fns";

export const DashboardScreen = ({ bills, settings, onResetAllData, onCreateBill, isAdmin }: { bills: Bill[], settings: Settings, onResetAllData: () => void, onCreateBill: () => void, isAdmin: boolean }) => {
  const now = new Date();
  
  const stats = useMemo(() => {
    const today = { start: startOfDay(now), end: endOfDay(now) };
    const week = { start: startOfWeek(now), end: endOfWeek(now) };
    const month = { start: startOfMonth(now), end: endOfMonth(now) };

    const getBillDate = (b: Bill) => b.timestamp ? new Date(b.timestamp) : new Date(b.date);

    const filterBills = (interval: { start: Date, end: Date }) => 
      bills.filter(b => isWithinInterval(getBillDate(b), interval));

    const todayBills = filterBills(today);
    const weekBills = filterBills(week);
    const monthBills = filterBills(month);

    const sum = (list: Bill[]) => list.reduce((acc, b) => acc + b.total, 0);
    const sumBalance = (list: Bill[]) => list.reduce((acc, b) => acc + (b.balance || 0), 0);

    return {
      today: { total: sum(todayBills), count: todayBills.length },
      week: { total: sum(weekBills), count: weekBills.length },
      month: { total: sum(monthBills), count: monthBills.length },
      allTime: sum(bills),
      totalUdhar: sumBalance(bills),
      avgBill: bills.length > 0 ? sum(bills) / bills.length : 0
    };
  }, [bills, now]);

  const chartData = useMemo(() => {
    // Last 7 days trend
    const last7Days = eachDayOfInterval({
      start: subDays(now, 6),
      end: now
    });

    return last7Days.map(date => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const dayBills = bills.filter(b => {
        const bDate = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
        return isWithinInterval(bDate, { start: dayStart, end: dayEnd });
      });
      return {
        name: format(date, "EEE"),
        fullDate: format(date, "dd MMM"),
        total: dayBills.reduce((acc, b) => acc + b.total, 0),
        count: dayBills.length
      };
    });
  }, [bills, now]);

  const topItems = useMemo(() => {
    const itemsMap: Record<string, { name: string, total: number, qty: number }> = {};
    bills.forEach(b => {
      b.items.forEach(it => {
        if (!itemsMap[it.name]) itemsMap[it.name] = { name: it.name, total: 0, qty: 0 };
        itemsMap[it.name].total += it.qty * it.price;
        itemsMap[it.name].qty += it.qty;
      });
    });
    return Object.values(itemsMap).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [bills]);

  const udharList = useMemo(() => {
    const map: Record<string, { name: string, phone: string, balance: number, count: number }> = {};
    bills.forEach(b => {
      if (b.balance && b.balance > 0) {
        const key = b.customerObj.phone || b.customerObj.name;
        if (!map[key]) {
          map[key] = { name: b.customerObj.name, phone: b.customerObj.phone, balance: 0, count: 0 };
        }
        map[key].balance += b.balance;
        map[key].count += 1;
      }
    });
    return Object.values(map).sort((a, b) => b.balance - a.balance);
  }, [bills]);

  return (
    <div className="fade" style={{ padding: "20px 18px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {settings.logo && (
            <img src={settings.logo} alt="Logo" style={{ width: 44, height: 44, borderRadius: 12, objectFit: "contain", background: "#fff", border: `1px solid ${C.border}` }} />
          )}
          <div>
            <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px" }}>Overview</h2>
            <p style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{format(now, "EEEE, dd MMMM")}</p>
          </div>
        </div>
        <button 
          onClick={() => {
            if (window.confirm("⚠️ KYA AAP SARE BILLS AUR SETTINGS RESET KARNA CHAHTE HAIN? Ye action wapas nahi liya ja sakta.")) {
              onResetAllData();
            }
          }}
          style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF0F0", border: `1px solid ${C.red}22`, display: "flex", alignItems: "center", justifyContent: "center", color: C.red }}
        >
          🔄
        </button>
      </div>

      {/* Quick Action */}
      <button 
        onClick={onCreateBill}
        style={{ width: "100%", background: C.dark, color: C.bg, padding: "18px", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24, boxShadow: "0 8px 24px rgba(10, 31, 68, 0.25)", border: "none" }}
      >
        <Plus size={22} color={C.accent} strokeWidth={3} />
        <span className="pf" style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.5px" }}>CREATE NEW BILL</span>
      </button>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: C.card, borderRadius: 20, padding: 20, border: `1.5px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: C.accent }} />
            <p className="pf" style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px" }}>Today's Sales</p>
          </div>
          <p className="pf" style={{ fontSize: 26, fontWeight: 900, color: C.dark }}>₹{fmt(stats.today.total)}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{stats.today.count}</span>
            <span style={{ fontSize: 11, color: C.muted }}>orders today</span>
          </div>
        </div>
        <div style={{ background: C.card, borderRadius: 20, padding: 20, border: `1.5px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: C.red }} />
            <p className="pf" style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px" }}>Total Udhar</p>
          </div>
          <p className="pf" style={{ fontSize: 26, fontWeight: 900, color: C.red }}>₹{fmt(stats.totalUdhar)}</p>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 6, fontWeight: 500 }}>Pending payments</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: C.card, borderRadius: 20, padding: 18, border: `1.5px solid ${C.border}` }}>
          <p className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px" }}>Avg. Bill Value</p>
          <p className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.dark, marginTop: 4 }}>₹{fmt(stats.avgBill)}</p>
        </div>
        <div style={{ background: C.card, borderRadius: 20, padding: 18, border: `1.5px solid ${C.border}` }}>
          <p className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.8px" }}>Monthly Sales</p>
          <p className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.dark, marginTop: 4 }}>₹{fmt(stats.month.total)}</p>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div style={{ background: C.card, borderRadius: 24, padding: "20px 16px", border: `1.5px solid ${C.border}`, marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: C.dark, marginBottom: 20, paddingLeft: 4 }}>Last 7 Days Sales Trend</p>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.accent} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: C.muted }} dy={10} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
                formatter={(val: number) => [`₹${fmt(val)}`, "Sales"]}
              />
              <Area type="monotone" dataKey="total" stroke={C.accent} strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Selling Items */}
      <div style={{ background: C.card, borderRadius: 24, padding: 20, border: `1.5px solid ${C.border}`, marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: C.dark, marginBottom: 16 }}>Top Selling Items</p>
        {topItems.length === 0 ? (
          <p style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "20px 0" }}>No data available</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {topItems.map((it, idx) => (
              <div key={it.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: idx === 0 ? C.green : C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: idx === 0 ? "#fff" : C.dark }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{it.name}</p>
                  <div style={{ width: "100%", height: 6, background: C.bg, borderRadius: 10, marginTop: 4, overflow: "hidden" }}>
                    <div style={{ width: `${(it.total / topItems[0].total) * 100}%`, height: "100%", background: C.accent, borderRadius: 10 }} />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: C.green }}>₹{fmt(it.total)}</p>
                  <p style={{ fontSize: 10, color: C.muted }}>{it.qty} sold</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Udhar List */}
      <div style={{ background: C.card, borderRadius: 24, padding: 20, border: `1.5px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: C.dark }}>Pending Udhar (Credit) List</p>
          <Pill bg="#FFF0F0" color={C.accent} small>{udharList.length} People</Pill>
        </div>
        {udharList.length === 0 ? (
          <p style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "20px 0" }}>Sabka payment clear hai! 🎉</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {udharList.map((u) => (
              <div key={u.phone || u.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.bg}` }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{u.name}</p>
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>📞 {u.phone || "No Phone"} · {u.count} Bills</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color: C.accent }}>₹{fmt(u.balance)}</p>
                  <p style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>PENDING</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
