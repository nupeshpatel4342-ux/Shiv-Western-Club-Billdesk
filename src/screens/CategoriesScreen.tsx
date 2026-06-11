import React, { useState } from "react";
import { C } from "../constants";
import { db } from "../firebase";
import { collection, doc, addDoc, setDoc, deleteDoc } from "firebase/firestore";
import { Tag, Plus, Edit2, Trash2, X, Check, Grid, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Category {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  tag: string;
  bg: string;
  search: string;
  createdAt: number;
}

const PRESET_GRADIENTS = [
  { label: "Warm Sand", value: "linear-gradient(135deg, #FAF8F5 0%, #F3EFE9 100%)", border: "rgba(139,115,85,0.15)" },
  { label: "Ocean Breeze", value: "linear-gradient(135deg, #F5F7FA 0%, #E7ECF3 100%)", border: "rgba(70,130,180,0.15)" },
  { label: "Dusty Rose", value: "linear-gradient(135deg, #FAF5F6 0%, #F5E6E8 100%)", border: "rgba(188,143,143,0.15)" },
  { label: "Mint Glass", value: "linear-gradient(135deg, #F4FBF7 0%, #E6F5EC 100%)", border: "rgba(45,106,79,0.12)" },
  { label: "Royal Blue", value: "linear-gradient(135deg, #1A365D 0%, #0A1F44 100%)", border: "rgba(212,175,55,0.15)" },
  { label: "Amethyst Deep", value: "linear-gradient(135deg, #2A1B40 0%, #170B26 100%)", border: "rgba(229,169,60,0.15)" },
  { label: "Dark Forest", value: "linear-gradient(135deg, #182015 0%, #0A0D08 100%)", border: "rgba(194,166,73,0.15)" }
];

export const CategoriesScreen = ({
  categories,
  isAdmin
}: {
  categories: Category[],
  isAdmin: boolean
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [icon, setIcon] = useState("👕");
  const [tag, setTag] = useState("");
  const [bg, setBg] = useState(PRESET_GRADIENTS[0].value);
  const [border, setBorder] = useState(PRESET_GRADIENTS[0].border);
  const [search, setSearch] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !displayName.trim()) {
      alert("Name and Display Name are required!");
      return;
    }

    try {
      const newCat = {
        name: name.trim(),
        displayName: displayName.trim(),
        icon: icon.trim() || "👕",
        tag: tag.trim() || "",
        bg: bg,
        border: border,
        search: search.trim().toLowerCase() || name.trim().toLowerCase(),
        createdAt: Date.now()
      };

      await addDoc(collection(db, "categories"), newCat);

      // Reset
      setName("");
      setDisplayName("");
      setIcon("👕");
      setTag("");
      setBg(PRESET_GRADIENTS[0].value);
      setBorder(PRESET_GRADIENTS[0].border);
      setSearch("");
      setShowAdd(false);
      alert("Category added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add category.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editingCategory.name.trim() || !editingCategory.displayName.trim()) {
      alert("Name and Display Name are required!");
      return;
    }

    try {
      const catRef = doc(db, "categories", editingCategory.id);
      await setDoc(catRef, {
        name: editingCategory.name.trim(),
        displayName: editingCategory.displayName.trim(),
        icon: editingCategory.icon.trim() || "👕",
        tag: editingCategory.tag.trim() || "",
        bg: editingCategory.bg,
        border: editingCategory.border || "rgba(0,0,0,0.1)",
        search: editingCategory.search.trim().toLowerCase() || editingCategory.name.trim().toLowerCase(),
        createdAt: editingCategory.createdAt || Date.now()
      });

      setEditingCategory(null);
      alert("Category updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update category.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) {
      alert("Only admins/owners can delete categories!");
      return;
    }
    if (window.confirm(`Are you sure you want to delete the category "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "categories", id));
        alert("Category deleted!");
      } catch (err) {
        console.error(err);
        alert("Failed to delete category.");
      }
    }
  };

  const startEditing = (cat: Category) => {
    setEditingCategory({ ...cat });
    setShowAdd(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fade" style={{ padding: "0 0 100px" }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px", margin: 0 }}>Category Spotlight</h2>
          <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, margin: 0 }}>Manage the product categories shown on your shop storefront</p>
        </div>
        {!showAdd && !editingCategory && (
          <button 
            onClick={() => setShowAdd(true)}
            style={{ background: C.dark, color: C.accent, border: `2px solid ${C.accent}`, padding: "10px 18px", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={16} /> Add Category
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
            style={{ background: C.card, padding: 24, borderRadius: 24, border: `1.5px solid ${C.border}`, marginBottom: 24, boxShadow: "0 8px 30px rgba(0,0,0,0.03)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 className="pf" style={{ fontSize: 16, fontWeight: 800, color: C.dark, margin: 0 }}>Add New Category</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Category Slug / Reference (e.g. Shirt)</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Shirt, T-Shirt, Jeans..." 
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Display Name (e.g. Casual Shirts)</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Spotlight Card Label" 
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Front Icon (Emoji or single character)</label>
                <input 
                  type="text" 
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  placeholder="👔, 👕, 👖, etc." 
                  maxLength={5}
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Badge Tag (e.g. Hot Trend, From ₹399)</label>
                <input 
                  type="text" 
                  value={tag}
                  onChange={e => setTag(e.target.value)}
                  placeholder="Sales tagline text" 
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Search Keyword Mapping</label>
                <input 
                  type="text" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filters catalog by: casual, printed, oversized..." 
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Gradients & Borders Presets</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {PRESET_GRADIENTS.map(p => (
                    <button 
                      key={p.label}
                      type="button"
                      onClick={() => { setBg(p.value); setBorder(p.border); }}
                      title={p.label}
                      style={{ 
                        width: 28, 
                        height: 28, 
                        borderRadius: "50%", 
                        background: p.value, 
                        border: bg === p.value ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                        cursor: "pointer"
                      }}
                    />
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "none", color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 10, background: C.dark, color: C.accent, border: `1.5px solid ${C.accent}`, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Save Category</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Form */}
      <AnimatePresence>
        {editingCategory && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ background: C.card, padding: 24, borderRadius: 24, border: `1.5px solid ${C.accent}`, marginBottom: 24, boxShadow: "0 8px 30px rgba(0,0,0,0.03)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 className="pf" style={{ fontSize: 16, fontWeight: 800, color: C.dark, margin: 0 }}>Edit Category: {editingCategory.displayName}</h3>
              <button onClick={() => setEditingCategory(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Category Slug / Reference</label>
                <input 
                  type="text" 
                  value={editingCategory.name}
                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="Shirt, T-Shirt, Jeans..." 
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Display Name</label>
                <input 
                  type="text" 
                  value={editingCategory.displayName}
                  onChange={e => setEditingCategory({ ...editingCategory, displayName: e.target.value })}
                  placeholder="Spotlight Card Label" 
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Front Icon</label>
                <input 
                  type="text" 
                  value={editingCategory.icon}
                  onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                  placeholder="👔, 👕, 👖" 
                  maxLength={5}
                  required
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Badge Tag</label>
                <input 
                  type="text" 
                  value={editingCategory.tag}
                  onChange={e => setEditingCategory({ ...editingCategory, tag: e.target.value })}
                  placeholder="Sales tagline text" 
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Search Keyword Mapping</label>
                <input 
                  type="text" 
                  value={editingCategory.search}
                  onChange={e => setEditingCategory({ ...editingCategory, search: e.target.value })}
                  placeholder="Filters catalog by: casual, printed..." 
                  style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, color: C.dark }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Gradients Presets</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {PRESET_GRADIENTS.map(p => (
                    <button 
                      key={p.label}
                      type="button"
                      onClick={() => setEditingCategory({ ...editingCategory, bg: p.value, border: p.border })}
                      title={p.label}
                      style={{ 
                        width: 28, 
                        height: 28, 
                        borderRadius: "50%", 
                        background: p.value, 
                        border: editingCategory.bg === p.value ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                        cursor: "pointer"
                      }}
                    />
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setEditingCategory(null)} style={{ padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "none", color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 10, background: C.dark, color: C.accent, border: `1.5px solid ${C.accent}`, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Update Category</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid List */}
      {categories.length === 0 ? (
        <div style={{ padding: "80px", textAlign: "center", border: `2px dashed ${C.border}`, borderRadius: 24, background: C.card }}>
          <Tag size={40} color={C.muted} style={{ marginBottom: 12, opacity: 0.6 }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: C.dark, margin: 0 }}>No categories configured</p>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 4, margin: 0 }}>Set up spotlight categories to show on the storefront.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {categories.map(cat => (
            <div 
              key={cat.id}
              style={{
                background: C.card,
                borderRadius: 24,
                border: `1.5px solid ${C.border}`,
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Frontend Card Preview */}
              <div 
                style={{ 
                  background: cat.bg, 
                  padding: "32px 20px", 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: 10,
                  position: "relative",
                  borderBottom: `1px solid ${C.border}`
                }}
              >
                {cat.tag && (
                  <span style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.75)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 100, textTransform: "uppercase" }}>
                    {cat.tag}
                  </span>
                )}
                <span style={{ fontSize: 36, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.05))" }}>{cat.icon}</span>
                <div style={{ textAlign: "center" }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: cat.bg.includes("#0e1e38") || cat.bg.includes("#2A1B40") || cat.bg.includes("#182015") ? "#ffffff" : "#111111", textTransform: "uppercase", letterSpacing: "0.5px" }}>{cat.displayName}</span>
                  <span style={{ display: "block", fontSize: 9, color: cat.bg.includes("#0e1e38") || cat.bg.includes("#2A1B40") || cat.bg.includes("#182015") ? "rgba(255,255,255,0.7)" : "#777777", textTransform: "uppercase", fontWeight: 700, marginTop: 2 }}>{cat.name} filter</span>
                </div>
              </div>

              {/* Information & Action buttons */}
              <div style={{ padding: "16px 20px", background: `${C.bg}40`, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: C.muted, margin: "0 0 4px", fontWeight: 600 }}>Keywords: <strong style={{ color: C.dark }}>{cat.search}</strong></p>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                  <button 
                    onClick={() => startEditing(cat)}
                    style={{ border: "none", background: "none", color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 750 }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id, cat.displayName)}
                    style={{ border: "none", background: "none", color: C.red, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 750 }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
