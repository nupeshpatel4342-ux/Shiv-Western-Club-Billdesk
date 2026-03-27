import React, { useState } from "react";
import { C } from "../constants";
import { Settings, UserProfile } from "../types";
import { Divider, Pill } from "../components/Layout";

export const SettingsScreen = ({ 
  settings, 
  onSave, 
  profile, 
  onUpdateProfile,
  darkMode,
  onToggleDarkMode
}: { 
  settings: Settings, 
  onSave: (s: Settings) => void, 
  profile: UserProfile | null,
  onUpdateProfile: (p: UserProfile) => void,
  darkMode: boolean,
  onToggleDarkMode: () => void
}) => {
  const [s, setS] = useState<Settings>(settings);
  const [p, setP] = useState<UserProfile | null>(profile);
  const [saved, setSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const saveSettings = () => {
    onSave(s);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveProfile = () => {
    if (p) {
      onUpdateProfile(p);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    }
  };

  return (
    <div className="fade" style={{ padding: "20px 18px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px" }}>Settings</h2>
        {(saved || profileSaved) && <Pill bg={C.green} color="#fff">✓ SAVED</Pill>}
      </div>

      {/* App Preferences */}
      <div style={{ background: C.card, borderRadius: 24, padding: 28, boxShadow: "0 8px 24px rgba(10, 31, 68, 0.06)", marginBottom: 28, border: `1px solid ${C.border}` }}>
        <p className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 20 }}>App Preferences</p>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: C.dark, marginBottom: 4 }}>Dark Mode</p>
            <p style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Switch to dark theme</p>
          </div>
          <button 
            onClick={onToggleDarkMode}
            style={{ 
              width: 52, 
              height: 28, 
              borderRadius: 100, 
              background: darkMode ? C.accent : C.border, 
              position: "relative", 
              border: "none", 
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            <div style={{ 
              width: 22, 
              height: 22, 
              borderRadius: "50%", 
              background: "#fff", 
              position: "absolute", 
              top: 3, 
              left: darkMode ? 27 : 3, 
              transition: "all 0.3s ease",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
            }} />
          </button>
        </div>
      </div>

      {/* User Profile Section */}
      {p && (
        <div style={{ background: C.card, borderRadius: 24, padding: 28, boxShadow: "0 8px 24px rgba(10, 31, 68, 0.06)", marginBottom: 28, border: `1px solid ${C.border}` }}>
          <p className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 20 }}>Your Profile</p>
          
          <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 20 }}>
            {p.photoURL ? (
              <div style={{ position: "relative", width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: `2px solid ${C.accent}`, boxShadow: "0 4px 12px rgba(212, 175, 55, 0.2)" }}>
                <img src={p.photoURL} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button 
                  onClick={() => setP({ ...p, photoURL: "" })}
                  style={{ position: "absolute", bottom: 0, right: 0, background: C.dark, color: C.bg, width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, border: "none" }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div 
                onClick={() => document.getElementById("profile-upload")?.click()}
                style={{ width: 72, height: 72, borderRadius: "50%", border: `2px dashed ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: C.bg, transition: "all 0.2s" }}
              >
                <span style={{ fontSize: 24 }}>👤</span>
              </div>
            )}
            <input 
              id="profile-upload" 
              type="file" 
              accept="image/*" 
              style={{ display: "none" }} 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setP({ ...p, photoURL: reader.result as string });
                  };
                  reader.readAsDataURL(file);
                }
              }} 
            />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Display Name</label>
              <input 
                value={p.displayName} 
                onChange={e => setP({ ...p, displayName: e.target.value })} 
                placeholder="Your Name" 
                style={{ fontSize: 18, fontWeight: 800, color: C.dark, width: "100%", border: "none", borderBottom: `2px solid ${C.bg}`, padding: "6px 0", outline: "none", background: "transparent" }} 
              />
            </div>
          </div>
          
          <button 
            onClick={saveProfile}
            style={{ width: "100%", background: C.dark, color: C.accent, padding: "14px", borderRadius: 14, fontSize: 13, fontWeight: 900, border: `1.5px solid ${C.accent}`, boxShadow: "0 4px 12px rgba(10, 31, 68, 0.15)", textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            {profileSaved ? "Profile Saved! ✓" : "Update Profile"}
          </button>
        </div>
      )}

      {/* Shop Identity Section */}
      <div style={{ background: C.card, borderRadius: 24, padding: 28, boxShadow: "0 8px 24px rgba(10, 31, 68, 0.06)", marginBottom: 28, border: `1px solid ${C.border}` }}>
        <p className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 24 }}>Shop Identity</p>
        
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 20 }}>
          {s.logo ? (
            <div style={{ position: "relative", width: 88, height: 88, borderRadius: 18, overflow: "hidden", border: `1px solid ${C.border}`, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
              <img src={s.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              <button 
                onClick={() => setS({ ...s, logo: undefined })}
                style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "#fff", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, border: "none" }}
              >
                ×
              </button>
            </div>
          ) : (
            <div 
              onClick={() => document.getElementById("logo-upload")?.click()}
              style={{ width: 88, height: 88, borderRadius: 18, border: `2px dashed ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: C.bg, transition: "all 0.2s" }}
            >
              <span style={{ fontSize: 24 }}>🖼️</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, marginTop: 6 }}>Add Logo</span>
            </div>
          )}
          <input 
            id="logo-upload" 
            type="file" 
            accept="image/*" 
            style={{ display: "none" }} 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setS({ ...s, logo: reader.result as string });
                };
                reader.readAsDataURL(file);
              }
            }} 
          />
          <div>
            <p className="pf" style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>Shop Logo</p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 4, fontWeight: 500, lineHeight: 1.4 }}>This logo will appear on all your invoices.</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 8 }}>Shop Name</label>
            <div style={{ borderBottom: `2px solid ${C.bg}`, padding: "8px 0" }}>
              <input value={s.shopName} onChange={e => setS({ ...s, shopName: e.target.value })} placeholder="e.g. Shiv Western Club" style={{ fontSize: 16, fontWeight: 800, color: C.dark, width: "100%", border: "none", outline: "none", background: "transparent" }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 8 }}>Owner Name</label>
            <div style={{ borderBottom: `2px solid ${C.bg}`, padding: "8px 0" }}>
              <input value={s.ownerName} onChange={e => setS({ ...s, ownerName: e.target.value })} placeholder="e.g. Nupesh Patel" style={{ fontSize: 16, fontWeight: 800, color: C.dark, width: "100%", border: "none", outline: "none", background: "transparent" }} />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 8 }}>Address</label>
          <div style={{ borderBottom: `2px solid ${C.bg}`, padding: "8px 0" }}>
            <textarea value={s.address} onChange={e => setS({ ...s, address: e.target.value })} placeholder="Shop full address..." style={{ fontSize: 14, color: C.dark, width: "100%", height: 60, resize: "none", border: "none", outline: "none", background: "transparent", fontWeight: 500 }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 8 }}>Phone No.</label>
            <div style={{ borderBottom: `2px solid ${C.bg}`, padding: "8px 0" }}>
              <input value={s.phone} onChange={e => setS({ ...s, phone: e.target.value })} placeholder="e.g. 9876543210" style={{ fontSize: 16, fontWeight: 800, color: C.dark, width: "100%", border: "none", outline: "none", background: "transparent" }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 8 }}>Email (Optional)</label>
            <div style={{ borderBottom: `2px solid ${C.bg}`, padding: "8px 0" }}>
              <input value={s.email} onChange={e => setS({ ...s, email: e.target.value })} placeholder="e.g. contact@shop.com" style={{ fontSize: 15, color: C.dark, width: "100%", border: "none", outline: "none", background: "transparent", fontWeight: 500 }} />
            </div>
          </div>
        </div>
      </div>

      {/* UPI QR Code Section */}
      <div style={{ background: C.card, borderRadius: 24, padding: 28, boxShadow: "0 8px 24px rgba(10, 31, 68, 0.06)", marginBottom: 28, border: `1px solid ${C.border}` }}>
        <p className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 24 }}>UPI QR Code (For Invoices)</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {s.upiQrCode ? (
            <div style={{ position: "relative", width: 140, height: 140, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
              <img src={s.upiQrCode} alt="UPI QR" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button 
                onClick={() => setS({ ...s, upiQrCode: undefined })}
                style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, border: "none" }}
              >
                ×
              </button>
            </div>
          ) : (
            <div 
              onClick={() => document.getElementById("qr-upload")?.click()}
              style={{ width: 140, height: 140, borderRadius: 16, border: `2px dashed ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: C.bg, transition: "all 0.2s" }}
            >
              <span style={{ fontSize: 28 }}>📷</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: C.muted, marginTop: 8 }}>Upload QR</span>
            </div>
          )}
          <input 
            id="qr-upload" 
            type="file" 
            accept="image/*" 
            style={{ display: "none" }} 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setS({ ...s, upiQrCode: reader.result as string });
                };
                reader.readAsDataURL(file);
              }
            }} 
          />
          <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, lineHeight: 1.5 }}>Upload your PhonePe, GPay, or any UPI QR code image. It will be displayed on your invoices for easy customer payments.</p>
        </div>
      </div>

      {/* Invoice Template Section */}
      <div style={{ background: C.card, borderRadius: 24, padding: 28, boxShadow: "0 8px 24px rgba(10, 31, 68, 0.06)", marginBottom: 28, border: `1px solid ${C.border}` }}>
        <p className="pf" style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 24 }}>Invoice Template</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { id: 'standard', name: 'Standard', desc: 'The classic, balanced layout.' },
            { id: 'minimal', name: 'Minimal', desc: 'Clean, simple, black & white focus.' },
            { id: 'modern', name: 'Modern', desc: 'Bold headers and structured grid.' }
          ].map(tpl => (
            <label key={tpl.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, borderRadius: 16, border: `2px solid ${s.invoiceLayout === tpl.id || (!s.invoiceLayout && tpl.id === 'standard') ? C.accent : C.border}`, background: s.invoiceLayout === tpl.id || (!s.invoiceLayout && tpl.id === 'standard') ? `${C.accent}11` : "transparent", cursor: "pointer", transition: "all 0.2s" }}>
              <input 
                type="radio" 
                name="invoiceLayout" 
                value={tpl.id} 
                checked={s.invoiceLayout === tpl.id || (!s.invoiceLayout && tpl.id === 'standard')} 
                onChange={() => setS({ ...s, invoiceLayout: tpl.id as any })} 
                style={{ width: 20, height: 20, accentColor: C.dark }} 
              />
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>{tpl.name}</p>
                <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginTop: 2 }}>{tpl.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Save Shop Settings Button */}
      {profile?.role === "admin" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
          <button onClick={() => setS(settings)} style={{ padding: "18px", borderRadius: 18, border: `1.5px solid ${C.border}`, color: C.muted, fontSize: 14, fontWeight: 800, background: "none" }}>Discard</button>
          <button onClick={saveSettings}
            style={{ background: saved ? C.green : C.dark, color: saved ? "#fff" : C.accent, padding: "18px", borderRadius: 18, fontSize: 14, fontWeight: 900, boxShadow: "0 8px 24px rgba(10, 31, 68, 0.15)", transition: "all 0.2s", border: `1.5px solid ${C.accent}`, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {saved ? "Saved! ✓" : "Save Settings"}
          </button>
        </div>
      ) : (
        <div style={{ padding: "20px", borderRadius: 18, background: "#FFF0F0", border: `1px solid ${C.red}22`, color: C.red, fontSize: 13, fontWeight: 700, textAlign: "center", marginBottom: 40 }}>
          ⚠️ Only Admin can change Shop Identity & Settings.
        </div>
      )}

      <div style={{ marginTop: 40, textAlign: "center" }}>
        <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Shiv Western Club v1.0</p>
        <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Made with ❤️ for Shop Owners</p>
      </div>
    </div>
  );
};
