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
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Star,
  Search, 
  Calendar,
  LogOut,
  FileText,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Truck,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { doWhatsApp, doPDF } from "../utils/exportUtils";
import { ProductCard } from "../components/ProductCard";

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



const getEnrichedProductData = (product: any) => {
  if (!product) return null;

  // Build gallery images array
  let galleryImages = product.images || [];
  if (!Array.isArray(galleryImages) || galleryImages.length === 0) {
    if (product.image) {
      // Create a nice set of varied photos using categories and focuses to make it look like a high-end storefront gallery
      if (product.category === "Shirt") {
        galleryImages = [
          product.image,
          "/categories/shirts.png",
          "/categories/shirts_focused_1781203465401.png"
        ];
      } else if (product.category === "Trouser") {
        galleryImages = [
          product.image,
          "/categories/trousers.png",
          "/categories/trousers_focused_1781203405559.png"
        ];
      } else if (product.category === "T-Shirt") {
        galleryImages = [
          product.image,
          "/categories/t_shirts.png",
          "/categories/printed.png"
        ];
      } else if (product.category === "Jeans") {
        galleryImages = [
          product.image,
          "/categories/jeans.png",
          "/categories/jeans_focused_1781203436747.png"
        ];
      } else if (product.category === "Shorts") {
        galleryImages = [
          product.image,
          "/categories/shorts.png",
          "/categories/shorts_focused_1781203449888.png"
        ];
      } else {
        galleryImages = [
          product.image,
          "/categories/combos.png",
          "/hero_fashion_banner.png"
        ];
      }
    } else {
      galleryImages = ["/logo.svg"];
    }
  }

  // Calculate pricing values
  const finalPrice = product.sellingPrice || product.price || 0;
  const mrpVal = product.price || finalPrice;
  const discountVal = mrpVal > finalPrice ? Math.round(((mrpVal - finalPrice) / mrpVal) * 100) : 0;

  // Clean sizes and colors lists
  const availableSizes = product.available_sizes || (product.size ? product.size.split(",").map((s: any) => s.trim()) : ["S", "M", "L", "XL", "XXL"]);
  const availableColors = product.available_colors || (product.color ? product.color.split(",").map((c: any) => c.trim()) : ["Navy Blue", "Olive Green", "Charcoal Black"]);

  return {
    ...product,
    id: product.id,
    name: product.name,
    category: product.category || "Menswear",
    price: finalPrice,
    mrp: mrpVal,
    discount: discountVal,
    images: galleryImages,
    available_sizes: availableSizes,
    available_colors: availableColors,
    description: product.description || `Elevate your casual wear with this premium ${product.category || "item"} from Shiv Western Club. Engineered with tailored precision, it boasts structural comfort, breathable fabrics, and a modern aesthetic suitable for all-day urban versatility. Pair it with your favorite denims or structured chinos for an effortless, premium D2C look.`,
    materialCare: product.materialCare || "• 100% Premium Combed Cotton & Eco-Friendly Dyes\n• Breathable knit fabric with soft finish\n• Cold machine wash on gentle cycle\n• Wash inside out with like colors\n• Iron on low heat; Do not iron directly on print",
    shippingReturns: product.shippingReturns || "• Free Delivery on all orders above ₹999 across India\n• Dispatched within 24-48 hours; delivery in 3-5 business days\n• 15-Day Hassle-Free Returns & Exchanges available\n• Cash on Delivery (COD) supported in all major pin codes",
    stockStatus: product.stockStatus || (product.stock > 0 ? "in_stock" : "out_of_stock"),
    stock: product.stock !== undefined ? product.stock : 10,
  };
};

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

interface ProductDetailPageProps {
  product: any;
  onClose: () => void;
  isWishlisted: boolean;
  onWishlistToggle: (e: React.MouseEvent) => void;
  onAddToCart: (product: any, size: string, color: string) => void;
  onBuyNow: (product: any, size: string, color: string) => void;
  isGuest: boolean;
  isDesktop: boolean;
  allProducts: any[];
  onProductClick: (product: any) => void;
  isProductWishlistedGlobal: (id: string) => boolean;
  toggleWishlistGlobal: (id: string) => void;
}

const ProductDetailPage = ({
  product,
  onClose,
  isWishlisted,
  onWishlistToggle,
  onAddToCart,
  onBuyNow,
  isGuest,
  isDesktop,
  allProducts,
  onProductClick,
  isProductWishlistedGlobal,
  toggleWishlistGlobal
}: ProductDetailPageProps) => {
  const enriched = getEnrichedProductData(product) || product;
  const imagesList = enriched.images || [enriched.image].filter(Boolean);

  const [activeImage, setActiveImage] = useState(imagesList[0] || "");
  const [selectedSize, setSelectedSize] = useState("");
  
  const initialColor = useMemo(() => {
    if (enriched.available_colors && enriched.available_colors.length > 0) {
      const firstColor = getColorObject(enriched.available_colors[0]);
      return firstColor?.name || "";
    }
    return "";
  }, [enriched.available_colors]);

  const [selectedColor, setSelectedColor] = useState(initialColor);

  const currentGalleryImages = useMemo(() => {
    const fullImagesList = enriched.images || [enriched.image].filter(Boolean);
    if (!selectedColor) return fullImagesList;
    
    // Find the variant
    const variant = enriched.available_colors?.find((cv: any) => {
      const cleanCv = getColorObject(cv);
      return cleanCv?.name === selectedColor;
    });
    
    if (variant) {
      const cleanCv = getColorObject(variant);
      if (cleanCv.image_indices && Array.isArray(cleanCv.image_indices) && cleanCv.image_indices.length > 0) {
        return cleanCv.image_indices.map((idx: number) => fullImagesList[idx]).filter(Boolean);
      } else if (cleanCv.image_index !== undefined && fullImagesList[cleanCv.image_index]) {
        return [fullImagesList[cleanCv.image_index]];
      }
    }
    
    return fullImagesList;
  }, [enriched.images, enriched.image, enriched.available_colors, selectedColor]);

  // Effect to automatically select the first image of the selected color's gallery
  React.useEffect(() => {
    if (currentGalleryImages && currentGalleryImages.length > 0) {
      setActiveImage(currentGalleryImages[0]);
    }
  }, [selectedColor, currentGalleryImages]);
  
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: "" });
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  const [openAccordions, setOpenAccordions] = useState({
    description: true,
    material: false,
    shipping: false
  });

  // Save viewed product to localStorage recently viewed list
  React.useEffect(() => {
    if (product && product.id) {
      try {
        const stored = localStorage.getItem("recently_viewed_products");
        let list: string[] = stored ? JSON.parse(stored) : [];
        list = list.filter(id => id !== product.id);
        list.unshift(product.id);
        if (list.length > 10) {
          list = list.slice(0, 10);
        }
        localStorage.setItem("recently_viewed_products", JSON.stringify(list));
      } catch (e) {
        console.error("Error updating recently viewed products:", e);
      }
    }
  }, [product]);

  // Compute actual product items for Recently Viewed list (excluding current)
  const recentlyViewed = useMemo(() => {
    if (!product || !allProducts) return [];
    try {
      const stored = localStorage.getItem("recently_viewed_products");
      const list: string[] = stored ? JSON.parse(stored) : [];
      const otherIds = list.filter(id => id !== product.id);
      return otherIds
        .map(id => allProducts.find(p => p.id === id))
        .filter(Boolean);
    } catch (e) {
      console.error("Error reading recently viewed products:", e);
      return [];
    }
  }, [product, allProducts]);

  React.useEffect(() => {
    if (product) {
      const freshEnriched = getEnrichedProductData(product) || product;
      const freshImages = freshEnriched.images || [freshEnriched.image].filter(Boolean);
      setActiveImage(freshImages[0] || "");
      setSelectedSize("");
      if (freshEnriched.available_colors && freshEnriched.available_colors.length > 0) {
        const firstColor = getColorObject(freshEnriched.available_colors[0]);
        setSelectedColor(firstColor?.name || "");
      } else {
        setSelectedColor("");
      }
      setPincode("");
      setPincodeStatus({ type: null, message: "" });
    }
  }, [product]);

  const handlePincodeCheck = () => {
    if (!pincode) {
      setPincodeStatus({ type: 'error', message: "Please enter a pincode." });
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeStatus({ type: 'error', message: "Invalid pincode. Please enter a 6-digit number." });
      return;
    }
    
    setCheckingPincode(true);
    setPincodeStatus({ type: null, message: "Checking availability..." });
    
    setTimeout(() => {
      setCheckingPincode(false);
      if (pincode.startsWith("38")) {
        setPincodeStatus({
          type: 'success',
          message: "⚡ Super Express Delivery: 1-2 Days to Gujarat! COD Available."
        });
      } else {
        setPincodeStatus({
          type: 'success',
          message: "🚚 Standard Shipping: Delivered in 3-5 days. COD Available."
        });
      }
    }, 600);
  };

  const toggleAccordion = (section: 'description' | 'material' | 'shipping') => {
    setOpenAccordions(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const materialPoints = useMemo(() => {
    return Array.isArray(enriched.material_care) 
      ? enriched.material_care 
      : (enriched.materialCare || "").split("\n").map((line: string) => line.replace(/^•\s*/, "").trim()).filter(Boolean);
  }, [enriched.material_care, enriched.materialCare]);

  const shippingPoints = useMemo(() => {
    return Array.isArray(enriched.shipping_returns) 
      ? enriched.shipping_returns 
      : (enriched.shippingReturns || "").split("\n").map((line: string) => line.replace(/^•\s*/, "").trim()).filter(Boolean);
  }, [enriched.shipping_returns, enriched.shippingReturns]);

  const colorList = useMemo(() => {
    if (!enriched.available_colors) return [];
    return enriched.available_colors.map((c: any) => getColorObject(c));
  }, [enriched.available_colors]);

  const sizes = ["S", "M", "L", "XL", "XXL"];

  return (
    <div className="fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: isDesktop ? '40px' : '100px' }}>
      {/* Breadcrumb Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: 16 }}>
        <button 
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#111', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeft size={16} /> Back to Catalog
        </button>
        <span style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>
          Home / {enriched.category} / <span style={{ color: '#111', fontWeight: 700 }}>{enriched.name}</span>
        </span>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1.2fr 1fr' : '1fr', gap: isDesktop ? 48 : 28, alignItems: 'start' }}>
        
        {/* Left Section: Gallery */}
        <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: 16, position: isDesktop ? 'sticky' : 'relative', top: isDesktop ? 100 : 0 }}>
          {/* Desktop Thumbnails (Left side of large image) */}
          {isDesktop && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 520, overflowY: 'auto', width: 80, flexShrink: 0 }} className="no-scrollbar">
              {currentGalleryImages.map((img: string, idx: number) => {
                const isActive = activeImage === img;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    style={{
                      width: 76,
                      height: 96,
                      borderRadius: 10,
                      border: isActive ? '2px solid #111' : '1.5px solid #E5E7EB',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      flexShrink: 0,
                      padding: 0,
                      transition: 'all 0.2s',
                      background: '#F8F9FB'
                    }}
                  >
                    <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Large Main Image */}
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ width: '100%', aspectRatio: isDesktop ? '3.2/4' : '1/1.15', borderRadius: 20, overflow: 'hidden', border: '1px solid #E5E7EB', background: '#F8F9FB' }}>
              <img
                src={activeImage}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease-out' }}
                className="hover:scale-105 cursor-zoom-in"
                alt={enriched.name}
              />
            </div>
            <button 
              onClick={onWishlistToggle}
              style={{ position: 'absolute', right: 20, top: 20, background: '#FFF', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: 'all 0.2s', zIndex: 10 }}
            >
              <Heart size={22} fill={isWishlisted ? '#9B2226' : 'none'} color={isWishlisted ? '#9B2226' : '#6B7280'} />
            </button>
          </div>

          {/* Mobile Thumbnails (Below large image) */}
          {!isDesktop && (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }} className="no-scrollbar">
              {currentGalleryImages.map((img: string, idx: number) => {
                const isActive = activeImage === img;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    style={{
                      width: 64,
                      height: 80,
                      borderRadius: 8,
                      border: isActive ? '2px solid #111' : '1.5px solid #E5E7EB',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      flexShrink: 0,
                      padding: 0,
                      transition: 'all 0.2s',
                      background: '#F8F9FB'
                    }}
                  >
                    <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Section: Details */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Brand & Category */}
          <span style={{ fontSize: 11, color: '#C2A649', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 6 }}>
            {enriched.brand || "SHIV WESTERN CLUB"}
          </span>
          
          {/* Title */}
          <h1 className="pf" style={{ fontSize: isDesktop ? 26 : 20, fontWeight: 900, color: '#111', lineHeight: 1.3, marginBottom: 8 }}>
            {enriched.name}
          </h1>

          {/* Ratings & Reviews */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#F5F5F0', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#111' }}>
              <Star size={11} fill="#D4AF37" color="#D4AF37" /> 4.8
            </div>
            <span style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>| 142 Reviews & Ratings</span>
          </div>

          {/* Price details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span className="pf" style={{ fontSize: 24, fontWeight: 900, color: '#111' }}>₹{enriched.price.toLocaleString("en-IN")}</span>
            <span style={{ fontSize: 15, color: '#9CA3AF', textDecoration: 'line-through' }}>₹{enriched.mrp.toLocaleString("en-IN")}</span>
            <span style={{ background: '#E8F5EE', color: '#2D6A4F', fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 8 }}>{enriched.discount}% OFF</span>
          </div>
          <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 24px', fontWeight: 500 }}>Inclusive of all taxes</p>

          <hr style={{ border: '0', borderTop: '1px solid #E5E7EB', margin: '0 0 20px' }} />

          {/* Color Selection swatches */}
          {colorList.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111', display: 'block', marginBottom: 10 }}>
                Color: <span style={{ fontWeight: 500, color: '#666' }}>{selectedColor}</span>
              </span>
              <div style={{ display: 'flex', gap: 12 }}>
                {colorList.map((c: any) => {
                  const isSelected = selectedColor === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => {
                        setSelectedColor(c.name);
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: c.hex,
                        border: isSelected ? '2px solid #000' : '1px solid #E5E7EB',
                        boxShadow: isSelected ? '0 0 0 3px rgba(0,0,0,0.1)' : 'none',
                        outline: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.2s'
                      }}
                      title={c.name}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Guide & Grid */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
                Select Size: <span style={{ fontWeight: 500, color: '#666' }}>{selectedSize || "None"}</span>
              </span>
              <button
                onClick={() => setSizeChartOpen(true)}
                style={{ background: 'none', border: 'none', color: '#C2A649', fontWeight: 800, fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Size Guide
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {sizes.map((s) => {
                const isOutOfStock = enriched.out_of_stock_sizes?.includes(s);
                const isSelected = selectedSize === s;
                return (
                  <button
                    key={s}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSize(s)}
                    style={{
                      padding: '12px 0',
                      borderRadius: 10,
                      border: isSelected ? '2px solid #111' : '1px solid #E5E7EB',
                      background: isSelected ? '#111' : isOutOfStock ? '#F3F4F6' : '#FFF',
                      color: isSelected ? '#FFF' : isOutOfStock ? '#9CA3AF' : '#111',
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: isOutOfStock ? 'line-through' : 'none',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inline CTA Buttons (Desktop) */}
          {isDesktop && (
            <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
              <button
                onClick={() => {
                  if (!selectedSize) {
                    alert("Please select a size!");
                    return;
                  }
                  onAddToCart(enriched, selectedSize, selectedColor);
                }}
                style={{
                  flex: 1,
                  background: '#FFF',
                  color: '#111',
                  border: '2px solid #111',
                  padding: '16px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
              >
                <ShoppingCart size={18} /> ADD TO CART
              </button>
              <button
                onClick={() => {
                  if (!selectedSize) {
                    alert("Please select a size!");
                    return;
                  }
                  onBuyNow(enriched, selectedSize, selectedColor);
                }}
                style={{
                  flex: 1,
                  background: '#111',
                  color: '#FFF',
                  border: 'none',
                  padding: '16px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
              >
                ⚡ BUY NOW
              </button>
            </div>
          )}

          {/* Pincode Estimator */}
          <div style={{ background: '#F8F9FB', border: '1px solid #E5E7EB', borderRadius: 16, padding: 18, marginBottom: 28 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Truck size={16} /> Check Delivery & COD Availability
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                maxLength={6}
                placeholder="Enter Pincode (e.g. 380001)"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                style={{ flex: 1, padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', background: '#FFF' }}
              />
              <button
                disabled={checkingPincode}
                onClick={handlePincodeCheck}
                style={{ background: '#111', color: '#FFF', border: 'none', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {checkingPincode ? '...' : 'Check'}
              </button>
            </div>
            {pincodeStatus.message && (
              <p style={{ fontSize: 12, fontWeight: 600, color: pincodeStatus.type === 'success' ? '#2D6A4F' : '#9B2226', margin: '8px 0 0' }}>
                {pincodeStatus.message}
              </p>
            )}
          </div>

          {/* Collapsible Accordions */}
          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #E5E7EB' }}>
            
            {/* Description Accordion */}
            <div style={{ borderBottom: '1px solid #E5E7EB' }}>
              <button
                onClick={() => toggleAccordion('description')}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Product Description</span>
                {openAccordions.description ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openAccordions.description && (
                <div style={{ padding: '0 4px 16px', fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                  {enriched.description}
                </div>
              )}
            </div>

            {/* Material & Wash Care Accordion */}
            <div style={{ borderBottom: '1px solid #E5E7EB' }}>
              <button
                onClick={() => toggleAccordion('material')}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Material & Wash Care</span>
                {openAccordions.material ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openAccordions.material && (
                <div style={{ padding: '0 4px 16px', fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                  {materialPoints.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18, listStyleType: 'disc' }}>
                      {materialPoints.map((pt: string, idx: number) => (
                        <li key={idx} style={{ marginBottom: 6 }}>{pt}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0 }}>Standard wash care instructions apply.</p>
                  )}
                </div>
              )}
            </div>

            {/* Shipping & Returns Accordion */}
            <div style={{ borderBottom: '1px solid #E5E7EB' }}>
              <button
                onClick={() => toggleAccordion('shipping')}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 4px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Shipping & Easy Returns</span>
                {openAccordions.shipping ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openAccordions.shipping && (
                <div style={{ padding: '0 4px 16px', fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                  {shippingPoints.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18, listStyleType: 'disc' }}>
                      {shippingPoints.map((pt: string, idx: number) => (
                        <li key={idx} style={{ marginBottom: 6 }}>{pt}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0 }}>Standard shipping and return rules apply.</p>
                  )}
                </div>
              )}
            </div>
            
          </div>

          {/* Safe & secure badge */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#F8F9FB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12, marginTop: 24 }}>
            <ShieldCheck size={24} color="#2D6A4F" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#555', fontWeight: 500, lineHeight: 1.4 }}>
              <strong>100% Quality Assured</strong>. Handpicked fabric selections with strict double-stitching quality control.
            </span>
          </div>

        </div>

      </div>

      {/* Mobile Sticky CTA Bar */}
      {!isDesktop && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#FFF',
          padding: '12px 16px env(safe-area-inset-bottom)',
          borderTop: '1px solid #E5E7EB',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.08)',
          display: 'flex',
          gap: 12,
          zIndex: 490
        }}>
          <button
            onClick={() => {
              if (!selectedSize) {
                alert("Please select a size!");
                return;
              }
              onAddToCart(enriched, selectedSize, selectedColor);
            }}
            style={{
              flex: 1,
              background: '#FFF',
              color: '#111',
              border: '2px solid #111',
              padding: '14px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            <ShoppingCart size={16} /> CART
          </button>
          <button
            onClick={() => {
              if (!selectedSize) {
                alert("Please select a size!");
                return;
              }
              onBuyNow(enriched, selectedSize, selectedColor);
            }}
            style={{
              flex: 1,
              background: '#111',
              color: '#FFF',
              border: 'none',
              padding: '14px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            ⚡ BUY NOW
          </button>
        </div>
      )}

      {/* Recently Viewed Products */}
      {recentlyViewed.length > 0 && (
        <div style={{ marginTop: 48, borderTop: '1px solid #E5E7EB', paddingTop: 36, paddingBottom: 20 }}>
          <h3 className="pf" style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Recently Viewed
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {recentlyViewed.slice(0, 4).map((p: any) => (
              <ProductCard
                key={p.id}
                product={p}
                isWishlisted={isProductWishlistedGlobal(p.id)}
                onWishlistToggle={(e) => {
                  e.stopPropagation();
                  toggleWishlistGlobal(p.id);
                }}
                onClick={() => {
                  onProductClick(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                isGuest={isGuest}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size Guide Chart Modal */}
      {sizeChartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifycontent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', padding: 20 }}>
          <div style={{ background: '#FFF', borderRadius: 24, padding: 28, width: '100%', maxWidth: 500, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 25px 60px rgba(0,0,0,0.15)', position: 'relative' }}>
            <button 
              onClick={() => setSizeChartOpen(false)}
              style={{ position: 'absolute', right: 20, top: 20, background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifycontent: 'center', cursor: 'pointer', color: '#111', fontWeight: 700 }}
            >
              ✕
            </button>
            <h3 className="pf" style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 6 }}>Size Chart Guide</h3>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 20 }}>All measurements are in inches. Select your perfect fit.</p>
            
            <div style={{ overflowX: 'auto', border: '1.5px solid #E5E7EB', borderRadius: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8F9FB', borderBottom: '1.5px solid #E5E7EB' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#111' }}>Size</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#111' }}>Chest (in)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#111' }}>Length (in)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#111' }}>Shoulder (in)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { size: 'S', chest: '38', length: '27.5', shoulder: '17.5' },
                    { size: 'M', chest: '40', length: '28.5', shoulder: '18.2' },
                    { size: 'L', chest: '42', length: '29.5', shoulder: '19.0' },
                    { size: 'XL', chest: '44', length: '30.5', shoulder: '19.8' },
                    { size: 'XXL', chest: '46', length: '31.5', shoulder: '20.5' },
                  ].map((row, idx) => (
                    <tr key={row.size} style={{ borderBottom: idx === 4 ? 'none' : '1px solid #E5E7EB' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#111' }}>{row.size}</td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>{row.chest}</td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>{row.length}</td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>{row.shoulder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: 20, background: '#FFFDF5', border: '1px solid #F3E8C4', borderRadius: 12, padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <p style={{ fontSize: 11, color: '#856404', margin: 0, lineHeight: 1.4 }}>
                <strong>Fit Tip:</strong> If your chest measurement is between sizes, order the smaller size for a tighter fit or the larger size for a relaxed/oversized fit.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
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
    if (banners === null) return null;
    const dbActive = banners.filter((b: any) => b.isActive);
    if (dbActive.length > 0) return dbActive;
    return [
      {
        id: "default-1",
        name: "Summer Vacation Shirts",
        imageUrl: "/hero_fashion_banner.png",
        isActive: true,
        createdAt: Date.now(),
        ctaLink: "Shirt"
      }
    ];
  }, [banners]);

  const nextSlide = useCallback(() => {
    if (!activeBanners || activeBanners.length === 0) return;
    setCurrentSlide((c) => (c + 1) % activeBanners.length);
  }, [activeBanners]);

  const prevSlide = useCallback(() => {
    if (!activeBanners || activeBanners.length === 0) return;
    setCurrentSlide((c) => (c - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners]);

  React.useEffect(() => {
    if (slidePaused || !activeBanners || activeBanners.length <= 1) return;
    const t = setInterval(nextSlide, 5000);
    return () => clearInterval(t);
  }, [slidePaused, nextSlide, activeBanners]);

  const handleCtaClick = (ctaLink: string) => {
    setActiveTab("products");
    setSelectedGender("All");
    setSortBy("default");
    setMaxPrice(null);

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
  const [showAuthModal, setShowAuthModal] = useState(false);
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
      
      const matchesMaxPrice = maxPrice === null || (p.sellingPrice || p.price || 0) <= maxPrice;
      
      return matchesCategory && matchesGender && matchesSearch && matchesMaxPrice;
    });

    if (sortBy === "newest") {
      result = [...result].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return result;
  }, [products, selectedCategory, selectedGender, searchQuery, sortBy, maxPrice]);

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

  const handleAddToCartFromPage = (product: any, size: string, color: string) => {
    const existingIndex = cart.findIndex(
      item => item.id === product.id && item.size === size && item.color === color
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
        size: size,
        color: color,
        image: product.image || (product.images && product.images[0]) || "",
        brand: product.brand || "Shiv Western Club",
        qty: 1
      }];
    }

    setCart(updatedCart);
    setIsCartOpen(true);
  };

  const handleBuyNowFromPage = (product: any, size: string, color: string) => {
    if (profile.isGuest) {
      setShowAuthModal(true);
      return;
    }
    handleAddToCartFromPage(product, size, color);
    setCheckoutMode(true);
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
    setMaxPrice(null);

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
              <div style={{ width: isDesktop ? 44 : 38, height: isDesktop ? 44 : 38, borderRadius: 10, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
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
                  <div style={{ width: 50, height: 50, borderRadius: 14, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
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
        
        {/* Full-width Hero Banner carousel rendered edge-to-edge */}
        {activeTab === "home" && !selectedProduct && (() => {
          if (activeBanners === null) {
            return (
              <div className="w-full aspect-square md:aspect-[3/1] md:h-[300px] lg:h-[400px] bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 font-medium">
                Loading promotional banners...
              </div>
            );
          }
          return (
            <div
              className="w-full aspect-square md:aspect-[3/1] md:h-[300px] lg:h-[400px] relative overflow-hidden"
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
                      pointerEvents: active ? "auto" : "none",
                      zIndex: active ? 10 : 0
                    }}
                  >
                    {(slide.desktopImageUrl || slide.mobileImageUrl || slide.imageUrl) ? (
                      <div 
                        onClick={() => slide.ctaLink && handleCtaClick(slide.ctaLink)}
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          cursor: slide.ctaLink ? "pointer" : "default"
                        }}
                      >
                        <picture style={{ width: "100%", height: "100%" }}>
                          <source 
                            media="(max-width: 767px)" 
                            srcSet={slide.mobileImageUrl || slide.imageUrl || slide.desktopImageUrl} 
                          />
                          <img 
                            src={slide.desktopImageUrl || slide.imageUrl || slide.mobileImageUrl} 
                            alt={slide.name || "Promotion Banner"} 
                            className="w-full h-full object-cover object-center"
                          />
                        </picture>
                      </div>
                    ) : (
                      // Fallback for old seeder / gradient banners
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: slide.bg.startsWith("data:") || slide.bg.startsWith("http") ? `url(${slide.bg}) center center / cover no-repeat` : slide.bg,
                          display: "flex",
                          alignItems: "center",
                          overflow: "hidden",
                          position: "relative"
                        }}
                      >
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
                        <div style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          background: `linear-gradient(to bottom, transparent, ${slide.accent}, transparent)`,
                        }} />
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
                        <div style={{ position: "relative", zIndex: 2, padding: isDesktop ? "0 64px" : "0 24px", maxWidth: 620 }}>
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            border: `1px solid ${slide.accent}60`,
                            borderRadius: 20,
                            padding: "4px 14px",
                            marginBottom: 20,
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
                          <h2 className="pf" style={{
                            color: "#fff",
                            fontSize: isDesktop ? 68 : 38,
                            fontWeight: 800,
                            lineHeight: 1.05,
                            letterSpacing: -1,
                            margin: "0 0 16px",
                            whiteSpace: "pre-line",
                            textTransform: "uppercase"
                          }}>
                            {(slide.headline || "").split("\n").map((line: string, idx: number) => (
                              <span key={idx} style={{ display: "block" }}>
                                {idx === 1 ? (
                                  <span style={{ color: slide.accent }}>{line}</span>
                                ) : line}
                              </span>
                            ))}
                          </h2>
                          <p style={{
                            color: "rgba(255,255,255,0.65)",
                            fontSize: isDesktop ? 15 : 13,
                            lineHeight: 1.6,
                            margin: "0 0 32px",
                            maxWidth: 440,
                          }}>
                            {slide.sub}
                          </p>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
                              {slide.cta || "Shop Now"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Prev/Next arrows */}
              {activeBanners.length > 1 && [
                { dir: "prev", action: prevSlide, style: { left: 24 } },
                { dir: "next", action: nextSlide, style: { right: 24 } }
              ].map(({ dir, action, style: arrowStyle }) => (
                <button
                  key={dir}
                  onClick={action}
                  style={{
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    width: 44,
                    height: 44,
                    color: "#FFFFFF",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    zIndex: 30,
                    ...arrowStyle
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.6)";
                    e.currentTarget.style.transform = "translateY(-50%) scale(1.05)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.3)";
                    e.currentTarget.style.transform = "translateY(-50%) scale(1)";
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    {dir === "prev" ? <path d="M15 18l-6-6 6-6"/> : <path d="M9 18l6-6-6-6"/>}
                  </svg>
                </button>
              ))}

              {/* Dot indicators */}
              {activeBanners.length > 1 && (
                <div style={{
                  position: "absolute",
                  bottom: 24,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 8,
                  zIndex: 30,
                }}>
                  {activeBanners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      style={{
                        width: i === currentSlide ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        background: i === currentSlide ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Progress bar */}
              {activeBanners.length > 1 && (
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "rgba(255,255,255,0.2)",
                  zIndex: 30,
                }}>
                  <div
                    key={currentSlide}
                    style={{
                      height: "100%",
                      background: "#FFFFFF",
                      animation: slidePaused ? "none" : "progress 5s linear",
                      width: "100%",
                      transformOrigin: "left",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })()}

        {/* Tab Display Body */}
        <main style={{ flex: 1, padding: "24px 20px 100px", overflowY: "auto", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <AnimatePresence mode="wait">
            {selectedProduct ? (() => {
              const activeProduct = products.find(p => p.id === selectedProduct.id) || selectedProduct;
              return (
                <motion.div
                  key="product-detail"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductDetailPage
                    product={activeProduct}
                    onClose={() => {
                      setSelectedProduct(null);
                      setSelectedSize("");
                      setSelectedColor("");
                    }}
                    isWishlisted={isProductWishlisted(activeProduct.id)}
                    onWishlistToggle={(e) => { e.stopPropagation(); toggleWishlist(activeProduct.id); }}
                    onAddToCart={handleAddToCartFromPage}
                    onBuyNow={handleBuyNowFromPage}
                    isGuest={profile.isGuest}
                    isDesktop={isDesktop}
                    allProducts={products}
                    onProductClick={(p) => setSelectedProduct(p)}
                    isProductWishlistedGlobal={isProductWishlisted}
                    toggleWishlistGlobal={toggleWishlist}
                  />
                </motion.div>
              );
            })() : (
              <>
                {/* TABS COMPONENT SWITCHER */}

            {/* 1. HOME TAB */}
            {activeTab === "home" && (
              <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                


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
                  <div style={{ textAlign: "center", marginBottom: 28, marginTop: 12 }}>
                    <h2 className="pf" style={{ fontSize: isDesktop ? 28 : 20, fontWeight: 900, color: "#111111", textTransform: "uppercase", letterSpacing: "1.5px", margin: 0 }}>
                      MOST-WANTED CATEGORIES
                    </h2>
                    <p style={{ fontSize: isDesktop ? 13 : 11, color: "#666666", margin: "6px 0 0", fontWeight: 500 }}>
                      Loved by all, selling out fast
                    </p>
                    <div style={{ width: 60, height: 3, background: "#000000", margin: "12px auto 0", borderRadius: 2 }} />
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(6, 1fr)" : "repeat(3, 1fr)", gap: isDesktop ? 16 : 10 }}>
                    {syncedCategories.map(card => {
                      return (
                        <div
                          key={card.id}
                          onClick={() => {
                            setActiveTab("products");
                            setSelectedGender("All");
                            setSortBy("default");
                            if (card.name === "All") {
                              setSelectedCategory("All");
                              setSearchQuery("");
                              if (card.maxPrice) {
                                setMaxPrice(card.maxPrice);
                              } else {
                                setMaxPrice(null);
                              }
                            } else {
                              setSelectedCategory(card.name);
                              setSearchQuery(card.search || "");
                              setMaxPrice(null);
                            }
                          }}
                          style={{
                            position: "relative",
                            aspectRatio: "3/4",
                            borderRadius: 4,
                            overflow: "hidden",
                            cursor: "pointer",
                            boxShadow: "0 6px 15px rgba(0,0,0,0.05)",
                          }}
                          className="prod-card"
                        >
                          <img 
                            src={card.icon.startsWith("/") ? `${card.icon}?v=1.2` : card.icon} 
                            alt={card.displayName} 
                            style={{ 
                              width: "100%", 
                              height: "100%", 
                              objectFit: "cover",
                            }} 
                            className="product-image-zoom"
                          />
                          
                          {/* Dark bottom gradient overlay */}
                          {!card.hideTitle && (
                            <div 
                              style={{ 
                                position: "absolute", 
                                inset: 0, 
                                background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
                                pointerEvents: "none"
                              }} 
                            />
                          )}
                          
                          {/* Text overlay */}
                          {!card.hideTitle && (
                            <div 
                              style={{ 
                                position: "absolute", 
                                bottom: isDesktop ? 14 : 8, 
                                left: 0,
                                right: 0,
                                textAlign: "center",
                                color: "#FFFFFF",
                                zIndex: 2,
                                padding: "0 8px"
                              }}
                            >
                              <span 
                                className="pf" 
                                style={{ 
                                  display: "block", 
                                  fontSize: isDesktop ? 14 : 10, 
                                  fontWeight: 800, 
                                  textTransform: "uppercase", 
                                  letterSpacing: "1.5px",
                                  textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                                }}
                              >
                                {card.displayName}
                              </span>
                            </div>
                          )}
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {products.slice(0, 8).map(p => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          isWishlisted={isProductWishlisted(p.id)}
                          onWishlistToggle={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                          onClick={() => setSelectedProduct(p)}
                        />
                      ))}
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {products.slice().reverse().slice(0, 8).map(p => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          isWishlisted={isProductWishlisted(p.id)}
                          onWishlistToggle={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                          onClick={() => setSelectedProduct(p)}
                        />
                      ))}
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



                {/* Catalog Grid */}
                {filteredProducts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", border: `2px dashed ${C.border}`, borderRadius: 20 }}>
                    <ShoppingBag size={48} color={C.muted} style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: C.dark, margin: 0 }}>No items match your criteria</p>
                    <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Try clearing search queries or checking other categories.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {filteredProducts.map(p => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        isWishlisted={isProductWishlisted(p.id)}
                        onWishlistToggle={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                        onClick={() => setSelectedProduct(p)}
                      />
                    ))}
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
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {wishlistedProducts.map(p => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        isWishlisted={true}
                        onWishlistToggle={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                        onClick={() => setSelectedProduct(p)}
                      />
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
                            onClick={() => {
                              if (profile.isGuest) {
                                setShowAuthModal(true);
                              } else {
                                setCheckoutMode(true);
                              }
                            }}
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
          </>
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
        <div style={{ display: (window.innerWidth >= 768 || selectedProduct) ? "none" : "flex", borderTop: `1px solid ${C.border}`, background: C.card, position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -4px 20px rgba(0,0,0,0.03)" }}>
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
                      onClick={() => {
                        if (profile.isGuest) {
                          setShowAuthModal(true);
                        } else {
                          setCheckoutMode(true);
                        }
                      }}
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

      {/* ----------------- AUTH REQ MODAL ----------------- */}
      <AnimatePresence>
        {showAuthModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", padding: 24 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              style={{ 
                background: "linear-gradient(145deg, #0f244a 0%, #000000 100%)", 
                borderRadius: 28, 
                padding: "36px 32px", 
                width: "100%", 
                maxWidth: 440, 
                border: `2px solid ${C.accent}`, 
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                textAlign: "center",
                color: "#fff"
              }}
            >
              <div style={{ 
                width: 72, 
                height: 72, 
                borderRadius: "50%", 
                background: "rgba(212, 175, 55, 0.15)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                border: `2px solid ${C.accent}`, 
                margin: "0 auto 20px",
                boxShadow: "0 0 20px rgba(212, 175, 55, 0.2)"
              }}>
                <Award size={36} color={C.accent} />
              </div>

              <h3 className="pf" style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 12 }}>Account Required</h3>
              
              <p style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6, marginBottom: 28, maxWidth: 360, margin: "0 auto 28px" }}>
                You must sign in or create a free club account to place reservations. Creating an account takes less than 30 seconds and unlocks exclusive member benefits.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button 
                  onClick={() => {
                    setShowAuthModal(false);
                    onLogout(true); // Exit guest mode and prompt registration
                  }}
                  style={{ 
                    background: C.accent, 
                    color: "#000", 
                    border: "none", 
                    padding: "16px", 
                    borderRadius: 16, 
                    fontSize: 14, 
                    fontWeight: 800, 
                    cursor: "pointer", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.5px",
                    boxShadow: "0 6px 20px rgba(212, 175, 55, 0.3)",
                    transition: "transform 0.1s"
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  Create Account / Sign In
                </button>
                
                <button 
                  onClick={() => setShowAuthModal(false)} 
                  style={{ 
                    background: "transparent", 
                    border: "1.5px solid rgba(255, 255, 255, 0.2)", 
                    padding: "14px", 
                    borderRadius: 16, 
                    fontSize: 13, 
                    fontWeight: 800, 
                    cursor: "pointer", 
                    color: "#ccc"
                  }}
                >
                  Continue Browsing
                </button>
              </div>
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
