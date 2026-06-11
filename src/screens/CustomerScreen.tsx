import React, { useState, useMemo, useCallback } from "react";
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
  FileText,
  ShoppingCart,
  Plus,
  Minus,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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

interface GuestGatingProps {
  tabName: string;
  onLogout: () => void;
}

const GuestGatingPrompt = ({ tabName, onLogout }: GuestGatingProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    style={{ 
      padding: "60px 24px", 
      background: "linear-gradient(135deg, #0A1F44 0%, #000 100%)",
      borderRadius: 24, 
      border: `2px solid ${C.accent}`,
      textAlign: "center",
      boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      maxWidth: 480,
      margin: "40px auto 0"
    }}
  >
    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(212, 175, 55, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${C.accent}`, marginBottom: 8 }}>
      <User size={32} color={C.accent} />
    </div>
    <h3 className="pf" style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0 }}>Login Required</h3>
    <p style={{ fontSize: 13, color: "#ccc", lineHeight: 1.5, maxWidth: 360, margin: 0 }}>
      You are currently browsing as a guest. Please create an account or log in to view your {tabName}, claim exclusive loyalty points, and make reservations.
    </p>
    <button 
      onClick={onLogout}
      style={{ 
        background: C.accent, 
        color: "#000", 
        border: "none", 
        padding: "14px 28px", 
        borderRadius: 12, 
        fontSize: 14, 
        fontWeight: 800, 
        cursor: "pointer", 
        textTransform: "uppercase", 
        letterSpacing: "0.5px", 
        marginTop: 8,
        boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)"
      }}
    >
      Log In / Register Now
    </button>
  </motion.div>
);

const SLIDES = [
  {
    id: 1,
    tag: "Urban Menswear",
    headline: "Oversized\nT-Shirts",
    sub: "Gen-Z Approved Drop-Shoulder Tees — Starting at ₹349",
    cta: "Shop Now",
    ctaLink: "/oversized-tees",
    bg: "linear-gradient(135deg, #0e1e38 0%, #1a365d 50%, #0e1e38 100%)",
    accent: "#F4C430",
    imgEmoji: "👕",
    badge: "Trending",
  },
  {
    id: 2,
    tag: "Printed & Casuals",
    headline: "Premium\nCasual Shirts",
    sub: "100% Breathable Cotton & Linen Shirts — Flat 25% Off",
    cta: "Shop Now",
    ctaLink: "/casual-shirts",
    bg: "linear-gradient(135deg, #1b0c2a 0%, #351a4f 50%, #1b0c2a 100%)",
    accent: "#E5A93C",
    imgEmoji: "👔",
    badge: "Hot Deal",
  },
  {
    id: 3,
    tag: "Bottomwear Specials",
    headline: "Chinos &\nCargo Pants",
    sub: "Comfort Fit Trousers & Jeans — Halvad's Finest In Stock",
    cta: "Shop Now",
    ctaLink: "/formal-trousers",
    bg: "linear-gradient(135deg, #181c15 0%, #2e3629 50%, #181c15 100%)",
    accent: "#C2A649",
    imgEmoji: "👖",
    badge: "New In",
  },
];

export const CustomerScreen = ({
  products,
  settings,
  bills,
  profile,
  orders = [],
  categories: syncedCategories = [],
  banners = [],
  onLogout,
  onUpdateProfile,
  onCreateOrder
}: {
  products: CatalogProduct[],
  settings: Settings,
  bills: Bill[],
  profile: any,
  orders?: Order[],
  categories?: any[],
  banners?: any[],
  onLogout: (startRegister?: boolean) => void,
  onUpdateProfile: (p: any) => void,
  onCreateOrder: (order: any) => Promise<void>
}) => {
  const [activeTab, setActiveTab] = useState<"home" | "products" | "offers" | "profile" | "bills" | "history" | "wishlist" | "cart">("home");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedGender, setSelectedGender] = useState<"All" | "Men" | "Women">("All");
  const [sortBy, setSortBy] = useState<"default" | "newest">("default");
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidePaused, setSlidePaused] = useState(false);

  const activeBanners = useMemo(() => {
    return banners && banners.length > 0 ? banners : SLIDES;
  }, [banners]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((c) => (c + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((c) => (c - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  React.useEffect(() => {
    if (slidePaused) return;
    const t = setInterval(nextSlide, 5000);
    return () => clearInterval(t);
  }, [slidePaused, nextSlide]);

  const handleCtaClick = (ctaLink: string) => {
    setActiveTab("products");
    setSelectedGender("All");
    setSortBy("default");

    if (ctaLink === "/oversized-tees") {
      setSelectedCategory("T-Shirt");
      setSearchQuery("oversized");
    } else if (ctaLink === "/casual-shirts") {
      setSelectedCategory("Shirt");
      setSearchQuery("casual");
    } else if (ctaLink === "/formal-trousers") {
      setSelectedCategory("Trouser");
      setSearchQuery("formal");
    } else {
      setSelectedCategory("All");
      setSearchQuery("");
    }
  };
  
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  
  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  React.useEffect(() => {
    if (activeTab === "cart") {
      setIsCartOpen(true);
      setActiveTab("home");
    }
  }, [activeTab]);

  const getProductPriceInfo = (p: any) => {
    const finalPrice = p.sellingPrice || p.price || 0;
    // If sellingPrice exists and price is higher, price is MRP.
    // Otherwise calculate a D2C-styled MRP.
    let mrp = p.price && p.sellingPrice && p.price > p.sellingPrice ? p.price : 0;
    if (!mrp) {
      mrp = Math.round(finalPrice * 2.2); // ~55% discount simulation
    }
    const discountPct = Math.round(((mrp - finalPrice) / mrp) * 100);
    return { finalPrice, mrp, discountPct };
  };
  
  // Profile editing
  const [editName, setEditName] = useState(profile?.displayName || profile?.name || "");
  const [editAddress, setEditAddress] = useState(profile?.address || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("customer_cart") || "[]");
    } catch {
      return [];
    }
  });

  // Guest Conversion and Checkout states
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync cart to localStorage
  React.useEffect(() => {
    localStorage.setItem("customer_cart", JSON.stringify(cart));
  }, [cart]);

  const categoryFilters = useMemo(() => {
    if (!syncedCategories || syncedCategories.length === 0) {
      return ["All", "Shirt", "T-Shirt", "Jeans", "Trouser", "Winterwear", "Kurta", "Saree", "Ladies Wear", "Western Wear"];
    }
    return ["All", ...Array.from(new Set(syncedCategories.map(c => c.name)))];
  }, [syncedCategories]);

  // Filter bills for this customer
  const customerBills = useMemo(() => {
    if (!profile?.phone) return [];
    const profPhoneClean = String(profile.phone).replace(/\D/g, "").slice(-10);
    return bills.filter(b => {
      const billPhone = b?.customerObj?.phone;
      if (!billPhone) return false;
      return String(billPhone).replace(/\D/g, "").slice(-10) === profPhoneClean;
    });
  }, [bills, profile]);

  // Extract all individual clothing items purchased in the past
  const purchasedItems = useMemo(() => {
    const items: any[] = [];
    customerBills.forEach(bill => {
      if (bill && Array.isArray(bill.items)) {
        bill.items.forEach(item => {
          if (item && item.name) {
            // Find product details from products list if available for brand info
            const prod = products.find(p => p && p.name && String(p.name).toLowerCase() === String(item.name).toLowerCase());
            items.push({
              ...item,
              brand: prod?.brand || "Shiv Western Club",
              billId: bill.id,
              date: bill.date,
              timestamp: bill.timestamp || Date.now()
            });
          }
        });
      }
    });
    // Newest purchases first
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [customerBills, products]);

  // Total Purchase & Loyalty Points
  const totalPurchase = useMemo(() => {
    return customerBills.reduce((sum, b) => sum + (b.total || 0), 0);
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
    let result = products.filter(p => {
      if (!p) return false;
      const nameVal = String(p.name || '');
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      
      let matchesGender = true;
      if (selectedGender === "Men") {
        matchesGender = !["Saree", "Ladies Wear"].includes(p.category || "") &&
                        !String(p.name).toLowerCase().includes("women") &&
                        !String(p.name).toLowerCase().includes("girl") &&
                        !String(p.name).toLowerCase().includes("ladies");
      } else if (selectedGender === "Women") {
        matchesGender = ["Saree", "Ladies Wear"].includes(p.category || "") ||
                        String(p.name).toLowerCase().includes("women") ||
                        String(p.name).toLowerCase().includes("girl") ||
                        String(p.name).toLowerCase().includes("ladies") ||
                        String(p.name).toLowerCase().includes("sari") ||
                        String(p.name).toLowerCase().includes("kurti") ||
                        String(p.name).toLowerCase().includes("saree");
      }

      const q = String(searchQuery || '').toLowerCase();
      const matchesSearch = nameVal.toLowerCase().includes(q) || 
                            (p.brand && String(p.brand).toLowerCase().includes(q)) ||
                            (p.category && String(p.category).toLowerCase().includes(q)) ||
                            (p.sku && String(p.sku).toLowerCase().includes(q));
      return matchesCategory && matchesGender && matchesSearch;
    });

    if (sortBy === "newest") {
      result = [...result].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return result;
  }, [products, selectedCategory, selectedGender, searchQuery, sortBy]);

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
      customerAddress: profile.address || "",
      productId: product.id,
      productName: product.name,
      size: selectedSize,
      color: colorVal,
      price: product.price || product.sellingPrice,
      qty: 1,
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

  const addToCart = (product: any) => {
    if (!selectedSize) {
      alert("Please select a size!");
      return;
    }
    const colors = product.color ? product.color.split(",").map((c: string) => c.trim()) : [];
    const colorVal = selectedColor || (colors.length > 0 ? colors[0] : "Default");

    const existingIndex = cart.findIndex(
      item => item.id === product.id && item.size === selectedSize && item.color === colorVal
    );

    let updatedCart;
    if (existingIndex > -1) {
      updatedCart = [...cart];
      updatedCart[existingIndex].qty += 1;
    } else {
      updatedCart = [...cart, {
        id: product.id,
        name: product.name,
        price: product.price || product.sellingPrice,
        size: selectedSize,
        color: colorVal,
        image: product.image,
        brand: product.brand,
        qty: 1
      }];
    }

    setCart(updatedCart);
    setSelectedProduct(null);
    setSelectedSize("");
    setSelectedColor("");
    setIsCartOpen(true);
  };

  const handleQuickAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    
    const sizes = product.size ? product.size.split(",").map((s: string) => s.trim()) : ["M"];
    const defaultSize = sizes[0] || "M";
    
    const colors = product.color ? product.color.split(",").map((c: string) => c.trim()) : ["Standard"];
    const defaultColor = colors[0] || "Standard";

    const existingIndex = cart.findIndex(
      item => item.id === product.id && item.size === defaultSize && item.color === defaultColor
    );

    let updatedCart;
    if (existingIndex > -1) {
      updatedCart = [...cart];
      updatedCart[existingIndex].qty += 1;
    } else {
      updatedCart = [...cart, {
        id: product.id,
        name: product.name,
        price: product.price || product.sellingPrice,
        size: defaultSize,
        color: defaultColor,
        image: product.image,
        brand: product.brand,
        qty: 1
      }];
    }

    setCart(updatedCart);
    setIsCartOpen(true);
  };

  const updateCartQty = (productId: string, size: string, color: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.id === productId && item.size === size && item.color === color) {
        const newQty = item.qty + delta;
        return { ...item, qty: Math.max(1, newQty) };
      }
      return item;
    });
    setCart(updated);
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    const updated = cart.filter(
      item => !(item.id === productId && item.size === size && item.color === color)
    );
    setCart(updated);
  };

  const handleCartCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    let custName = "";
    let custPhone = "";
    let custAddress = "";

    if (profile.isGuest) {
      if (!guestName.trim() || !guestPhone.trim()) {
        alert("Please enter your Name and Mobile Number for guest checkout.");
        return;
      }
      custName = guestName.trim();
      custPhone = guestPhone.trim();
      custAddress = guestAddress.trim();
    } else {
      custName = profile.displayName || profile.name || "Customer";
      custPhone = profile.phone;
      custAddress = profile.address || "";
    }

    setIsPlacingOrder(true);
    try {
      // Create a reservation for each cart item
      const promises = cart.map(item => {
        const orderData = {
          customerId: profile.uid,
          customerName: custName,
          customerPhone: custPhone,
          customerAddress: custAddress || "",
          productId: item.id,
          productName: item.name,
          size: item.size,
          color: item.color,
          price: item.price,
          qty: item.qty || 1,
          status: "Reserved" as const,
          createdAt: Date.now()
        };
        return onCreateOrder(orderData);
      });

      await Promise.all(promises);
      alert(`🎉 Checkout Successful!\nYour ${cart.length} items have been reserved. Please visit the store billing counter to complete your purchase.`);
      
      // Clear cart
      setCart([]);
      setCheckoutMode(false);
      setGuestName("");
      setGuestPhone("");
      setGuestAddress("");
      setIsCartOpen(false);

      if (!profile.isGuest) {
        setActiveTab("profile"); // Switch to profile to check reservations
      } else {
        setActiveTab("home");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to place reservations. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleEnquiry = (product: any) => {
    const sizeStr = selectedSize ? `Size: ${selectedSize}` : "Size: Any";
    const colorStr = selectedColor ? `Color: ${selectedColor}` : "Color: Any";
    const text = encodeURIComponent(`Hi! I'm interested in the "${product.name}" from ${product.brand || "Shiv Western Club"}.\n\nCategory: ${product.category || "General"}\n${sizeStr}\n${colorStr}\nPrice: ₹${product.price || product.sellingPrice}\n\nIs this item available in stock?`);
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

  const headerNavItems = [
    { id: "shirts", label: "Shirts" },
    { id: "t-shirts", label: "T-Shirts" },
    { id: "jeans", label: "Jeans" },
    { id: "trousers", label: "Trousers" },
    { id: "winterwear", label: "Winterwear" }
  ];

  const mobileDrawerItems = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "shirts", label: "Shirts", icon: "👔" },
    { id: "t-shirts", label: "T-Shirts", icon: "👕" },
    { id: "jeans", label: "Jeans", icon: "👖" },
    { id: "trousers", label: "Trousers", icon: "👖" },
    { id: "winterwear", label: "Winterwear", icon: "🧥" },
    { id: "wishlist", label: "Wishlist", icon: "❤️" },
    { id: "cart", label: `My Cart ${cart.length > 0 ? `(${cart.reduce((sum, item) => sum + item.qty, 0)})` : ""}`, icon: "🛒" },
    { id: "profile", label: "My Profile", icon: "👤" },
    { id: "bills", label: "My Bills", icon: "📄" },
    { id: "history", label: "Purchase History", icon: "🕒" }
  ];

  const handleNavClick = (menuId: string) => {
    setActiveTab("products");
    setSelectedGender("All");
    setSortBy("default");

    if (menuId === "shirts") {
      setSelectedCategory("Shirt");
    } else if (menuId === "t-shirts") {
      setSelectedCategory("T-Shirt");
    } else if (menuId === "jeans") {
      setSelectedCategory("Jeans");
    } else if (menuId === "trousers") {
      setSelectedCategory("Trouser");
    } else if (menuId === "winterwear") {
      setSelectedCategory("Winterwear");
    }
  };

  const isNavActive = (menuId: string) => {
    if (activeTab !== "products") return false;
    if (menuId === "shirts") return selectedCategory === "Shirt";
    if (menuId === "t-shirts") return selectedCategory === "T-Shirt";
    if (menuId === "jeans") return selectedCategory === "Jeans";
    if (menuId === "trousers") return selectedCategory === "Trouser";
    if (menuId === "winterwear") return selectedCategory === "Winterwear";
    return false;
  };

  const handleMobileDrawerClick = (itemId: string) => {
    setDrawerOpen(false);
    if (["shirts", "t-shirts", "jeans", "trousers", "winterwear"].includes(itemId)) {
      handleNavClick(itemId);
    } else {
      if (itemId === "home") {
        setSelectedCategory("All");
        setSelectedGender("All");
        setSortBy("default");
      }
      setActiveTab(itemId as any);
    }
  };

  const renderProductCard = (p: CatalogProduct) => {
    const isWish = isProductWishlisted(p.id);
    const { finalPrice, mrp, discountPct } = getProductPriceInfo(p);
    
    return (
      <div 
        key={p.id} 
        style={{ 
          background: "#FFFFFF", 
          borderRadius: 22, 
          padding: 14, 
          border: "1px solid rgba(0,0,0,0.05)", 
          position: "relative",
          cursor: "pointer"
        }}
        className="prod-card shadow-hover shadow-soft"
        onClick={() => setSelectedProduct(p)}
      >
        {/* Wishlist Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
          style={{ 
            position: "absolute", 
            top: 22, 
            right: 22, 
            background: "#FFFFFF", 
            border: "none", 
            borderRadius: "50%", 
            width: 32, 
            height: 32, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            cursor: "pointer", 
            zIndex: 10, 
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)" 
          }}
        >
          <Heart size={16} fill={isWish ? "#E63946" : "none"} color={isWish ? "#E63946" : "#777777"} />
        </button>

        {/* Image Container with Add to Cart Overlay */}
        <div 
          style={{ 
            width: "100%", 
            height: isDesktop ? 220 : 170, 
            borderRadius: 16, 
            background: "#F5F5F3", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            overflow: "hidden", 
            marginBottom: 12, 
            border: "1px solid rgba(0,0,0,0.02)",
            position: "relative"
          }}
        >
          {p.image ? (
            <img src={p.image} className="product-image-zoom" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={p.name} />
          ) : (
            <Shirt size={44} color="#888888" strokeWidth={1.5} />
          )}

          {/* Quick Add to Cart Hover Button */}
          <button 
            className="prod-add-to-cart-btn"
            onClick={(e) => handleQuickAddToCart(e, p)}
          >
            {profile.isGuest ? "🔑 Join to Buy" : "🛒 Add to Cart"}
          </button>
        </div>

        {/* Content details */}
        <div>
          <span style={{ fontSize: 9, color: "#888888", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>{p.brand || "SHIV WESTERN"}</span>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "#111111", margin: "2px 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h4>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span className="pf" style={{ fontSize: 15, fontWeight: 900, color: "#111111" }}>₹{finalPrice.toLocaleString("en-IN")}</span>
            {mrp > finalPrice && (
              <>
                <span style={{ fontSize: 11, textDecoration: "line-through", color: "#999999" }}>₹{mrp.toLocaleString("en-IN")}</span>
                <span style={{ fontSize: 10, color: "#2D6A4F", fontWeight: 800 }}>({discountPct}% OFF)</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

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
            onClick={() => addToCart(product)}
            style={{ flex: 1, background: C.dark, color: C.accent, border: `1.5px solid ${C.accent}`, padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {profile.isGuest ? "🔑 Join Club to Buy" : "🛒 Add to Cart"}
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

  const headerColor = "#111111";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#FFFFFF", color: "#111111" }}>
      
      {/* ----------------- TOP ANNOUNCEMENT BAR ----------------- */}
      <div style={{ 
        background: "#000000", 
        color: "#FFFFFF", 
        padding: "8px 16px", 
        fontSize: 10, 
        fontWeight: 800, 
        textAlign: "center", 
        textTransform: "uppercase", 
        letterSpacing: "1.5px",
        zIndex: 101
      }}>
        ⚡ Free Shipping on Orders above ₹999 | Cash on Delivery Available ⚡
      </div>

      {/* ----------------- STICKY TOP HEADER ----------------- */}
      <header style={{ 
        position: "sticky", 
        top: 0, 
        left: 0,
        right: 0,
        zIndex: 100, 
        background: "#FFFFFF", 
        backdropFilter: "blur(20px)", 
        WebkitBackdropFilter: "blur(20px)", 
        borderBottom: "1px solid rgba(0,0,0,0.06)", 
        boxShadow: isScrolled ? "0 4px 20px rgba(0,0,0,0.05)" : "none",
        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)"
      }}>
        <div style={{ 
          maxWidth: 1280, 
          margin: "0 auto", 
          padding: isDesktop ? "12px 24px" : "12px 16px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          gap: isDesktop ? 24 : 12 
        }}>
          
          {/* Left: Hamburger menu (mobile) & Brand Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            {!isDesktop && (
              <button 
                onClick={() => setDrawerOpen(true)} 
                style={{ background: "transparent", border: "none", color: headerColor, cursor: "pointer", padding: 0 }}
              >
                <Menu size={24} />
              </button>
            )}
            <div 
              onClick={() => {
                setActiveTab("home");
                setSelectedCategory("All");
                setSelectedGender("All");
                setSortBy("default");
                setSearchQuery("");
              }} 
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                <img src={settings.logo || "/logo.svg"} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <span className="pf" style={{ fontWeight: 900, fontSize: isDesktop ? 18 : 14, color: headerColor, letterSpacing: "1px", textTransform: "uppercase" }}>
                Shiv Western Club
              </span>
            </div>
          </div>

          {/* Center-Left: Navigation Links (Desktop only) */}
          {isDesktop && (
            <nav style={{ display: "flex", gap: 20 }}>
              {headerNavItems.map(item => {
                const isActive = isNavActive(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: isActive ? "#111111" : "#555555",
                      fontWeight: isActive ? 800 : 600,
                      fontSize: 13,
                      cursor: "pointer",
                      padding: "8px 0",
                      position: "relative",
                      transition: "color 0.2s",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}
                  >
                    {item.label}
                    {isActive && (
                      <motion.div 
                        layoutId="activeNavUnderline" 
                        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "#111111" }} 
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Middle: Search Bar (Desktop only) */}
          {isDesktop && (
            <div style={{ flex: 1, maxWidth: 320, position: "relative" }}>
              <input 
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== "products") setActiveTab("products");
                }}
                placeholder="Search entire store here..." 
                style={{ 
                  width: "100%", 
                  padding: "9px 12px 9px 38px", 
                  borderRadius: 8, 
                  border: "1px solid #E5E7EB", 
                  outline: "none", 
                  fontSize: 13, 
                  fontWeight: 500,
                  color: "#333333",
                  background: "#F8F9FB",
                  transition: "all 0.2s" 
                }}
                onFocus={e => {
                  e.target.style.borderColor = "#111111";
                  e.target.style.background = "#FFFFFF";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "#E5E7EB";
                  e.target.style.background = "#F8F9FB";
                }}
              />
              <Search 
                size={16} 
                color="#666666" 
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} 
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#999999",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Right: Wishlist, Profile, Cart */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            {/* Wishlist Button */}
            <button 
              onClick={() => setActiveTab("wishlist")}
              style={{ background: "none", border: "none", color: "#333333", cursor: "pointer", padding: 4, position: "relative", display: "flex", alignItems: "center" }}
              title="Wishlist"
            >
              <Heart size={22} fill={activeTab === "wishlist" ? "#E63946" : "none"} color={activeTab === "wishlist" ? "#E63946" : "#333333"} />
              {wishlist.length > 0 && (
                <span style={{ 
                  position: "absolute", 
                  top: -4, 
                  right: -4, 
                  background: "#111111", 
                  color: "#FFFFFF", 
                  borderRadius: "50%", 
                  width: 14, 
                  height: 14, 
                  fontSize: 8, 
                  fontWeight: 800, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Profile/Account dropdown/button */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => {
                  if (profile?.isGuest) {
                    onLogout(); // Directly open sign in screen
                  } else {
                    setShowAccountDropdown(!showAccountDropdown);
                  }
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#333333",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center"
                }}
                title={profile?.isGuest ? "Sign In" : "My Account"}
              >
                <User size={22} />
              </button>
              
              {!profile?.isGuest && showAccountDropdown && (
                <>
                  <div 
                    style={{ position: "fixed", inset: 0, zIndex: 90 }} 
                    onClick={() => setShowAccountDropdown(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "120%",
                      width: 180,
                      background: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 12,
                      boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
                      zIndex: 100,
                      padding: "6px 0",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <button
                      onClick={() => { setActiveTab("profile"); setShowAccountDropdown(false); }}
                      style={{ background: "none", border: "none", width: "100%", padding: "10px 16px", textAlign: "left", fontSize: 13, color: "#333", fontWeight: 600, cursor: "pointer" }}
                    >
                      👤 Profile
                    </button>
                    <button
                      onClick={() => { setActiveTab("bills"); setShowAccountDropdown(false); }}
                      style={{ background: "none", border: "none", width: "100%", padding: "10px 16px", textAlign: "left", fontSize: 13, color: "#333", fontWeight: 600, cursor: "pointer" }}
                    >
                      📄 My Bills
                    </button>
                    <button
                      onClick={() => { setActiveTab("history"); setShowAccountDropdown(false); }}
                      style={{ background: "none", border: "none", width: "100%", padding: "10px 16px", textAlign: "left", fontSize: 13, color: "#333", fontWeight: 600, cursor: "pointer" }}
                    >
                      📋 Order History
                    </button>
                    <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "4px 0" }} />
                    <button
                      onClick={() => { onLogout(); setShowAccountDropdown(false); }}
                      style={{ background: "none", border: "none", width: "100%", padding: "10px 16px", textAlign: "left", fontSize: 13, color: "#E63946", fontWeight: 700, cursor: "pointer" }}
                    >
                      🚪 Logout
                    </button>
                  </motion.div>
                </>
              )}
            </div>

            {/* Cart Button with badge */}
            <button 
              onClick={() => setIsCartOpen(true)}
              style={{ background: "none", border: "none", color: "#333333", cursor: "pointer", padding: 4, position: "relative", display: "flex", alignItems: "center" }}
              title="Cart"
            >
              <ShoppingCart size={22} color="#333333" />
              {cart.reduce((sum, item) => sum + item.qty, 0) > 0 && (
                <span style={{ 
                  position: "absolute", 
                  top: -4, 
                  right: -4, 
                  background: "#E63946", 
                  color: "#fff", 
                  borderRadius: "50%", 
                  width: 14, 
                  height: 14, 
                  fontSize: 8, 
                  fontWeight: 800, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  {cart.reduce((sum, item) => sum + item.qty, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Search Bar (Only on mobile) */}
      {!isDesktop && (
        <div style={{ padding: "0 16px 12px 16px", background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.06)", zIndex: 90 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input 
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (activeTab !== "products") setActiveTab("products");
              }}
              placeholder="Search entire store here..." 
              style={{ 
                width: "100%", 
                padding: "8px 12px 8px 36px", 
                borderRadius: 8, 
                border: "1px solid #E5E7EB", 
                outline: "none", 
                fontSize: 12, 
                fontWeight: 500,
                color: "#333333",
                background: "#F8F9FB"
              }}
            />
            <Search 
              size={16} 
              color="#666666" 
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} 
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#999999",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* ----------------- MOBILE SLIDING DRAWER ----------------- */}
      <AnimatePresence>
        {drawerOpen && (
          <div 
            style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} 
            onClick={() => setDrawerOpen(false)}
          >
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ width: 280, background: "#FFFFFF", height: "100%", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(0,0,0,0.08)", boxShadow: "20px 0 50px rgba(0,0,0,0.05)" }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: "30px 24px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <img src={settings.logo || "/logo.svg"} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                  <button onClick={() => setDrawerOpen(false)} style={{ background: "transparent", border: "none", color: "#111", cursor: "pointer" }}>
                    <X size={20} />
                  </button>
                </div>
                <h3 className="pf" style={{ color: "#111111", fontWeight: 850, fontSize: 18, margin: 0 }}>
                  {profile?.isGuest ? settings.shopName : (profile?.displayName || profile?.name)}
                </h3>
                {!profile?.isGuest && (
                  <p style={{ color: "#8B7355", fontSize: 11, fontWeight: 700, margin: "4px 0 0" }}>Member ID: {profile?.phone}</p>
                )}
              </div>
              
              <div style={{ padding: "14px 10px", flex: 1, overflowY: "auto" }}>
                {mobileDrawerItems.map(item => {
                  const isActive = item.id === "home" 
                    ? activeTab === "home"
                    : ["men", "women", "t-shirts", "shirts", "jeans", "new-arrivals"].includes(item.id)
                      ? isNavActive(item.id)
                      : activeTab === item.id;
                  return (
                    <button 
                      key={item.id} 
                      onClick={() => handleMobileDrawerClick(item.id)}
                      style={{ 
                        width: "100%", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 12, 
                        padding: "12px 14px", 
                        borderRadius: 12, 
                        marginBottom: 4, 
                        textAlign: "left", 
                        color: isActive ? "#000000" : "#555555", 
                        fontWeight: isActive ? 800 : 600, 
                        fontSize: 14, 
                        border: "none", 
                        background: isActive ? "#F3F4F6" : "transparent", 
                        cursor: "pointer" 
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
                    </button>
                  );
                })}
              </div>

              {!profile?.isGuest && (
                <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <button onClick={onLogout}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, color: "#E63946", fontWeight: 700, fontSize: 14, border: "none", background: "#FEF2F2", cursor: "pointer" }}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MAIN CONTENT BODY ----------------- */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        


        {/* Tab Display Body */}
        <main style={{ flex: 1, padding: "24px 20px 100px", overflowY: "auto", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <AnimatePresence mode="wait">
            
            {/* TABS COMPONENT SWITCHER */}

            {/* 1. HOME TAB */}
            {activeTab === "home" && (
              <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                
                {/* Premium Carousel Hero Banner */}
                <div
                  style={{
                    position: "relative",
                    height: isDesktop ? 520 : 420,
                    borderRadius: 24,
                    overflow: "hidden",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
                  }}
                  onMouseEnter={() => setSlidePaused(true)}
                  onMouseLeave={() => setSlidePaused(false)}
                >
                  {activeBanners.map((slide, i) => {
                    const active = i === currentSlide;
                    return (
                      <div
                        key={slide.id || i}
                        style={{
                          position: "absolute",
                          inset: 0,
                          opacity: active ? 1 : 0,
                          transition: "opacity 0.7s ease",
                          background: slide.bg.startsWith("data:") || slide.bg.startsWith("http") ? `url(${slide.bg}) center center / cover no-repeat` : slide.bg,
                          display: "flex",
                          alignItems: "center",
                          overflow: "hidden",
                          pointerEvents: active ? "auto" : "none",
                        }}
                      >
                        {/* Fabric texture overlay */}
                        <div style={{
                          position: "absolute",
                          inset: 0,
                          backgroundImage: `repeating-linear-gradient(
                            45deg,
                            rgba(255,255,255,0.015) 0px,
                            rgba(255,255,255,0.015) 1px,
                            transparent 1px,
                            transparent 8px
                          )`,
                          pointerEvents: "none",
                        }} />

                        {/* Gold accent lines */}
                        <div style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          background: `linear-gradient(to bottom, transparent, ${slide.accent}, transparent)`,
                        }} />

                        {/* Big decorative emoji/product illustration or custom uploaded image */}
                        {slide.imgEmoji && (slide.imgEmoji.startsWith("data:") || slide.imgEmoji.startsWith("http")) ? (
                          <div style={{
                            position: "absolute",
                            right: isDesktop ? "8%" : "5%",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: isDesktop ? "40%" : "45%",
                            height: "85%",
                            userSelect: "none",
                            pointerEvents: "none",
                            zIndex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            <img 
                              src={slide.imgEmoji} 
                              alt={slide.headline} 
                              style={{ 
                                width: "100%", 
                                height: "100%", 
                                objectFit: "contain", 
                                filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.35))" 
                              }} 
                            />
                          </div>
                        ) : (
                          <div style={{
                            position: "absolute",
                            right: isDesktop ? "8%" : "5%",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: isDesktop ? 200 : 120,
                            opacity: 0.08,
                            userSelect: "none",
                            pointerEvents: "none",
                            lineHeight: 1,
                          }}>
                            {slide.imgEmoji}
                          </div>
                        )}

                        {/* Circular glow */}
                        <div style={{
                          position: "absolute",
                          right: isDesktop ? "15%" : "10%",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: isDesktop ? 420 : 260,
                          height: isDesktop ? 420 : 260,
                          borderRadius: "50%",
                          background: `radial-gradient(circle, ${slide.accent}18 0%, transparent 70%)`,
                          pointerEvents: "none",
                        }} />

                        {/* Content */}
                        <div style={{ position: "relative", zIndex: 2, padding: isDesktop ? "0 64px" : "0 24px", maxWidth: 620 }}>
                          {/* Badge */}
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            border: `1px solid ${slide.accent}60`,
                            borderRadius: 20,
                            padding: "4px 14px",
                            marginBottom: 20,
                            opacity: active ? 1 : 0,
                            transform: active ? "translateY(0)" : "translateY(10px)",
                            transition: "all 0.6s ease 0.2s",
                          }}>
                            <div style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: slide.accent,
                              boxShadow: `0 0 8px ${slide.accent}`,
                            }} />
                            <span style={{ color: slide.accent, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
                              {slide.tag}
                            </span>
                          </div>

                          {/* Headline */}
                          <h2 className="pf" style={{
                            color: "#fff",
                            fontSize: isDesktop ? 68 : 38,
                            fontWeight: 800,
                            lineHeight: 1.05,
                            letterSpacing: -1,
                            margin: "0 0 16px",
                            whiteSpace: "pre-line",
                            opacity: active ? 1 : 0,
                            transform: active ? "translateY(0)" : "translateY(20px)",
                            transition: "all 0.6s ease 0.35s",
                            textTransform: "uppercase"
                          }}>
                            {slide.headline.split("\n").map((line, idx) => (
                              <span key={idx} style={{ display: "block" }}>
                                {idx === 1 ? (
                                  <span style={{ color: slide.accent }}>{line}</span>
                                ) : line}
                              </span>
                            ))}
                          </h2>

                          {/* Subtext */}
                          <p style={{
                            color: "rgba(255,255,255,0.65)",
                            fontSize: isDesktop ? 15 : 13,
                            lineHeight: 1.6,
                            margin: "0 0 32px",
                            maxWidth: 440,
                            opacity: active ? 1 : 0,
                            transform: active ? "translateY(0)" : "translateY(10px)",
                            transition: "all 0.6s ease 0.45s",
                          }}>
                            {slide.sub}
                          </p>

                          {/* CTAs */}
                          <div style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                            opacity: active ? 1 : 0,
                            transform: active ? "translateY(0)" : "translateY(10px)",
                            transition: "all 0.6s ease 0.55s",
                          }}>
                            <button
                              onClick={() => handleCtaClick(slide.ctaLink)}
                              style={{
                                background: slide.accent,
                                color: "#0a1628",
                                padding: isDesktop ? "14px 28px" : "10px 20px",
                                borderRadius: 8,
                                fontWeight: 700,
                                fontSize: isDesktop ? 14 : 12,
                                border: "none",
                                cursor: "pointer",
                                letterSpacing: 0.5,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                boxShadow: `0 4px 20px ${slide.accent}40`,
                              }}
                              className="zoom-effect"
                            >
                              {slide.cta}
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab("products");
                                setSelectedCategory("All");
                                setSelectedGender("All");
                              }}
                              style={{
                                color: "rgba(255,255,255,0.75)",
                                fontSize: isDesktop ? 14 : 12,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                borderBottom: "1px solid rgba(255,255,255,0.3)",
                                paddingBottom: 2,
                              }}
                            >
                              View All Products
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Prev/Next arrows */}
                  {[{ dir: "prev", action: prevSlide, x: 20 }, { dir: "next", action: nextSlide, x: null }].map(({ dir, action, x }) => (
                    <button
                      key={dir}
                      onClick={action}
                      style={{
                        position: "absolute",
                        ...(x !== null ? { left: 20 } : { right: 20 }),
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "50%",
                        width: isDesktop ? 44 : 36,
                        height: isDesktop ? 44 : 36,
                        color: "rgba(255,255,255,0.8)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.2s",
                        zIndex: 10,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.3)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        {dir === "prev"
                          ? <path d="M15 18l-6-6 6-6"/>
                          : <path d="M9 18l6-6-6-6"/>}
                      </svg>
                    </button>
                  ))}

                  {/* Dot indicators */}
                  <div style={{
                    position: "absolute",
                    bottom: 20,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 8,
                    zIndex: 10,
                  }}>
                    {activeBanners.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        style={{
                          width: i === currentSlide ? 28 : 8,
                          height: 8,
                          borderRadius: 4,
                          background: i === currentSlide
                            ? (activeBanners[currentSlide] ? activeBanners[currentSlide].accent : C.accent)
                            : "rgba(255,255,255,0.3)",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.4s ease",
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "rgba(255,255,255,0.1)",
                    zIndex: 10,
                  }}>
                    <div
                      key={currentSlide}
                      style={{
                        height: "100%",
                        background: (activeBanners[currentSlide] ? activeBanners[currentSlide].accent : C.accent),
                        animation: slidePaused ? "none" : "progress 5s linear",
                        width: "100%",
                        transformOrigin: "left",
                      }}
                    />
                  </div>
                </div>

                {/* Account Points & Loyalty Metrics */}
                {!profile.isGuest && (
                  <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 16 }}>
                    <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 20, border: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 14 }} className="shadow-soft">
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(139,115,85,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Award size={22} color="#8B7355" />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: "#666", fontWeight: 600, margin: 0 }}>Loyalty balance</p>
                        <p className="pf" style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: 0 }}>{loyaltyPoints} Pts Available</p>
                      </div>
                    </div>
                    <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 20, border: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 14 }} className="shadow-soft">
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(45,106,79,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ShoppingBag size={22} color="#2D6A4F" />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: "#666", fontWeight: 600, margin: 0 }}>Total Purchases</p>
                        <p className="pf" style={{ fontSize: 22, fontWeight: 900, color: "#2D6A4F", margin: 0 }}>₹{totalPurchase.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category Spotlight Grid */}
                <div>
                  <h3 className="pf" style={{ fontSize: 18, fontWeight: 900, color: "#111111", marginBottom: 16 }}>Shop by Category</h3>
                  <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(4, 1fr)" : "repeat(2, 1fr)", gap: 16 }}>
                    {(syncedCategories && syncedCategories.length > 0 ? syncedCategories.slice(0, 4) : [
                      { displayName: "Casual Shirts", name: "Shirt", search: "casual", tag: "From ₹399", bg: "linear-gradient(135deg, #FAF8F5 0%, #F3EFE9 100%)", icon: "👔", border: "rgba(139,115,85,0.15)" },
                      { displayName: "Printed T-Shirts", name: "T-Shirt", search: "printed", tag: "Hot Trend", bg: "linear-gradient(135deg, #F5F7FA 0%, #E7ECF3 100%)", icon: "👕", border: "rgba(70,130,180,0.15)" },
                      { displayName: "Formal Trousers", name: "Trouser", search: "formal", tag: "Chinos & Cargos", bg: "linear-gradient(135deg, #F5F8FA 0%, #E3EDF3 100%)", icon: "👖", border: "rgba(95,158,160,0.15)" },
                      { displayName: "Oversized Tees", name: "T-Shirt", search: "oversized", tag: "Gen-Z Fits", bg: "linear-gradient(135deg, #FAF5F6 0%, #F5E6E8 100%)", icon: "👕", border: "rgba(188,143,143,0.15)" }
                    ]).map(cat => {
                      const displayLabel = cat.displayName || cat.name;
                      const filterCategory = cat.category || cat.name;
                      const icon = cat.icon || "👕";
                      const bg = cat.bg || "linear-gradient(135deg, #FAF8F5 0%, #F3EFE9 100%)";
                      const tag = cat.tag || "";
                      const border = cat.border || "rgba(0,0,0,0.05)";
                      const search = cat.search || "";
                      const isDarkBg = bg.includes("#0e1e38") || bg.includes("#2A1B40") || bg.includes("#182015") || bg.includes("#1a1a1a") || bg.includes("#2b080c");

                      return (
                        <div
                          key={displayLabel}
                          onClick={() => { 
                            setSelectedCategory(filterCategory); 
                            setSearchQuery(search);
                            setActiveTab("products"); 
                          }}
                          style={{
                            background: bg,
                            borderRadius: 24,
                            padding: "28px 20px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                            cursor: "pointer",
                            border: `1px solid ${border}`,
                            transition: "all 0.2s"
                          }}
                          className="shadow-hover"
                        >
                          {icon.startsWith("data:") || icon.startsWith("http") ? (
                            <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                              <img src={icon} alt={displayLabel} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          ) : (
                            <span style={{ fontSize: 36, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.05))" }}>{icon}</span>
                          )}
                          <div style={{ textAlign: "center" }}>
                            <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: isDarkBg ? "#ffffff" : "#111111", textTransform: "uppercase", letterSpacing: "0.5px" }}>{displayLabel}</span>
                            {tag && <span style={{ display: "block", fontSize: 10, fontWeight: 600, color: isDarkBg ? "rgba(255,255,255,0.7)" : "#666666", textTransform: "uppercase", letterSpacing: "1px", marginTop: 4 }}>{tag}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Promo Spotlight Banner (Glassmorphism) */}
                <div 
                  onClick={() => setActiveTab("offers")}
                  style={{ 
                    background: "rgba(253, 251, 247, 0.6)", 
                    borderRadius: 24, 
                    padding: "20px 24px", 
                    border: "1px dashed #8B7355", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 16, 
                    cursor: "pointer",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.02)"
                  }}
                  className="glass-effect"
                >
                  <span style={{ fontSize: 24 }}>✨</span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: 0 }}>Flat 50% Off Vouchers Active</h4>
                    <p style={{ fontSize: 12, color: "#666", margin: "2px 0 0" }}>Check your special code keys in the Offers tab. Redeem points at checkouts!</p>
                  </div>
                  <ChevronRight size={18} color="#8B7355" />
                </div>

                {/* 1. New Arrivals Section */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <div>
                      <h3 className="pf" style={{ fontSize: 20, fontWeight: 900, color: "#111111", margin: 0 }}>NEW ARRIVALS</h3>
                      <p style={{ fontSize: 12, color: "#777777", margin: "2px 0 0" }}>The latest drops in style and trends</p>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveTab("products");
                        setSelectedCategory("All");
                        setSearchQuery("");
                        setSortBy("newest");
                      }} 
                      style={{ background: "none", border: "none", color: "#8B7355", fontSize: 13, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px" }}
                    >
                      View All
                    </button>
                  </div>
                  
                  {products.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", background: "#F9F9FB", borderRadius: 20, border: "1px solid rgba(0,0,0,0.06)" }}>
                      <p style={{ color: "#777777", fontSize: 13, margin: 0 }}>No items in stock.</p>
                    </div>
                  ) : (
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: isDesktop ? "repeat(4, 1fr)" : "repeat(2, 1fr)", 
                      gap: isDesktop ? "24px" : "12px" 
                    }}>
                      {products.slice(0, 8).map(p => renderProductCard(p))}
                    </div>
                  )}
                </div>

                {/* 2. Best Sellers Section */}
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <div>
                      <h3 className="pf" style={{ fontSize: 20, fontWeight: 900, color: "#111111", margin: 0 }}>BEST SELLERS</h3>
                      <p style={{ fontSize: 12, color: "#777777", margin: "2px 0 0" }}>Customer favorites and top rated fits</p>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveTab("products");
                        setSelectedCategory("All");
                        setSearchQuery("");
                        setSortBy("default");
                      }} 
                      style={{ background: "none", border: "none", color: "#8B7355", fontSize: 13, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px" }}
                    >
                      View All
                    </button>
                  </div>
                  
                  {products.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", background: "#F9F9FB", borderRadius: 20, border: "1px solid rgba(0,0,0,0.06)" }}>
                      <p style={{ color: "#777777", fontSize: 13, margin: 0 }}>No items in stock.</p>
                    </div>
                  ) : (
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: isDesktop ? "repeat(4, 1fr)" : "repeat(2, 1fr)", 
                      gap: isDesktop ? "24px" : "12px" 
                    }}>
                      {products.slice().reverse().slice(0, 8).map(p => renderProductCard(p))}
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
                  {categoryFilters.map(cat => (
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 20 }}>
                    {filteredProducts.map(p => {
                      const isWish = isProductWishlisted(p.id);
                      const stockVal = p.stock !== undefined ? p.stock : 0;
                      const hasStock = stockVal > 0;
                      const isLowStock = hasStock && stockVal < 5;

                      return (
                        <div 
                          key={p.id}
                          style={{ 
                            background: "#FFFFFF", 
                            borderRadius: 22, 
                            padding: 14, 
                            border: "1px solid rgba(0,0,0,0.05)", 
                            position: "relative", 
                            display: "flex", 
                            flexDirection: "column", 
                            justifyContent: "space-between",
                            cursor: "pointer"
                          }}
                          className="product-card-hover shadow-hover shadow-soft"
                          onClick={() => setSelectedProduct(p)}
                        >
                          <div>
                            {/* Wishlist Heart Button */}
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id, e); }}
                              style={{ 
                                position: "absolute", 
                                top: 22, 
                                right: 22, 
                                background: "#FFFFFF", 
                                border: "none", 
                                borderRadius: "50%", 
                                width: 32, 
                                height: 32, 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                cursor: "pointer", 
                                zIndex: 10, 
                                boxShadow: "0 4px 12px rgba(0,0,0,0.06)" 
                              }}
                            >
                              <Heart size={16} fill={isWish ? "#E63946" : "none"} color={isWish ? "#E63946" : "#777777"} />
                            </button>

                            {/* Product Image Wrapper */}
                            <div 
                              style={{ 
                                width: "100%", 
                                height: 180, 
                                borderRadius: 16, 
                                background: "#F5F5F3", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                overflow: "hidden", 
                                border: "1px solid rgba(0,0,0,0.02)", 
                                marginBottom: 12, 
                                position: "relative" 
                              }}
                            >
                              {p.image ? (
                                <img src={p.image} className="product-image-zoom" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={p.name} />
                              ) : (
                                <Shirt size={44} color="#888888" strokeWidth={1.5} />
                              )}
                              
                              {/* Stock status badge overlay */}
                              <div style={{ position: "absolute", bottom: 10, left: 10, zIndex: 5 }}>
                                {!hasStock ? (
                                  <span style={{ background: "#FEE2E2", color: "#DC2626", fontSize: 9, padding: "4px 8px", borderRadius: 100, fontWeight: 800 }}>
                                    Out of Stock
                                  </span>
                                ) : isLowStock ? (
                                  <span style={{ background: "#FEF3C7", color: "#D97706", fontSize: 9, padding: "4px 8px", borderRadius: 100, fontWeight: 800 }}>
                                    Only {stockVal} left!
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {/* Brand & Category */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontSize: 9, color: "#8B7355", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>{p.brand || "SHIV WESTERN"}</span>
                              <span style={{ background: "#F3F4F6", color: "#666", fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>{p.category || "General"}</span>
                            </div>

                            {/* Product Name */}
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h4>

                            {/* Sizes */}
                            {p.size && (
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                                {p.size.split(",").map((s: string) => (
                                  <span key={s} style={{ fontSize: 8, padding: "1px 5px", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 4, color: "#777", fontWeight: 750 }}>
                                    {s.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            {/* Price details */}
                            {(() => {
                              const { finalPrice, mrp, discountPct } = getProductPriceInfo(p);
                              return (
                                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                                  <span className="pf" style={{ fontSize: 16, fontWeight: 900, color: "#111" }}>₹{finalPrice.toLocaleString("en-IN")}</span>
                                  {mrp > finalPrice && (
                                    <>
                                      <span style={{ fontSize: 11, textDecoration: "line-through", color: "#999" }}>₹{mrp.toLocaleString("en-IN")}</span>
                                      <span style={{ fontSize: 10, color: "#2D6A4F", fontWeight: 800 }}>({discountPct}% OFF)</span>
                                    </>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Primary Button */}
                            <button 
                              style={{ 
                                width: "100%", 
                                background: "#000000", 
                                color: "#FFFFFF", 
                                border: "none", 
                                padding: "10px", 
                                borderRadius: 100, 
                                fontSize: 12, 
                                fontWeight: 800, 
                                cursor: "pointer", 
                                transition: "all 0.2s", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                gap: 6 
                              }}
                            >
                              View Details & Buy
                            </button>
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
              profile.isGuest ? (
                <GuestGatingPrompt tabName="exclusive discount vouchers" onLogout={onLogout} />
              ) : (
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
              )
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
                            View
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
              profile.isGuest ? (
                <GuestGatingPrompt tabName="invoices and digital receipts" onLogout={onLogout} />
              ) : (
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
              )
            )}

            {/* 6. PURCHASE HISTORY TAB */}
            {activeTab === "history" && (
              profile.isGuest ? (
                <GuestGatingPrompt tabName="itemized purchase history" onLogout={onLogout} />
              ) : (
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
              )
            )}

            {/* 7. PROFILE TAB */}
            {activeTab === "profile" && (
              profile.isGuest ? (
                <GuestGatingPrompt tabName="profile details and reservations" onLogout={onLogout} />
              ) : (
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
              )
            )}

            {/* 8. MY CART TAB */}
            {activeTab === "cart" && (
              <motion.div key="cart" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <h3 className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.dark, margin: 0 }}>My Shopping Cart</h3>
                  <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 16px" }}>Manage items and place reservation orders</p>
                </div>

                {cart.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", border: `2px dashed ${C.border}`, borderRadius: 24, background: C.card }}>
                    <div style={{ display: "inline-flex", width: 64, height: 64, borderRadius: "50%", background: C.bg, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      <ShoppingCart size={28} color={C.muted} />
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: 0 }}>Your Cart is Empty</p>
                    <p style={{ fontSize: 13, color: C.muted, marginTop: 6, marginBottom: 24 }}>Browse our premium collections and add your favorite wear to the cart.</p>
                    <button 
                      onClick={() => setActiveTab("products")}
                      style={{ background: C.dark, color: C.accent, border: `1.5px solid ${C.accent}`, padding: "12px 28px", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px" }}
                    >
                      Shop Collection
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: window.innerWidth >= 768 ? "row" : "column", gap: 24, alignItems: "flex-start" }}>
                    {/* Cart Items List */}
                    <div style={{ flex: 1.5, width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: 20 }}>
                        <h4 className="pf" style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 16 }}>Cart Items ({cart.reduce((sum, item) => sum + item.qty, 0)})</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {cart.map(item => (
                            <div key={`${item.id}-${item.size}-${item.color}`} style={{ display: "flex", gap: 14, alignItems: "center", paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
                              <div style={{ width: 60, height: 60, borderRadius: 10, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.border}`, overflow: "hidden", flexShrink: 0 }}>
                                {item.image ? (
                                  <img src={item.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={item.name} />
                                ) : (
                                  <Shirt size={24} color={C.muted} />
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 10, color: C.accent, fontWeight: 800, textTransform: "uppercase" }}>{item.brand || "Shiv Western"}</span>
                                <h5 style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: "2px 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</h5>
                                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Size: {item.size} | Color: {item.color}</p>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                                <span className="pf" style={{ fontSize: 15, fontWeight: 800, color: C.dark }}>₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  {/* Quantity selector */}
                                  <div style={{ display: "flex", alignItems: "center", border: `1px solid ${C.border}`, borderRadius: 8, background: C.bg }}>
                                    <button 
                                      onClick={() => updateCartQty(item.id, item.size, item.color, -1)}
                                      style={{ padding: "4px 8px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: C.dark }}
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <span style={{ fontSize: 12, fontWeight: 700, minWidth: 20, textAlign: "center", color: C.dark }}>{item.qty}</span>
                                    <button 
                                      onClick={() => updateCartQty(item.id, item.size, item.color, 1)}
                                      style={{ padding: "4px 8px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: C.dark }}
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                  {/* Delete button */}
                                  <button 
                                    onClick={() => removeFromCart(item.id, item.size, item.color)}
                                    style={{ background: "none", border: "none", color: C.red, cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
                                    title="Remove item"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cart Summary & Checkout Card */}
                    <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 20 }}>
                      <div style={{ background: C.card, borderRadius: 24, padding: 20, border: `1px solid ${C.border}`, boxShadow: "0 4px 15px rgba(0,0,0,0.01)" }}>
                        <h4 className="pf" style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 16 }}>Order Summary</h4>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ color: C.muted, fontSize: 13, fontWeight: 500 }}>Subtotal</span>
                          <span className="pf" style={{ fontWeight: 700, color: C.dark, fontSize: 15 }}>₹{cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toLocaleString("en-IN")}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                          <span style={{ color: C.muted, fontSize: 13, fontWeight: 500 }}>Delivery / Reservation Fee</span>
                          <span style={{ color: C.green, fontSize: 12, fontWeight: 700 }}>FREE</span>
                        </div>
                        
                        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                          <span style={{ color: C.dark, fontWeight: 700, fontSize: 14 }}>Total</span>
                          <span className="pf" style={{ fontSize: 22, fontWeight: 900, color: C.dark }}>₹{cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toLocaleString("en-IN")}</span>
                        </div>

                        {/* Checkout Form Toggle / Details */}
                        {!checkoutMode ? (
                          <button 
                            onClick={() => setCheckoutMode(true)}
                            style={{ width: "100%", background: C.dark, color: C.accent, border: `1.5px solid ${C.accent}`, padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                          >
                            Proceed to Reservation
                          </button>
                        ) : (
                          <form onSubmit={handleCartCheckout} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <h5 className="pf" style={{ fontSize: 13, fontWeight: 800, color: C.dark, margin: "10px 0 2px" }}>
                              {profile.isGuest ? "Guest Billing Details" : "Billing Details"}
                            </h5>

                            {profile.isGuest ? (
                              <>
                                <div style={{ border: `1.5px solid ${C.accent}22`, background: "#FFFBF0", borderRadius: 12, padding: 12, marginBottom: 4 }}>
                                  <p style={{ fontSize: 11, color: C.accent, fontWeight: 800, margin: "0 0 4px", textTransform: "uppercase" }}>💡 Exclusive Club offer Available</p>
                                  <p style={{ fontSize: 10, color: C.muted, margin: 0, lineHeight: 1.4 }}>Create a free account to automatically save **Flat 50% Off** and earn loyalty points!</p>
                                </div>
                                <input 
                                  value={guestName}
                                  onChange={e => setGuestName(e.target.value)}
                                  placeholder="Full Name *"
                                  required
                                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.dark }}
                                />
                                <input 
                                  value={guestPhone}
                                  onChange={e => setGuestPhone(e.target.value)}
                                  placeholder="10-digit Mobile Number *"
                                  required
                                  type="tel"
                                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.dark }}
                                />
                                <input 
                                  value={guestAddress}
                                  onChange={e => setGuestAddress(e.target.value)}
                                  placeholder="Delivery / Billing Address (Optional)"
                                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.dark }}
                                />
                              </>
                            ) : (
                              <div style={{ background: C.bg, borderRadius: 12, padding: 12, fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                                <p style={{ margin: 0, color: C.dark }}><strong>Name:</strong> {profile.displayName || profile.name}</p>
                                <p style={{ margin: 0, color: C.dark }}><strong>Phone:</strong> {profile.phone}</p>
                                <p style={{ margin: 0, color: C.dark }}><strong>Address:</strong> {profile.address || "Not set (Please edit in Profile)"}</p>
                              </div>
                            )}

                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                              <button 
                                type="button"
                                onClick={() => setCheckoutMode(false)}
                                style={{ flex: 1, background: "transparent", color: C.muted, border: `1px solid ${C.border}`, padding: "12px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                              >
                                Back
                              </button>
                              <button 
                                type="submit"
                                disabled={isPlacingOrder}
                                style={{ flex: 2, background: C.dark, color: C.accent, border: `1.5px solid ${C.accent}`, padding: "12px", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                              >
                                {isPlacingOrder ? "Placing..." : "Confirm Reservation"}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        {/* ----------------- PROFESSIONAL FOOTER ----------------- */}
        <footer style={{ 
          background: "#111111", 
          color: "#FFFFFF", 
          padding: isDesktop ? "48px 32px 32px" : "32px 20px 24px", 
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          marginTop: "40px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
        }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr", 
            gap: "32px",
            marginBottom: "32px"
          }}>
            {/* Column 1: Brand Info */}
            <div>
              <h4 className="pf" style={{ fontSize: 16, fontWeight: 900, color: "#C2A649", letterSpacing: "1px", margin: "0 0 16px", textTransform: "uppercase" }}>SHIV WESTERN CLUB</h4>
              <p style={{ fontSize: 13, color: "#CCCCCC", lineHeight: 1.6, margin: "0 0 16px" }}>
                Discover premium quality menswear, casual shirts, printed tees, formal trousers, and classic winterwear crafted for modern everyday comfort.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#999999" }}>
                <span>📞 Support: +91 9724557728</span>
                <span>📧 Email: contact@shivwestern.com</span>
                <span>📍 Location: Ahmedabad, Gujarat</span>
              </div>
            </div>

            {/* Column 2: Information Links */}
            <div>
              <h4 className="pf" style={{ fontSize: 14, fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.5px", margin: "0 0 16px", textTransform: "uppercase" }}>Quick Links</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                <span 
                  onClick={() => alert("About Us:\n\nShiv Western Club is Halvad's finest premium menswear store, delivering modern clothing trends at affordable pricing since 2020.")} 
                  style={{ color: "#CCCCCC", cursor: "pointer", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#C2A649"}
                  onMouseLeave={e => e.currentTarget.style.color = "#CCCCCC"}
                >
                  About Us
                </span>
                <span 
                  onClick={() => alert("Contact Details:\n\nPhone: +91 9724557728\nEmail: contact@shivwestern.com\nAddress: 123, Fashion Hub, Near Main Market, Ahmedabad, Gujarat - 380001")} 
                  style={{ color: "#CCCCCC", cursor: "pointer", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#C2A649"}
                  onMouseLeave={e => e.currentTarget.style.color = "#CCCCCC"}
                >
                  Contact Us
                </span>
                <span 
                  onClick={() => alert("Return & Replacement Policy:\n\nWe offer a hassle-free 7-day exchange and replacement policy for all unworn clothes. Visit our store or contact support.")} 
                  style={{ color: "#CCCCCC", cursor: "pointer", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#C2A649"}
                  onMouseLeave={e => e.currentTarget.style.color = "#CCCCCC"}
                >
                  Return Policy
                </span>
              </div>
            </div>

            {/* Column 3: Social & Trust */}
            <div>
              <h4 className="pf" style={{ fontSize: 14, fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.5px", margin: "0 0 16px", textTransform: "uppercase" }}>Follow Us</h4>
              <div style={{ display: "flex", gap: 14, fontSize: 20, marginBottom: 20 }}>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ color: "#CCCCCC", textDecoration: "none", cursor: "pointer", transition: "transform 0.2s" }} onMouseEnter={e => { e.currentTarget.style.color = "#E1306C"; e.currentTarget.style.transform = "scale(1.1)"; }} onMouseLeave={e => { e.currentTarget.style.color = "#CCCCCC"; e.currentTarget.style.transform = "scale(1)"; }}>📸</a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{ color: "#CCCCCC", textDecoration: "none", cursor: "pointer", transition: "transform 0.2s" }} onMouseEnter={e => { e.currentTarget.style.color = "#1877F2"; e.currentTarget.style.transform = "scale(1.1)"; }} onMouseLeave={e => { e.currentTarget.style.color = "#CCCCCC"; e.currentTarget.style.transform = "scale(1)"; }}>👥</a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" style={{ color: "#CCCCCC", textDecoration: "none", cursor: "pointer", transition: "transform 0.2s" }} onMouseEnter={e => { e.currentTarget.style.color = "#1DA1F2"; e.currentTarget.style.transform = "scale(1.1)"; }} onMouseLeave={e => { e.currentTarget.style.color = "#CCCCCC"; e.currentTarget.style.transform = "scale(1)"; }}>🐦</a>
                <a href="https://wa.me/919724557728" target="_blank" rel="noreferrer" style={{ color: "#CCCCCC", textDecoration: "none", cursor: "pointer", transition: "transform 0.2s" }} onMouseEnter={e => { e.currentTarget.style.color = "#25D366"; e.currentTarget.style.transform = "scale(1.1)"; }} onMouseLeave={e => { e.currentTarget.style.color = "#CCCCCC"; e.currentTarget.style.transform = "scale(1)"; }}>💬</a>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 12, fontSize: 11, color: "#999999" }}>
                🔒 <strong>100% Secure Checkout</strong>. All transactions are encrypted and processed safely.
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, textAlign: "center", fontSize: 11, color: "#777777" }}>
            © {new Date().getFullYear()} Shiv Western Club. All Rights Reserved. Crafted with ❤️ for premium style.
          </div>
        </footer>
        </main>

        {/* ----------------- MOBILE BOTTOM NAVIGATION ----------------- */}
        <div style={{ display: window.innerWidth >= 768 ? "none" : "flex", borderTop: `1px solid ${C.border}`, background: C.card, position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -4px 20px rgba(0,0,0,0.03)" }}>
          {[
            { id: "home", icon: "🏠", label: "Home" },
            { id: "products", icon: "🛍️", label: "Products" },
            { id: "cart", icon: `🛒${cart.length > 0 ? ` (${cart.reduce((sum, item) => sum + item.qty, 0)})` : ""}`, label: "Cart" },
            { id: "wishlist", icon: "❤️", label: "Wishlist" },
            { id: "profile", icon: "👤", label: "My Profile" }
          ].map(nav => (
            <button
              key={nav.id}
              onClick={() => {
                if (nav.id === "cart") {
                  setIsCartOpen(true);
                } else {
                  setActiveTab(nav.id as any);
                }
              }}
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
          <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ background: "#FFFFFF", borderRadius: 28, padding: 28, width: "100%", maxWidth: 460, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 50px rgba(0,0,0,0.08)", position: "relative" }}
            >
              <button 
                onClick={() => { setSelectedProduct(null); setSelectedSize(""); setSelectedColor(""); }}
                style={{ position: "absolute", right: 24, top: 24, background: "#F3F4F6", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#111111", fontWeight: 700 }}
              >
                ✕
              </button>
              <h3 className="pf" style={{ fontSize: 18, fontWeight: 900, color: "#111111", marginBottom: 18 }}>Product Details</h3>
              {renderProductDetails(selectedProduct)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guest Conversion Modal Popup */}
      <AnimatePresence>
        {showConversionModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              style={{ background: "#FFFFFF", borderRadius: 28, padding: "36px 32px", width: "100%", maxWidth: 460, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 25px 60px rgba(0,0,0,0.1)", position: "relative", textAlign: "center", color: "#111111" }}
            >
              <button 
                onClick={() => setShowConversionModal(false)}
                style={{ position: "absolute", right: 24, top: 24, background: "#F3F4F6", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#111111", fontWeight: 700 }}
              >
                ✕
              </button>

              <div style={{ display: "inline-flex", width: 60, height: 60, borderRadius: "50%", background: "rgba(139,115,85,0.1)", alignItems: "center", justifyContent: "center", border: "1px solid rgba(139,115,85,0.2)", marginBottom: 20 }}>
                <Award size={28} color="#8B7355" />
              </div>

              <h3 className="pf" style={{ fontSize: 22, fontWeight: 900, color: "#111111", marginBottom: 8 }}>Unlock Club Member Perks! 🌟</h3>
              <p style={{ fontSize: 13, color: "#555555", lineHeight: 1.5, margin: "0 0 24px" }}>
                Add items to cart and create a free account today to claim your special benefits. It takes less than 30 seconds!
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left", marginBottom: 28, background: "#F9F9FB", padding: 18, borderRadius: 20, border: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16 }}>🏷️</span>
                  <div>
                    <h5 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: "#111111" }}>Flat 50% Off & Vouchers</h5>
                    <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0" }}>Unlock exclusive voucher codes (e.g. SHIVW50) at counter checkout.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16 }}>🏆</span>
                  <div>
                    <h5 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: "#111111" }}>Loyalty Cashpoints</h5>
                    <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0" }}>Earn 1 point per ₹100 spent, redeemable directly for cash discounts.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16 }}>📦</span>
                  <div>
                    <h5 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: "#111111" }}>Real-time Reservation Tracking</h5>
                    <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0" }}>Track reservation status, approvals, and order records instantly.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16 }}>📄</span>
                  <div>
                    <h5 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: "#111111" }}>Digital Receipts & PDF Invoices</h5>
                    <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0" }}>Retrieve or share your invoices via PDF download or WhatsApp.</p>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button 
                  onClick={() => {
                    setShowConversionModal(false);
                    onLogout(true);
                  }}
                  style={{ width: "100%", background: "#000000", color: "#FFFFFF", border: "none", padding: "14px", borderRadius: 100, fontSize: 13, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px", boxShadow: "0 6px 20px rgba(0,0,0,0.15)" }}
                >
                  Create Club Account
                </button>
                <button 
                  onClick={() => setShowConversionModal(false)}
                  style={{ width: "100%", background: "transparent", color: "#444444", border: "1px solid rgba(0,0,0,0.15)", padding: "12px", borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Continue as Guest
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- CART SIDEBAR DRAWER ----------------- */}
      <AnimatePresence>
        {isCartOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsCartOpen(false); setCheckoutMode(false); }}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
                cursor: "pointer"
              }}
            />

            {/* Sidebar Pane */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 450,
                height: "100%",
                background: "#FFFFFF",
                boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                zIndex: 1001,
                color: "#111111"
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div>
                  <h3 className="pf" style={{ fontSize: 18, fontWeight: 900, color: "#111111", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Shopping Cart</h3>
                  <span style={{ fontSize: 11, color: "#777777", fontWeight: 700 }}>({cart.reduce((sum, item) => sum + item.qty, 0)} items)</span>
                </div>
                <button
                  onClick={() => { setIsCartOpen(false); setCheckoutMode(false); }}
                  style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#111111", fontWeight: 700 }}
                >
                  ✕
                </button>
              </div>

              {/* Items List */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }} className="no-scrollbar">
                {cart.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ShoppingCart size={28} color="#999999" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#111111" }}>Your cart is empty</h4>
                      <p style={{ fontSize: 12, color: "#777777", margin: "4px 0 0" }}>Add products to your cart to see them here.</p>
                    </div>
                    <button
                      onClick={() => { setIsCartOpen(false); setActiveTab("products"); }}
                      style={{ background: "#000000", color: "#FFFFFF", border: "none", padding: "12px 24px", borderRadius: 100, fontSize: 12, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 8 }}
                    >
                      Shop Collection
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {cart.map(item => (
                      <div key={`${item.id}-${item.size}-${item.color}`} style={{ display: "flex", gap: 14, paddingBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        {/* Image */}
                        <div style={{ width: 70, height: 75, borderRadius: 10, background: "#F5F5F3", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,0.05)", overflow: "hidden", flexShrink: 0 }}>
                          {item.image ? (
                            <img src={item.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={item.name} />
                          ) : (
                            <Shirt size={28} color="#aaaaaa" />
                          )}
                        </div>
                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 9, color: "#8B7355", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.brand || "Shiv Western"}</span>
                          <h5 style={{ fontSize: 13, fontWeight: 700, color: "#111111", margin: "2px 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</h5>
                          <p style={{ fontSize: 10, color: "#666666", margin: 0 }}>Size: {item.size} | Color: {item.color}</p>
                          
                          {/* Price in list */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 6, background: "#F9F9FB" }}>
                              <button 
                                onClick={() => updateCartQty(item.id, item.size, item.color, -1)}
                                style={{ padding: "3px 6px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#111111" }}
                              >
                                <Minus size={10} />
                              </button>
                              <span style={{ fontSize: 11, fontWeight: 700, minWidth: 16, textAlign: "center", color: "#111111" }}>{item.qty}</span>
                              <button 
                                onClick={() => updateCartQty(item.id, item.size, item.color, 1)}
                                style={{ padding: "3px 6px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#111111" }}
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                            <span className="pf" style={{ fontSize: 13, fontWeight: 800, color: "#111111" }}>₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                        {/* Remove */}
                        <button 
                          onClick={() => removeFromCart(item.id, item.size, item.color)}
                          style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", alignSelf: "flex-start", padding: 4 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer / Summary / Checkout form */}
              {cart.length > 0 && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", padding: "20px 24px", background: "#F9F9FB" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#666666", fontSize: 13, fontWeight: 500 }}>Subtotal</span>
                    <span className="pf" style={{ fontWeight: 700, color: "#111111", fontSize: 15 }}>₹{cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ color: "#666666", fontSize: 13, fontWeight: 500 }}>Delivery / Reservation</span>
                    <span style={{ color: "#16A34A", fontSize: 12, fontWeight: 700 }}>FREE</span>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ color: "#111111", fontWeight: 700, fontSize: 14 }}>Total</span>
                    <span className="pf" style={{ fontSize: 20, fontWeight: 900, color: "#111111" }}>₹{cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toLocaleString("en-IN")}</span>
                  </div>

                  {!checkoutMode ? (
                    <button 
                      onClick={() => setCheckoutMode(true)}
                      style={{ width: "100%", background: "#000000", color: "#FFFFFF", border: "none", padding: "14px", borderRadius: 100, fontSize: 13, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                    >
                      Proceed to Checkout
                    </button>
                  ) : (
                    <form onSubmit={handleCartCheckout} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <h4 className="pf" style={{ fontSize: 13, fontWeight: 900, color: "#111111", margin: "4px 0 2px" }}>
                        {profile.isGuest ? "GUEST CHECKOUT DETAILS" : "CONFIRM BILLING DETAILS"}
                      </h4>

                      {profile.isGuest ? (
                        <>
                          <input 
                            value={guestName}
                            onChange={e => setGuestName(e.target.value)}
                            placeholder="Full Name *"
                            required
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)", fontSize: 12, color: "#111111", background: "#FFFFFF" }}
                          />
                          <input 
                            value={guestPhone}
                            onChange={e => setGuestPhone(e.target.value)}
                            placeholder="10-digit Mobile Number *"
                            required
                            type="tel"
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)", fontSize: 12, color: "#111111", background: "#FFFFFF" }}
                          />
                          <input 
                            value={guestAddress}
                            onChange={e => setGuestAddress(e.target.value)}
                            placeholder="Delivery / Shipping Address *"
                            required
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.15)", fontSize: 12, color: "#111111", background: "#FFFFFF" }}
                          />
                        </>
                      ) : (
                        <div style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10, padding: 12, fontSize: 11, display: "flex", flexDirection: "column", gap: 6 }}>
                          <p style={{ margin: 0, color: "#111111" }}><strong>Name:</strong> {profile.displayName || profile.name}</p>
                          <p style={{ margin: 0, color: "#111111" }}><strong>Phone:</strong> {profile.phone}</p>
                          <p style={{ margin: 0, color: "#111111" }}><strong>Address:</strong> {profile.address || "Not set (Please edit in Profile)"}</p>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button 
                          type="button"
                          onClick={() => setCheckoutMode(false)}
                          style={{ flex: 1, background: "transparent", color: "#666666", border: "1px solid rgba(0,0,0,0.15)", padding: "10px", borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          Back
                        </button>
                        <button 
                          type="submit"
                          disabled={isPlacingOrder}
                          style={{ flex: 2, background: "#000000", color: "#FFFFFF", border: "none", padding: "10px", borderRadius: 100, fontSize: 11, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
                        >
                          {isPlacingOrder ? "Placing..." : "Confirm Order"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ----------------- FLOATING WHATSAPP SUPPORT BUTTON ----------------- */}
      <a
        href="https://wa.me/919724557728?text=Hi!%20I'm%20visiting%20the%20Shiv%20Western%20Club%20online%20store%20and%20have%20an%20inquiry..."
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          bottom: isDesktop ? 24 : 84,
          right: 20,
          width: 52,
          height: 52,
          background: "#25D366",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 20px rgba(37, 211, 102, 0.4)",
          cursor: "pointer",
          zIndex: 400,
          textDecoration: "none",
          transition: "transform 0.2s"
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        title="Chat on WhatsApp"
      >
        <svg 
          viewBox="0 0 24 24" 
          width="28" 
          height="28" 
          fill="#FFFFFF"
        >
          <path d="M12.031 2c-5.514 0-9.99 4.477-9.99 9.99 0 2.08.636 4.01 1.728 5.614l-1.129 4.12 4.225-1.107c1.54 1 3.36 1.583 5.323 1.583 5.514 0 10.01-4.487 10.01-10s-4.496-10-10.01-10zm5.99 14.394c-.245.696-1.22 1.277-1.688 1.344-.457.067-.98.12-2.924-.654-2.484-.99-4.066-3.52-4.19-3.687-.122-.167-1.002-1.332-1.002-2.54 0-1.21.636-1.804.862-2.04.223-.235.485-.295.646-.295s.323.004.463.01c.143.007.337-.054.527.404.195.474.67 1.632.728 1.75.06.12.097.26.017.414-.08.156-.12.257-.24.398-.12.14-.253.315-.36.424-.122.12-.25.253-.108.497.143.245.637 1.05 1.367 1.702.94.84 1.73 1.1 1.974 1.22.245.122.387.102.53-.06.143-.167.613-.715.777-.96.162-.24.328-.203.554-.12.223.085 1.417.67 1.662.793.245.123.407.18.468.286.06.104.06.607-.184 1.303z"/>
        </svg>
      </a>
    </div>
  );
};
