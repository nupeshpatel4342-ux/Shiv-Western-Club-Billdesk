import React, { useState, useEffect } from "react";
import { C } from "./constants";
import { Bill, Settings, UserProfile, CatalogProduct } from "./types";
import { Header, Drawer, BottomNav, Sidebar } from "./components/Layout";
import { Shirt } from "lucide-react";
const NewBillScreen = React.lazy(() => import("./screens/NewBillScreen").then(m => ({ default: m.NewBillScreen })));
const InvoiceScreen = React.lazy(() => import("./screens/InvoiceScreen").then(m => ({ default: m.InvoiceScreen })));
const HistoryScreen = React.lazy(() => import("./screens/HistoryScreen").then(m => ({ default: m.HistoryScreen })));
const SettingsScreen = React.lazy(() => import("./screens/SettingsScreen").then(m => ({ default: m.SettingsScreen })));
const DashboardScreen = React.lazy(() => import("./screens/DashboardScreen").then(m => ({ default: m.DashboardScreen })));
const ProductsScreen = React.lazy(() => import("./screens/ProductsScreen").then(m => ({ default: m.ProductsScreen })));
const CustomerScreen = React.lazy(() => import("./screens/CustomerScreen").then(m => ({ default: m.CustomerScreen })));
const InventoryScreen = React.lazy(() => import("./screens/InventoryScreen").then(m => ({ default: m.InventoryScreen })));
const CustomersScreen = React.lazy(() => import("./screens/CustomersScreen").then(m => ({ default: m.CustomersScreen })));
const OrdersScreen = React.lazy(() => import("./screens/OrdersScreen").then(m => ({ default: m.OrdersScreen })));
const ReportsScreen = React.lazy(() => import("./screens/ReportsScreen").then(m => ({ default: m.ReportsScreen })));
import { auth, db, loginWithGoogle, loginWithEmail, registerWithEmail, logout, handleFirestoreError, OperationType, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, loginAnonymously } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot, query, orderBy, serverTimestamp, where, getDocs, addDoc, updateDoc } from "firebase/firestore";
import { AnimatePresence, motion } from "motion/react";


const App = () => {
  const [tab, setTab] = useState("dashboard"); // Default to dashboard for admin
  const [drawer, setDrawer] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  
  // Hash & Path-Based Portal Routing (/admin or #admin for admin, else customer)
  const checkIsAdmin = () => {
    const path = window.location.pathname.replace(/^\/+/g, '').replace(/\/+$/g, '').toLowerCase();
    const hash = window.location.hash.replace('#', '').replace('/', '').toLowerCase();
    return path === 'admin' || hash === 'admin';
  };

  const [isAdminPortal, setIsAdminPortal] = useState(checkIsAdmin);

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminPortal(checkIsAdmin());
    };
    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  const navigateTo = (portal: "admin" | "customer") => {
    if (portal === "admin") {
      history.pushState(null, "", "/admin");
      setIsAdminPortal(true);
    } else {
      history.pushState(null, "", "/");
      setIsAdminPortal(false);
    }
  };
  
  // Customer Login/Register states
  const [custPhone, setCustPhone] = useState("");
  const [custPassword, setCustPassword] = useState("");
  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custRegister, setCustRegister] = useState(false);
  const [custReset, setCustReset] = useState(false);

  // Admin login states
  const [loginMode, setLoginMode] = useState<"direct" | "google" | "email" | "phone">("direct");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const [settings, setSettings] = useState<Settings>({
    shopName: "Shiv Western Club",
    ownerName: "Nupesh Patel",
    address: "123, Fashion Hub, Near Main Market, Ahmedabad, Gujarat - 380001",
    phone: "98765 43210",
    email: "contact@shivwestern.com",
    currency: "₹"
  });
  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const isAdmin = profile?.role === "admin" || profile?.role === "owner" || profile?.role === "manager";
  const isOwner = profile?.role === "admin" || profile?.role === "owner";

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        setUser(u);
        if (u) {
          // Fetch or Create Profile
          const pDoc = await getDoc(doc(db, "users", u.uid));
          const isOwnerEmail = u.email?.toLowerCase() === "nupeshpatel4342@gmail.com";
          
          if (pDoc.exists()) {
            const currentProfile = pDoc.data() as any;
            if (currentProfile.role === "customer") {
              const cDoc = await getDoc(doc(db, "customers", u.uid));
              if (cDoc.exists()) {
                setProfile({ ...currentProfile, ...cDoc.data() });
              } else {
                setProfile(currentProfile);
              }
            } else {
              // Ensure owner always has owner role
              if (isOwnerEmail && currentProfile.role !== "admin" && currentProfile.role !== "owner") {
                const updatedProfile = { ...currentProfile, role: "owner" as const };
                await setDoc(doc(db, "users", u.uid), updatedProfile);
                setProfile(updatedProfile);
              } else {
                setProfile(currentProfile);
              }
            }
          } else {
            // If it is virtual customer email, create customer profile
            if (u.email?.endsWith("@customer.shivwestern.com")) {
              // Handled during registration, but fallback here
              const newProfile = {
                uid: u.uid,
                email: u.email,
                displayName: u.displayName || "Customer",
                role: "customer",
                createdAt: Date.now()
              };
              await setDoc(doc(db, "users", u.uid), newProfile);
              setProfile(newProfile);
            } else {
              const newProfile: UserProfile = {
                uid: u.uid,
                email: u.email || "",
                displayName: u.displayName || "Staff Member",
                photoURL: u.photoURL || "",
                role: isOwnerEmail ? "owner" : "staff",
                createdAt: Date.now()
              };
              await setDoc(doc(db, "users", u.uid), newProfile);
              setProfile(newProfile);
            }
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth sync profile error:", err);
        // On error (e.g. Permission Denied), clear auth state so they can log in/out properly
        setProfile(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  // Sync Settings
  useEffect(() => {
    if (!user && !isGuestMode) return;
    const unsub = onSnapshot(doc(db, "settings", "global"), (s) => {
      if (s.exists()) setSettings(s.data() as Settings);
    }, (err) => handleFirestoreError(err, OperationType.GET, "settings/global"));
    return unsub;
  }, [user, isGuestMode]);

  // Sync Bills
  useEffect(() => {
    if (!user || !profile) return;
    let q;
    if (profile.role === "customer") {
      const cleanPhone = profile.phone ? String(profile.phone).replace(/\D/g, "").slice(-10) : "";
      if (!cleanPhone) {
        setBills([]);
        return;
      }
      q = query(
        collection(db, "bills"),
        where("customerObj.phone", "in", [
          cleanPhone,
          `+91${cleanPhone}`,
          `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`,
          `${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`
        ])
      );
    } else {
      q = query(collection(db, "bills"), orderBy("timestamp", "desc"));
    }
    const unsub = onSnapshot(q, (s) => {
      const bList = s.docs.map(d => d.data() as Bill);
      const sorted = bList.sort((a, b) => b.timestamp - a.timestamp);
      setBills(sorted);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "bills"));
    return unsub;
  }, [user, profile]);

  // Sync Products
  useEffect(() => {
    if (!user && !isGuestMode) return;
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (s) => {
      const pList = s.docs.map(d => ({ id: d.id, ...d.data() }) as CatalogProduct);
      setProducts(pList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "products"));
    return unsub;
  }, [user, isGuestMode]);

  // Sync Orders
  useEffect(() => {
    if (!user || !profile) return;
    let q;
    if (profile.role === "customer") {
      if (!profile.phone) {
        setOrders([]);
        return;
      }
      q = query(
        collection(db, "orders"),
        where("customerPhone", "==", profile.phone),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    }
    const unsub = onSnapshot(q, (s) => {
      const oList = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(oList);
    }, (err) => console.error(err));
    return unsub;
  }, [user, profile]);

  // Sync Users Directory (for staff roles)
  useEffect(() => {
    if (!user || (profile?.role !== "admin" && profile?.role !== "owner")) return;
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (s) => {
      const uList = s.docs.map(d => d.data() as UserProfile);
      setUsers(uList);
    }, (err) => console.error(err));
    return unsub;
  }, [user, profile]);


  const updateCustomerLedgerAndStock = async (bill: Bill) => {
    try {
      // 1. Deduct Stock for each billed item
      if (Array.isArray(bill.items)) {
        for (const item of bill.items) {
          if (!item || !item.name) continue;
          const cleanItemName = String(item.name).toLowerCase().trim();
          const cleanItemSku = item.sku ? String(item.sku).toLowerCase().trim() : "";
          const prod = products.find(p => p && p.name && String(p.name).toLowerCase().trim() === cleanItemName || (p.sku && String(p.sku).toLowerCase().trim() === cleanItemSku));
          if (prod) {
            const currentStock = (prod as any).stock !== undefined ? (prod as any).stock : 0;
            const newStock = Math.max(0, currentStock - item.qty);
            await setDoc(doc(db, "products", prod.id), {
              ...prod,
              stock: newStock
            });
            // Log history in inventory_history
            await addDoc(collection(db, "inventory_history"), {
              productId: prod.id,
              productName: prod.name,
              previousStock: currentStock,
              newStock: newStock,
              change: -item.qty,
              type: "sale",
              updatedBy: profile?.displayName || "Staff Billing",
              timestamp: Date.now(),
              reason: `Billed in Invoice #${bill.id}`
            });
          }
        }
      }

      const cleanPhone = bill?.customerObj?.phone ? String(bill.customerObj.phone).replace(/\D/g, "").slice(-10) : "";
      if (cleanPhone.length >= 10) {
        const custQuery = query(collection(db, "customers"), where("phone", "==", cleanPhone));
        const qSnap = await getDocs(custQuery);
        if (!qSnap.empty) {
          const custDoc = qSnap.docs[0];
          const custData = custDoc.data() as any;
          const updatedHistory = [...(custData.purchaseHistory || [])];
          if (!updatedHistory.includes(bill.id)) {
            updatedHistory.push(bill.id);
          }
          const newTotalPurchase = (custData.totalPurchase || 0) + bill.total;
          const newLoyaltyPoints = Math.floor(newTotalPurchase / 100);
          await setDoc(doc(db, "customers", custDoc.id), {
            ...custData,
            purchaseHistory: updatedHistory,
            totalPurchase: newTotalPurchase,
            loyaltyPoints: newLoyaltyPoints
          });
        }
      }
    } catch (e) {
      console.error("Ledger Sync Error:", e);
    }
  };

  const handleGenerate = async (bill: Bill) => {
    try {
      const billWithUser = { ...bill, createdBy: user?.uid };
      await setDoc(doc(db, "bills", bill.id), billWithUser);
      
      // Update ledger & inventory stock
      await updateCustomerLedgerAndStock(bill);

      setCurrentBill(billWithUser);
      setBillToEdit(null);
      setTab("invoice");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `bills/${bill.id}`);
    }
  };

  const handleEdit = (bill: Bill) => {
    setBillToEdit(bill);
    setTab("bill");
  };

  const handleView = (bill: Bill) => {
    setCurrentBill(bill);
    setTab("invoice");
  };

  const handleUpdateBill = async (updated: Bill) => {
    try {
      await setDoc(doc(db, "bills", updated.id), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bills/${updated.id}`);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    try {
      await deleteDoc(doc(db, "bills", billId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `bills/${billId}`);
    }
  };

  const handleDeleteAllBills = async () => {
    try {
      const promises = bills.map(b => deleteDoc(doc(db, "bills", b.id)));
      await Promise.all(promises);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "bills/all");
    }
  };

  const handleResetAllData = async () => {
    try {
      // Delete all bills
      const billPromises = bills.map(b => deleteDoc(doc(db, "bills", b.id)));
      await Promise.all(billPromises);
      
      // Reset settings to default
      const defaultSettings: Settings = {
        shopName: "Shiv Western Club",
        ownerName: "Nupesh Patel",
        address: "123, Fashion Hub, Near Main Market, Ahmedabad, Gujarat - 380001",
        phone: "98765 43210",
        email: "contact@shivwestern.com",
        currency: "₹"
      };
      await setDoc(doc(db, "settings", "global"), defaultSettings);
      
      alert("All data has been reset successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "all-data");
    }
  };

  const handleSaveSettings = async (s: Settings) => {
    try {
      await setDoc(doc(db, "settings", "global"), s);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/global");
    }
  };

  const handleUpdateUserRole = async (uid: string, newRole: string) => {
    try {
      await setDoc(doc(db, "users", uid), { role: newRole }, { merge: true });
    } catch (err) {
      console.error("Failed to update role", err);
      alert("Error updating role");
    }
  };

  const handleUpdateProfile = async (p: any) => {
    try {
      if (isGuestMode || p.isGuest) {
        localStorage.setItem("guest_wishlist", JSON.stringify(p.wishlist || []));
        setProfile(p);
        return;
      }
      await setDoc(doc(db, "users", p.uid), {
        uid: p.uid,
        email: p.email || "",
        displayName: p.displayName || p.name || "",
        photoURL: p.photoURL || "",
        role: p.role || "customer",
        createdAt: p.createdAt || Date.now()
      });
      if (p.role === "customer") {
        await setDoc(doc(db, "customers", p.uid), {
          uid: p.uid,
          name: p.displayName || p.name || "Customer",
          phone: p.phone || "",
          password: p.password || "",
          address: p.address || "",
          loyaltyPoints: p.loyaltyPoints || 0,
          totalPurchase: p.totalPurchase || 0,
          purchaseHistory: p.purchaseHistory || [],
          wishlist: p.wishlist || [],
          createdAt: p.createdAt || Date.now()
        });
      }
      setProfile(p);
    } catch (err) {
      console.error("Profile update error:", err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${p.uid}`);
    }
  };

  const handleNav = (newTab: string) => {
    if (newTab === "bill") setBillToEdit(null);
    setTab(newTab);
  };

  // Customer Auth Virtualization Handlers
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    const cleanPhone = custPhone.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || !custPassword) {
      alert("Please enter mobile number and password.");
      return;
    }
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsLoggingIn(true);
    try {
      const virtualEmail = `${cleanPhone}@customer.shivwestern.com`;
      await loginWithEmail(virtualEmail, custPassword);
      navigateTo("customer");
    } catch (err: any) {
      console.error("Customer Login Error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        alert("Invalid mobile number or password.");
      } else {
        alert(err.message || "Login failed.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    const cleanPhone = custPhone.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || !custPassword || !custName) {
      alert("Please fill in Name, Mobile, and Password.");
      return;
    }
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsLoggingIn(true);
    try {
      const virtualEmail = `${cleanPhone}@customer.shivwestern.com`;

      const userCred = await registerWithEmail(virtualEmail, custPassword);
      const u = userCred.user;

      // 1. Create user profile in users
      const newProfile = {
        uid: u.uid,
        email: virtualEmail,
        displayName: custName,
        role: "customer",
        createdAt: Date.now()
      };
      await setDoc(doc(db, "users", u.uid), newProfile);

      // 2. Create customer details in customers
      const customerDetails = {
        uid: u.uid,
        name: custName,
        phone: cleanPhone,
        password: custPassword,
        address: custAddress,
        loyaltyPoints: 0,
        totalPurchase: 0,
        purchaseHistory: [],
        wishlist: [],
        createdAt: Date.now()
      };
      await setDoc(doc(db, "customers", u.uid), customerDetails);

      setProfile({ ...newProfile, ...customerDetails });
      navigateTo("customer");
      alert("🎉 Account created successfully! Welcome to Shiv Western Club.");
    } catch (err: any) {
      console.error("Customer Register Error:", err);
      if (err.code === "auth/email-already-in-use") {
        alert("This mobile number is already registered.");
      } else {
        alert(err.message || "Registration failed.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCustomerResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = custPhone.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    try {
      const q = query(collection(db, "customers"), where("phone", "==", cleanPhone));
      const qSnap = await getDocs(q);
      if (qSnap.empty) {
        alert("Mobile number not registered.");
        return;
      }
      const data = qSnap.docs[0].data();
      alert(`Security Check: Registered name is "${data.name}". Your password is: ${data.password}`);
      setCustReset(false);
    } catch (err) {
      console.error(err);
      alert("Failed to retrieve password. Please contact shop staff.");
    }
  };

  const handleCreateOrder = async (orderData: any) => {
    await addDoc(collection(db, "orders"), orderData);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status });
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code === "auth/cancelled-popup-request") {
        console.warn("Login popup request was cancelled by a subsequent request.");
      } else if (err.code === "auth/popup-closed-by-user") {
        console.warn("Login popup was closed by the user.");
      } else {
        console.error("Login Error:", err);
        alert("Login failed. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDirectLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await loginAnonymously();
    } catch (err: any) {
      console.error("Direct Login Error:", err);
      alert("Failed to enter app. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }
    setIsLoggingIn(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error("Email Login Error:", err);
      if (err.code === "auth/user-not-found") {
        alert("User not found. Please register first.");
      } else if (err.code === "auth/wrong-password") {
        alert("Incorrect password.");
      } else if (err.code === "auth/email-already-in-use") {
        alert("This email is already registered. Switching to Login mode.");
        setIsRegistering(false);
      } else {
        alert(err.message || "Login failed.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    
    let formattedPhone = phone.trim();
    // If it's 10 digits and doesn't start with +, assume +91
    if (formattedPhone.length === 10 && !formattedPhone.startsWith("+")) {
      formattedPhone = "+91" + formattedPhone;
    }

    if (!formattedPhone.startsWith("+")) {
      alert("Please include country code (e.g., +91 for India).");
      return;
    }

    setIsLoggingIn(true);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      alert("OTP sent to your mobile.");
    } catch (err: any) {
      console.error("Phone Auth Error:", err);
      if (err.code === "auth/invalid-phone-number") {
        alert("Invalid phone number format. Please use +91 followed by your 10-digit number.");
      } else {
        alert(err.message || "Failed to send OTP.");
      }
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;
    setIsLoggingIn(true);
    try {
      await confirmationResult.confirm(otp);
    } catch (err: any) {
      console.error("OTP Verification Error:", err);
      alert("Invalid OTP. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
        <div style={{ textAlign: "center" }}>
          {settings?.logo ? (
            <img src={settings.logo} alt="Logo" style={{ width: 80, height: 80, objectFit: "contain", marginBottom: 20 }} />
          ) : (
            <div style={{ width: 40, height: 40, border: `4px solid ${C.bg}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          )}
          <p style={{ fontSize: 14, color: C.muted, fontWeight: 600 }}>{settings?.shopName || "Shiv Western Club"} loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !isGuestMode) {
    const isAdminPath = isAdminPortal;
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 20 }}>
        <div className="fade" style={{ width: "100%", maxWidth: 360, background: C.card, borderRadius: 32, padding: 32, textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.1)", border: `1px solid ${C.border}` }}>
          {settings?.logo ? (
            <img src={settings.logo} alt="Logo" style={{ width: 100, height: 100, objectFit: "contain", margin: "0 auto 20px" }} />
          ) : (
            <div style={{ width: 60, height: 60, borderRadius: 20, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: `0 10px 20px rgba(0,0,0,0.2)`, border: `2px solid ${C.accent}` }}>
              <Shirt color={C.accent} size={30} strokeWidth={2.5} />
            </div>
          )}
          <h1 className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.dark, marginBottom: 4, letterSpacing: "-0.5px" }}>{settings?.shopName || "Shiv Western Club"}</h1>
          <p style={{ fontSize: 11, color: C.accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 20 }}>
            {isAdminPath ? "Admin & Staff Portal" : "Customer Club Portal"}
          </p>

          {!isAdminPath ? (
            /* CUSTOMER PORTAL VIEWS */
            custReset ? (
              <form onSubmit={handleCustomerResetPassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h3 className="pf" style={{ fontSize: 14, fontWeight: 800, color: C.dark, marginBottom: 4 }}>Recover Club Password</h3>
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Enter your registered mobile number to retrieve your portal password.</p>
                <input 
                  type="tel" 
                  placeholder="Registered Mobile Number" 
                  value={custPhone} 
                  onChange={e => setCustPhone(e.target.value)}
                  required
                  style={{ padding: "14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                />
                <button 
                  type="submit"
                  style={{ width: "100%", background: C.dark, color: C.accent, padding: "16px", borderRadius: 16, fontSize: 14, fontWeight: 800, border: `2px solid ${C.accent}`, cursor: "pointer", marginTop: 8 }}
                >
                  Retrieve Password Key
                </button>
                <button 
                  type="button" 
                  onClick={() => setCustReset(false)}
                  style={{ background: "transparent", border: "none", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 4 }}
                >
                  ← Back to login
                </button>
              </form>
            ) : custRegister ? (
              <form onSubmit={handleCustomerRegister} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h3 className="pf" style={{ fontSize: 14, fontWeight: 800, color: C.dark, marginBottom: 4 }}>Join Our Customer Club</h3>
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={custName} 
                  onChange={e => setCustName(e.target.value)}
                  required
                  style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 13 }}
                />
                <input 
                  type="tel" 
                  placeholder="Mobile Number" 
                  value={custPhone} 
                  onChange={e => setCustPhone(e.target.value)}
                  required
                  style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 13 }}
                />
                <input 
                  type="password" 
                  placeholder="Create Portal Password" 
                  value={custPassword} 
                  onChange={e => setCustPassword(e.target.value)}
                  required
                  style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 13 }}
                />
                <input 
                  type="text" 
                  placeholder="Delivery Address (Optional)" 
                  value={custAddress} 
                  onChange={e => setCustAddress(e.target.value)}
                  style={{ padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 13 }}
                />
                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  style={{ width: "100%", background: C.dark, color: C.accent, padding: "14px", borderRadius: 14, fontSize: 14, fontWeight: 800, border: `2px solid ${C.accent}`, cursor: "pointer", marginTop: 4 }}
                >
                  {isLoggingIn ? "Registering..." : "Register & Sign In"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setCustRegister(false)}
                  style={{ background: "transparent", border: "none", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 4 }}
                >
                  Already have an account? Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleCustomerLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h3 className="pf" style={{ fontSize: 14, fontWeight: 800, color: C.dark, marginBottom: 4 }}>Customer Login</h3>
                <input 
                  type="tel" 
                  placeholder="Mobile Number" 
                  value={custPhone} 
                  onChange={e => setCustPhone(e.target.value)}
                  required
                  style={{ padding: "14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={custPassword} 
                  onChange={e => setCustPassword(e.target.value)}
                  required
                  style={{ padding: "14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                />
                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  style={{ width: "100%", background: C.dark, color: C.accent, padding: "16px", borderRadius: 16, fontSize: 14, fontWeight: 800, border: `2px solid ${C.accent}`, cursor: "pointer", marginTop: 8 }}
                >
                  {isLoggingIn ? "Logging in..." : "Login to Portal"}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsGuestMode(true);
                    setProfile({
                      uid: "guest",
                      email: "guest@shivwestern.com",
                      displayName: "Guest Customer",
                      role: "customer",
                      isGuest: true,
                      wishlist: JSON.parse(localStorage.getItem("guest_wishlist") || "[]"),
                      phone: "",
                      address: ""
                    });
                  }}
                  style={{ width: "100%", background: "transparent", color: C.dark, padding: "12px", borderRadius: 16, fontSize: 13, fontWeight: 800, border: `1.5px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  🛍️ Browse Catalog as Guest
                </button>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <button 
                    type="button"
                    onClick={() => setCustRegister(true)}
                    style={{ background: "transparent", border: "none", color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Create Account
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCustReset(true)}
                    style={{ background: "transparent", border: "none", color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </form>
            )
          ) : (
            /* STAFF / ADMIN VIEW */
            loginMode === "direct" ? (
              <>
                <button 
                  onClick={handleDirectLogin} 
                  disabled={isLoggingIn}
                  style={{ 
                    width: "100%", 
                    background: C.dark, 
                    color: C.accent, 
                    padding: "18px", 
                    borderRadius: 20, 
                    fontSize: 16, 
                    fontWeight: 800, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: 12, 
                    boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
                    opacity: isLoggingIn ? 0.7 : 1,
                    cursor: isLoggingIn ? "not-allowed" : "pointer",
                    border: `2px solid ${C.accent}`,
                    textTransform: "uppercase",
                    letterSpacing: "1px"
                  }}
                >
                  {isLoggingIn ? (
                    <div style={{ width: 20, height: 20, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  ) : "Enter App Directly"}
                </button>
                <button 
                  onClick={() => setLoginMode("google")}
                  style={{ marginTop: 20, background: "transparent", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Staff Login (Google/Email/Phone)
                </button>
                <button 
                  type="button"
                  onClick={() => navigateTo("customer")}
                  style={{ background: "transparent", border: "none", color: C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", marginTop: 16, textDecoration: "underline", display: "block", width: "100%" }}
                >
                  Are you a Customer? Go to Customer Portal →
                </button>
              </>
            ) : loginMode === "google" ? (
              <>
                <button 
                  onClick={handleLogin} 
                  disabled={isLoggingIn}
                  style={{ 
                    width: "100%", 
                    background: isLoggingIn ? C.muted : C.dark, 
                    color: isLoggingIn ? "#fff" : C.accent, 
                    padding: "16px", 
                    borderRadius: 16, 
                    fontSize: 15, 
                    fontWeight: 700, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: 12, 
                    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                    opacity: isLoggingIn ? 0.7 : 1,
                    cursor: isLoggingIn ? "not-allowed" : "pointer",
                    border: `2px solid ${C.accent}`
                  }}
                >
                  {isLoggingIn ? (
                    <div style={{ width: 20, height: 20, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  ) : (
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="Google" />
                  )}
                  {isLoggingIn ? "Signing in..." : "Sign in with Google"}
                </button>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                  <button 
                    onClick={() => setLoginMode("email")}
                    style={{ background: "transparent", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    Login with Email/Password
                  </button>
                  <button 
                    onClick={() => setLoginMode("phone")}
                    style={{ background: "transparent", border: "none", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    Login with Phone Number
                  </button>
                  <button 
                    onClick={() => setLoginMode("direct")}
                    style={{ background: "transparent", border: "none", color: C.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 8 }}
                  >
                    Back to Direct Entry
                  </button>
                </div>
              </>
            ) : loginMode === "email" ? (
              <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  style={{ padding: "14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  style={{ padding: "14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                />
                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  style={{ 
                    width: "100%", 
                    background: C.dark, 
                    color: C.accent, 
                    padding: "16px", 
                    borderRadius: 16, 
                    fontSize: 15, 
                    fontWeight: 700, 
                    marginTop: 8,
                    border: `2px solid ${C.accent}`,
                    opacity: isLoggingIn ? 0.7 : 1
                  }}
                >
                  {isLoggingIn ? "Processing..." : (isRegistering ? "Create Account" : "Login")}
                </button>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <button 
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    style={{ background: "transparent", border: "none", color: C.muted, fontSize: 12, fontWeight: 600 }}
                  >
                    {isRegistering ? "Already have an account? Login" : "New Staff? Register"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setLoginMode("google")}
                    style={{ background: "transparent", border: "none", color: C.accent, fontSize: 12, fontWeight: 700 }}
                  >
                    Back to Google
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={confirmationResult ? handleVerifyOtp : handlePhoneLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {!confirmationResult ? (
                  <>
                    <input 
                      type="tel" 
                      placeholder="Mobile Number (e.g. 9876543210)" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      style={{ padding: "14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14 }}
                    />
                    <p style={{ fontSize: 10, color: C.muted, marginTop: -8, marginLeft: 4 }}>* Include +91 if outside India</p>
                  </>
                ) : (
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value)}
                    style={{ padding: "14px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, textAlign: "center", letterSpacing: "4px", fontWeight: 700 }}
                  />
                )}
                <div id="recaptcha-container"></div>
                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  style={{ 
                    width: "100%", 
                    background: C.dark, 
                    color: C.accent, 
                    padding: "16px", 
                    borderRadius: 16, 
                    fontSize: 15, 
                    fontWeight: 700, 
                    marginTop: 8,
                    border: `2px solid ${C.accent}`,
                    opacity: isLoggingIn ? 0.7 : 1
                  }}
                >
                  {isLoggingIn ? "Processing..." : (confirmationResult ? "Verify OTP" : "Send OTP")}
                </button>
                <button 
                  type="button"
                  onClick={() => { setLoginMode("google"); setConfirmationResult(null); }}
                  style={{ background: "transparent", border: "none", color: C.accent, fontSize: 12, fontWeight: 700, marginTop: 12 }}
                >
                  Back to Google
                </button>
              </form>
            )
          )}
          
          <p style={{ fontSize: 11, color: C.muted, marginTop: 24 }}>Authorized access only. Contact owner for staff access.</p>
        </div>
      </div>
    );
  }

  // REDIRECT AND ENFORCE PATH-BASED AUTHENTICATION ROLES
  const isPathAdmin = isAdminPortal;

  // Case A: Customer logged in, but tries to access /admin
  if (isPathAdmin && profile?.role === "customer") {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 20 }}>
        <div style={{ width: "100%", maxWidth: 380, background: C.card, borderRadius: 28, padding: 32, textAlign: "center", border: `1.5px solid ${C.red}`, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
          <span style={{ fontSize: 44 }}>🚫</span>
          <h3 className="pf" style={{ fontSize: 20, fontWeight: 900, color: C.red, marginTop: 16, marginBottom: 8 }}>Access Denied</h3>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 24 }}>You do not have staff/admin privileges. This account is registered in the Customer Club.</p>
          <button 
            onClick={() => navigateTo("customer")}
            style={{ width: "100%", background: C.dark, color: C.accent, border: `1.5px solid ${C.accent}`, padding: "14px", borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Go to Customer Portal →
          </button>
          <button 
            onClick={logout}
            style={{ background: "transparent", border: "none", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 16 }}
          >
            Log Out from Account
          </button>
        </div>
      </div>
    );
  }

  // Case B: Staff/Admin logged in, but tries to access / (Customer Portal) - auto-redirect
  if (!isPathAdmin && profile?.role && profile.role !== "customer") {
    // Auto-redirect staff/admin to admin portal
    navigateTo("admin");
    return null;
  }

  // Case C: Customer logged in on / (Customer view) OR guest mode active
  if (!isPathAdmin && (isGuestMode || (profile && profile.role === "customer"))) {
    const activeProfile = isGuestMode ? (profile || {
      uid: "guest",
      email: "guest@shivwestern.com",
      displayName: "Guest Customer",
      role: "customer",
      isGuest: true,
      wishlist: JSON.parse(localStorage.getItem("guest_wishlist") || "[]"),
      phone: "",
      address: ""
    }) : profile;

    return (
      <React.Suspense fallback={
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
          <div style={{ width: 40, height: 40, border: `4px solid ${C.bg}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      }>
        <CustomerScreen
          products={products}
          settings={settings}
          bills={bills}
          profile={activeProfile}
          orders={orders}
          onLogout={(startRegister?: boolean) => {
            if (isGuestMode) {
              setIsGuestMode(false);
              setProfile(null);
              if (startRegister) {
                setCustRegister(true);
              }
            } else {
              logout();
            }
          }}
          onUpdateProfile={handleUpdateProfile}
          onCreateOrder={handleCreateOrder}
        />
      </React.Suspense>
    );
  }

  const renderScreen = () => {
    const pageVariants = {
      initial: { opacity: 0, y: 10, scale: 0.98 },
      animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }
    };

    const wrapScreen = (content: React.ReactNode, key: string) => (
      <motion.div
        key={key}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        style={{ height: "100%" }}
      >
        {content}
      </motion.div>
    );

    switch (tab) {
      case "bill": return wrapScreen(<NewBillScreen onGenerate={handleGenerate} settings={settings} bills={bills} products={products} initialBill={billToEdit} onCancel={() => setBillToEdit(null)} />, "bill");
      case "invoice": return wrapScreen(currentBill ? <InvoiceScreen bill={currentBill} settings={settings} onBack={() => setTab("history")} onNew={() => { setBillToEdit(null); setTab("bill"); }} /> : <NewBillScreen onGenerate={handleGenerate} settings={settings} bills={bills} products={products} />, "invoice");
      case "history": return wrapScreen(<HistoryScreen bills={bills} onView={handleView} onEdit={handleEdit} onUpdateBill={handleUpdateBill} onDeleteBill={handleDeleteBill} onDeleteAllBills={handleDeleteAllBills} settings={settings} isAdmin={isAdmin} isDesktop={isDesktop} />, "history");
      case "products": return wrapScreen(<ProductsScreen products={products} settings={settings} isAdmin={isAdmin} />, "products");
      case "dashboard": return wrapScreen(<DashboardScreen bills={bills} settings={settings} onResetAllData={handleResetAllData} onCreateBill={() => setTab("bill")} isAdmin={isAdmin} />, "dashboard");
      case "inventory": return wrapScreen(<InventoryScreen products={products} settings={settings} isAdmin={isAdmin} userProfile={profile} />, "inventory");
      case "customers": return wrapScreen(<CustomersScreen bills={bills} />, "customers");
      case "orders": return wrapScreen(<OrdersScreen orders={orders} onUpdateStatus={handleUpdateOrderStatus} />, "orders");
      case "reports": return wrapScreen(<ReportsScreen bills={bills} products={products} />, "reports");
      case "settings": return wrapScreen(<SettingsScreen settings={settings} onSave={handleSaveSettings} profile={profile} onUpdateProfile={handleUpdateProfile} darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} users={users} onUpdateUserRole={handleUpdateUserRole} />, "settings");
      default: return wrapScreen(<NewBillScreen onGenerate={handleGenerate} settings={settings} bills={bills} products={products} />, "default");
    }
  };

  if (isDesktop) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
        {/* Desktop Sidebar */}
        <Sidebar active={tab} onNav={handleNav} settings={settings} user={profile} onLogout={logout} />
        
        {/* Main Content Area */}
        <main style={{ flex: 1, height: "100vh", overflowY: "auto", padding: "40px" }} id="main-content-scroll">
          <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
            <React.Suspense fallback={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }}>
                <div style={{ width: 40, height: 40, border: `4px solid ${C.bg}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              </div>
            }>
              <AnimatePresence mode="wait">
                {renderScreen()}
              </AnimatePresence>
            </React.Suspense>
          </div>
        </main>
      </div>
    );
  }

  // Mobile layout
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 0 40px rgba(0,0,0,0.05)" }}>
      <Header onMenu={() => setDrawer(true)} settings={settings} />
      <Drawer open={drawer} onClose={() => setDrawer(false)} settings={settings} onNav={handleNav} user={profile} onLogout={logout} />
      
      <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <React.Suspense fallback={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }}>
            <div style={{ width: 40, height: 40, border: `4px solid ${C.bg}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          </div>
        }>
          <AnimatePresence mode="wait">
            {renderScreen()}
          </AnimatePresence>
        </React.Suspense>
      </main>

      {tab !== "invoice" && <BottomNav active={tab} onChange={handleNav} role={profile?.role} />}
    </div>
  );

};

export default App;
