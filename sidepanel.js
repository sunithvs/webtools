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
        chrome.tabs.sendMessage(tab.id, { action: "analyze" }, async (response) => {
            if (chrome.runtime.lastError) {
                resultsContainer.innerHTML = `<div class="empty-state">Error: ${chrome.runtime.lastError.message}</div>`;
                return;
            }

            if (response && response.images) {
                let images = response.images;

                // Get headers from background script
                const urls = images.map(img => img.url);
                const headerResponse = await new Promise(resolve => {
                    chrome.runtime.sendMessage({ action: "getHeaders", urls: urls }, resolve);
                });

                // Merge headers
                images = images.map(img => {
                    const headers = headerResponse ? headerResponse[img.url] : null;
                    let cacheControl = null;

                    if (headers) {
                        cacheControl = headers['cache-control'];
                    }

                    // Refine cache status based on headers
                    let isCached = img.isCached;
                    let cacheWarning = null;

                    if (!isCached && cacheControl) {
                        if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
                            cacheWarning = 'Explicitly Uncached (Header)';
                        } else if (cacheControl.includes('max-age=0')) {
                            cacheWarning = 'max-age=0';
                        }
                    }

                    return { ...img, headers, cacheControl, cacheWarning };
                });

                currentImages = images;

                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = '<span class="icon">🔍</span> Analyze Page';

                // Show controls
                document.getElementById('filters').classList.remove('hidden');
                document.getElementById('stats').classList.remove('hidden');
                document.getElementById('suggestions').classList.remove('hidden');

                filterAndRender();
                generateSuggestions();
            } else {
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = '<span class="icon">🔍</span> Analyze Page';
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

        const imgEl = document.createElement('img');
        imgEl.className = 'thumb';
        imgEl.src = img.url;
        imgEl.addEventListener('error', function () {
            this.style.display = 'none'; // Hide broken images or replace with placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'thumb';
            placeholder.style.backgroundColor = '#ccc';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.textContent = '?';

            // Insert placeholder before the hidden image
            imgEl.parentNode.insertBefore(placeholder, imgEl);
        });

        const infoDiv = document.createElement('div');
        infoDiv.className = 'info';

        const fileNameDiv = document.createElement('div');
        fileNameDiv.className = 'filename';
        fileNameDiv.title = img.url;
        fileNameDiv.textContent = fileName;

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'details';

        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'size';
        sizeSpan.textContent = size;

        const badgeSpan = document.createElement('span');
        badgeSpan.className = `badge ${badgeClass}`;
        badgeSpan.textContent = badgeText;

        if (img.cacheWarning) {
            const warningSpan = document.createElement('span');
            warningSpan.className = 'badge warning';
            warningSpan.textContent = img.cacheWarning;
            detailsDiv.appendChild(warningSpan);
        }

        detailsDiv.appendChild(sizeSpan);
        detailsDiv.appendChild(badgeSpan);

        infoDiv.appendChild(fileNameDiv);
        infoDiv.appendChild(detailsDiv);

        div.appendChild(imgEl);
        div.appendChild(infoDiv);

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

    // Check for explicitly uncached assets (no-cache headers)
    const explicitlyUncached = currentImages.filter(i => i.cacheWarning === 'Explicitly Uncached (Header)');
    if (explicitlyUncached.length > 0) {
        suggestions.push(`${explicitlyUncached.length} images have 'no-cache' or 'no-store' headers. Remove if possible.`);
    }

    // Check for dimensions mismatch
    const oversizedImages = currentImages.filter(i => {
        if (i.width > 0 && i.naturalWidth > 0) {
            return i.naturalWidth > i.width * 2; // Intrinsic is more than 2x display width
        }
        return false;
    });
    if (oversizedImages.length > 0) {
        suggestions.push(`${oversizedImages.length} images are significantly larger than their display size. Resize them.`);
    }

    // Check for lazy loading opportunities
    const lazyLoadCandidates = currentImages.filter(i => {
        // Simple heuristic: if it's not lazy loaded and it's largeish
        return !i.loading || i.loading !== 'lazy';
    });
    // This is a bit broad, maybe only if we have many images
    if (lazyLoadCandidates.length > 10 && currentImages.length > 10) {
        suggestions.push(`Consider adding loading="lazy" to off-screen images.`);
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
