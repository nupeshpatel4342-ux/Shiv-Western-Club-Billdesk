import React from "react";
import { CatalogProduct } from "../types";
import { Heart, Shirt } from "lucide-react";
import { C } from "../constants";

interface ProductCardProps {
  product: CatalogProduct;
  isWishlisted: boolean;
  onWishlistToggle: (e: React.MouseEvent) => void;
  onClick: () => void;
  isGuest?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onWishlistToggle,
  onClick,
  isGuest = false
}) => {
  // Calculate price information
  const finalPrice = product.sellingPrice || product.price || 0;
  const mrp = product.price || finalPrice;
  const discountPct = mrp > finalPrice ? Math.round(((mrp - finalPrice) / mrp) * 100) : 0;

  // Determine badge dynamically based on name/category
  const getBadge = () => {
    const name = String(product.name).toLowerCase();
    const cat = String(product.category || "").toLowerCase();
    if (name.includes("polo") || name.includes("oversized") || cat.includes("t-shirt") || name.includes("new")) {
      return { text: "New Arrival", bg: "bg-[#FF5A36] text-white" };
    }
    if (name.includes("striped") || name.includes("linen") || cat.includes("shirt") || cat.includes("trouser") || cat.includes("jeans") || cat.includes("cargo")) {
      return { text: "Bestseller", bg: "bg-[#FFD700] text-black" };
    }
    return null;
  };

  const badge = getBadge();

  // Parse fit/subtitle dynamically
  const getSubtitle = () => {
    const name = String(product.name).toLowerCase();
    if (name.includes("oversized")) return "Oversized-Fit";
    if (name.includes("slim")) return "Slim-Fit";
    return "Regular-Fit";
  };

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer flex flex-col justify-between w-full h-full bg-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100 p-3"
    >
      <div className="flex flex-col">
        {/* Image Container */}
        <div 
          style={{ aspectRatio: "3/4" }}
          className="w-full relative bg-gray-50 flex items-center justify-center overflow-hidden rounded-lg mb-3 border border-gray-100/50"
        >
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <Shirt size={40} strokeWidth={1.5} />
            </div>
          )}

          {/* Badge (Top Left) */}
          {badge && (
            <div className={`absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-[3px] text-[10px] font-extrabold uppercase tracking-wider ${badge.bg}`}>
              {badge.text}
            </div>
          )}

          {/* Wishlist Button (Top Right) */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onWishlistToggle(e);
            }}
            className="absolute top-2.5 right-2.5 z-10 bg-white hover:bg-gray-50 rounded-full w-8 h-8 flex items-center justify-center shadow-md border border-gray-100 transition-colors"
          >
            <Heart 
              size={16} 
              fill={isWishlisted ? "#E63946" : "none"} 
              color={isWishlisted ? "#E63946" : "#777777"} 
            />
          </button>
        </div>

        {/* Product Brand */}
        <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest block mb-0.5">
          {product.brand || "SHIV WESTERN"}
        </span>

        {/* Product Title */}
        <h4 className="text-sm font-semibold text-gray-900 truncate block group-hover:text-black">
          {product.name}
        </h4>

        {/* Subtitle / Fit */}
        <span className="text-xs text-gray-400 mt-0.5 block">
          {getSubtitle()}
        </span>
      </div>

      {/* Pricing Row */}
      <div className="flex items-baseline gap-2 mt-2 pt-1.5 border-t border-gray-50">
        <span className="text-sm font-black text-gray-900">
          ₹{finalPrice.toLocaleString("en-IN")}
        </span>
        {mrp > finalPrice && (
          <>
            <span className="text-xs text-gray-400 line-through">
              ₹{mrp.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] font-extrabold text-[#2D6A4F]">
              ({discountPct}% off)
            </span>
          </>
        )}
      </div>
    </div>
  );
};
