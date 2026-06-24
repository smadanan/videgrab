import React, { useState } from "react";

const PLATFORM_ICONS = {
  Youtube: "▶",
  Instagram: "◈",
  Facebook: "ƒ",
  Twitter: "✦",
  TikTok: "♪",
  Unknown: "⬇",
};

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0a0a0f;
    color: #e8e6f0;
    font-family: 'Space Grotesk', sans-serif;
    min-height: 100vh;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 20px;
  }

  .header {
    text-align: center;
    margin-bottom: 48px;
  }

  .logo {
    font-family: 'Space Mono', monospace;
    font-size: 2.8rem;
    font-weight: 700;
    letter-spacing: -2px;
    background: linear-gradient(135deg, #a78bfa, #60a5fa, #34d399);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tagline {
    color: #6b7280;
    font-size: 0.95rem;
    margin-top: 8px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-size: 0.78rem;
  }

  .platforms {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-top: 16px;
    flex-wrap: wrap;
  }

  .platform-badge {
    background: #1a1a2e;
    border: 1px solid #2d2d4e;
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 0.75rem;
    color: #8b8baa;
  }

  .card {
    background: #12121e;
    border: 1px solid #1e1e3a;
    border-radius: 16px;
    padding: 32px;
    width: 100%;
    max-width: 640px;
  }

  .input-row {
    display: flex;
    gap: 10px;
  }

  .url-input {
    flex: 1;
    background: #0a0a0f;
    border: 1px solid #2d2d4e;
    border-radius: 10px;
    padding: 14px 16px;
    color: #e8e6f0;
    font-family: 'Space Mono', monospace;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.2s;
  }

  .url-input:focus {
    border-color: #a78bfa;
  }

  .url-input::placeholder {
    color: #3d3d5c;
  }

  .btn {
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 14px 20px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    white-space: nowrap;
  }

  .btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .btn:active:not(:disabled) { transform: translateY(0); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-download {
    background: linear-gradient(135deg, #059669, #0ea5e9);
    width: 100%;
    padding: 16px;
    font-size: 1rem;
    border-radius: 12px;
    margin-top: 8px;
  }

  .error {
    background: #2d1515;
    border: 1px solid #5a1f1f;
    border-radius: 10px;
    padding: 12px 16px;
    color: #f87171;
    font-size: 0.85rem;
    margin-top: 16px;
  }

  .video-info {
    margin-top: 24px;
    border-top: 1px solid #1e1e3a;
    padding-top: 24px;
  }

  .video-meta {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
  }

  .thumbnail {
    width: 120px;
    height: 68px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #2d2d4e;
    flex-shrink: 0;
    background: #1a1a2e;
  }

  .thumbnail-placeholder {
    width: 120px;
    height: 68px;
    background: #1a1a2e;
    border-radius: 8px;
    border: 1px solid #2d2d4e;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    flex-shrink: 0;
  }

  .video-details { flex: 1; overflow: hidden; }

  .video-title {
    font-weight: 600;
    font-size: 0.95rem;
    line-height: 1.4;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .meta-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .chip {
    background: #1a1a2e;
    border: 1px solid #2d2d4e;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 0.72rem;
    color: #8b8baa;
    font-family: 'Space Mono', monospace;
  }

  .chip.platform {
    color: #a78bfa;
    border-color: #4c1d95;
    background: #1e1340;
  }

  .format-label {
    font-size: 0.78rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 8px;
    font-family: 'Space Mono', monospace;
  }

  .format-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
    margin-bottom: 16px;
  }

  .format-btn {
    background: #0a0a0f;
    border: 1px solid #2d2d4e;
    border-radius: 8px;
    padding: 10px 12px;
    color: #8b8baa;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
  }

  .format-btn:hover { border-color: #7c3aed; color: #e8e6f0; }
  .format-btn.selected {
    border-color: #7c3aed;
    background: #1e1340;
    color: #a78bfa;
  }

  .loading {
    text-align: center;
    padding: 24px;
    color: #6b7280;
    font-size: 0.85rem;
  }

  .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid #2d2d4e;
    border-top-color: #a78bfa;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 10px;
    vertical-align: middle;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .download-progress {
    background: #0a0a12;
    border: 1px solid #1e1e3a;
    border-radius: 10px;
    padding: 16px;
    margin-top: 16px;
    text-align: center;
    color: #6b7280;
    font-size: 0.85rem;
  }

  .progress-bar-wrap {
    background: #1a1a2e;
    border-radius: 4px;
    height: 4px;
    margin-top: 12px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #7c3aed, #3b82f6);
    border-radius: 4px;
    animation: progress-pulse 1.5s ease-in-out infinite;
  }

  @keyframes progress-pulse {
    0% { width: 10%; }
    50% { width: 80%; }
    100% { width: 95%; }
  }

  .success-msg {
    background: #052e16;
    border: 1px solid #166534;
    border-radius: 10px;
    padding: 14px 16px;
    color: #4ade80;
    font-size: 0.85rem;
    margin-top: 16px;
    text-align: center;
  }

  .footer {
    margin-top: 40px;
    color: #3d3d5c;
    font-size: 0.72rem;
    text-align: center;
    font-family: 'Space Mono', monospace;
  }

  @media (max-width: 480px) {
    .logo { font-size: 2rem; }
    .card { padding: 20px; }
    .input-row { flex-direction: column; }
    .video-meta { flex-direction: column; }
    .thumbnail, .thumbnail-placeholder { width: 100%; height: 160px; }
  }
`;

export default function App() {
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_BASE = process.env.NODE_ENV === "production" ? "" : "http://localhost:3001";

  const fetchInfo = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setInfo(null);
    setSuccess("");
    setSelectedFormat(null);

    try {
      const res = await fetch(`${API_BASE}/api/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch info");
      setInfo(data);
      setSelectedFormat(data.formats[0]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!info || !selectedFormat) return;
    setDownloading(true);
    setSuccess("");
    setError("");

    const params = new URLSearchParams({
      url: url.trim(),
      format: selectedFormat.value,
      ext: selectedFormat.ext,
      title: info.title,
    });

    const downloadUrl = `${API_BASE}/api/download?${params.toString()}`;

    // Trigger browser download
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${info.title}.${selectedFormat.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloading(false);
      setSuccess(`"${info.title}" is downloading to your device.`);
    }, 3000);
  };

  const platformIcon = info ? (PLATFORM_ICONS[info.platform] || "⬇") : "";

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="header">
          <div className="logo">VidGrab</div>
          <div className="tagline">Download any video, anywhere</div>
          <div className="platforms">
            {["YouTube", "Instagram", "Facebook", "Twitter", "TikTok", "1000+ sites"].map((p) => (
              <span key={p} className="platform-badge">{p}</span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="input-row">
            <input
              className="url-input"
              type="text"
              placeholder="Paste video URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchInfo()}
            />
            <button className="btn" onClick={fetchInfo} disabled={loading || !url.trim()}>
              {loading ? <span className="spinner" /> : "Fetch"}
            </button>
          </div>

          {error && <div className="error">⚠ {error}</div>}

          {loading && (
            <div className="loading">
              <span className="spinner" /> Fetching video info...
            </div>
          )}

          {info && (
            <div className="video-info">
              <div className="video-meta">
                {info.thumbnail ? (
                  <img className="thumbnail" src={info.thumbnail} alt="thumbnail" />
                ) : (
                  <div className="thumbnail-placeholder">{platformIcon}</div>
                )}
                <div className="video-details">
                  <div className="video-title">{info.title}</div>
                  <div className="meta-chips">
                    <span className="chip platform">{platformIcon} {info.platform}</span>
                    <span className="chip">⏱ {info.duration}</span>
                    <span className="chip">👤 {info.uploader}</span>
                  </div>
                </div>
              </div>

              <div className="format-label">Select Format</div>
              <div className="format-grid">
                {info.formats.map((fmt) => (
                  <button
                    key={fmt.value}
                    className={`format-btn ${selectedFormat?.value === fmt.value ? "selected" : ""}`}
                    onClick={() => setSelectedFormat(fmt)}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              <button
                className="btn btn-download"
                onClick={handleDownload}
                disabled={downloading || !selectedFormat}
              >
                {downloading ? (
                  <><span className="spinner" /> Preparing download...</>
                ) : (
                  `⬇ Download ${selectedFormat?.ext?.toUpperCase() || ""}`
                )}
              </button>

              {downloading && (
                <div className="download-progress">
                  Streaming video... your browser download will start shortly.
                  <div className="progress-bar-wrap">
                    <div className="progress-bar" />
                  </div>
                </div>
              )}

              {success && <div className="success-msg">✓ {success}</div>}
            </div>
          )}
        </div>

        <div className="footer">
          powered by yt-dlp · built for personal use
        </div>
      </div>
    </>
  );
}
