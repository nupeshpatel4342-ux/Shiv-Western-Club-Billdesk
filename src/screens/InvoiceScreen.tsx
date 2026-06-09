import React, { useRef, useState, useEffect } from "react";
import { C } from "../constants";
import { fmt, numToWords } from "../utils/formatters";
import { Bill, Settings } from "../types";
import { doWhatsApp, doPDF } from "../utils/exportUtils";
import { StandardTemplate, MinimalTemplate, ModernTemplate } from "../components/InvoiceTemplates";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

export const InvoiceScreen = ({ 
  bill, 
  settings, 
  onBack, 
  onNew,
  hideBack = false
}: { 
  bill: Bill, 
  settings: Settings, 
  onBack: () => void, 
  onNew: () => void,
  hideBack?: boolean
}) => {
  const invRef = useRef<HTMLDivElement>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Check if the bill was just generated (within the last 10 seconds) and has a discount
    const isNew = (Date.now() - bill.timestamp) < 10000;
    if (bill.discount > 0 && isNew) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [bill.discount, bill.timestamp]);

  const handleWhatsApp = () => {
    doWhatsApp(bill, settings, undefined, invRef);
  };

  const handlePDF = () => {
    doPDF(bill, settings, undefined, invRef);
  };

  const handlePrint = () => {
    const invoiceEl = invRef.current;
    if (!invoiceEl) return;
    const originalId = invoiceEl.id;
    invoiceEl.id = "invoice-print-root";
    window.print();
    invoiceEl.id = originalId;
  };


  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ padding: "20px 18px 100px", position: "relative" }}
    >
      {showCelebration && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9999 }}>
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={400} gravity={0.15} />
        </div>
      )}
      
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.8, y: -20, x: "-50%" }}
            transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
            style={{
              position: "fixed",
              top: 80,
              left: "50%",
              background: "linear-gradient(135deg, #10B981, #059669)",
              color: "white",
              padding: "14px 28px",
              borderRadius: 50,
              fontWeight: 800,
              fontSize: 16,
              boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              gap: 10,
              whiteSpace: "nowrap",
              pointerEvents: "none"
            }}
          >
            <span style={{ fontSize: 24 }}>🎉</span> 
            Customer Saved {settings.currency || "₹"}{fmt(bill.discount)}!
          </motion.div>

        )}
      </AnimatePresence>

      {!hideBack && (
        <motion.div variants={itemVariants} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <button onClick={onBack} style={{ color: C.muted, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer" }}>
            <span style={{ fontSize: 18 }}>←</span> Back
          </button>
          <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px" }}>Invoice</h2>
          <button onClick={onNew} style={{ color: C.accent, fontSize: 13, fontWeight: 800, background: "none", border: "none", cursor: "pointer" }}>New Bill ＋</button>
        </motion.div>
      )}

      {/* Actual Invoice View */}
      <motion.div variants={itemVariants} style={{ overflowX: "auto", margin: hideBack ? "0" : "0 -18px", padding: hideBack ? "0" : "0 18px", paddingBottom: 16 }}>
        {(!settings.invoiceLayout || settings.invoiceLayout === 'standard') && <StandardTemplate bill={bill} settings={settings} invRef={invRef} />}
        {settings.invoiceLayout === 'minimal' && <MinimalTemplate bill={bill} settings={settings} invRef={invRef} />}
        {settings.invoiceLayout === 'modern' && <ModernTemplate bill={bill} settings={settings} invRef={invRef} />}
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePrint} 
          style={{ background: C.card, border: `1.5px solid ${C.border}`, padding: "20px", borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.02)", cursor: "pointer" }}
        >
          <span style={{ fontSize: 26 }}>🖨️</span>
          <span className="pf" style={{ fontSize: 13, fontWeight: 800, color: C.dark, textTransform: "uppercase", letterSpacing: "0.5px" }}>Print Bill</span>
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePDF} 
          className="spin-on-click"
          style={{ background: C.card, border: `1.5px solid ${C.border}`, padding: "20px", borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.02)", cursor: "pointer" }}
        >
          <span style={{ fontSize: 26 }}>📄</span>
          <span className="pf" style={{ fontSize: 13, fontWeight: 800, color: C.dark, textTransform: "uppercase", letterSpacing: "0.5px" }}>Download PDF</span>
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleWhatsApp} 
          className="spin-on-click"
          style={{ background: "#25D366", color: "#fff", padding: "20px", borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 8px 24px rgba(37,211,102,0.25)", border: "none", cursor: "pointer" }}
        >
          <span style={{ fontSize: 26 }}>💬</span>
          <span className="pf" style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px" }}>Share WhatsApp</span>
        </motion.button>
      </motion.div>


      <motion.div variants={itemVariants} style={{ marginTop: 24, textAlign: "center" }}>
        <p style={{ fontSize: 12, color: C.muted }}>Invoice generated successfully. You can find it in History anytime.</p>
      </motion.div>
    </motion.div>
  );
};
