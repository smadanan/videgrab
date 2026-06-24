const express = require("express");
const { spawn, execSync } = require("child_process");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));

const COOKIES_PATH = path.join(__dirname, "cookies.txt");
const hasCookies = fs.existsSync(COOKIES_PATH);
const PROXY_URL = process.env.PROXY_URL || null;

// ─── DEBUG ─────────────────────────────────────────────────────────
app.get("/api/test", (req, res) => {
  try {
    const version = execSync("yt-dlp --version").toString().trim();
    const ytdlpPath = execSync("which yt-dlp").toString().trim();
    res.json({ version, path: ytdlpPath, cookies: hasCookies, proxy: !!PROXY_URL, status: "ok" });
  } catch (e) {
    res.json({ error: e.message, status: "failed" });
  }
});

// ─── GET VIDEO INFO ────────────────────────────────────────────────
app.post("/api/info", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const ytdlp = process.env.YTDLP_PATH || "yt-dlp";
  const args = ["--dump-json", "--no-playlist", "--no-warnings"];
  if (hasCookies) args.push("--cookies", COOKIES_PATH);
  if (PROXY_URL) args.push("--proxy", PROXY_URL);
  args.push(url);

  const proc = spawn(ytdlp, args);
  let stdout = "";
  let stderr = "";

  proc.stdout.on("data", (d) => (stdout += d.toString()));
  proc.stderr.on("data", (d) => (stderr += d.toString()));

  proc.on("close", (code) => {
    if (code !== 0) {
      console.error("[info error]", stderr);
      return res.status(500).json({ error: `Could not fetch video info: ${stderr || "Unknown error"}` });
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
          { label: "Best Quality (MP4)", value: "bv[ext=mp4]+ba[ext=m4a]/bv+ba/b", ext: "mp4" },
          { label: "1080p (MP4)",        value: "bv[height<=1080][ext=mp4]+ba[ext=m4a]/bv[height<=1080]+ba/b[height<=1080]", ext: "mp4" },
          { label: "720p (MP4)",         value: "bv[height<=720][ext=mp4]+ba[ext=m4a]/bv[height<=720]+ba/b[height<=720]",   ext: "mp4" },
          { label: "480p (MP4)",         value: "bv[height<=480][ext=mp4]+ba[ext=m4a]/bv[height<=480]+ba/b[height<=480]",   ext: "mp4" },
          { label: "Audio Only (MP3)",   value: "ba/b", ext: "mp3" },
        ],
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to parse video info." });
    }
  });
});

// ─── DOWNLOAD ──────────────────────────────────────────────────────
app.get("/api/download", (req, res) => {
  const { url, format, ext, title } = req.query;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const fileExt = ext || "mp4";
  const isAudio = fileExt === "mp3";
  const safeTitle = (title || "video").replace(/[^\w\s\-]/gi, "_").trim();
  const fileName = `${safeTitle}.${fileExt}`;
  const tmpFile = path.join(os.tmpdir(), `vidgrab_${Date.now()}`);
  // yt-dlp will add the correct extension itself
  const tmpOutput = `${tmpFile}.${fileExt}`;

  let args = [];

  if (isAudio) {
    args = [
      "--no-playlist",
      "--no-warnings",
      "-x",
      "--audio-format", "mp3",
      "--audio-quality", "0",
      "-o", tmpOutput,
    ];
  } else {
    args = [
      "-f", format || "bv[ext=mp4]+ba[ext=m4a]/bv+ba/b",
      "--no-playlist",
      "--no-warnings",
      "--merge-output-format", "mp4",
      "-o", tmpOutput,
    ];
  }

  if (hasCookies) args.push("--cookies", COOKIES_PATH);
  if (PROXY_URL) args.push("--proxy", PROXY_URL);
  args.push(url);

  console.log("[yt-dlp] starting:", args.join(" "));

  const ytdlp = process.env.YTDLP_PATH || "yt-dlp";
  const proc = spawn(ytdlp, args);

  let stderr = "";
  proc.stderr.on("data", (d) => {
    stderr += d.toString();
    process.stdout.write(d);
  });

  proc.on("close", (code) => {
    if (code !== 0) {
      console.error("[download error]", stderr);
      if (!res.headersSent) res.status(500).json({ error: "Download failed: " + stderr });
      cleanupFile(tmpOutput);
      return;
    }

    // Find the actual output file (yt-dlp sometimes changes extension)
    let actualFile = tmpOutput;
    if (!fs.existsSync(actualFile)) {
      const dir = os.tmpdir();
      const base = path.basename(tmpFile);
      const found = fs.readdirSync(dir).find(f => f.startsWith(base));
      if (found) {
        actualFile = path.join(dir, found);
      } else {
        return res.status(500).json({ error: "Output file not found after download." });
      }
    }

    const stat = fs.statSync(actualFile);
    const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
    console.log(`[download] complete: ${actualFile} (${sizeMB} MB)`);

    if (stat.size === 0) {
      cleanupFile(actualFile);
      return res.status(500).json({ error: "Downloaded file is empty." });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", isAudio ? "audio/mpeg" : "video/mp4");
    res.setHeader("Content-Length", stat.size);

    const stream = fs.createReadStream(actualFile);
    stream.pipe(res);
    stream.on("close", () => cleanupFile(actualFile));
    stream.on("error", (err) => {
      console.error("[stream error]", err);
      cleanupFile(actualFile);
    });
  });

  req.on("close", () => {
    proc.kill("SIGTERM");
    cleanupFile(tmpOutput);
  });
});

function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.log("[cleanup]", filePath);
  } catch (e) {
    console.error("[cleanup error]", e.message);
  }
}

// ─── CATCH-ALL → React ─────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ VidGrab running on port ${PORT}`);
  console.log(`🍪 Cookies: ${hasCookies ? "Found ✅" : "Not found ❌"}`);
  console.log(`🌐 Proxy: ${PROXY_URL ? "Configured ✅" : "Not set ❌"}`);
});
