// Background script for managing image header requests

// Store headers temporarily in memory
// Key: URL, Value: Object of headers
const headerCache = new Map();

// Listen for headers received
chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
        if (details.type === 'image' || details.type === 'xmlhttprequest') { // xhr for fetch
            const headers = {};
            details.responseHeaders.forEach(header => {
                const name = header.name.toLowerCase();
                if (['cache-control', 'pragma', 'expires', 'etag', 'last-modified'].includes(name)) {
                    headers[name] = header.value;
                }
            });
            if (Object.keys(headers).length > 0) {
                headerCache.set(details.url, headers);
            }
        }
    },
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
);

// Listen for messages from sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getHeaders") {
        const results = {};
        request.urls.forEach(url => {
            if (headerCache.has(url)) {
                results[url] = headerCache.get(url);
            }
        });
        sendResponse(results);
    }
    return true; // Keep channel open
});
