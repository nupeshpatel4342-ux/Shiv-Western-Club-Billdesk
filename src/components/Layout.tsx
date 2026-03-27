import React from "react";
import { C } from "../constants";
import { Settings, UserProfile } from "../types";
import { Shirt, Menu, ShoppingBag, Plus, History, Settings as SettingsIcon, CheckCircle2, LayoutDashboard } from "lucide-react";

export const Pill = ({ children, color = "#fff", bg = C.accent, small }: { children: React.ReactNode, color?: string, bg?: string, small?: boolean }) => (
  <span className="pf" style={{ background: bg, color, fontSize: small ? 10 : 11, fontWeight: 700, padding: small ? "2px 8px" : "4px 12px", borderRadius: 100, letterSpacing: "0.8px", display: "inline-block", textTransform: "uppercase" }}>{children}</span>
);

export const Divider = ({ my = 12 }: { my?: number }) => <div style={{ height: 1, background: C.border, margin: `${my}px 0` }} />;

export const Drawer = ({ open, onClose, settings, onNav, user, onLogout }: { open: boolean, onClose: () => void, settings: Settings, onNav: (tab: string) => void, user: UserProfile | null, onLogout: () => void }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }} onClick={onClose}>
      <div className="sinl" onClick={e => e.stopPropagation()}
        style={{ width: 275, background: C.card, height: "100%", display: "flex", flexDirection: "column", boxShadow: "6px 0 28px rgba(0,0,0,0.18)" }}>
        <div style={{ background: C.dark, padding: "32px 24px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            {user?.photoURL ? (
              <img src={user.photoURL} style={{ width: 56, height: 56, borderRadius: 16, border: `2px solid ${C.accent}` }} alt="User" referrerPolicy="no-referrer" />
            ) : settings.logo ? (
              <img src={settings.logo} style={{ width: 56, height: 56, borderRadius: 16, border: `2px solid ${C.accent}`, background: "#fff", objectFit: "contain" }} alt="Logo" />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)" }}>
                <Shirt color={C.bg} size={30} strokeWidth={2.5} />
              </div>
            )}
            <div>
              <p className="pf" style={{ color: C.bg, fontWeight: 800, fontSize: 20, marginBottom: 4, letterSpacing: "-0.5px" }}>{user?.displayName}</p>
              <Pill bg={user?.role === "admin" ? C.accent : C.muted} small>{user?.role?.toUpperCase()}</Pill>
            </div>
          </div>
          <p style={{ color: C.bg, opacity: 0.7, fontSize: 13, fontWeight: 400 }}>{user?.email}</p>
        </div>
        <div style={{ padding: "14px 10px", flex: 1 }}>
          {[
            { icon: <Plus size={20} />, label: "New Bill", tab: "bill", show: true },
            { icon: <LayoutDashboard size={20} />, label: "Dashboard", tab: "dashboard", show: true },
            { icon: <History size={20} />, label: "Bill History", tab: "history", show: true },
            { icon: <SettingsIcon size={20} />, label: "Settings", tab: "settings", show: true }
          ].filter(l => l.show).map(l => (
            <button key={l.tab} onClick={() => { onNav(l.tab); onClose(); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 12, marginBottom: 4, textAlign: "left", color: C.dark, fontWeight: 600, fontSize: 15, transition: "all 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = C.bg)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <span style={{ color: C.green }}>{l.icon}</span>{l.label}
            </button>
          ))}
          <Divider my={8} />
          <button onClick={onLogout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 12, marginBottom: 4, textAlign: "left", color: C.accent, fontWeight: 700, fontSize: 15 }}>
            🚪 Logout
          </button>
        </div>
        <div style={{ padding: "12px 20px 22px", borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 11, color: C.muted }}>{settings.shopName} · v1.2 Cloud</p>
        </div>
      </div>
    </div>
  );
};

export const Header = ({ onMenu, settings }: { onMenu: () => void, settings: Settings }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 12px", background: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100 }}>
    <button onClick={onMenu} style={{ background: C.bg, borderRadius: 12, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", color: C.dark, border: `1px solid ${C.border}`, transition: "0.2s" }}>
      <Menu size={22} />
    </button>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {settings.logo ? (
        <img src={settings.logo} alt="Logo" style={{ width: 34, height: 34, borderRadius: 10, objectFit: "contain" }} />
      ) : (
        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shirt size={20} color={C.accent} />
        </div>
      )}
      <span className="pf" style={{ fontWeight: 800, fontSize: 20, color: C.dark, letterSpacing: "-0.8px" }}>{settings.shopName}</span>
    </div>
    <div style={{ width: 42 }} />
  </div>
);

export const BottomNav = ({ active, onChange, isAdmin }: { active: string, onChange: (id: string) => void, isAdmin?: boolean }) => (
  <div style={{ display: "flex", borderTop: `1px solid ${C.border}`, background: C.card, position: "sticky", bottom: 0, zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -4px 20px rgba(0,0,0,0.03)" }}>
    {[
      { id: "bill", icon: <Plus size={24} />, label: "Bill", show: true },
      { id: "dashboard", icon: <LayoutDashboard size={24} />, label: "Stats", show: true },
      { id: "history", icon: <History size={24} />, label: "History", show: true },
      { id: "settings", icon: <SettingsIcon size={24} />, label: "Settings", show: true }
    ].filter(t => t.show).map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        style={{ flex: 1, padding: "14px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          color: active === t.id ? C.dark : C.muted, borderTop: active === t.id ? `3px solid ${C.accent}` : "3px solid transparent", transition: "all 0.2s" }}>
        {t.icon}
        <span className="pf" style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t.label}</span>
      </button>
    ))}
  </div>
);
