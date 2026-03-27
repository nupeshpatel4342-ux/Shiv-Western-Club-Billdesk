import React, { useRef } from "react";
import { C } from "../constants";
import { fmt, numToWords } from "../utils/formatters";
import { Bill, Settings } from "../types";
import { doWhatsApp, doPDF } from "../utils/exportUtils";
import { StandardTemplate, MinimalTemplate, ModernTemplate } from "../components/InvoiceTemplates";

export const InvoiceScreen = ({ bill, settings, onBack, onNew }: { bill: Bill, settings: Settings, onBack: () => void, onNew: () => void }) => {
  const invRef = useRef<HTMLDivElement>(null);

  const handleWhatsApp = () => {
    doWhatsApp(bill, settings, undefined, invRef);
  };

  const handlePDF = () => {
    doPDF(bill, settings, undefined, invRef);
  };

  return (
    <div className="fade" style={{ padding: "20px 18px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button onClick={onBack} style={{ color: C.muted, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, background: "none", border: "none" }}>
          <span style={{ fontSize: 18 }}>←</span> Back
        </button>
        <h2 className="pf" style={{ fontSize: 24, fontWeight: 900, color: C.dark, letterSpacing: "-0.8px" }}>Invoice</h2>
        <button onClick={onNew} style={{ color: C.accent, fontSize: 13, fontWeight: 800, background: "none", border: "none" }}>New Bill ＋</button>
      </div>

      {/* Actual Invoice View */}
      <div style={{ overflowX: "auto", margin: "0 -18px", padding: "0 18px", paddingBottom: 16 }}>
        {(!settings.invoiceLayout || settings.invoiceLayout === 'standard') && <StandardTemplate bill={bill} settings={settings} invRef={invRef} />}
        {settings.invoiceLayout === 'minimal' && <MinimalTemplate bill={bill} settings={settings} invRef={invRef} />}
        {settings.invoiceLayout === 'modern' && <ModernTemplate bill={bill} settings={settings} invRef={invRef} />}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <button onClick={handlePDF} className="spin-on-click"
          style={{ background: C.card, border: `1.5px solid ${C.border}`, padding: "20px", borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: 26 }}>📄</span>
          <span className="pf" style={{ fontSize: 13, fontWeight: 800, color: C.dark, textTransform: "uppercase", letterSpacing: "0.5px" }}>Download PDF</span>
        </button>
        <button onClick={handleWhatsApp} className="spin-on-click"
          style={{ background: "#25D366", color: "#fff", padding: "20px", borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 8px 24px rgba(37,211,102,0.25)", border: "none" }}>
          <span style={{ fontSize: 26 }}>💬</span>
          <span className="pf" style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px" }}>Share WhatsApp</span>
        </button>
      </div>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <p style={{ fontSize: 12, color: C.muted }}>Invoice generated successfully. You can find it in History anytime.</p>
      </div>
    </div>
  );
};
