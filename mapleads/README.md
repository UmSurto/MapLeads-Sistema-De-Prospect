<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/644a8fc7-388e-4d9c-b0d4-417cf9360891

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## WhatsApp inbox

The QR connection in this project uses Baileys, an unofficial third-party integration. It is not the official WhatsApp Web interface or the Meta WhatsApp Business Platform. After a device is linked, the app reads the conversations and messages delivered by that session and sends messages through the same session; a successful send request does not by itself confirm delivery or reading.

For an officially supported business integration, configure the WhatsApp Business Platform (Cloud API) in Meta, including its business account, phone number, access token, and inbound-message webhooks. That integration is separate from QR-linking a personal WhatsApp account and is not configured by this project.
