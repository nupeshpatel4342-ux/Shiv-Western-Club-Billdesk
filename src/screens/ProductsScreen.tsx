import React, { useState } from "react";
import { C } from "../constants";
import { CatalogProduct, Settings } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, doc, addDoc, setDoc, deleteDoc } from "firebase/firestore";
import { Pill } from "../components/Layout";
import { ShoppingBag, Plus, Search, Trash2, Edit2, Check, X, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const ProductsScreen = ({ 
  products, 
  settings,
  isAdmin 
}: { 
  products: CatalogProduct[], 
  settings: Settings,
  isAdmin: boolean 
}) => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");

  const filtered = products.filter(p => {
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s);
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      alert("Product name and price are required!");
      return;
    }

    try {
      const newProduct = {
        name: name.trim(),
        sku: sku.trim() || `SWC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        price: Number(price),
        createdAt: Date.now()
      };

      const docRef = await addDoc(collection(db, "products"), newProduct);
      // Reset form
      setName("");
      setSku("");
      setPrice("");
      setShowAdd(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "products");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.name.trim() || !editingProduct.price) {
      alert("Product name and price are required!");
      return;
    }

    try {
      const productRef = doc(db, "products", editingProduct.id);
      await setDoc(productRef, {
        name: editingProduct.name.trim(),
        sku: editingProduct.sku.trim(),
        price: Number(editingProduct.price),
        createdAt: editingProduct.createdAt || Date.now()
      });
      setEditingProduct(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${editingProduct.id}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) {
      alert("Only admins can delete products!");
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${name}" from catalog?`)) {
      try {
        await deleteDoc(doc(db, "products", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      }
    }
  };

  return (
    <div className="fade" style={{ padding: "20px 18px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={24} color={C.accent} />
          </div>
          <div>
            <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px", margin: 0 }}>Product Catalog</h2>
            <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, margin: 0 }}>Manage shop items & prices</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)} 
          style={{ 
            background: showAdd ? C.accent : C.dark, 
            color: showAdd ? C.dark : C.accent, 
            padding: "8px 16px", 
            borderRadius: 12, 
            fontSize: 12, 
            fontWeight: 800, 
            border: "none", 
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s"
          }}
        >
          {showAdd ? <><X size={16} /> Close</> : <><Plus size={16} /> Add Product</>}
        </button>
      </div>

      {/* Add / Edit Form Panel */}
      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginBottom: 24 }}
          >
            <form onSubmit={handleAdd} style={{ background: C.card, borderRadius: 20, padding: 20, border: `1.5px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
              <h3 className="pf" style={{ fontSize: 16, fontWeight: 850, color: C.dark, marginBottom: 16 }}>Add New Product</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Product Name *</label>
                  <input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. Designer Denim Jacket" 
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 14, fontWeight: 600, color: C.dark }}
                  />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Price (₹) *</label>
                    <input 
                      type="number" 
                      value={price} 
                      onChange={e => setPrice(e.target.value)} 
                      placeholder="1200" 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 14, fontWeight: 750, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>SKU Code (Optional)</label>
                    <input 
                      value={sku} 
                      onChange={e => setSku(e.target.value)} 
                      placeholder="e.g. SWC-JKT-01" 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 14, fontWeight: 600, color: C.dark }}
                    />
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                style={{ width: "100%", background: C.dark, color: C.accent, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 800, border: `1.5px solid ${C.accent}`, cursor: "pointer" }}
              >
                SAVE TO CATALOG ＋
              </button>
            </form>
          </motion.div>
        )}

        {editingProduct && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginBottom: 24 }}
          >
            <form onSubmit={handleUpdate} style={{ background: C.card, borderRadius: 20, padding: 20, border: `1.5px solid ${C.accent}`, boxShadow: "0 4px 12px rgba(212,175,55,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 className="pf" style={{ fontSize: 16, fontWeight: 850, color: C.dark, margin: 0 }}>Edit Product</h3>
                <button type="button" onClick={() => setEditingProduct(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><X size={18} /></button>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Product Name *</label>
                  <input 
                    value={editingProduct.name} 
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} 
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 14, fontWeight: 600, color: C.dark }}
                  />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Price (₹) *</label>
                    <input 
                      type="number" 
                      value={editingProduct.price} 
                      onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 14, fontWeight: 750, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>SKU Code</label>
                    <input 
                      value={editingProduct.sku} 
                      onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })} 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 14, fontWeight: 600, color: C.dark }}
                    />
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                style={{ width: "100%", background: C.dark, color: C.accent, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 800, border: `1.5px solid ${C.accent}`, cursor: "pointer" }}
              >
                UPDATE PRODUCT ✓
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div style={{ background: C.card, borderRadius: 18, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, border: `1.5px solid ${C.border}`, marginBottom: 20, boxShadow: "0 4px 12px rgba(10, 31, 68, 0.02)" }}>
        <Search size={18} color={C.muted} />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search by product name or SKU..." 
          style={{ flex: 1, fontSize: 14, color: C.dark, border: "none", outline: "none", background: "transparent", fontWeight: 600 }} 
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ background: C.bg, border: "none", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}>✕</button>
        )}
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", border: `2px dashed ${C.border}`, borderRadius: 20 }}>
          <ShoppingBag size={48} color={C.muted} style={{ marginBottom: 12 }} />
          <p className="pf" style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>No products found</p>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Add products to get started with quick billing.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map(p => (
            <motion.div 
              key={p.id}
              layout
              style={{ background: C.card, borderRadius: 18, padding: 18, border: `1.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}
            >
              <div style={{ minWidth: 0, flex: 1, marginRight: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Tag size={12} color={C.accent} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "0.5px" }}>{p.sku}</span>
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: C.dark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h4>
                <p className="pf" style={{ fontSize: 18, fontWeight: 900, color: C.green, marginTop: 8, marginBottom: 0 }}>₹{p.price.toLocaleString("en-IN")}</p>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button 
                  onClick={() => { setEditingProduct(p); setShowAdd(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  style={{ width: 32, height: 32, borderRadius: 8, background: C.bg, border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: C.dark, cursor: "pointer" }}
                  title="Edit Product"
                >
                  <Edit2 size={14} />
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(p.id, p.name)}
                    style={{ width: 32, height: 32, borderRadius: 8, background: "#FFF0F0", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: C.red, cursor: "pointer" }}
                    title="Delete Product"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
