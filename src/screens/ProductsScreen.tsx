import React, { useState } from "react";
import { C } from "../constants";
import { CatalogProduct, Settings } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, doc, addDoc, setDoc, deleteDoc } from "firebase/firestore";
import { Pill } from "../components/Layout";
import { ShoppingBag, Plus, Search, Trash2, Edit2, Check, X, Tag, Barcode, DollarSign, Image } from "lucide-react";
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
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form states (Add Product)
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState(""); // mapped to selling price for billing compatibility
  const [purchasePrice, setPurchasePrice] = useState("");
  const [category, setCategory] = useState("Shirt");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [barcode, setBarcode] = useState("");
  const [stock, setStock] = useState("10");
  const [image, setImage] = useState("");
  
  // Sizes selection
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["M", "L", "XL"]);
  const availableSizes = ["S", "M", "L", "XL", "XXL", "Free Size"];

  const categories = ["Shirt", "T-Shirt", "Jeans", "Kurta", "Saree", "Ladies Wear", "Western Wear"];

  const filtered = products.filter(p => {
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return p.name.toLowerCase().includes(s) || 
           (p.sku && p.sku.toLowerCase().includes(s)) ||
           ((p as any).brand && (p as any).brand.toLowerCase().includes(s));
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        if (isEdit && editingProduct) {
          setEditingProduct({ ...editingProduct, image: reader.result as string });
        } else {
          setImage(reader.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const toggleSize = (size: string, isEdit = false) => {
    if (isEdit && editingProduct) {
      const currentSizes = editingProduct.size ? editingProduct.size.split(",").map((s: string) => s.trim()) : [];
      const updatedSizes = currentSizes.includes(size)
        ? currentSizes.filter((s: string) => s !== size)
        : [...currentSizes, size];
      setEditingProduct({ ...editingProduct, size: updatedSizes.join(", ") });
    } else {
      setSelectedSizes(prev => 
        prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
      );
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      alert("Product name and selling price are required!");
      return;
    }

    try {
      const sellPriceNum = Number(price);
      const newProduct = {
        name: name.trim(),
        sku: sku.trim() || `SWC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        price: sellPriceNum, // Keep for billing compatibility
        sellingPrice: sellPriceNum,
        purchasePrice: purchasePrice ? Number(purchasePrice) : sellPriceNum * 0.6, // default 60% CP
        category: category,
        brand: brand.trim() || "Shiv Western",
        color: color.trim() || "Multi",
        size: selectedSizes.join(", "),
        barcode: barcode.trim() || `BAR-${Math.random().toString().substr(2, 8)}`,
        stock: stock ? Number(stock) : 0,
        image: image || "",
        createdAt: Date.now()
      };

      await addDoc(collection(db, "products"), newProduct);
      
      // Reset form
      setName("");
      setSku("");
      setPrice("");
      setPurchasePrice("");
      setCategory("Shirt");
      setBrand("");
      setColor("");
      setBarcode("");
      setStock("10");
      setImage("");
      setSelectedSizes(["M", "L", "XL"]);
      setShowAdd(false);
      alert("Product added to catalog successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "products");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.name.trim() || !editingProduct.price) {
      alert("Product name and selling price are required!");
      return;
    }

    try {
      const sellPriceNum = Number(editingProduct.price);
      const productRef = doc(db, "products", editingProduct.id);
      
      const updatedProduct = {
        name: editingProduct.name.trim(),
        sku: editingProduct.sku.trim(),
        price: sellPriceNum,
        sellingPrice: sellPriceNum,
        purchasePrice: editingProduct.purchasePrice ? Number(editingProduct.purchasePrice) : sellPriceNum * 0.6,
        category: editingProduct.category,
        brand: editingProduct.brand?.trim() || "Shiv Western",
        color: editingProduct.color?.trim() || "Multi",
        size: editingProduct.size || "",
        barcode: editingProduct.barcode?.trim() || "",
        stock: editingProduct.stock !== undefined ? Number(editingProduct.stock) : 0,
        image: editingProduct.image || "",
        createdAt: editingProduct.createdAt || Date.now()
      };

      await setDoc(productRef, updatedProduct);
      setEditingProduct(null);
      alert("Product updated successfully!");
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

  const startEditing = (p: any) => {
    setEditingProduct({
      id: p.id,
      name: p.name,
      sku: p.sku || "",
      price: p.price || p.sellingPrice || 0,
      sellingPrice: p.sellingPrice || p.price || 0,
      purchasePrice: p.purchasePrice || (p.price || 0) * 0.6,
      category: p.category || "Shirt",
      brand: p.brand || "",
      color: p.color || "",
      size: p.size || "",
      barcode: p.barcode || "",
      stock: p.stock !== undefined ? p.stock : 0,
      image: p.image || "",
      createdAt: p.createdAt
    });
    setShowAdd(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fade" style={{ padding: "0 0 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={24} color={C.accent} />
          </div>
          <div>
            <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px", margin: 0 }}>Product Catalog</h2>
            <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, margin: 0 }}>Manage premium clothing products and pricing</p>
          </div>
        </div>
        <button 
          onClick={() => { setShowAdd(!showAdd); setEditingProduct(null); }} 
          style={{ 
            background: showAdd ? C.accent : C.dark, 
            color: showAdd ? C.dark : C.accent, 
            padding: "10px 18px", 
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
            <form onSubmit={handleAdd} style={{ background: C.card, borderRadius: 24, padding: 24, border: `1.5px solid ${C.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.02)" }}>
              <h3 className="pf" style={{ fontSize: 17, fontWeight: 950, color: C.dark, marginBottom: 20 }}>Add New Clothing Item</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Product Name *</label>
                    <input 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="e.g. Premium Cotton Kurta" 
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 600, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Category *</label>
                    <select 
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 600, color: C.dark }}
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Brand Name</label>
                    <input 
                      value={brand} 
                      onChange={e => setBrand(e.target.value)} 
                      placeholder="e.g. Shiv Western" 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 600, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>SKU Code (Auto-generates if blank)</label>
                    <input 
                      value={sku} 
                      onChange={e => setSku(e.target.value)} 
                      placeholder="e.g. SWC-KRT-01" 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 600, color: C.dark }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Purchase Price (₹)</label>
                    <input 
                      type="number"
                      value={purchasePrice} 
                      onChange={e => setPurchasePrice(e.target.value)} 
                      placeholder="e.g. 500" 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 700, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Selling Price (₹) *</label>
                    <input 
                      type="number"
                      value={price} 
                      onChange={e => setPrice(e.target.value)} 
                      placeholder="e.g. 999" 
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 800, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Initial Stock Qty</label>
                    <input 
                      type="number"
                      value={stock} 
                      onChange={e => setStock(e.target.value)} 
                      placeholder="10" 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 700, color: C.dark }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Color</label>
                    <input 
                      value={color} 
                      onChange={e => setColor(e.target.value)} 
                      placeholder="e.g. Black, Navy, White" 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Barcode Number</label>
                    <input 
                      value={barcode} 
                      onChange={e => setBarcode(e.target.value)} 
                      placeholder="e.g. 8901234567" 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.dark }}
                    />
                  </div>
                </div>

                {/* Size selections checkboxes */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 8 }}>Available Sizes</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {availableSizes.map(sz => {
                      const active = selectedSizes.includes(sz);
                      return (
                        <button 
                          type="button" 
                          key={sz} 
                          onClick={() => toggleSize(sz)}
                          style={{ padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${active ? C.dark : C.border}`, background: active ? C.dark : "transparent", color: active ? C.accent : C.muted, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product Image upload */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Product Image</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => handleFileChange(e)}
                      style={{ fontSize: 12, color: C.muted }}
                    />
                    {image && (
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
                        <img src={image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Preview" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                style={{ width: "100%", background: C.dark, color: C.accent, padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 800, border: `1.5px solid ${C.accent}`, cursor: "pointer" }}
              >
                ADD PRODUCT TO CATALOG ＋
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
            <form onSubmit={handleUpdate} style={{ background: C.card, borderRadius: 24, padding: 24, border: `1.5px solid ${C.accent}`, boxShadow: "0 8px 24px rgba(212,175,55,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 className="pf" style={{ fontSize: 17, fontWeight: 950, color: C.dark, margin: 0 }}>Edit Clothing Product</h3>
                <button type="button" onClick={() => setEditingProduct(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><X size={18} /></button>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Product Name *</label>
                    <input 
                      value={editingProduct.name} 
                      onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} 
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 600, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Category *</label>
                    <select 
                      value={editingProduct.category}
                      onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 600, color: C.dark }}
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Brand Name</label>
                    <input 
                      value={editingProduct.brand} 
                      onChange={e => setEditingProduct({ ...editingProduct, brand: e.target.value })} 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 600, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>SKU Code</label>
                    <input 
                      value={editingProduct.sku} 
                      onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })} 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 600, color: C.dark }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Purchase Price (₹)</label>
                    <input 
                      type="number"
                      value={editingProduct.purchasePrice} 
                      onChange={e => setEditingProduct({ ...editingProduct, purchasePrice: e.target.value })} 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 700, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Selling Price (₹) *</label>
                    <input 
                      type="number"
                      value={editingProduct.price} 
                      onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} 
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 800, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Stock Quantity</label>
                    <input 
                      type="number"
                      value={editingProduct.stock} 
                      onChange={e => setEditingProduct({ ...editingProduct, stock: e.target.value })} 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 700, color: C.dark }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Color</label>
                    <input 
                      value={editingProduct.color} 
                      onChange={e => setEditingProduct({ ...editingProduct, color: e.target.value })} 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Barcode Number</label>
                    <input 
                      value={editingProduct.barcode} 
                      onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })} 
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.dark }}
                    />
                  </div>
                </div>

                {/* Edit sizes selection */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 8 }}>Available Sizes</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {availableSizes.map(sz => {
                      const sizesArray = editingProduct.size ? editingProduct.size.split(",").map((s: string) => s.trim()) : [];
                      const active = sizesArray.includes(sz);
                      return (
                        <button 
                          type="button" 
                          key={sz} 
                          onClick={() => toggleSize(sz, true)}
                          style={{ padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${active ? C.dark : C.border}`, background: active ? C.dark : "transparent", color: active ? C.accent : C.muted, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Edit image selection */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Product Image</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => handleFileChange(e, true)}
                      style={{ fontSize: 12, color: C.muted }}
                    />
                    {editingProduct.image && (
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
                        <img src={editingProduct.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Preview" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                style={{ width: "100%", background: C.dark, color: C.accent, padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 800, border: `1.5px solid ${C.accent}`, cursor: "pointer" }}
              >
                UPDATE PRODUCT DETAILS ✓
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
          placeholder="Search catalog by name, brand, SKU or category..." 
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
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Add products to populate the customer catalog and enable quick counter billing.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map(p => {
            const stockVal = p.stock !== undefined ? (p as any).stock : 0;
            const isLow = stockVal < 5;
            return (
              <motion.div 
                key={p.id}
                layout
                style={{ background: C.card, borderRadius: 18, padding: 18, border: `1.5px solid ${C.border}`, display: "flex", gap: 14, boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}
              >
                <div style={{ width: 80, height: 80, borderRadius: 10, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `1px solid ${C.border}`, flexShrink: 0 }}>
                  {(p as any).image ? (
                    <img src={(p as any).image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={p.name} />
                  ) : (
                    <ShoppingBag size={32} color={C.muted} />
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: C.accent, letterSpacing: "0.5px" }}>{(p as any).brand || "Shiv Western"}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: C.muted }}>SKU: {p.sku}</span>
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h4>
                    <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>Category: {(p as any).category || "General"} | Size: {p.size || "M, L"}</p>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 }}>
                    <div>
                      <p className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.green, margin: 0 }}>₹{p.price.toLocaleString("en-IN")}</p>
                      <p style={{ fontSize: 9, color: C.muted, margin: "2px 0 0" }}>CP: ₹{((p as any).purchasePrice || 0).toLocaleString()}</p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: isLow ? C.red : C.muted }}>
                        Stock: {stockVal}
                      </span>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button 
                          onClick={() => startEditing(p)}
                          style={{ width: 28, height: 28, borderRadius: 6, background: C.bg, border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: C.dark, cursor: "pointer" }}
                          title="Edit Product"
                        >
                          <Edit2 size={12} />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(p.id, p.name)}
                            style={{ width: 28, height: 28, borderRadius: 6, background: "#FFF0F0", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: C.red, cursor: "pointer" }}
                            title="Delete Product"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
