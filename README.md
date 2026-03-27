<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/550b4257-5844-4142-b54e-8fc0aa58b569

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## PDF generation with Puppeteer (improved quality)

This app now supports a higher-quality PDF flow via Puppeteer.

1. Install Puppeteer once:
   `npm install puppeteer`
2. Start PDF microservice:
   `npm run pdf:server`
3. (Optional) configure custom service URL in `.env.local`:
   `VITE_PDF_SERVICE_URL=http://localhost:4173`

If the Puppeteer service is not running, the app will fall back to the in-browser PDF generator automatically.
