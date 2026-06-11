import React, { useState } from "react";
import { C } from "../constants";
import { db } from "../firebase";
import { collection, doc, addDoc, setDoc, deleteDoc } from "firebase/firestore";
import { Image as ImageIcon, Plus, Edit2, Trash2, X, Check, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Banner {
  id: string;
  tag: string;
  headline: string;
  sub: string;
  cta: string;
  ctaLink: string;
  bg: string;
  accent: string;
  imgEmoji: string;
  badge?: string;
  createdAt: number;
}

const PRESET_BANNER_BGS = [
  { label: "Navy Space", value: "linear-gradient(135deg, #0e1e38 0%, #1a365d 50%, #0e1e38 100%)", accent: "#F4C430" },
  { label: "Deep Purple", value: "linear-gradient(135deg, #1b0c2a 0%, #351a4f 50%, #1b0c2a 100%)", accent: "#E5A93C" },
  { label: "Olive Forest", value: "linear-gradient(135deg, #181c15 0%, #2e3629 50%, #181c15 100%)", accent: "#C2A649" },
  { label: "Crimson Maroon", value: "linear-gradient(135deg, #2b080c 0%, #4a121a 50%, #2b080c 100%)", accent: "#D4AF37" },
  { label: "Golden Luxe", value: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)", accent: "#D4AF37" }
];

export const BannersScreen = ({
  banners,
  isAdmin
}: {
  banners: Banner[],
  isAdmin: boolean
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form States
  const [tag, setTag] = useState("");
  const [headline, setHeadline] = useState("");
  const [sub, setSub] = useState("");
  const [cta, setCta] = useState("Shop Now");
  const [ctaLink, setCtaLink] = useState("Shirt");
  const [bg, setBg] = useState(PRESET_BANNER_BGS[0].value);
  const [accent, setAccent] = useState(PRESET_BANNER_BGS[0].accent);
  const [imgEmoji, setImgEmoji] = useState("👕");
  const [badge, setBadge] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !tag.trim()) {
      alert("Headline and Tag are required!");
      return;
    }

    try {
      const newBanner = {
        tag: tag.trim(),
        headline: headline.trim(),
        sub: sub.trim(),
        cta: cta.trim() || "Shop Now",
        ctaLink: ctaLink.trim(),
        bg: bg,
        accent: accent,
        imgEmoji: imgEmoji.trim() || "👕",
        badge: badge.trim() || "",
        createdAt: Date.now()
      };

      await addDoc(collection(db, "banners"), newBanner);

      // Reset Form
      setTag("");
      setHeadline("");
      setSub("");
      setCta("Shop Now");
      setCtaLink("Shirt");
      setBg(PRESET_BANNER_BGS[0].value);
      setAccent(PRESET_BANNER_BGS[0].accent);
      setImgEmoji("👕");
      setBadge("");
      setShowAdd(false);
      alert("Promotional banner added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add banner.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    if (!editingBanner.headline.trim() || !editingBanner.tag.trim()) {
      alert("Headline and Tag are required!");
      return;
    }

    try {
      const bannerRef = doc(db, "banners", editingBanner.id);
      await setDoc(bannerRef, {
        tag: editingBanner.tag.trim(),
        headline: editingBanner.headline.trim(),
        sub: editingBanner.sub.trim(),
        cta: editingBanner.cta.trim() || "Shop Now",
        ctaLink: editingBanner.ctaLink.trim(),
        bg: editingBanner.bg,
        accent: editingBanner.accent,
        imgEmoji: editingBanner.imgEmoji.trim() || "👕",
        badge: editingBanner.badge?.trim() || "",
        createdAt: editingBanner.createdAt || Date.now()
      });

      setEditingBanner(null);
      alert("Banner updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update banner.");
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!isAdmin) {
      alert("Only admins/owners can delete banners!");
      return;
    }
    if (window.confirm(`Are you sure you want to delete banner "${label}"?`)) {
      try {
        await deleteDoc(doc(db, "banners", id));
        alert("Banner deleted!");
      } catch (err) {
        console.error(err);
        alert("Failed to delete banner.");
      }
    }
  };

  const startEditing = (banner: Banner) => {
    setEditingBanner({ ...banner });
    setShowAdd(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fade" style={{ padding: "0 0 100px" }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px", margin: 0 }}>Home Banners</h2>
          <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, margin: 0 }}>Design and schedule homepage promotion sliders</p>
        </div>
        {!showAdd && !editingBanner && (
          <button 
            onClick={() => setShowAdd(true)}
            style={{ background: C.dark, color: C.accent, border: `2px solid ${C.accent}`, padding: "10px 18px", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={16} /> Add Banner
          </button>
        )}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ background: C.card, padding: 24, borderRadius: 24, border: `1.5px solid ${C.border}`, marginBottom: 28, boxShadow: "0 8px 30px rgba(0,0,0,0.03)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 className="pf" style={{ fontSize: 16, fontWeight: 800, color: C.dark, margin: 0 }}>Create Homepage Banner</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Tagline Label (e.g. Urban Menswear)</label>
                <input 
                  type="text" 
                  value={tag} 
                  onChange={e => setTag(e.target.value)}
                  placeholder="Urban Menswear, Printed & Casuals..." 
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Headline (Use \n for line break)</label>
                <input 
                  type="text" 
                  value={headline} 
                  onChange={e => setHeadline(e.target.value)}
                  placeholder="Oversized\nT-Shirts" 
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 2" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Subtext / Description</label>
                <textarea 
                  value={sub} 
                  onChange={e => setSub(e.target.value)}
                  placeholder="Gen-Z Approved Drop-Shoulder Tees — Starting at ₹349" 
                  required
                  rows={2}
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark, fontFamily: "sans-serif" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>CTA Button Text</label>
                <input 
                  type="text" 
                  value={cta} 
                  onChange={e => setCta(e.target.value)}
                  placeholder="Shop Now" 
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>CTA Filter Category Link (e.g. T-Shirt, Shirt)</label>
                <input 
                  type="text" 
                  value={ctaLink} 
                  onChange={e => setCtaLink(e.target.value)}
                  placeholder="Shirt, T-Shirt, Jeans..." 
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Banner Graphic (Emoji or Upload Image)</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input 
                    type="text" 
                    value={imgEmoji.startsWith("data:") ? "Custom Image Uploaded" : imgEmoji} 
                    onChange={e => setImgEmoji(e.target.value)}
                    placeholder="👕, 👔, 👖" 
                    disabled={imgEmoji.startsWith("data:")}
                    required
                    style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                  />
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="add-banner-graphic"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setImgEmoji(reader.result as string);
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                  <label 
                    htmlFor="add-banner-graphic"
                    style={{ 
                      padding: "10px 14px", 
                      borderRadius: 10, 
                      border: `1.5px solid ${C.border}`, 
                      background: C.bg, 
                      color: C.dark, 
                      fontSize: 12, 
                      fontWeight: 700, 
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    Upload
                  </label>
                  {imgEmoji.startsWith("data:") && (
                    <button 
                      type="button" 
                      onClick={() => setImgEmoji("👕")}
                      style={{ padding: "10px", borderRadius: 10, border: "none", background: `${C.red}11`, color: C.red, cursor: "pointer", fontWeight: 700 }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Corner Accent Badge (e.g. Trending, Hot Deal)</label>
                <input 
                  type="text" 
                  value={badge} 
                  onChange={e => setBadge(e.target.value)}
                  placeholder="New In, Limited..." 
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Background (CSS Gradient or Upload Image)</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input 
                    type="text" 
                    value={bg.startsWith("data:") ? "Custom Background Uploaded" : bg} 
                    onChange={e => setBg(e.target.value)}
                    placeholder="linear-gradient(...)" 
                    disabled={bg.startsWith("data:")}
                    required
                    style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                  />
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="add-banner-bg"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setBg(reader.result as string);
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                  <label 
                    htmlFor="add-banner-bg"
                    style={{ 
                      padding: "10px 14px", 
                      borderRadius: 10, 
                      border: `1.5px solid ${C.border}`, 
                      background: C.bg, 
                      color: C.dark, 
                      fontSize: 12, 
                      fontWeight: 700, 
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    Upload
                  </label>
                  {bg.startsWith("data:") && (
                    <button 
                      type="button" 
                      onClick={() => setBg(PRESET_BANNER_BGS[0].value)}
                      style={{ padding: "10px", borderRadius: 10, border: "none", background: `${C.red}11`, color: C.red, cursor: "pointer", fontWeight: 700 }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Accent Color HEX (e.g. #F4C430)</label>
                <input 
                  type="text" 
                  value={accent} 
                  onChange={e => setAccent(e.target.value)}
                  placeholder="#F4C430" 
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              
              <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Presets</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {PRESET_BANNER_BGS.map(p => (
                    <button 
                      key={p.label}
                      type="button"
                      onClick={() => { setBg(p.value); setAccent(p.accent); }}
                      style={{ 
                        padding: "8px 12px", 
                        borderRadius: 12, 
                        background: p.value, 
                        color: "#fff", 
                        border: bg === p.value ? `2.5px solid ${C.accent}` : `1px solid ${C.border}`,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "none", color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 10, background: C.dark, color: C.accent, border: `1.5px solid ${C.accent}`, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Save Banner</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Form */}
      <AnimatePresence>
        {editingBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ background: C.card, padding: 24, borderRadius: 24, border: `1.5px solid ${C.accent}`, marginBottom: 28, boxShadow: "0 8px 30px rgba(0,0,0,0.03)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 className="pf" style={{ fontSize: 16, fontWeight: 800, color: C.dark, margin: 0 }}>Edit Homepage Banner</h3>
              <button onClick={() => setEditingBanner(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Tagline Label</label>
                <input 
                  type="text" 
                  value={editingBanner.tag} 
                  onChange={e => setEditingBanner({ ...editingBanner, tag: e.target.value })}
                  placeholder="Urban Menswear..." 
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Headline (Use \n for line break)</label>
                <input 
                  type="text" 
                  value={editingBanner.headline} 
                  onChange={e => setEditingBanner({ ...editingBanner, headline: e.target.value })}
                  placeholder="Oversized\nT-Shirts" 
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 2" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Subtext</label>
                <textarea 
                  value={editingBanner.sub} 
                  onChange={e => setEditingBanner({ ...editingBanner, sub: e.target.value })}
                  placeholder="Description text" 
                  required
                  rows={2}
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark, fontFamily: "sans-serif" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>CTA Button Text</label>
                <input 
                  type="text" 
                  value={editingBanner.cta} 
                  onChange={e => setEditingBanner({ ...editingBanner, cta: e.target.value })}
                  placeholder="Shop Now" 
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>CTA Filter Link</label>
                <input 
                  type="text" 
                  value={editingBanner.ctaLink} 
                  onChange={e => setEditingBanner({ ...editingBanner, ctaLink: e.target.value })}
                  placeholder="Shirt, T-Shirt..." 
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Banner Graphic (Emoji or Upload Image)</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input 
                    type="text" 
                    value={editingBanner.imgEmoji.startsWith("data:") ? "Custom Image Uploaded" : editingBanner.imgEmoji} 
                    onChange={e => setEditingBanner({ ...editingBanner, imgEmoji: e.target.value })}
                    placeholder="👕" 
                    disabled={editingBanner.imgEmoji.startsWith("data:")}
                    required
                    style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                  />
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="edit-banner-graphic"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setEditingBanner({ ...editingBanner, imgEmoji: reader.result as string });
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                  <label 
                    htmlFor="edit-banner-graphic"
                    style={{ 
                      padding: "10px 14px", 
                      borderRadius: 10, 
                      border: `1.5px solid ${C.border}`, 
                      background: C.bg, 
                      color: C.dark, 
                      fontSize: 12, 
                      fontWeight: 700, 
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    Upload
                  </label>
                  {editingBanner.imgEmoji.startsWith("data:") && (
                    <button 
                      type="button" 
                      onClick={() => setEditingBanner({ ...editingBanner, imgEmoji: "👕" })}
                      style={{ padding: "10px", borderRadius: 10, border: "none", background: `${C.red}11`, color: C.red, cursor: "pointer", fontWeight: 700 }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Corner Accent Badge</label>
                <input 
                  type="text" 
                  value={editingBanner.badge || ""} 
                  onChange={e => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                  placeholder="Trending" 
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Background (CSS Gradient or Upload Image)</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input 
                    type="text" 
                    value={editingBanner.bg.startsWith("data:") ? "Custom Background Uploaded" : editingBanner.bg} 
                    onChange={e => setEditingBanner({ ...editingBanner, bg: e.target.value })}
                    placeholder="linear-gradient(...)" 
                    disabled={editingBanner.bg.startsWith("data:")}
                    required
                    style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                  />
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="edit-banner-bg"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setEditingBanner({ ...editingBanner, bg: reader.result as string });
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                  <label 
                    htmlFor="edit-banner-bg"
                    style={{ 
                      padding: "10px 14px", 
                      borderRadius: 10, 
                      border: `1.5px solid ${C.border}`, 
                      background: C.bg, 
                      color: C.dark, 
                      fontSize: 12, 
                      fontWeight: 700, 
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    Upload
                  </label>
                  {editingBanner.bg.startsWith("data:") && (
                    <button 
                      type="button" 
                      onClick={() => setEditingBanner({ ...editingBanner, bg: PRESET_BANNER_BGS[0].value })}
                      style={{ padding: "10px", borderRadius: 10, border: "none", background: `${C.red}11`, color: C.red, cursor: "pointer", fontWeight: 700 }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Accent Color HEX</label>
                <input 
                  type="text" 
                  value={editingBanner.accent} 
                  onChange={e => setEditingBanner({ ...editingBanner, accent: e.target.value })}
                  placeholder="#F4C430" 
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>

              <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Presets</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {PRESET_BANNER_BGS.map(p => (
                    <button 
                      key={p.label}
                      type="button"
                      onClick={() => setEditingBanner({ ...editingBanner, bg: p.value, accent: p.accent })}
                      style={{ 
                        padding: "8px 12px", 
                        borderRadius: 12, 
                        background: p.value, 
                        color: "#fff", 
                        border: editingBanner.bg === p.value ? `2.5px solid ${C.accent}` : `1px solid ${C.border}`,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setEditingBanner(null)} style={{ padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "none", color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 10, background: C.dark, color: C.accent, border: `1.5px solid ${C.accent}`, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Update Banner</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner Preview Grid */}
      {banners.length === 0 ? (
        <div style={{ padding: "80px", textAlign: "center", border: `2px dashed ${C.border}`, borderRadius: 24, background: C.card }}>
          <ImageIcon size={40} color={C.muted} style={{ marginBottom: 12, opacity: 0.6 }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: C.dark, margin: 0 }}>No promotion banners configured</p>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 4, margin: 0 }}>Design slides to display at the top of the customer storefront.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {banners.map((b, idx) => (
            <div 
              key={b.id} 
              style={{ 
                background: C.card, 
                borderRadius: 28, 
                border: `1.5px solid ${C.border}`, 
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
              }}
            >
              {/* Header Info */}
              <div style={{ padding: "14px 24px", background: `${C.bg}40`, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Eye size={14} color={C.muted} />
                  <span style={{ fontSize: 12, color: C.muted, fontWeight: 750 }}>Slide #{idx + 1} Preview</span>
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  <button 
                    onClick={() => startEditing(b)}
                    style={{ border: "none", background: "none", color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 750 }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(b.id, b.tag)}
                    style={{ border: "none", background: "none", color: C.red, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 750 }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>

              {/* Slider Mock Graphic */}
              <div 
                style={{ 
                  background: b.bg.startsWith("data:") || b.bg.startsWith("http") ? `url(${b.bg}) center center / cover no-repeat` : b.bg, 
                  minHeight: 200, 
                  padding: "40px", 
                  position: "relative", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  color: "#fff"
                }}
              >
                {/* Accent glow */}
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 80% 50%, ${b.accent}12 0%, transparent 60%)`, pointerEvents: "none" }} />
                
                <div style={{ zIndex: 2, maxWidth: "60%" }}>
                  {b.badge && (
                    <span style={{ background: b.accent, color: "#111", fontSize: 9, fontWeight: 900, padding: "3px 10px", borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {b.badge}
                    </span>
                  )}
                  <p style={{ color: b.accent, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: b.badge ? "10px 0 6px" : "0 0 6px" }}>{b.tag}</p>
                  <h1 className="pf" style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2, margin: "0 0 10px", whiteSpace: "pre-line" }}>
                    {b.headline}
                  </h1>
                  <p style={{ fontSize: 12, opacity: 0.85, margin: "0 0 20px", fontWeight: 500 }}>{b.sub}</p>
                  <button 
                    type="button" 
                    style={{ background: b.accent, color: "#111", border: "none", padding: "10px 22px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                  >
                    {b.cta}
                  </button>
                </div>

                {/* Emoji float or Uploaded Image */}
                {b.imgEmoji && (b.imgEmoji.startsWith("data:") || b.imgEmoji.startsWith("http")) ? (
                  <div style={{ width: 140, height: 140, marginRight: 20, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={b.imgEmoji} alt={b.headline} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))" }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 96, marginRight: 20, zIndex: 2, filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))" }}>
                    {b.imgEmoji}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
