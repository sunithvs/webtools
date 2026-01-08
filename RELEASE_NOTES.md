# Release Notes - Clens v1.1.2

## 🛠 Patch v1.1.2

Fixes and stability improvements.

### 🐛 Bug Fixes

- **Extension Loading**: Fixed a critical issue where the side panel would fail to open.
- **Cache Logic**: Improved detection of "Disk Cache" vs "Network" requests to handle 304 Revalidated responses correctly.

---

# Release Notes - Clens v1.1.1

## 🐛 Patch v1.1.1

Small UI improvement.

### 💅 UI Improvements

- **Image Path Display**: Now showing the full image URL path below the filename to help distinguish assets with same filenames.

---

# Release Notes - Clens v1.1

## 🚀 Version 1.1

We are excited to introduce **Clens v1.1**, featuring enhanced analysis capabilities and smarter suggestions.

### ✨ New Features

- **Advanced Cache Detection**: Now detects `no-cache`, `no-store`, and `max-age=0` headers to explain *why* an image isn't cached.
- **Dimensions Check**: Identifies images that are significantly larger than their display size, helping you save bandwidth.
- **Lazy Loading Suggestions**: Detects when multiple off-screen images are missing the `loading="lazy"` attribute.
- **Improved UI**: New warning badges and clearer efficiency tips.

### 🌟 Core Features

- **Instant Analysis**: Scans all images on the current page with a single click.
- **Cache Detection**: Identifies if images are served from **Memory Cache**, **Disk Cache**, or fetched over the **Network**.
- **Smart Filtering**:
  - Filter by **"Not Cached"** to spot unoptimized assets.
  - Filter by file type (JPG, PNG, WebP, SVG, GIF).
- **Size Sorting**: Automatically sorts images by file size to help you identify heavy assets slowing down your LCP.
- **Efficiency Suggestions**: Provides automated tips for format optimization (e.g., converting large PNGs to WebP) and missing cache headers.
- **Non-Intrusive UI**: Uses the Chrome Side Panel API to keep your debugging experience clean and side-by-side with your content.
- **Privacy First**: Runs locally in your browser with no background tracking or external data collection.

### 🛠 Installation

1. Download the `image-insight.zip` from the Assets section below.
2. Unzip the file.
3. Open `chrome://extensions/` in Chrome.
4. Enable **Developer Mode**.
5. Click **Load Unpacked** and select the unzipped folder.

---
*Made with ❤️ by [Sunith](https://sunithvs.com)*
