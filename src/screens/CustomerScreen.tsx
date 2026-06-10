import React, { useState, useMemo } from "react";
import { C } from "../constants";
import { CatalogProduct, Settings, Bill } from "../types";
import { 
  Shirt, 
  ShoppingBag, 
  Phone, 
  MapPin, 
  Tag, 
  Award, 
  User, 
  Download, 
  Share2, 
  ClipboardList, 
  Heart, 
  Menu, 
  X, 
  ChevronRight, 
  Search, 
  Calendar,
  LogOut,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { doWhatsApp, doPDF } from "../utils/exportUtils";

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
  const [activeTab, setActiveTab] = useState<"home" | "products" | "offers" | "profile" | "bills" | "history" | "wishlist">("home");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Profile editing
  const [editName, setEditName] = useState(profile?.displayName || profile?.name || "");
  const [editAddress, setEditAddress] = useState(profile?.address || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const categories = ["All", "Shirt", "T-Shirt", "Jeans", "Kurta", "Saree", "Ladies Wear", "Western Wear"];

  // Filter bills for this customer
  const customerBills = useMemo(() => {
    if (!profile?.phone) return [];
    return bills.filter(b => b.customerObj.phone.replace(/\D/g, "") === profile.phone.replace(/\D/g, ""));
  }, [bills, profile]);

  // Extract all individual clothing items purchased in the past
  const purchasedItems = useMemo(() => {
    const items: any[] = [];
    customerBills.forEach(bill => {
      bill.items.forEach(item => {
        // Find product details from products list if available for brand info
        const prod = products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
        items.push({
          ...item,
          brand: prod?.brand || "Shiv Western Club",
          billId: bill.id,
          date: bill.date,
          timestamp: bill.timestamp || Date.now()
        });
      });
    });
    // Newest purchases first
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [customerBills, products]);

  // Total Purchase & Loyalty Points
  const totalPurchase = useMemo(() => {
    return customerBills.reduce((sum, b) => sum + b.total, 0);
  }, [customerBills]);

  const loyaltyPoints = Math.floor(totalPurchase / 100);

  // Wishlist array of product IDs
  const wishlist = useMemo(() => {
    return profile?.wishlist || [];
  }, [profile]);

  const isProductWishlisted = (productId: string) => {
    return wishlist.includes(productId);
  };

  const toggleWishlist = async (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isWish = wishlist.includes(productId);
    const newWish = isWish 
      ? wishlist.filter((id: string) => id !== productId)
      : [...wishlist, productId];
      
    try {
      await onUpdateProfile({
        ...profile,
        wishlist: newWish
      });
    } catch (err) {
      console.error("Failed to update wishlist:", err);
      alert("Failed to update wishlist. Please try again.");
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Wishlisted products full objects
  const wishlistedProducts = useMemo(() => {
    return products.filter(p => wishlist.includes(p.id));
  }, [products, wishlist]);

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
        name: editName,
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
      customerName: profile.displayName || profile.name || "Customer",
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
      setActiveTab("profile"); // Switch to profile to check reservations
    } catch (err) {
      alert("Reservation failed. Please try again.");
    }
  };

  const handleEnquiry = (product: any) => {
    const text = encodeURIComponent(`Hi, I'm interested in the "${product.name}" (${product.brand || "Shiv Western"}). Category: ${product.category || "General"}, Price: ₹${product.price}. Is it available?`);
    const shopPhoneClean = settings.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${shopPhoneClean}?text=${text}`, "_blank");
  };

  const handleEnquiryHistoryItem = (item: any) => {
    const text = encodeURIComponent(`Hi! I previously purchased "${item.name}" (Brand: ${item.brand}, Size: ${item.size || "Standard"}, Color: ${item.color || "Standard"}) on ${item.date}. Do you have this or similar items in stock right now?`);
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

  const menuItems = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "products", label: "Products Catalog", icon: "🛍️" },
    { id: "offers", label: "Special Offers", icon: "🏷️" },
    { id: "wishlist", label: "My Wishlist", icon: "❤️" },
    { id: "bills", label: "My Bills", icon: "📄" },
    { id: "history", label: "Purchase History", icon: "🕒" },
    { id: "profile", label: "My Profile & Club", icon: "👤" }
  ];

  const renderProductDetails = (product: any) => {
    const sizes = product.size ? product.size.split(",").map((s: string) => s.trim()) : ["S", "M", "L", "XL"];
    const colors = product.color ? product.color.split(",").map((c: string) => c.trim()) : ["Standard"];
    const isWish = isProductWishlisted(product.id);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ width: 100, height: 100, borderRadius: 12, background: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.border}`, overflow: "hidden", position: "relative" }}>
            {product.image ? (
              <img src={product.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={product.name} />
            ) : (
              <Shirt size={48} color={C.muted} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, textTransform: "uppercase" }}>{product.brand || "Shiv Western"}</span>
              <button 
                onClick={() => toggleWishlist(product.id)}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
              >
                <Heart size={20} fill={isWish ? C.red : "none"} color={isWish ? C.red : C.muted} />
              </button>
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: C.dark, margin: "2px 0 6px" }}>{product.name}</h4>
            <span style={{ background: C.greenLight, color: C.green, fontSize: 10, padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>{product.category || "General Wear"}</span>
            <p className="pf" style={{ fontSize: 18, fontWeight: 900, color: C.dark, marginTop: 8 }}>₹{(product.price || product.sellingPrice || 0).toLocaleString("en-IN")}</p>
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
    <div style={{ minHeight: "100vh", display: "flex", background: C.bg }}>
      
      {/* ----------------- DESKTOP SIDEBAR ----------------- */}
      <aside style={{ width: 260, background: "#000", borderRight: `1px solid ${C.accent}`, display: window.innerWidth >= 768 ? "flex" : "none", flexDirection: "column", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
        <div style={{ padding: "28px 24px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid rgba(212, 175, 55, 0.2)` }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shirt size={22} color="#000" />
          </div>
          <div>
            <h1 className="pf" style={{ fontSize: 17, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", margin: 0 }}>{settings.shopName}</h1>
            <p style={{ fontSize: 9, color: C.accent, fontWeight: 800, margin: 0, letterSpacing: "1px" }}>CUSTOMER CLUB</p>
          </div>
        </div>
        
        <nav style={{ padding: "20px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                style={{ 
                  width: "100%", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 12, 
                  padding: "12px 16px", 
                  borderRadius: 12, 
                  textAlign: "left", 
                  color: isActive ? "#000" : "#fff", 
                  background: isActive ? C.accent : "transparent",
                  fontWeight: 700, 
                  fontSize: 14, 
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <div style={{ padding: "16px 20px", borderTop: `1px solid rgba(212, 175, 55, 0.2)`, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 16, color: "#000" }}>👤</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="pf" style={{ color: "#fff", fontWeight: 800, fontSize: 13, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.displayName || profile?.name || "Customer"}</p>
              <p style={{ fontSize: 10, color: C.accent, margin: 0 }}>{loyaltyPoints} Pts Available</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 10, background: `${C.red}22`, color: C.red, fontWeight: 800, fontSize: 13, border: "none", cursor: "pointer", transition: "0.2s" }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* ----------------- MAIN APP BODY ----------------- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* Mobile Header */}
        <header style={{ display: window.innerWidth >= 768 ? "none" : "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#000", borderBottom: `1px solid ${C.accent}`, position: "sticky", top: 0, zIndex: 100 }}>
          <button onClick={() => setDrawerOpen(true)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>
            <Menu size={24} />
          </button>
          <div style={{ textAlign: "center" }}>
            <span className="pf" style={{ fontWeight: 900, fontSize: 18, color: "#fff", letterSpacing: "-0.5px" }}>{settings.shopName}</span>
            <span style={{ fontSize: 8, color: C.accent, fontWeight: 800, display: "block", marginTop: -2, letterSpacing: "1px" }}>CUSTOMER CLUB</span>
          </div>
          <div style={{ width: 24 }} />
        </header>

        {/* Sliding Mobile Drawer Navigation */}
        <AnimatePresence>
          {drawerOpen && (
            <div 
              style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", background: "rgba(0,0,0,0.5)" }} 
              onClick={() => setDrawerOpen(false)}
            >
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                style={{ width: 280, background: "#000", height: "100%", display: "flex", flexDirection: "column", borderRight: `1px solid ${C.accent}` }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ padding: "30px 24px 20px", borderBottom: `1px solid rgba(212, 175, 55, 0.2)` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Shirt size={24} color="#000" />
                    </div>
                    <button onClick={() => setDrawerOpen(false)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>
                      <X size={20} />
                    </button>
                  </div>
                  <h3 className="pf" style={{ color: "#fff", fontWeight: 800, fontSize: 18, margin: 0 }}>{profile?.displayName || profile?.name}</h3>
                  <p style={{ color: C.accent, fontSize: 11, fontWeight: 700, margin: "4px 0 0" }}>Member ID: {profile?.phone}</p>
                </div>
                
                <div style={{ padding: "14px 10px", flex: 1, overflowY: "auto" }}>
                  {menuItems.map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => { setActiveTab(item.id as any); setDrawerOpen(false); }}
                      style={{ 
                        width: "100%", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 12, 
                        padding: "12px 14px", 
                        borderRadius: 12, 
                        marginBottom: 4, 
                        textAlign: "left", 
                        color: activeTab === item.id ? "#000" : "#fff", 
                        fontWeight: 700, 
                        fontSize: 14, 
                        border: "none", 
                        background: activeTab === item.id ? C.accent : "transparent", 
                        cursor: "pointer" 
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
                    </button>
                  ))}
                </div>

                <div style={{ padding: "16px 20px", borderTop: `1px solid rgba(212, 175, 55, 0.2)` }}>
                  <button onClick={onLogout}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, color: C.red, fontWeight: 700, fontSize: 14, border: "none", background: `${C.red}15`, cursor: "pointer" }}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Tab Display Body */}
        <main style={{ flex: 1, padding: "24px 20px 100px", overflowY: "auto", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <AnimatePresence mode="wait">
            
            {/* TABS COMPONENT SWITCHER */}

            {/* 1. HOME TAB */}
            {activeTab === "home" && (
              <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Premium Banner */}
                <div style={{ background: "linear-gradient(135deg, #0A1F44 0%, #000 100%)", borderRadius: 24, padding: "40px 24px", border: `2px solid ${C.accent}`, position: "relative", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <span style={{ color: C.accent, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px" }}>Exclusive Club Offer</span>
                    <h2 className="pf" style={{ fontSize: 30, fontWeight: 900, color: "#fff", marginTop: 8, marginBottom: 12, lineHeight: 1.2 }}>LUXURY FASHION &<br />SEASONAL FESTIVALS</h2>
                    <p style={{ color: "#eee", fontSize: 14, maxWidth: 320, lineHeight: 1.5, marginBottom: 20 }}>Browse premium shirts, custom wear, and ethnic catalogs. Place instant reservations now.</p>
                    <button onClick={() => setActiveTab("products")} style={{ background: C.accent, color: "#000", border: "none", padding: "12px 24px", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px" }}>Shop Collection →</button>
                  </div>
                  <div style={{ position: "absolute", right: -30, bottom: -30, opacity: 0.15, transform: "rotate(-15deg)" }}>
                    <Shirt size={240} color={C.accent} />
                  </div>
                </div>

                {/* Account Points Preview */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ background: C.card, borderRadius: 20, padding: 18, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Award size={24} color={C.accent} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, margin: 0 }}>Loyalty Balance</p>
                      <p className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.dark, margin: 0 }}>{loyaltyPoints} Pts</p>
                    </div>
                  </div>
                  <div style={{ background: C.card, borderRadius: 20, padding: 18, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.green}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ShoppingBag size={24} color={C.green} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, margin: 0 }}>Total Purchases</p>
                      <p className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.green, margin: 0 }}>₹{totalPurchase.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>

                {/* Promo Spotlight Banner */}
                <div 
                  onClick={() => setActiveTab("offers")}
                  style={{ background: "#FFFBF0", borderRadius: 20, padding: "18px 24px", border: `1.5px dashed ${C.accent}`, display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}
                >
                  <span style={{ fontSize: 28 }}>✨</span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: C.dark, margin: 0 }}>Flat 50% Off Vouchers Active</h4>
                    <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>Check your special code keys in the Offers tab. Redeem points at checkouts!</p>
                  </div>
                  <ChevronRight size={18} color={C.accent} />
                </div>

                {/* Latest Arrivals horizontal track */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 className="pf" style={{ fontSize: 18, fontWeight: 900, color: C.dark, margin: 0 }}>New Arrivals</h3>
                    <button onClick={() => setActiveTab("products")} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>View Catalog</button>
                  </div>
                  
                  {products.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
                      <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>No items in stock.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12 }} className="no-scrollbar">
                      {products.slice(0, 6).map(p => {
                        const isWish = isProductWishlisted(p.id);
                        return (
                          <div 
                            key={p.id} 
                            style={{ background: C.card, borderRadius: 18, padding: 14, border: `1px solid ${C.border}`, minWidth: 190, width: 190, flexShrink: 0, position: "relative", boxShadow: "0 4px 10px rgba(0,0,0,0.01)" }}
                          >
                            <button 
                              onClick={() => toggleWishlist(p.id)}
                              style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.8)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}
                            >
                              <Heart size={16} fill={isWish ? C.red : "none"} color={isWish ? C.red : C.muted} />
                            </button>
                            <div 
                              onClick={() => setSelectedProduct(p)}
                              style={{ width: "100%", height: 150, borderRadius: 12, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 12, cursor: "pointer" }}
                            >
                              {p.image ? (
                                <img src={p.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={p.name} />
                              ) : (
                                <Shirt size={40} color={C.muted} />
                              )}
                            </div>
                            <span style={{ fontSize: 9, color: C.accent, fontWeight: 800, textTransform: "uppercase" }}>{p.brand || "Shiv Western"}</span>
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: C.dark, margin: "2px 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h4>
                            <p className="pf" style={{ fontSize: 15, fontWeight: 900, color: C.dark, margin: 0 }}>₹{(p.price || p.sellingPrice || 0).toLocaleString("en-IN")}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 2. PRODUCTS CATALOG TAB */}
            {activeTab === "products" && (
              <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Search */}
                <div style={{ background: C.card, borderRadius: 18, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, border: `1px solid ${C.border}` }}>
                  <Search size={18} color={C.muted} />
                  <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search premium collections, sizes, brand..." 
                    style={{ border: "none", outline: "none", flex: 1, background: "transparent", color: C.dark, fontWeight: 600, fontSize: 14 }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>✕</button>
                  )}
                </div>

                {/* Categories */}
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
                    <p style={{ fontSize: 15, fontWeight: 700, color: C.dark, margin: 0 }}>No items match your criteria</p>
                    <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Try clearing search queries or checking other categories.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: 16 }}>
                    {filteredProducts.map(p => {
                      const isWish = isProductWishlisted(p.id);
                      return (
                        <div 
                          key={p.id}
                          style={{ background: C.card, borderRadius: 20, padding: 12, border: `1px solid ${C.border}`, position: "relative", boxShadow: "0 4px 10px rgba(0,0,0,0.01)" }}
                        >
                          <button 
                            onClick={() => toggleWishlist(p.id)}
                            style={{ position: "absolute", top: 18, right: 18, background: "rgba(255,255,255,0.8)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                          >
                            <Heart size={15} fill={isWish ? C.red : "none"} color={isWish ? C.red : C.muted} />
                          </button>
                          <div 
                            onClick={() => setSelectedProduct(p)}
                            style={{ width: "100%", height: 130, borderRadius: 12, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 10, cursor: "pointer" }}
                          >
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
                            <span style={{ fontSize: 9, color: p.stock && p.stock > 0 ? C.green : C.red, fontWeight: 800 }}>
                              {p.stock && p.stock > 0 ? "In Stock" : "Out of Stock"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. OFFERS TAB */}
            {activeTab === "offers" && (
              <motion.div key="offers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <h3 className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.dark, margin: 0 }}>Club Member Vouchers</h3>
                  <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 16px" }}>Use these coupon codes during billing counters to save extra</p>
                </div>

                {/* Offer Card 1 */}
                <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: 20, padding: 20, border: `2px solid ${C.accent}`, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}>
                  <div>
                    <span style={{ background: C.accent, color: "#000", fontSize: 10, padding: "4px 10px", borderRadius: 100, fontWeight: 800, textTransform: "uppercase" }}>Season Sale</span>
                    <h4 className="pf" style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "10px 0 4px" }}>FLAT 50% OFF</h4>
                    <p style={{ fontSize: 11, color: C.accent, margin: 0 }}>On purchase of second selected item</p>
                  </div>
                  <div style={{ textAlign: "center", borderLeft: `1px dashed rgba(212, 175, 55, 0.4)`, paddingLeft: 20 }}>
                    <p style={{ fontSize: 10, color: "#ccc", margin: 0 }}>PROMO CODE</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: C.accent, marginTop: 4, letterSpacing: "1px" }}>SHIVW50</p>
                  </div>
                </div>

                {/* Offer Card 2 */}
                <div style={{ background: "linear-gradient(135deg, #111827 0%, #374151 100%)", borderRadius: 20, padding: 20, border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
                  <div>
                    <span style={{ background: C.green, color: "#fff", fontSize: 10, padding: "4px 10px", borderRadius: 100, fontWeight: 800, textTransform: "uppercase" }}>Loyalty Reward</span>
                    <h4 className="pf" style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "10px 0 4px" }}>EXTRA ₹200 CASHBACK</h4>
                    <p style={{ fontSize: 11, color: "#ddd", margin: 0 }}>Redeem 100 loyalty points key at counter</p>
                  </div>
                  <div style={{ textAlign: "center", borderLeft: `1px dashed rgba(255,255,255,0.2)`, paddingLeft: 20 }}>
                    <p style={{ fontSize: 10, color: "#ccc", margin: 0 }}>PROMO CODE</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: C.green, marginTop: 4, letterSpacing: "1px" }}>LOYAL20</p>
                  </div>
                </div>

                {/* Loyalty Rules Card */}
                <div style={{ background: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
                  <h4 className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.dark, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <Award size={20} color={C.accent} />
                    Loyalty Reward Policies
                  </h4>
                  <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, color: C.muted, display: "flex", flexDirection: "column", gap: 10, lineHeight: 1.4 }}>
                    <li>Get **1 Loyalty Point** for every **₹100** spent on final invoice totals.</li>
                    <li>Points automatically sync to your mobile number ledger on counter invoicing.</li>
                    <li>Points can be redeemed for instant bill discounts: **1 point = ₹1 flat deduction**.</li>
                    <li>To claim code benefits, simply mention your registered mobile number to billing staff at the store checkout.</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* 4. WISHLIST TAB */}
            {activeTab === "wishlist" && (
              <motion.div key="wishlist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <h3 className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.dark, margin: 0 }}>My Saved Wishlist</h3>
                  <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 16px" }}>Clothing items you bookmarked to reserve or purchase later</p>
                </div>

                {wishlistedProducts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", border: `2px dashed ${C.border}`, borderRadius: 24 }}>
                    <Heart size={44} color={C.muted} style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: C.dark, margin: 0 }}>Your Wishlist is Empty</p>
                    <p style={{ fontSize: 12, color: C.muted, marginTop: 4, marginBottom: 20 }}>Add products from the catalog by clicking the heart button.</p>
                    <button 
                      onClick={() => setActiveTab("products")}
                      style={{ background: C.dark, color: C.accent, border: `1px solid ${C.accent}`, padding: "12px 24px", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: 16 }}>
                    {wishlistedProducts.map(p => (
                      <div 
                        key={p.id}
                        style={{ background: C.card, borderRadius: 20, padding: 12, border: `1px solid ${C.border}`, position: "relative" }}
                      >
                        <button 
                          onClick={() => toggleWishlist(p.id)}
                          style={{ position: "absolute", top: 18, right: 18, background: "rgba(255,255,255,0.8)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}
                        >
                          <Heart size={15} fill={C.red} color={C.red} />
                        </button>
                        <div 
                          onClick={() => setSelectedProduct(p)}
                          style={{ width: "100%", height: 130, borderRadius: 12, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 10, cursor: "pointer" }}
                        >
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
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }}
                            style={{ background: C.dark, border: `1px solid ${C.accent}`, color: C.accent, fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
                          >
                            Reserve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* 5. MY BILLS TAB */}
            {activeTab === "bills" && (
              <motion.div key="bills" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <h3 className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.dark, margin: 0 }}>My Invoices & Bills</h3>
                  <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 16px" }}>Digital receipts for purchases made at Shiv Western Club</p>
                </div>

                {customerBills.length === 0 ? (
                  <div style={{ padding: "40px 20px", background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, textAlign: "center" }}>
                    <FileText size={36} color={C.muted} style={{ margin: "0 auto 12px" }} />
                    <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>No invoices found for mobile: {profile.phone}</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {customerBills.map(bill => (
                      <div key={bill.id} style={{ background: C.card, borderRadius: 16, padding: 18, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span className="pf" style={{ fontSize: 14, fontWeight: 900, color: C.dark }}>Invoice #{bill.id}</span>
                            <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{bill.date}</span>
                          </div>
                          <span className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.green }}>₹{bill.total.toLocaleString("en-IN")}</span>
                        </div>
                        
                        <p style={{ fontSize: 12, color: C.muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {bill.items.map(it => `${it.name} (Qty: ${it.qty})`).join(", ")}
                        </p>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${C.bg}`, marginTop: 4 }}>
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
                              title="Download PDF Receipts"
                            >
                              <Download size={14} />
                            </button>
                            <button 
                              onClick={() => handleShareInvoice(bill)}
                              style={{ background: C.bg, border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: C.dark, cursor: "pointer" }}
                              title="Share Receipt on WhatsApp"
                            >
                              <Share2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* 6. PURCHASE HISTORY TAB */}
            {activeTab === "history" && (
              <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <h3 className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.dark, margin: 0 }}>Itemized Purchase History</h3>
                  <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 16px" }}>Detailed list of all individual clothing items you have bought in the past</p>
                </div>

                {purchasedItems.length === 0 ? (
                  <div style={{ padding: "40px 20px", background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, textAlign: "center" }}>
                    <ClipboardList size={36} color={C.muted} style={{ margin: "0 auto 12px" }} />
                    <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>No item purchase logs found.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {purchasedItems.map((item, idx) => (
                      <div key={idx} style={{ background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, display: "flex", gap: 14, alignItems: "center" }}>
                        <div style={{ width: 50, height: 50, borderRadius: 10, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.border}`, flexShrink: 0 }}>
                          <Shirt size={24} color={C.accent} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 750, color: C.dark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</h4>
                            <span className="pf" style={{ fontSize: 14, fontWeight: 900, color: C.green, flexShrink: 0 }}>₹{item.price.toLocaleString("en-IN")}</span>
                          </div>
                          <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>Brand: {item.brand} | Size: {item.size || "Default"} | Color: {item.color || "Default"}</p>
                          
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 6, borderTop: `1px dashed ${C.bg}` }}>
                            <span style={{ fontSize: 10, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                              <Calendar size={12} /> {item.date} (Invoice #{item.billId})
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: C.dark }}>Qty: {item.qty}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleEnquiryHistoryItem(item)}
                          style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                          title="Ask to buy again / Check stock"
                        >
                          <Phone size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* 7. PROFILE TAB */}
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Premium Golden Card */}
                <div style={{ background: "linear-gradient(135deg, #0A1F44 0%, #000 100%)", borderRadius: 24, padding: 24, border: `2px solid ${C.accent}`, color: "#fff", position: "relative", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
                  <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
                      <User size={30} color="#000" />
                    </div>
                    <div>
                      <h3 className="pf" style={{ fontSize: 19, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>{profile.displayName || profile.name}</h3>
                      <p style={{ fontSize: 13, color: C.accent, margin: "2px 0 0", fontWeight: 700 }}>📞 {profile.phone}</p>
                    </div>
                  </div>
                  <div style={{ marginTop: 24, background: "rgba(255,255,255,0.06)", padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: 10, color: "#ccc", textTransform: "uppercase", margin: 0 }}>Total Spends Value</p>
                      <p className="pf" style={{ fontSize: 18, fontWeight: 900, color: C.accent, margin: "2px 0 0" }}>₹{totalPurchase.toLocaleString("en-IN")}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 10, color: "#ccc", textTransform: "uppercase", margin: 0 }}>Points Available</p>
                      <p className="pf" style={{ fontSize: 18, fontWeight: 900, color: C.accent, margin: "2px 0 0" }}>{loyaltyPoints} Pts</p>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div style={{ background: C.card, borderRadius: 20, padding: 20, border: `1px solid ${C.border}` }}>
                  <h4 className="pf" style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 14 }}>Edit Contact Details</h4>
                  <form onSubmit={handleUpdateProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Full Name</label>
                      <input 
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="e.g. John Doe"
                        required
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.dark, fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Delivery / Billing Address</label>
                      <input 
                        value={editAddress}
                        onChange={e => setEditAddress(e.target.value)}
                        placeholder="e.g. Flat 101, Galaxy Complex, Ahmedabad"
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.dark, fontWeight: 600 }}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSavingProfile}
                      style={{ width: "100%", background: C.dark, color: C.accent, border: `1.5px solid ${C.accent}`, padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", marginTop: 4 }}
                    >
                      {isSavingProfile ? "Saving..." : "UPDATE DETAILS ✓"}
                    </button>
                  </form>
                </div>

                {/* Reservations List */}
                <div>
                  <h4 className="pf" style={{ fontSize: 16, fontWeight: 900, color: C.dark, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <ClipboardList size={18} color={C.accent} />
                    My Reservations
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
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* ----------------- MOBILE BOTTOM NAVIGATION ----------------- */}
        <div style={{ display: window.innerWidth >= 768 ? "none" : "flex", borderTop: `1px solid ${C.border}`, background: C.card, position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -4px 20px rgba(0,0,0,0.03)" }}>
          {[
            { id: "home", icon: "🏠", label: "Home" },
            { id: "products", icon: "🛍️", label: "Catalog" },
            { id: "wishlist", icon: "❤️", label: "Wishlist" },
            { id: "bills", icon: "📄", label: "Bills" },
            { id: "profile", icon: "👤", label: "Profile" }
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
