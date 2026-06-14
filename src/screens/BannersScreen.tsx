import React, { useState } from "react";
import { C } from "../constants";
import { db } from "../firebase";
import { collection, doc, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { Image as ImageIcon, Plus, Trash2, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Banner {
  id: string;
  name?: string;
  desktopImageUrl?: string;
  mobileImageUrl?: string;
  imageUrl?: string; // Legacy fallback
  isActive?: boolean;
  ctaLink?: string;
  createdAt: number;
  headline?: string;
  tag?: string;
}


export const BannersScreen = ({
  banners,
  isAdmin
}: {
  banners: Banner[];
  isAdmin: boolean;
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [name, setName] = useState("");
  const [desktopImageUrl, setDesktopImageUrl] = useState("");
  const [mobileImageUrl, setMobileImageUrl] = useState("");
  const [ctaLink, setCtaLink] = useState("Shirt");
  const [isActive, setIsActive] = useState(true);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "desktop" | "mobile") => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 1.5 * 1024 * 1024) {
        alert("Image size must be less than 1.5MB for upload.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (type === "desktop") {
          setDesktopImageUrl(reader.result as string);
        } else {
          setMobileImageUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Banner name/title is required!");
      return;
    }
    if (!desktopImageUrl && !mobileImageUrl) {
      alert("Please upload at least one banner image (Desktop or Mobile)!");
      return;
    }

    setIsSubmitting(true);
    try {
      // If only one aspect ratio is uploaded, copy it to the other to guarantee image coverage
      const finalDesktop = desktopImageUrl || mobileImageUrl;
      const finalMobile = mobileImageUrl || desktopImageUrl;

      const newBanner = {
        name: name.trim(),
        desktopImageUrl: finalDesktop,
        mobileImageUrl: finalMobile,
        ctaLink: ctaLink.trim(),
        isActive: isActive,
        createdAt: Date.now()
      };

      await addDoc(collection(db, "banners"), newBanner);

      // Reset Form
      setName("");
      setDesktopImageUrl("");
      setMobileImageUrl("");
      setCtaLink("Shirt");
      setIsActive(true);
      setShowAdd(false);
      alert("Responsive promotional banner added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add banner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const docRef = doc(db, "banners", id);
      await updateDoc(docRef, { isActive: !currentStatus });
    } catch (err) {
      console.error("Failed to toggle status:", err);
      alert("Failed to update status.");
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
        alert("Banner deleted successfully!");
      } catch (err) {
        console.error(err);
        alert("Failed to delete banner.");
      }
    }
  };

  return (
    <div className="fade" style={{ padding: "0 0 100px" }}>
      {/* Header section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 className="pf" style={{ fontSize: 26, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px", margin: 0 }}>Promotional Banners</h2>
          <p style={{ fontSize: 13, color: C.muted, fontWeight: 500, margin: "4px 0 0" }}>Manage responsive D2C storefront banners for desktop & mobile viewports</p>
        </div>
        {!showAdd && (
          <button 
            onClick={() => setShowAdd(true)}
            style={{ 
              background: C.dark, 
              color: C.accent, 
              border: `2px solid ${C.accent}`, 
              padding: "10px 18px", 
              borderRadius: 12, 
              fontSize: 13, 
              fontWeight: 800, 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: 6,
              boxShadow: "0 4px 14px rgba(0,0,0,0.05)"
            }}
          >
            <Plus size={16} /> Add Banner
          </button>
        )}
      </div>

      {/* Add Banner Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ 
              background: C.card, 
              padding: 28, 
              borderRadius: 24, 
              border: `1.5px solid ${C.border}`, 
              marginBottom: 32, 
              boxShadow: "0 10px 30px rgba(0,0,0,0.04)" 
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 className="pf" style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>Upload Responsive Promotional Banners</h3>
              <button 
                type="button" 
                onClick={() => setShowAdd(false)} 
                style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Campaign Name / Label</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Summer Vacation Banner" 
                    required
                    style={{ 
                      padding: "12px 14px", 
                      borderRadius: 12, 
                      border: `1.5px solid ${C.border}`, 
                      fontSize: 14, 
                      color: C.dark,
                      background: "#F9FAFB" 
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Target Category Filter Link</label>
                  <select
                    value={ctaLink}
                    onChange={e => setCtaLink(e.target.value)}
                    style={{ 
                      padding: "12px 14px", 
                      borderRadius: 12, 
                      border: `1.5px solid ${C.border}`, 
                      fontSize: 14, 
                      color: C.dark,
                      background: "#F9FAFB",
                      cursor: "pointer"
                    }}
                  >
                    <option value="Shirt">Casual Shirts</option>
                    <option value="T-Shirt">Printed T-Shirts</option>
                    <option value="Trouser">Formal Trousers</option>
                    <option value="Jeans">Denims</option>
                    <option value="Winterwear">Winter Wear</option>
                    <option value="All">All Products</option>
                  </select>
                </div>
              </div>

              {/* Upload sections */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Desktop Upload */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Desktop Banner Image (1200 x 400 pixels — 3:1)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="desktop-image-file"
                    onChange={(e) => handleImageUpload(e, "desktop")}
                    style={{ display: "none" }}
                  />
                  <label 
                    htmlFor="desktop-image-file"
                    style={{ 
                      border: `2px dashed ${desktopImageUrl ? C.accent : C.border}`, 
                      borderRadius: 16, 
                      padding: "24px 16px", 
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      cursor: "pointer",
                      background: "#F9FAFB",
                      transition: "all 0.2s"
                    }}
                  >
                    <ImageIcon size={28} color={C.muted} style={{ marginBottom: 8 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>Upload Desktop Image</span>
                    <span style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Aspect ratio 3:1 (1200x400)</span>
                  </label>

                  {desktopImageUrl && (
                    <div style={{ position: "relative", width: "100%", height: 90, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, marginTop: 8 }}>
                      <img src={desktopImageUrl} alt="Desktop Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button 
                        type="button" 
                        onClick={() => setDesktopImageUrl("")}
                        style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#FFF", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Upload */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Mobile Banner Image (1080 x 1080 pixels — 1:1)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="mobile-image-file"
                    onChange={(e) => handleImageUpload(e, "mobile")}
                    style={{ display: "none" }}
                  />
                  <label 
                    htmlFor="mobile-image-file"
                    style={{ 
                      border: `2px dashed ${mobileImageUrl ? C.accent : C.border}`, 
                      borderRadius: 16, 
                      padding: "24px 16px", 
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      cursor: "pointer",
                      background: "#F9FAFB",
                      transition: "all 0.2s"
                    }}
                  >
                    <ImageIcon size={28} color={C.muted} style={{ marginBottom: 8 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>Upload Mobile Image</span>
                    <span style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Aspect ratio 1:1 (1080x1080)</span>
                  </label>

                  {mobileImageUrl && (
                    <div style={{ position: "relative", width: 90, height: 90, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, marginTop: 8 }}>
                      <img src={mobileImageUrl} alt="Mobile Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button 
                        type="button" 
                        onClick={() => setMobileImageUrl("")}
                        style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#FFF", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Switch & Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                  <input 
                    type="checkbox" 
                    checked={isActive} 
                    onChange={e => setIsActive(e.target.checked)}
                    style={{ 
                      width: 18, 
                      height: 18, 
                      accentColor: C.green,
                      cursor: "pointer" 
                    }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>Set Banner as Active immediately</span>
                </label>

                <div style={{ display: "flex", gap: 12 }}>
                  <button 
                    type="button" 
                    onClick={() => setShowAdd(false)} 
                    style={{ 
                      padding: "10px 18px", 
                      borderRadius: 12, 
                      border: `1.5px solid ${C.border}`, 
                      background: "none", 
                      color: C.muted, 
                      fontSize: 13, 
                      fontWeight: 700, 
                      cursor: "pointer" 
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    style={{ 
                      padding: "10px 24px", 
                      borderRadius: 12, 
                      background: C.dark, 
                      color: C.accent, 
                      border: `1.5px solid ${C.accent}`, 
                      fontSize: 13, 
                      fontWeight: 800, 
                      cursor: "pointer",
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                  >
                    {isSubmitting ? "Uploading..." : "Save Banner"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banners Control Table */}
      <div style={{ background: C.card, borderRadius: 24, border: `1.5px solid ${C.border}`, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, background: "#F9FAFB" }}>
          <h3 className="pf" style={{ fontSize: 15, fontWeight: 800, color: C.dark, margin: 0 }}>Banner Management Directory</h3>
        </div>

        {banners.length === 0 ? (
          <div style={{ padding: "80px 40px", textAlign: "center" }}>
            <ImageIcon size={48} color={C.muted} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: 0 }}>No Banners Configured</p>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 6, margin: 0 }}>Create responsive storefront promotional banners above.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${C.border}`, background: "#FAFBFD" }}>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Responsive Previews</th>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Banner Info</th>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Category Link</th>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((b) => (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.2s" }} className="hover:bg-gray-50/50">
                    {/* Preview Column */}
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        {/* Desktop Image */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 8, fontWeight: 850, color: C.muted, letterSpacing: "0.2px" }}>DESKTOP (3:1)</span>
                          <div style={{ width: 110, height: 37, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}`, background: "#f3f4f6" }}>
                            {b.desktopImageUrl || b.imageUrl ? (
                              <img src={b.desktopImageUrl || b.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 9, color: C.muted }}>No Image</div>
                            )}
                          </div>
                        </div>

                        {/* Mobile Image */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 8, fontWeight: 850, color: C.muted, letterSpacing: "0.2px" }}>MOBILE (1:1)</span>
                          <div style={{ width: 37, height: 37, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}`, background: "#f3f4f6" }}>
                            {b.mobileImageUrl || b.imageUrl ? (
                              <img src={b.mobileImageUrl || b.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 9, color: C.muted }}>No Image</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Banner Info Column */}
                    <td style={{ padding: "16px 24px" }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: 0 }}>
                        {b.name || (b.headline ? b.headline.replace(/\n/g, " ") : "Untitled Campaign")}
                      </p>
                      <p style={{ fontSize: 11, color: C.muted, margin: "4px 0 0" }}>
                        Added {new Date(b.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </td>

                    {/* Category Link Column */}
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 700, 
                        color: C.dark,
                        background: "#F3F4F6", 
                        padding: "4px 10px", 
                        borderRadius: 100 
                      }}>
                        {b.ctaLink || "None"}
                      </span>
                    </td>

                    {/* Toggle Switch Status Column */}
                    <td style={{ padding: "16px 24px" }}>
                      <button
                        onClick={() => handleToggleActive(b.id, b.isActive !== false)}
                        style={{
                          background: b.isActive !== false ? C.greenLight : "#FEF2F2",
                          color: b.isActive !== false ? C.green : C.red,
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <span style={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: "50%", 
                          background: b.isActive !== false ? C.green : C.red 
                        }} />
                        {b.isActive !== false ? "Active" : "Inactive"}
                      </button>
                    </td>

                    {/* Delete Action Column */}
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <button
                        onClick={() => handleDelete(b.id, b.name || b.tag || "this banner")}
                        style={{
                          background: "none",
                          border: "none",
                          color: C.red,
                          cursor: "pointer",
                          padding: 8,
                          borderRadius: 8,
                          transition: "background 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                        title="Delete Banner"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Alert guidelines */}
      <div style={{ marginTop: 24, display: "flex", gap: 10, background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 16, padding: "16px 20px", color: "#1E40AF" }}>
        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>Responsive Poster Guideline</h4>
          <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: 1.5, opacity: 0.9 }}>
            Upload both a wide desktop graphic (1200x400, 3:1) and a square mobile graphic (1080x1080, 1:1) for optimal display. The store will automatically present the appropriate version based on the visitor's screen.
          </p>
        </div>
      </div>
    </div>
  );
};
