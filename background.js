// Background script for managing image header requests

// Store headers temporarily in memory
// Key: URL, Value: Object of headers
// Store request details: statusCode, fromCache
// Key: URL, Value: Object
const requestDetails = new Map();

chrome.webRequest.onCompleted.addListener(
    (details) => {
        if (details.type === 'image' || details.type === 'xmlhttprequest') {
            const existing = requestDetails.get(details.url) || {};
            const info = {
                ...existing,
                fromCache: details.fromCache,
                statusCode: details.statusCode
            };
            requestDetails.set(details.url, info);
        }
    },
    { urls: ["<all_urls>"] }
);

// Listen for headers received
chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
        if (details.type === 'image' || details.type === 'xmlhttprequest') { // xhr for fetch
            const headers = {};
            if (details.responseHeaders) {
                details.responseHeaders.forEach(header => {
                    const name = header.name.toLowerCase();
                    if (['cache-control', 'pragma', 'expires', 'etag', 'last-modified'].includes(name)) {
                        headers[name] = header.value;
                    }
                });
            }

            // Merge with existing details if any, or create new
            const existing = requestDetails.get(details.url) || {};
            if (Object.keys(headers).length > 0) {
                existing.headers = headers;
                requestDetails.set(details.url, existing);
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
            if (requestDetails.has(url)) {
                results[url] = requestDetails.get(url);
            }
        });
        sendResponse(results);
    }
    return true; // Keep channel open
});

// Allow side panel to open on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
