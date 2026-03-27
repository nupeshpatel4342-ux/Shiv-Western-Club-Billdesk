import express from "express";

const app = express();
const port = Number(process.env.PDF_SERVER_PORT || 4173);

app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "puppeteer-pdf", date: new Date().toISOString() });
});

app.post("/api/render-invoice-pdf", async (req, res) => {
  const html = typeof req.body?.html === "string" ? req.body.html : "";
  const rawFileName = typeof req.body?.fileName === "string" ? req.body.fileName : "invoice.pdf";
  const safeFileName = rawFileName.replace(/[^\w.-]/g, "_");

  if (!html.trim()) {
    res.status(400).json({ error: "html payload is required" });
    return;
  }

  let browser;
  try {
    const puppeteerModule = await import("puppeteer");
    const puppeteer = puppeteerModule.default || puppeteerModule;
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${safeFileName}\"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Puppeteer PDF render failed:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      details: error?.message || "Unknown error",
      note: "Install puppeteer in this project with `npm install puppeteer` before starting this service.",
    });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(port, () => {
  console.log(`Puppeteer PDF server running on http://localhost:${port}`);
});
