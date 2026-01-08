# Image Insight - Cache Efficiency Checker

> **Analyze image caching status, size, and efficiency directly in your browser.**

**Image Insight** is a lightweight Chrome Extension designed for developers and performance enthusiasts. It scans the current webpage to identify image assets, checks their cache status (Memory, Disk, or Network), and provides actionable suggestions to improve efficiency.

## Features

- **⚡ Efficiency Analysis**: Detects uncached images and suggests optimizations.
- **🔍 Deep Dive**: View transfer size, decoded size, and cache type.
- **📂 Smart Filtering**: Filter by "Not Cached" or specific file extensions (JPG, PNG, WebP, etc.).
- **⚖️ Size Sorting**: Quickly find the heaviest images on your page.
- **🛡️ Privacy Focused**: Runs only when you click "Analyze". No background tracking.

![Image Insight Screenshot](docs/images/screenshot.png)

## Installation

### Method 1: Download from Releases (Recommended)

1. **[Download the latest release](./releases/latest/download/clens.zip)** (Note: This link works after the first release).
2. Unzip the downloaded file.
3. Open Chrome and navigate to `chrome://extensions/`.
4. Enable **Developer Mode** (top right switch).
5. Click **Load Unpacked**.
6. Select the unzipped folder.

### Method 2: From Source

1. Clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer Mode**.
4. Click **Load Unpacked**.
5. Select the cloned folder.

## Usage

1. Click the **Image Insight** icon in your toolbar (it opens the Side Panel).
2. Click **"Analyze Page"**.
3. Review the stats and suggestions.

## Credits

Made by [Sunith](https://sunithvs.com).
