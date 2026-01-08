let currentImages = [];
let filteredImages = [];

const analyzeBtn = document.getElementById('analyzeBtn');
const resultsContainer = document.getElementById('results');
const noCacheToggle = document.getElementById('noCacheOnly');
const typeFilter = document.getElementById('typeFilter');
const sortOrder = document.getElementById('sortOrder');

const totalImagesEl = document.getElementById('totalImages');
const uncachedCountEl = document.getElementById('uncachedCount');
const totalSizeEl = document.getElementById('totalSize');
const suggestionList = document.getElementById('suggestionList');

analyzeBtn.addEventListener('click', async () => {
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="icon">⏳</span> Analyzing...';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) throw new Error("No active tab found");

        // Inject content script to ensure it's there
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        // Request analysis
        chrome.tabs.sendMessage(tab.id, { action: "analyze" }, (response) => {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<span class="icon">🔍</span> Analyze Page';

            if (chrome.runtime.lastError) {
                resultsContainer.innerHTML = `<div class="empty-state">Error: ${chrome.runtime.lastError.message}</div>`;
                return;
            }

            if (response && response.images) {
                currentImages = response.images;

                // Show controls
                document.getElementById('filters').classList.remove('hidden');
                document.getElementById('stats').classList.remove('hidden');
                document.getElementById('suggestions').classList.remove('hidden');

                filterAndRender();
                generateSuggestions();
            } else {
                resultsContainer.innerHTML = '<div class="empty-state">No images found or analysis failed.</div>';
            }
        });
    } catch (err) {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<span class="icon">🔍</span> Analyze Page';
        resultsContainer.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
    }
});

// Filters and Sort Listeners
noCacheToggle.addEventListener('change', filterAndRender);
typeFilter.addEventListener('change', filterAndRender);
sortOrder.addEventListener('change', filterAndRender);

function filterAndRender() {
    const showUncachedOnly = noCacheToggle.checked;
    const typeValue = typeFilter.value;
    const sortValue = sortOrder.value;

    filteredImages = currentImages.filter(img => {
        // Cache Filter
        if (showUncachedOnly && img.isCached) return false;

        // Type Filter
        if (typeValue !== 'all') {
            const ext = img.url.split('.').pop().split('?')[0].toLowerCase();
            // Simple check, can be robustified
            if (typeValue === 'jpg' && !['jpg', 'jpeg'].includes(ext)) return false;
            if (typeValue === 'png' && ext !== 'png') return false;
            if (typeValue === 'webp' && ext !== 'webp') return false;
            if (typeValue === 'gif' && ext !== 'gif') return false;
            if (typeValue === 'svg' && ext !== 'svg') return false;
        }
        return true;
    });

    // Sorting
    filteredImages.sort((a, b) => {
        const sizeA = a.encodedBodySize || a.transferSize; // effective size
        const sizeB = b.encodedBodySize || b.transferSize;
        return sortValue === 'sizeDesc' ? sizeB - sizeA : sizeA - sizeB;
    });

    updateStats(filteredImages);
    renderList(filteredImages);
}

function updateStats(images) {
    totalImagesEl.textContent = images.length;

    const uncached = images.filter(i => !i.isCached).length;
    uncachedCountEl.textContent = uncached;
    if (uncached > 0) {
        uncachedCountEl.style.color = 'var(--danger-color)';
    } else {
        uncachedCountEl.style.color = 'var(--text-primary)';
    }

    const totalBytes = images.reduce((sum, img) => sum + (img.encodedBodySize || img.transferSize), 0);
    totalSizeEl.textContent = formatBytes(totalBytes);
}

function renderList(images) {
    resultsContainer.innerHTML = '';

    if (images.length === 0) {
        resultsContainer.innerHTML = '<div class="empty-state">No images match filters.</div>';
        return;
    }

    images.forEach(img => {
        const size = formatBytes(img.encodedBodySize || img.transferSize);
        const fileName = img.url.split('/').pop().split('?')[0] || img.url;
        const badgeClass = img.isCached ? 'cached' : 'uncached';
        const badgeText = img.cacheType;

        const div = document.createElement('div');
        div.className = 'image-item';
        div.innerHTML = `
      <img src="${img.url}" class="thumb" onerror="this.src='';this.style.backgroundColor='#ccc'">
      <div class="info">
        <div class="filename" title="${img.url}">${fileName}</div>
        <div class="details">
          <span class="size">${size}</span>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
      </div>
    `;
        resultsContainer.appendChild(div);
    });
}

function generateSuggestions() {
    suggestionList.innerHTML = '';
    const suggestions = [];

    // Check for large PNGs
    const largePngs = currentImages.filter(i => (i.url.match(/\.png$/i)) && i.encodedBodySize > 100 * 1024);
    if (largePngs.length > 0) {
        suggestions.push(`Found ${largePngs.length} large PNGs. Consider converting to WebP or AVIF.`);
    }

    // Check for huge images
    const hugeImages = currentImages.filter(i => i.encodedBodySize > 500 * 1024);
    if (hugeImages.length > 0) {
        suggestions.push(`${hugeImages.length} images are over 500KB. Try compressing them.`);
    }

    // Check for uncached assets that should be cached
    const uncached = currentImages.filter(i => !i.isCached);
    if (uncached.length > 5) {
        suggestions.push(`${uncached.length} images are not cached. Check your server's Cache-Control headers.`);
    }

    if (suggestions.length === 0) {
        suggestions.push("Great job! No major efficiency issues detected.");
    }

    suggestions.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        suggestionList.appendChild(li);
    });
}

function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
