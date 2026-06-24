const express = require("express");
const { spawn, execSync } = require("child_process");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve React build (produced by `npm run build` into /build folder)
app.use(express.static(path.join(__dirname, "build")));

// Check if cookies.txt exists
const COOKIES_PATH = path.join(__dirname, "cookies.txt");
const hasCookies = fs.existsSync(COOKIES_PATH);

// ─── DEBUG ────────────────────────────────────────────────────────
app.get("/api/test", (req, res) => {
  try {
    const version = execSync("yt-dlp --version").toString().trim();
    const ytdlpPath = execSync("which yt-dlp").toString().trim();
    res.json({ version, path: ytdlpPath, cookies: hasCookies, status: "ok" });
  } catch (e) {
    res.json({ error: e.message, status: "failed" });
  }
});

// ─── GET VIDEO INFO ───────────────────────────────────────────────
app.post("/api/info", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const ytdlp = process.env.YTDLP_PATH || "yt-dlp";
  const args = ["--dump-json", "--no-playlist", "--no-warnings"];

  if (hasCookies) {
    args.push("--cookies", COOKIES_PATH);
  }

  args.push(url);

  const proc = spawn(ytdlp, args);

  let stdout = "";
  let stderr = "";

  proc.stdout.on("data", (d) => (stdout += d.toString()));
  proc.stderr.on("data", (d) => (stderr += d.toString()));

  proc.on("close", (code) => {
    if (code !== 0) {
      console.error("[yt-dlp info error]", stderr);
      return res.status(500).json({
        error: `Could not fetch video info: ${stderr || "Unknown error"}`,
      });
    }
    try {
      const info = JSON.parse(stdout);
      const duration = info.duration
        ? `${Math.floor(info.duration / 60)}:${String(Math.floor(info.duration % 60)).padStart(2, "0")}`
        : "Unknown";

      res.json({
        title: info.title || "Untitled",
        thumbnail: info.thumbnail || "",
        duration,
        uploader: info.uploader || info.channel || "Unknown",
        platform: info.extractor_key || "Unknown",
        formats: [
          { label: "Best Quality (MP4)", value: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best", ext: "mp4" },
          { label: "1080p (MP4)", value: "bestvideo[height<=1080][ext=mp4]+bestaudio/best[height<=1080]", ext: "mp4" },
          { label: "720p (MP4)", value: "bestvideo[height<=720][ext=mp4]+bestaudio/best[height<=720]", ext: "mp4" },
          { label: "480p (MP4)", value: "bestvideo[height<=480][ext=mp4]+bestaudio/best[height<=480]", ext: "mp4" },
          { label: "Audio Only (MP3)", value: "bestaudio/best", ext: "mp3" },
        ],
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to parse video info." });
    }
  });
});

// ─── STREAM DOWNLOAD ─────────────────────────────────────────────
app.get("/api/download", (req, res) => {
  const { url, format, ext, title } = req.query;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const selectedFormat = format || "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best";
  const fileExt = ext || "mp4";
  const fileName = (title || "video").replace(/[^a-z0-9_\-\s]/gi, "_").trim() + "." + fileExt;
  const isAudio = fileExt === "mp3";

  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Content-Type", isAudio ? "audio/mpeg" : "video/mp4");

  const args = [
    "-f", selectedFormat,
    "--no-playlist",
    "--no-warnings",
  ];

  if (hasCookies) {
    args.push("--cookies", COOKIES_PATH);
  }

  args.push("--merge-output-format", isAudio ? "mp3" : "mp4", "-o", "-");

  if (isAudio) {
    args.push("--extract-audio", "--audio-format", "mp3");
  }

  args.push(url);

  const ytdlp = process.env.YTDLP_PATH || "yt-dlp";
  const proc = spawn(ytdlp, args);

  proc.stdout.pipe(res);

  proc.stderr.on("data", (d) => console.error("[yt-dlp]", d.toString()));

  proc.on("close", (code) => {
    if (code !== 0 && !res.headersSent) {
      res.status(500).json({ error: "Download failed." });
    }
  });

  req.on("close", () => proc.kill("SIGTERM"));
});

// ─── CATCH-ALL → React ────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ VidGrab running on port ${PORT}`);
  console.log(`🍪 Cookies: ${hasCookies ? "Found ✅" : "Not found ❌"}`);
});
