# Village Market App

A complete mobile-first web application for connecting villagers with local shopkeepers.

## Features
- **User & Shopkeeper Accounts**: Separate flows for users and shopkeepers.
- **Shopkeeper Registration**: GPS location capture, Camera integration for photos.
- **User Dashboard**: Search products, view shop details, live map navigation.
- **Shopkeeper Dashboard**: Manage products, toggle shop status (Open/Closed), chat with users.
- **Real-time Chat**: Direct messaging between users and shopkeepers.
- **Backend**: Node.js + Express + SQLite.

## Prerequisites
- Node.js installed.

## How to Run
1. Open a terminal in the project folder.
2. Run the following command to start both the backend and frontend:
   ```bash
   npm run dev:all
   ```
3. Open your browser to `http://localhost:5173`.

## Tech Stack
- **Frontend**: React, Vite, CSS (Mobile-first design).
- **Backend**: Express.js, SQLite.
- **Database**: SQLite (stored in `server/village_market.db`).
- **Uploads**: Images stored in `server/uploads`.

## Notes
- To test the "Camera Only" feature, access the app from a mobile device (you can use `npm run dev -- --host` to expose it to your network).
- GPS requires allowing location permissions in the browser.
