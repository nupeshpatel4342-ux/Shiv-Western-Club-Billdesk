import React, { useState } from "react";
import { C } from "../constants";
import { CatalogProduct, Settings } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, doc, addDoc, setDoc, deleteDoc } from "firebase/firestore";
import { Pill } from "../components/Layout";
import { ShoppingBag, Plus, Search, Trash2, Edit2, Check, X, Tag, Barcode, DollarSign, Image, FileText, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const getColorObject = (color: any) => {
  if (typeof color === "string") {
    const clean = color.trim().toLowerCase();
    const map: Record<string, string> = {
      "navy blue": "#1A365D",
      "indigo blue": "#1B3A4B",
      "olive green": "#4A5D4E",
      "charcoal black": "#1A1A1A",
      "black": "#000000",
      "white": "#FFFFFF",
      "ivory white": "#F5F5F0",
      "red": "#9B2226",
      "blue": "#3B82F6",
      "green": "#10B981",
      "gray": "#6B7280",
      "grey": "#6B7280",
      "beige": "#F5F5DC",
      "brown": "#78350F",
      "khaki": "#C3B091",
      "mustard": "#E1AD01",
      "maroon": "#800000"
    };
    return {
      name: color,
      hex: map[clean] || "#9CA3AF"
    };
  }
  return color;
};

export const ProductsScreen = ({ 
  products, 
  categories: syncedCategories = [],
  settings,
  isAdmin 
}: { 
  products: CatalogProduct[], 
  categories?: any[],
  settings: Settings,
  isAdmin: boolean 
}) => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form states (Add Product)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [price, setPrice] = useState(""); // Discounted Price
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Shirt");
  const [brand, setBrand] = useState("Shiv Western");
  const [color, setColor] = useState("Multi");
  const [barcode, setBarcode] = useState("");
  const [stock, setStock] = useState("10");
  const [image, setImage] = useState("");
  
  // Custom multi-variant states
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [colorVariants, setColorVariants] = useState<{ name: string, hex: string, image_index: number }[]>([]);
  const [outOfStockSizes, setOutOfStockSizes] = useState<string[]>([]);

  // Temp input states for color variants
  const [tempColorName, setTempColorName] = useState("");
  const [tempColorHex, setTempColorHex] = useState("#000000");
  const [tempColorImageIdx, setTempColorImageIdx] = useState<number>(0);
  
  // Sizes selection
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["S", "M", "L", "XL", "XXL"]);
  const availableSizes = ["S", "M", "L", "XL", "XXL", "Free Size"];

  const categories = syncedCategories && syncedCategories.length > 0
    ? Array.from(new Set(syncedCategories.map((c: any) => c.name)))
    : ["Shirt", "T-Shirt", "Jeans", "Trouser", "Winterwear", "Kurta", "Saree", "Ladies Wear", "Western Wear"];

  const filtered = products.filter(p => {
    const s = search.toLowerCase().trim();
    if (!s) return true;
    return p.name.toLowerCase().includes(s) || 
           (p.sku && p.sku.toLowerCase().includes(s)) ||
           ((p as any).category && (p as any).category.toLowerCase().includes(s));
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
      alert("Product Title and Discounted Price are required!");
      return;
    }

    try {
      const sellPriceNum = Number(price);
      const originalPriceNum = basePrice ? Number(basePrice) : sellPriceNum;

      const newProduct = {
        name: name.trim(),
        description: description.trim(),
        sku: sku.trim() || `SWC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        price: originalPriceNum, // Base Price / MRP (Compatibility: used as strikethrough MRP)
        sellingPrice: sellPriceNum, // Discounted Price
        purchasePrice: sellPriceNum * 0.6, // Default 60% CP
        category: category,
        brand: brand.trim() || "Shiv Western Club",
        color: colorVariants.map(cv => cv.name).join(", ") || color.trim() || "Multi",
        size: selectedSizes.join(", "),
        barcode: barcode.trim() || `BAR-${Math.random().toString().substr(2, 8)}`,
        stock: stock ? Number(stock) : 0,
        image: galleryImages[0] || image || "",
        images: galleryImages,
        available_colors: colorVariants,
        out_of_stock_sizes: outOfStockSizes,
        createdAt: Date.now()
      };

      await addDoc(collection(db, "products"), newProduct);
      
      // Reset form
      setName("");
      setDescription("");
      setBasePrice("");
      setPrice("");
      setSku("");
      setCategory(categories[0] || "Shirt");
      setBrand("Shiv Western");
      setColor("Multi");
      setBarcode("");
      setStock("10");
      setImage("");
      setGalleryImages([]);
      setColorVariants([]);
      setOutOfStockSizes([]);
      setSelectedSizes(["S", "M", "L", "XL", "XXL"]);
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
      alert("Product Title and Discounted Price are required!");
      return;
    }

    try {
      const sellPriceNum = Number(editingProduct.sellingPrice || editingProduct.price);
      const originalPriceNum = Number(editingProduct.price);
      const productRef = doc(db, "products", editingProduct.id);
      
      const updatedProduct = {
        name: editingProduct.name.trim(),
        description: editingProduct.description || "",
        sku: editingProduct.sku.trim(),
        price: originalPriceNum, // Base Price / MRP
        sellingPrice: sellPriceNum, // Discounted Price
        purchasePrice: editingProduct.purchasePrice ? Number(editingProduct.purchasePrice) : sellPriceNum * 0.6,
        category: editingProduct.category,
        brand: editingProduct.brand?.trim() || "Shiv Western Club",
        color: (editingProduct.available_colors && editingProduct.available_colors.length > 0)
          ? editingProduct.available_colors.map((cv: any) => cv.name).join(", ")
          : editingProduct.color?.trim() || "Multi",
        size: editingProduct.size || "",
        barcode: editingProduct.barcode?.trim() || "",
        stock: editingProduct.stock !== undefined ? Number(editingProduct.stock) : 0,
        image: (editingProduct.images && editingProduct.images[0]) || editingProduct.image || "",
        images: editingProduct.images || [],
        available_colors: editingProduct.available_colors || [],
        out_of_stock_sizes: editingProduct.out_of_stock_sizes || [],
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
      alert("Only admins/owners can delete products!");
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
      description: p.description || "",
      sku: p.sku || "",
      price: p.price || p.sellingPrice || 0, // Base Price
      sellingPrice: p.sellingPrice || p.price || 0, // Discounted Price
      purchasePrice: p.purchasePrice || (p.sellingPrice || p.price || 0) * 0.6,
      category: p.category || "Shirt",
      brand: p.brand || "",
      color: p.color || "",
      size: p.size || "",
      barcode: p.barcode || "",
      stock: p.stock !== undefined ? p.stock : 0,
      image: p.image || "",
      images: p.images || [],
      available_colors: p.available_colors || [],
      out_of_stock_sizes: p.out_of_stock_sizes || [],
      createdAt: p.createdAt
    });
    setShowAdd(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fade" style={{ padding: "0 0 100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={24} color={C.accent} />
          </div>
          <div>
            <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px", margin: 0 }}>Products Catalog</h2>
            <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, margin: 0 }}>Manage clothing inventory, descriptions, and pricing</p>
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

      {/* Add Product Form Panel */}
      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginBottom: 24 }}
          >
            <form onSubmit={handleAdd} style={{ background: C.card, borderRadius: 24, padding: 24, border: `1.5px solid ${C.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.02)" }}>
              <h3 className="pf" style={{ fontSize: 16, fontWeight: 950, color: C.dark, marginBottom: 20 }}>Add New Clothing Item</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                {/* Product Title & Category */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Product Title *</label>
                    <input 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="e.g. Premium Cotton Oversized Tee" 
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 650, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Category Dropdown *</label>
                    <select 
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 650, color: C.dark }}
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Description</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Enter detailed description of the clothing material, fit, and style..." 
                    rows={3}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.dark, fontFamily: "sans-serif" }}
                  />
                </div>

                {/* Base Price, Discount Price & Stock */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Base Price (MRP strikethrough) *</label>
                    <input 
                      type="number"
                      value={basePrice} 
                      onChange={e => setBasePrice(e.target.value)} 
                      placeholder="e.g. 1199" 
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 700, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Discounted Price (Selling Price) *</label>
                    <input 
                      type="number"
                      value={price} 
                      onChange={e => setPrice(e.target.value)} 
                      placeholder="e.g. 599" 
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 800, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Stock Quantity *</label>
                    <input 
                      type="number"
                      value={stock} 
                      onChange={e => setStock(e.target.value)} 
                      placeholder="e.g. 25" 
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 700, color: C.dark }}
                    />
                  </div>
                </div>

                {/* Available Sizes selection */}
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

                {/* Out of Stock Sizes checklist */}
                {selectedSizes.length > 0 && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 8 }}>Mark Sizes as Out of Stock</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {selectedSizes.map(sz => {
                        const isOut = outOfStockSizes.includes(sz);
                        return (
                          <button 
                            type="button" 
                            key={sz} 
                            onClick={() => {
                              setOutOfStockSizes(prev => 
                                prev.includes(sz) ? prev.filter(s => s !== sz) : [...prev, sz]
                              );
                            }}
                            style={{ 
                              padding: "6px 12px", 
                              borderRadius: 8, 
                              border: `1.5px solid ${isOut ? C.red : C.border}`, 
                              background: isOut ? `${C.red}12` : "transparent", 
                              color: isOut ? C.red : C.muted, 
                              fontWeight: 650, 
                              fontSize: 11, 
                              cursor: "pointer" 
                            }}
                          >
                            {sz} {isOut ? "✗ (Out)" : "✓ (In)"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Optional additional details to prevent breaking compatibility */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: C.accent, textTransform: "uppercase", margin: "0 0 12px" }}>Optional Brand & Code Details</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Brand</label>
                      <input 
                        value={brand} 
                        onChange={e => setBrand(e.target.value)} 
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.dark }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>SKU Code</label>
                      <input 
                        value={sku} 
                        onChange={e => setSku(e.target.value)} 
                        placeholder="SWC-T-01"
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.dark }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Barcode</label>
                      <input 
                        value={barcode} 
                        onChange={e => setBarcode(e.target.value)} 
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.dark }}
                      />
                    </div>
                  </div>
                </div>

                {/* Product Images Gallery */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.accent, textTransform: "uppercase", display: "block", marginBottom: 12 }}>Product Photos Gallery (Manage All Photos)</label>
                  
                  {/* Gallery Thumbnails List */}
                  {galleryImages.length > 0 && (
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                      {galleryImages.map((img, idx) => (
                        <div key={idx} style={{ position: "relative", width: 80, height: 80, borderRadius: 12, overflow: "hidden", border: `2px solid ${idx === 0 ? C.dark : C.border}` }}>
                          <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "#FFF", fontSize: 9, textAlign: "center", padding: "2px 0", fontWeight: 700 }}>
                            {idx === 0 ? "Main (#0)" : `#${idx}`}
                          </div>
                          <button
                            type="button"
                            onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                            style={{ position: "absolute", top: 4, right: 4, background: C.red, color: "#FFF", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            title="Delete Image"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={e => {
                        if (e.target.files) {
                          const filesArray = Array.from(e.target.files);
                          filesArray.forEach(file => {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setGalleryImages(prev => [...prev, reader.result as string]);
                            };
                            reader.readAsDataURL(file);
                          });
                        }
                      }}
                      style={{ fontSize: 12, color: C.muted }}
                    />
                    <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Upload one or more photos (first image is the main catalog photo)</p>
                  </div>
                </div>

                {/* Product Colors Management */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.accent, textTransform: "uppercase", display: "block", marginBottom: 12 }}>Cloth Colors & Variants</label>
                  
                  {/* Current color variants list */}
                  {colorVariants.length > 0 && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                      {colorVariants.map((cv, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 650, color: C.dark }}>
                          <span style={{ width: 14, height: 14, borderRadius: "50%", background: cv.hex, border: "1px solid rgba(0,0,0,0.15)" }} />
                          <span>{cv.name} (Image #{cv.image_index})</span>
                          <button
                            type="button"
                            onClick={() => setColorVariants(prev => prev.filter((_, i) => i !== idx))}
                            style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontWeight: 700, padding: 0 }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add variant inputs */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 1fr auto", gap: 12, alignItems: "flex-end", background: `${C.bg}50`, padding: 14, borderRadius: 16, border: `1px dashed ${C.border}` }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, display: "block", marginBottom: 4 }}>Color Name</label>
                      <input
                        type="text"
                        value={tempColorName}
                        onChange={e => setTempColorName(e.target.value)}
                        placeholder="e.g. Indigo Blue"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: "#FFF", fontSize: 12, fontWeight: 650, color: C.dark }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, display: "block", marginBottom: 4 }}>Color Swatch</label>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="color"
                          value={tempColorHex}
                          onChange={e => setTempColorHex(e.target.value)}
                          style={{ width: 34, height: 34, border: "none", borderRadius: 6, padding: 0, cursor: "pointer" }}
                        />
                        <span style={{ fontSize: 11, fontFamily: "monospace", color: C.dark }}>{tempColorHex.toUpperCase()}</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, display: "block", marginBottom: 4 }}>Associated Photo</label>
                      <select
                        value={tempColorImageIdx}
                        onChange={e => setTempColorImageIdx(Number(e.target.value))}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: "#FFF", fontSize: 12, fontWeight: 650, color: C.dark }}
                      >
                        {galleryImages.map((_, i) => (
                          <option key={i} value={i}>Photo #{i}</option>
                        ))}
                        {galleryImages.length === 0 && <option value={0}>No Photos (Main)</option>}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!tempColorName.trim()) {
                          alert("Please enter a color name.");
                          return;
                        }
                        setColorVariants(prev => [...prev, { name: tempColorName.trim(), hex: tempColorHex, image_index: tempColorImageIdx }]);
                        setTempColorName("");
                        setTempColorHex("#000000");
                        setTempColorImageIdx(0);
                      }}
                      style={{ background: C.dark, color: C.accent, border: "none", padding: "10px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                    >
                      Add Color
                    </button>
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                style={{ width: "100%", background: C.dark, color: C.accent, padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 800, border: `1.5px solid ${C.accent}`, cursor: "pointer" }}
              >
                SAVE NEW PRODUCT TO CATALOG ＋
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Product Form Panel */}
      <AnimatePresence>
        {editingProduct && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginBottom: 24 }}
          >
            <form onSubmit={handleUpdate} style={{ background: C.card, borderRadius: 24, padding: 24, border: `1.5px solid ${C.accent}`, boxShadow: "0 8px 24px rgba(212,175,55,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 className="pf" style={{ fontSize: 16, fontWeight: 950, color: C.dark, margin: 0 }}>Edit Clothing Product</h3>
                <button type="button" onClick={() => setEditingProduct(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}><X size={18} /></button>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                {/* Product Title & Category */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Product Title *</label>
                    <input 
                      value={editingProduct.name} 
                      onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} 
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 650, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Category dropdown *</label>
                    <select 
                      value={editingProduct.category}
                      onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 650, color: C.dark }}
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Description</label>
                  <textarea 
                    value={editingProduct.description || ""} 
                    onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} 
                    rows={3}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.dark, fontFamily: "sans-serif" }}
                  />
                </div>

                {/* Prices & Stock */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Base Price (MRP) *</label>
                    <input 
                      type="number"
                      value={editingProduct.price} 
                      onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} 
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 700, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Discounted Price *</label>
                    <input 
                      type="number"
                      value={editingProduct.sellingPrice || editingProduct.price} 
                      onChange={e => setEditingProduct({ ...editingProduct, sellingPrice: e.target.value })} 
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 800, color: C.dark }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 6 }}>Stock Quantity *</label>
                    <input 
                      type="number"
                      value={editingProduct.stock} 
                      onChange={e => setEditingProduct({ ...editingProduct, stock: e.target.value })} 
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 700, color: C.dark }}
                    />
                  </div>
                </div>

                {/* Available Sizes selection */}
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

                {/* Out of Stock Sizes (Edit) */}
                {editingProduct.size && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: C.muted, display: "block", marginBottom: 8 }}>Mark Sizes as Out of Stock</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {editingProduct.size.split(",").map((s: string) => s.trim()).filter(Boolean).map((sz: string) => {
                        const currentOutList = editingProduct.out_of_stock_sizes || [];
                        const isOut = currentOutList.includes(sz);
                        return (
                          <button 
                            type="button" 
                            key={sz} 
                            onClick={() => {
                              const updatedOutList = isOut
                                ? currentOutList.filter((s: string) => s !== sz)
                                : [...currentOutList, sz];
                              setEditingProduct({ ...editingProduct, out_of_stock_sizes: updatedOutList });
                            }}
                            style={{ 
                              padding: "6px 12px", 
                              borderRadius: 8, 
                              border: `1.5px solid ${isOut ? C.red : C.border}`, 
                              background: isOut ? `${C.red}12` : "transparent", 
                              color: isOut ? C.red : C.muted, 
                              fontWeight: 650, 
                              fontSize: 11, 
                              cursor: "pointer" 
                            }}
                          >
                            {sz} {isOut ? "✗ (Out)" : "✓ (In)"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Product Images Gallery (Edit) */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.accent, textTransform: "uppercase", display: "block", marginBottom: 12 }}>Product Photos Gallery (Manage All Photos)</label>
                  
                  {/* Gallery Thumbnails List */}
                  {editingProduct.images && editingProduct.images.length > 0 && (
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                      {editingProduct.images.map((img: string, idx: number) => (
                        <div key={idx} style={{ position: "relative", width: 80, height: 80, borderRadius: 12, overflow: "hidden", border: `2px solid ${idx === 0 ? C.dark : C.border}` }}>
                          <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "#FFF", fontSize: 9, textAlign: "center", padding: "2px 0", fontWeight: 700 }}>
                            {idx === 0 ? "Main (#0)" : `#${idx}`}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedImgs = editingProduct.images.filter((_: any, i: number) => i !== idx);
                              setEditingProduct({ ...editingProduct, images: updatedImgs });
                            }}
                            style={{ position: "absolute", top: 4, right: 4, background: C.red, color: "#FFF", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            title="Delete Image"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={e => {
                        if (e.target.files) {
                          const filesArray = Array.from(e.target.files);
                          filesArray.forEach(file => {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const currentImgs = editingProduct.images || [];
                              setEditingProduct({ ...editingProduct, images: [...currentImgs, reader.result as string] });
                            };
                            reader.readAsDataURL(file);
                          });
                        }
                      }}
                      style={{ fontSize: 12, color: C.muted }}
                    />
                    <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Upload one or more photos</p>
                  </div>
                </div>

                {/* Product Colors Management (Edit) */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.accent, textTransform: "uppercase", display: "block", marginBottom: 12 }}>Cloth Colors & Variants</label>
                  
                  {/* Current color variants list */}
                  {editingProduct.available_colors && editingProduct.available_colors.length > 0 && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                      {editingProduct.available_colors.map((cv: any, idx: number) => {
                        const cleanCv = getColorObject(cv);
                        return (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 650, color: C.dark }}>
                            <span style={{ width: 14, height: 14, borderRadius: "50%", background: cleanCv.hex, border: "1px solid rgba(0,0,0,0.15)" }} />
                            <span>{cleanCv.name} (Image #{cleanCv.image_index || 0})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedColors = editingProduct.available_colors.filter((_: any, i: number) => i !== idx);
                                setEditingProduct({ ...editingProduct, available_colors: updatedColors });
                              }}
                              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontWeight: 700, padding: 0 }}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add variant inputs */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 1fr auto", gap: 12, alignItems: "flex-end", background: `${C.bg}50`, padding: 14, borderRadius: 16, border: `1px dashed ${C.border}` }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, display: "block", marginBottom: 4 }}>Color Name</label>
                      <input
                        type="text"
                        value={tempColorName}
                        onChange={e => setTempColorName(e.target.value)}
                        placeholder="e.g. Indigo Blue"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: "#FFF", fontSize: 12, fontWeight: 650, color: C.dark }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, display: "block", marginBottom: 4 }}>Color Swatch</label>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="color"
                          value={tempColorHex}
                          onChange={e => setTempColorHex(e.target.value)}
                          style={{ width: 34, height: 34, border: "none", borderRadius: 6, padding: 0, cursor: "pointer" }}
                        />
                        <span style={{ fontSize: 11, fontFamily: "monospace", color: C.dark }}>{tempColorHex.toUpperCase()}</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, display: "block", marginBottom: 4 }}>Associated Photo</label>
                      <select
                        value={tempColorImageIdx}
                        onChange={e => setTempColorImageIdx(Number(e.target.value))}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: "#FFF", fontSize: 12, fontWeight: 650, color: C.dark }}
                      >
                        {(editingProduct.images || []).map((_: any, i: number) => (
                          <option key={i} value={i}>Photo #{i}</option>
                        ))}
                        {(editingProduct.images || []).length === 0 && <option value={0}>No Photos (Main)</option>}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!tempColorName.trim()) {
                          alert("Please enter a color name.");
                          return;
                        }
                        const currentColors = editingProduct.available_colors || [];
                        setEditingProduct({
                          ...editingProduct,
                          available_colors: [...currentColors, { name: tempColorName.trim(), hex: tempColorHex, image_index: tempColorImageIdx }]
                        });
                        setTempColorName("");
                        setTempColorHex("#000000");
                        setTempColorImageIdx(0);
                      }}
                      style={{ background: C.dark, color: C.accent, border: "none", padding: "10px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                    >
                      Add Color
                    </button>
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
      <div style={{ background: C.card, borderRadius: 18, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, border: `1.5px solid ${C.border}`, marginBottom: 24, boxShadow: "0 4px 12px rgba(10, 31, 68, 0.02)" }}>
        <Search size={18} color={C.muted} />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search catalog by title, SKU or category..." 
          style={{ flex: 1, fontSize: 14, color: C.dark, border: "none", outline: "none", background: "transparent", fontWeight: 600 }} 
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ background: C.bg, border: "none", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}>✕</button>
        )}
      </div>

      {/* Products Data Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", border: `2px dashed ${C.border}`, borderRadius: 24, background: C.card }}>
          <ShoppingBag size={48} color={C.muted} style={{ marginBottom: 12, opacity: 0.6 }} />
          <p className="pf" style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>No products found</p>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Add products to populate the customer catalog and enable quick counter billing.</p>
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 28, border: `1.5px solid ${C.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.01)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: `${C.bg}60`, borderBottom: `1.5px solid ${C.border}` }}>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Image</th>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Product details</th>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Category</th>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Price (Base / Disc)</th>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>Stock Status</th>
                  <th style={{ padding: "14px 24px", fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const stockVal = p.stock !== undefined ? p.stock : 0;
                  const isLow = stockVal < 5;
                  const isOut = stockVal === 0;

                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background-color 0.2s" }} className="hover:bg-slate-50/50">
                      {/* Image */}
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `1px solid ${C.border}` }}>
                          {p.image ? (
                            <img src={p.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={p.name} />
                          ) : (
                            <ShoppingBag size={20} color={C.muted} />
                          )}
                        </div>
                      </td>
                      
                      {/* Name Details */}
                      <td style={{ padding: "16px 24px", maxWidth: 220 }}>
                        <p style={{ fontSize: 13, fontWeight: 850, color: C.dark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                        <p style={{ fontSize: 10, color: C.muted, marginTop: 2, margin: 0 }}>
                          SKU: <span style={{ color: C.accent, fontWeight: 700 }}>{p.sku || "Auto"}</span> {p.size && `| Size: ${p.size}`}
                        </p>
                      </td>

                      {/* Category */}
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ background: `${C.accent}12`, color: C.accent, fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 100, textTransform: "uppercase" }}>
                          {p.category || "General"}
                        </span>
                      </td>

                      {/* Price Details */}
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span className="pf" style={{ fontSize: 14, fontWeight: 900, color: C.green }}>₹{(p.sellingPrice || p.price).toLocaleString("en-IN")}</span>
                          {p.sellingPrice && p.price > p.sellingPrice && (
                            <span style={{ fontSize: 11, textDecoration: "line-through", color: C.muted }}>₹{p.price.toLocaleString("en-IN")}</span>
                          )}
                        </div>
                      </td>

                      {/* Stock Status */}
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 750, color: isOut ? C.red : isLow ? C.accent : C.dark }}>
                            {stockVal} units
                          </span>
                          <span style={{ 
                            fontSize: 9, 
                            fontWeight: 800, 
                            padding: "2px 6px", 
                            borderRadius: 4, 
                            display: "inline-block",
                            width: "fit-content",
                            background: isOut ? `${C.red}12` : isLow ? `${C.accent}12` : `${C.green}12`,
                            color: isOut ? C.red : isLow ? C.accent : C.green,
                            textTransform: "uppercase"
                          }}>
                            {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "16px 24px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button 
                            onClick={() => startEditing(p)}
                            style={{ padding: "6px 12px", borderRadius: 8, background: C.bg, border: "none", display: "flex", alignItems: "center", gap: 4, color: C.dark, fontSize: 11, fontWeight: 750, cursor: "pointer", transition: "0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = C.border}
                            onMouseLeave={e => e.currentTarget.style.background = C.bg}
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          {isAdmin && (
                            <button 
                              onClick={() => handleDelete(p.id, p.name)}
                              style={{ padding: "6px 12px", borderRadius: 8, background: "#FFF0F0", border: "none", display: "flex", alignItems: "center", gap: 4, color: C.red, fontSize: 11, fontWeight: 750, cursor: "pointer", transition: "0.2s" }}
                              onMouseEnter={e => e.currentTarget.style.background = "#FFE4E4"}
                              onMouseLeave={e => e.currentTarget.style.background = "#FFF0F0"}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
