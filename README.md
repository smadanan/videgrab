# VidGrab 🎬

Download videos from YouTube, Instagram, Facebook, Twitter, TikTok and 1000+ sites.

## Tech Stack
- **Backend:** Node.js + Express + yt-dlp (streams directly, no storage needed)
- **Frontend:** React (built into `/build` folder, served by Express)
- **Deploy:** Render (free tier)

---

## 📁 Project Structure (Flat)

```
vidgrab/
├── server.js        # Express backend — API + serves React build
├── package.json     # Single package.json for everything
├── build.sh         # Render build script
├── render.yaml      # Render deploy config
├── .gitignore
├── public/
│   └── index.html   # React HTML entry
└── src/
    ├── index.js     # React entry point
    └── App.js       # Main React component
```

---

## 🚀 Deploy to Render

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/vidgrab.git
git push -u origin main
```

### Step 2 — Create Render Web Service
1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Set these values:
   - **Build Command:** `chmod +x build.sh && ./build.sh`
   - **Start Command:** `node server.js`
   - **Environment:** `Node`
4. Click **Deploy** ✅

---

## 💻 Run Locally

### Prerequisites
- Node.js 18+
- Python 3 + pip
- yt-dlp: `pip install yt-dlp`

### Install & Run
```bash
# Install dependencies
npm install

# Build React frontend
npm run build

# Start server (serves both API + frontend)
npm start
# Open http://localhost:3001
```

### Dev Mode (with hot reload for React)
```bash
# Terminal 1 — backend
npm run dev:server

# Terminal 2 — React dev server (http://localhost:3000)
npm run dev:client
```

---

## ⚠️ Notes
- Videos stream directly to your browser — nothing stored on server
- Free Render tier sleeps after 15min inactivity — use UptimeRobot to keep it awake
- For personal use only
