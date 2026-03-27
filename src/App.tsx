import React, { useState, useEffect } from "react";
import { C } from "./constants";
import { Bill, Settings, UserProfile } from "./types";
import { Header, Drawer, BottomNav } from "./components/Layout";
import { Shirt } from "lucide-react";
import { NewBillScreen } from "./screens/NewBillScreen";
import { InvoiceScreen } from "./screens/InvoiceScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { auth, db, loginWithGoogle, loginWithEmail, registerWithEmail, logout, handleFirestoreError, OperationType, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, loginAnonymously } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";

const App = () => {
  const [tab, setTab] = useState("bill");
  const [drawer, setDrawer] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });

  const isAdmin = profile?.role === "admin";

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
      setUser(u);
      if (u) {
        // Fetch or Create Profile
        const pDoc = await getDoc(doc(db, "users", u.uid));
        const isAdmin = u.email?.toLowerCase() === "nupeshpatel4342@gmail.com";
        
        if (pDoc.exists()) {
          const currentProfile = pDoc.data() as UserProfile;
          // Ensure owner always has admin role
          if (isAdmin && currentProfile.role !== "admin") {
            const updatedProfile = { ...currentProfile, role: "admin" as const };
            await setDoc(doc(db, "users", u.uid), updatedProfile);
            setProfile(updatedProfile);
          } else {
            setProfile(currentProfile);
          }
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email || "",
            displayName: u.displayName || "Staff Member",
            photoURL: u.photoURL || "",
            role: isAdmin ? "admin" : "staff",
            createdAt: Date.now()
          };
          await setDoc(doc(db, "users", u.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Sync Settings
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "settings", "global"), (s) => {
      if (s.exists()) setSettings(s.data() as Settings);
    }, (err) => handleFirestoreError(err, OperationType.GET, "settings/global"));
    return unsub;
  }, [user]);

  // Sync Bills
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "bills"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (s) => {
      const bList = s.docs.map(d => d.data() as Bill);
      setBills(bList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "bills"));
    return unsub;
  }, [user]);

  const handleGenerate = async (bill: Bill) => {
    try {
      const billWithUser = { ...bill, createdBy: user?.uid };
      await setDoc(doc(db, "bills", bill.id), billWithUser);
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
    if (!isAdmin) {
      alert("Only admin can delete all bills.");
      return;
    }
    try {
      const promises = bills.map(b => deleteDoc(doc(db, "bills", b.id)));
      await Promise.all(promises);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "bills/all");
    }
  };

  const handleResetAllData = async () => {
    if (!isAdmin) {
      alert("Only admin can reset all data.");
      return;
    }
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
    if (!isAdmin) {
      alert("You do not have permission to save settings.");
      return;
    }
    try {
      await setDoc(doc(db, "settings", "global"), s);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/global");
    }
  };

  const handleUpdateProfile = async (p: UserProfile) => {
    try {
      await setDoc(doc(db, "users", p.uid), p);
      setProfile(p);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${p.uid}`);
    }
  };

  const handleNav = (newTab: string) => {
    if (newTab === "bill") setBillToEdit(null);
    setTab(newTab);
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

  if (!user) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 20 }}>
        <div className="fade" style={{ width: "100%", maxWidth: 360, background: C.card, borderRadius: 32, padding: 32, textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.1)" }}>
          {settings?.logo ? (
            <img src={settings.logo} alt="Logo" style={{ width: 120, height: 120, objectFit: "contain", margin: "0 auto 24px" }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: 20, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: `0 10px 20px rgba(0,0,0,0.2)`, border: `2px solid ${C.accent}` }}>
              <Shirt color={C.accent} size={32} strokeWidth={2.5} />
            </div>
          )}
          <h1 className="pf" style={{ fontSize: 22, fontWeight: 700, color: C.dark, marginBottom: 8 }}>{settings?.shopName || "Shiv Western Club"}</h1>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 32 }}>Staff & Admin Login required to continue.</p>
          
          {loginMode === "direct" ? (
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
          )}
          
          <p style={{ fontSize: 11, color: C.muted, marginTop: 24 }}>Authorized access only. Contact owner for staff access.</p>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (tab) {
      case "bill": return <NewBillScreen onGenerate={handleGenerate} settings={settings} bills={bills} initialBill={billToEdit} onCancel={() => setBillToEdit(null)} />;
      case "invoice": return currentBill ? <InvoiceScreen bill={currentBill} settings={settings} onBack={() => setTab("history")} onNew={() => { setBillToEdit(null); setTab("bill"); }} /> : <NewBillScreen onGenerate={handleGenerate} settings={settings} bills={bills} />;
      case "history": return <HistoryScreen bills={bills} onView={handleView} onEdit={handleEdit} onUpdateBill={handleUpdateBill} onDeleteBill={handleDeleteBill} onDeleteAllBills={handleDeleteAllBills} settings={settings} isAdmin={isAdmin} />;
      case "dashboard": return <DashboardScreen bills={bills} settings={settings} onResetAllData={handleResetAllData} onCreateBill={() => setTab("bill")} isAdmin={isAdmin} />;
      case "settings": return <SettingsScreen settings={settings} onSave={handleSaveSettings} profile={profile} onUpdateProfile={handleUpdateProfile} darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />;
      default: return <NewBillScreen onGenerate={handleGenerate} settings={settings} bills={bills} />;
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 0 40px rgba(0,0,0,0.05)" }}>
      <Header onMenu={() => setDrawer(true)} settings={settings} />
      <Drawer open={drawer} onClose={() => setDrawer(false)} settings={settings} onNav={handleNav} user={profile} onLogout={logout} />
      
      <main style={{ flex: 1, overflowY: "auto" }}>
        {renderScreen()}
      </main>

      {tab !== "invoice" && <BottomNav active={tab} onChange={handleNav} isAdmin={isAdmin} />}
    </div>
  );
};

export default App;
