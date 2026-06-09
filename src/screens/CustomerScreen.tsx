import React, { useState, useMemo } from "react";
import { C } from "../constants";
import { CatalogProduct, Settings, Bill, Customer } from "../types";
import { Shirt, ShoppingBag, Phone, MapPin, Tag, Award, User, Download, Share2, ClipboardList, Info, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { doWhatsApp, doExcelExport, doPDF } from "../utils/exportUtils";

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  productId: string;
  productName: string;
  size: string;
  color: string;
  price: number;
  status: "Pending" | "Approved" | "Cancelled" | "Reserved" | "Completed";
  createdAt: number;
}

export const CustomerScreen = ({
  products,
  settings,
  bills,
  profile,
  orders = [],
  onLogout,
  onUpdateProfile,
  onCreateOrder
}: {
  products: CatalogProduct[],
  settings: Settings,
  bills: Bill[],
  profile: any,
  orders?: Order[],
  onLogout: () => void,
  onUpdateProfile: (p: any) => void,
  onCreateOrder: (order: any) => Promise<void>
}) => {
  const [activeTab, setActiveTab] = useState<"home" | "catalog" | "account">("home");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  
  // Profile editing
  const [editName, setEditName] = useState(profile?.displayName || "");
  const [editAddress, setEditAddress] = useState(profile?.address || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const categories = ["All", "Shirt", "T-Shirt", "Jeans", "Kurta", "Saree", "Ladies Wear", "Western Wear"];

  // Filter bills for this customer
  const customerBills = useMemo(() => {
    if (!profile?.phone) return [];
    return bills.filter(b => b.customerObj.phone.replace(/\D/g, "") === profile.phone.replace(/\D/g, ""));
  }, [bills, profile]);

  // Total Purchase & Loyalty Points
  const totalPurchase = useMemo(() => {
    return customerBills.reduce((sum, b) => sum + b.total, 0);
  }, [customerBills]);

  const loyaltyPoints = Math.floor(totalPurchase / 100);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Customer orders/reservations
  const customerOrders = useMemo(() => {
    if (!profile?.phone) return [];
    return orders.filter(o => o.customerPhone === profile.phone);
  }, [orders, profile]);

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await onUpdateProfile({
        ...profile,
        displayName: editName,
        address: editAddress
      });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleReserve = async (product: any) => {
    if (!selectedSize) {
      alert("Please select a size!");
      return;
    }
    
    const colors = product.color ? product.color.split(",").map((c: string) => c.trim()) : [];
    const colorVal = selectedColor || (colors.length > 0 ? colors[0] : "Default");

    const orderData = {
      customerId: profile.uid,
      customerName: profile.displayName || "Customer",
      customerPhone: profile.phone,
      productId: product.id,
      productName: product.name,
      size: selectedSize,
      color: colorVal,
      price: product.price || product.sellingPrice,
      status: "Reserved" as const,
      createdAt: Date.now()
    };

    try {
      await onCreateOrder(orderData);
      alert(`🎉 Product Reserved Successfully!\nOur staff will verify and keep it ready for you.`);
      setSelectedProduct(null);
      setSelectedSize("");
      setSelectedColor("");
      setActiveTab("account"); // Switch to order tab
    } catch (err) {
      alert("Reservation failed. Please try again.");
    }
  };

  const handleEnquiry = (product: any) => {
    const text = encodeURIComponent(`Hi, I'm interested in the "${product.name}" (${product.brand || "Shiv Western"}). Category: ${product.category || "General"}, Price: ₹${product.price}. Is it available?`);
    const shopPhoneClean = settings.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${shopPhoneClean}?text=${text}`, "_blank");
  };

  const handleDownloadInvoice = async (bill: Bill) => {
    try {
      await doPDF(bill, settings);
    } catch (err) {
      alert("Failed to generate PDF invoice.");
    }
  };

  const handleShareInvoice = (bill: Bill) => {
    doWhatsApp(bill, settings, () => {});
  };

  const renderProductDetails = (product: any) => {
    const sizes = product.size ? product.size.split(",").map((s: string) => s.trim()) : ["S", "M", "L", "XL"];
    const colors = product.color ? product.color.split(",").map((c: string) => c.trim()) : ["Standard"];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ width: 100, height: 100, borderRadius: 12, background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {product.image ? (
              <img src={product.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={product.name} />
            ) : (
              <Shirt size={48} color={C.muted} />
            )}
          </div>
          <div>
            <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, textTransform: "uppercase" }}>{product.brand || "Shiv Western"}</span>
            <h4 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: "2px 0 6px" }}>{product.name}</h4>
            <span style={{ background: C.greenLight, color: C.green, fontSize: 11, padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>{product.category || "General Wear"}</span>
            <p className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.dark, marginTop: 8 }}>₹{(product.price || product.sellingPrice || 0).toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Sizes */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Select Size</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {sizes.map((s: string) => (
              <button 
                key={s} 
                onClick={() => setSelectedSize(s)}
                style={{ 
                  padding: "8px 14px", 
                  borderRadius: 8, 
                  border: `1.5px solid ${selectedSize === s ? C.dark : C.border}`, 
                  background: selectedSize === s ? C.dark : "transparent",
                  color: selectedSize === s ? C.accent : C.dark,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        {colors.length > 0 && colors[0] !== "Standard" && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Select Color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {colors.map((c: string) => (
                <button 
                  key={c} 
                  onClick={() => setSelectedColor(c)}
                  style={{ 
                    padding: "8px 14px", 
                    borderRadius: 8, 
                    border: `1.5px solid ${selectedColor === c ? C.dark : C.border}`, 
                    background: selectedColor === c ? C.dark : "transparent",
                    color: selectedColor === c ? C.accent : C.dark,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer"
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button 
            onClick={() => handleReserve(product)}
            style={{ flex: 1, background: C.dark, color: C.accent, border: `1.5px solid ${C.accent}`, padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            🛎️ Reserve Product
          </button>
          <button 
            onClick={() => handleEnquiry(product)}
            style={{ background: "#25D366", color: "#fff", border: "none", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 54 }}
            title="Enquire on WhatsApp"
          >
            <Phone size={20} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: C.bg }}>
      {/* Top Premium Navbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#000", borderBottom: `1px solid ${C.accent}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.accent}` }}>
            <Shirt size={20} color={C.accent} />
          </div>
          <div>
            <span className="pf" style={{ fontWeight: 900, fontSize: 18, color: "#fff", letterSpacing: "-0.5px" }}>{settings.shopName}</span>
            <span style={{ fontSize: 9, color: C.accent, fontWeight: 800, display: "block", marginTop: -2, letterSpacing: "1px" }}>CUSTOMER CLUB</span>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: "transparent", border: `1px solid ${C.red}`, color: C.red, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Logout 🚪</button>
      </div>

      {/* Main Content Viewport */}
      <main style={{ flex: 1, padding: "20px 18px 100px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        
        {/* TAB 1: HOME PORTAL */}
        {activeTab === "home" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="fade" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Hero / Collection Banner */}
            <div style={{ background: "linear-gradient(135deg, #0A1F44 0%, #000000 100%)", borderRadius: 24, padding: "36px 24px", border: `2px solid ${C.accent}`, position: "relative", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
              <div style={{ position: "relative", zIndex: 2 }}>
                <span style={{ color: C.accent, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px" }}>New Collection 2026</span>
                <h2 className="pf" style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginTop: 8, marginBottom: 12, lineHeight: 1.2 }}>FESTIVAL ESSENTIALS &<br />LUXURY WESTERN WEAR</h2>
                <p style={{ color: "#eee", fontSize: 14, maxWidth: 280, lineHeight: 1.4, marginBottom: 20 }}>Get premium fit shirts, kurtas and sarees at exclusive member prices.</p>
                <button onClick={() => setActiveTab("catalog")} style={{ background: C.accent, color: "#000", border: "none", padding: "12px 24px", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px" }}>Browse Catalog →</button>
              </div>
              <div style={{ position: "absolute", right: -30, bottom: -30, opacity: 0.15, transform: "rotate(-15deg)" }}>
                <Shirt size={220} color={C.accent} />
              </div>
            </div>

            {/* Quick Stats Panel */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: C.card, borderRadius: 20, padding: 18, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Award size={24} color={C.accent} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, margin: 0 }}>Loyalty Points</p>
                  <p className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.dark, margin: 0 }}>{loyaltyPoints} Pts</p>
                </div>
              </div>
              <div style={{ background: C.card, borderRadius: 20, padding: 18, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.green}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShoppingBag size={24} color={C.green} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, margin: 0 }}>Total Purchase</p>
                  <p className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.green, margin: 0 }}>₹{totalPurchase.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </div>

            {/* Banner Offers */}
            <div style={{ background: "#FFFBF0", borderRadius: 20, padding: "16px 20px", border: `1.5px dashed ${C.accent}`, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 24 }}>✨</span>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: C.dark, margin: 0 }}>Exclusive Member Offers</h4>
                <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>Get 1 loyalty point for every ₹100 purchase. Redeem points at counter bills!</p>
              </div>
            </div>

            {/* Featured / Latest Products Slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 className="pf" style={{ fontSize: 18, fontWeight: 900, color: C.dark }}>Latest Arrivals</h3>
                <button onClick={() => setActiveTab("catalog")} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>View All</button>
              </div>
              
              {products.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
                  <p style={{ color: C.muted, fontSize: 13 }}>No products in catalog yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 10 }} className="no-scrollbar">
                  {products.slice(0, 5).map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => setSelectedProduct(p)}
                      style={{ background: C.card, borderRadius: 18, padding: 14, border: `1px solid ${C.border}`, minWidth: 200, width: 200, flexShrink: 0, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.01)" }}
                    >
                      <div style={{ width: "100%", height: 160, borderRadius: 12, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 12 }}>
                        {p.image ? (
                          <img src={p.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={p.name} />
                        ) : (
                          <Shirt size={44} color={C.muted} />
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: C.accent, fontWeight: 800, textTransform: "uppercase" }}>{p.brand || "Shiv Western"}</span>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: C.dark, margin: "2px 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h4>
                      <p className="pf" style={{ fontSize: 15, fontWeight: 900, color: C.dark }}>₹{(p.price || p.sellingPrice || 0).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: PRODUCT CATALOG */}
        {activeTab === "catalog" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Search */}
            <div style={{ background: C.card, borderRadius: 18, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
              <span style={{ color: C.muted }}>🔍</span>
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search catalog or brand..." 
                style={{ border: "none", outline: "none", flex: 1, background: "transparent", color: C.dark, fontWeight: 600, fontSize: 14 }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}>✕</button>
              )}
            </div>

            {/* Categories scroll bar */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }} className="no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 100,
                    border: `1px solid ${selectedCategory === cat ? C.dark : C.border}`,
                    background: selectedCategory === cat ? C.dark : C.card,
                    color: selectedCategory === cat ? C.accent : C.dark,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", border: `2px dashed ${C.border}`, borderRadius: 20 }}>
                <ShoppingBag size={48} color={C.muted} style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>No products found</p>
                <p style={{ fontSize: 12, color: C.muted }}>Try looking in other categories or change search query.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
                {filteredProducts.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    style={{ background: C.card, borderRadius: 20, padding: 12, border: `1px solid ${C.border}`, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.01)" }}
                  >
                    <div style={{ width: "100%", height: 130, borderRadius: 12, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 10 }}>
                      {p.image ? (
                        <img src={p.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={p.name} />
                      ) : (
                        <Shirt size={36} color={C.muted} />
                      )}
                    </div>
                    <span style={{ fontSize: 9, color: C.accent, fontWeight: 800, textTransform: "uppercase" }}>{p.brand || "Shiv Western"}</span>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: C.dark, margin: "2px 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h4>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                      <p className="pf" style={{ fontSize: 14, fontWeight: 900, color: C.dark, margin: 0 }}>₹{(p.price || p.sellingPrice || 0).toLocaleString("en-IN")}</p>
                      <span style={{ fontSize: 10, color: p.stock && p.stock > 0 ? C.green : C.red, fontWeight: 800 }}>
                        {p.stock && p.stock > 0 ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: ACCOUNT LEDGER & PROFILE */}
        {activeTab === "account" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="fade" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Account overview card */}
            <div style={{ background: "linear-gradient(135deg, #0A1F44 0%, #000 100%)", borderRadius: 24, padding: 24, border: `1.5px solid ${C.accent}`, color: "#fff", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
                <User size={32} color="#000" />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 className="pf" style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>{profile.displayName || "Club Member"}</h3>
                <p style={{ fontSize: 13, color: C.accent, margin: "2px 0 0", fontWeight: 700 }}>📞 {profile.phone}</p>
              </div>
            </div>

            {/* Purchase ledger cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: C.card, borderRadius: 20, padding: 16, border: `1px solid ${C.border}`, textAlign: "center" }}>
                <Award size={20} color={C.accent} style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: 10, color: C.muted, fontWeight: 600, margin: 0 }}>Loyalty Balance</p>
                <p className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, margin: "4px 0 0" }}>{loyaltyPoints} Pts</p>
              </div>
              <div style={{ background: C.card, borderRadius: 20, padding: 16, border: `1px solid ${C.border}`, textAlign: "center" }}>
                <ShoppingBag size={20} color={C.green} style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: 10, color: C.muted, fontWeight: 600, margin: 0 }}>Total Invoiced</p>
                <p className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.green, margin: "4px 0 0" }}>₹{totalPurchase.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Profile Editing Section */}
            <div style={{ background: C.card, borderRadius: 20, padding: 20, border: `1px solid ${C.border}` }}>
              <h4 className="pf" style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 14 }}>Edit Profile Details</h4>
              <form onSubmit={handleUpdateProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Full Name"
                  required
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.dark }}
                />
                <input 
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  placeholder="Delivery / Billing Address"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.dark }}
                />
                <button 
                  type="submit" 
                  disabled={isSavingProfile}
                  style={{ width: "100%", background: C.dark, color: C.accent, border: `1px solid ${C.accent}`, padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                >
                  {isSavingProfile ? "Saving..." : "UPDATE DETAILS ✓"}
                </button>
              </form>
            </div>

            {/* My Reservations / Orders */}
            <div>
              <h4 className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.dark, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <ClipboardList size={18} color={C.accent} />
                My Product Reservations
              </h4>
              {customerOrders.length === 0 ? (
                <div style={{ padding: "20px", background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, textAlign: "center" }}>
                  <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>You haven't reserved any items yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {customerOrders.map(ord => (
                    <div key={ord.id} style={{ background: C.card, borderRadius: 16, padding: 14, border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h5 style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: 0 }}>{ord.productName}</h5>
                        <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Size: {ord.size} | Color: {ord.color} | Price: ₹{ord.price}</p>
                        <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Date: {new Date(ord.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span 
                        style={{ 
                          fontSize: 10, 
                          fontWeight: 800, 
                          padding: "4px 10px", 
                          borderRadius: 100,
                          background: ord.status === "Reserved" || ord.status === "Pending" ? `${C.accent}15` : ord.status === "Approved" || ord.status === "Completed" ? `${C.green}15` : `${C.red}15`,
                          color: ord.status === "Reserved" || ord.status === "Pending" ? C.accent : ord.status === "Approved" || ord.status === "Completed" ? C.green : C.red,
                          textTransform: "uppercase"
                        }}
                      >
                        {ord.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Previous Bills */}
            <div>
              <h4 className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.dark, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <ClipboardList size={18} color={C.green} />
                Purchase Ledger & Invoices
              </h4>
              
              {customerBills.length === 0 ? (
                <div style={{ padding: "20px", background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, textAlign: "center" }}>
                  <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>No invoices generated for this mobile number yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {customerBills.map(bill => (
                    <div key={bill.id} style={{ background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span className="pf" style={{ fontSize: 14, fontWeight: 900, color: C.dark }}>Bill #{bill.id}</span>
                          <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{bill.date}</span>
                        </div>
                        <span className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.green }}>₹{bill.total.toLocaleString("en-IN")}</span>
                      </div>
                      
                      {/* Bill details */}
                      <p style={{ fontSize: 12, color: C.muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {bill.items.map(it => `${it.name} (${it.qty})`).join(", ")}
                      </p>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${C.bg}` }}>
                        <span 
                          style={{ 
                            fontSize: 10, 
                            fontWeight: 800, 
                            padding: "2px 8px", 
                            borderRadius: 100, 
                            background: bill.paymentStatus === "PAID" ? `${C.green}15` : `${C.red}15`,
                            color: bill.paymentStatus === "PAID" ? C.green : C.red
                          }}
                        >
                          {bill.paymentStatus}
                        </span>
                        
                        <div style={{ display: "flex", gap: 8 }}>
                          <button 
                            onClick={() => handleDownloadInvoice(bill)}
                            style={{ background: C.bg, border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: C.dark, cursor: "pointer" }}
                            title="Download PDF Invoice"
                          >
                            <Download size={14} />
                          </button>
                          <button 
                            onClick={() => handleShareInvoice(bill)}
                            style={{ background: C.bg, border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: C.dark, cursor: "pointer" }}
                            title="Share Bill via WhatsApp"
                          >
                            <Share2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation Menu */}
      <div style={{ display: "flex", borderTop: `1px solid ${C.border}`, background: C.card, position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -4px 20px rgba(0,0,0,0.03)" }}>
        {[
          { id: "home", icon: "🏠", label: "Home" },
          { id: "catalog", icon: "🛍️", label: "Catalog" },
          { id: "account", icon: "👤", label: "My Club" }
        ].map(nav => (
          <button
            key={nav.id}
            onClick={() => setActiveTab(nav.id as any)}
            style={{
              flex: 1,
              padding: "12px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              background: "none",
              border: "none",
              cursor: "pointer",
              borderTop: activeTab === nav.id ? `3px solid ${C.accent}` : "3px solid transparent",
              color: activeTab === nav.id ? C.dark : C.muted,
              transition: "all 0.2s"
            }}
          >
            <span style={{ fontSize: 20 }}>{nav.icon}</span>
            <span className="pf" style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2px" }}>{nav.label}</span>
          </button>
        ))}
      </div>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ background: C.card, borderRadius: 24, padding: 24, width: "100%", maxWidth: 440, border: `1.5px solid ${C.accent}`, boxShadow: "0 10px 30px rgba(0,0,0,0.15)", position: "relative" }}
            >
              <button 
                onClick={() => { setSelectedProduct(null); setSelectedSize(""); setSelectedColor(""); }}
                style={{ position: "absolute", right: 20, top: 20, background: C.bg, border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted, fontWeight: 700 }}
              >
                ✕
              </button>
              <h3 className="pf" style={{ fontSize: 18, fontWeight: 900, color: C.dark, marginBottom: 18 }}>Product Details</h3>
              {renderProductDetails(selectedProduct)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
