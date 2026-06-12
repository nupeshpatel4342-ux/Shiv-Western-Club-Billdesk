// Schema definition representing the Database/Admin Panel structure for a Menswear Product.
// This structure is ready to be loaded from Firestore, Supabase, or a custom REST API.

export interface ProductSchema {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  price: number;              // Selling price (e.g., 849)
  mrp: number;                // Original Manufacturer's Retail Price (e.g., 1499)
  discount: number;           // Discount percentage (e.g., 43)
  images: string[];           // Array of high-resolution image URLs
  available_sizes: string[];  // Available sizes (e.g., ["S", "M", "L", "XL", "XXL"])
  out_of_stock_sizes: string[]; // Sizes that are out of stock (e.g., ["XXL"])
  available_colors: {         // Available colors with their hex codes and specific images
    name: string;
    hex: string;
    image_index: number;      // Index in the images array representing this color's photo
  }[];
  description: string;        // Product description text
  material_care: string[];    // Bullet points for material and wash care instructions
  shipping_returns: string[]; // Bullet points for shipping and returns policy
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  stock_quantity: number;     // Remaining stock count
}

export const MOCK_ADMIN_PRODUCT: ProductSchema = {
  id: "swc-shirt-001",
  name: "Vintage Coastal Indigo Linen Shirt",
  slug: "vintage-coastal-indigo-linen-shirt",
  category: "Shirt",
  brand: "Shiv Western Club",
  price: 849,
  mrp: 1499,
  discount: 43,
  images: [
    "/categories/shirts.png",                 // Main Indigo Color
    "/categories/shirts_focused_1781203465401.png", // Thumbnail 2
    "/categories/activewear.png",             // Olive Variant Photo
    "/categories/printed.png"                 // Ivory White Variant Photo
  ],
  available_sizes: ["S", "M", "L", "XL", "XXL"],
  out_of_stock_sizes: ["XXL"],
  available_colors: [
    { name: "Indigo Blue", hex: "#1A365D", image_index: 0 },
    { name: "Olive Green", hex: "#4A5D4E", image_index: 2 },
    { name: "Ivory White", hex: "#F5F5F0", image_index: 3 }
  ],
  description: "Crafted from a premium blend of breathability and comfort, the Vintage Coastal Indigo Linen Shirt is your ultimate warm-weather essential. Featuring a classic resort collar, tailored slim-fit design, and naturally textured fabric, it pairs effortlessly with structured cargos or lightweight denims. Engineered for comfort and designed to keep you cool under pressure.",
  material_care: [
    "100% Breathable Organic Cotton-Linen Blend",
    "Soft-washed for pre-shrunk comfort",
    "Machine wash cold inside out on a gentle cycle",
    "Wash with similar dark indigo colors",
    "Line dry in shade; warm iron if necessary",
    "Do not bleach or dry clean"
  ],
  shipping_returns: [
    "Free standard shipping on all orders above ₹999",
    "Dispatched within 24-48 hours; delivery in 3-5 business days",
    "15-Day hassle-free online returns and color exchanges",
    "Cash on Delivery (COD) & Cashless UPI payments supported"
  ],
  stock_status: "in_stock",
  stock_quantity: 12
};
