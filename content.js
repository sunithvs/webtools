if (!window.hasImageCheckerListener) {
    window.hasImageCheckerListener = true;

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "analyze") {
            const resources = performance.getEntriesByType('resource');
            const images = resources.filter(r =>
                r.initiatorType === 'img' ||
                r.initiatorType === 'css' ||
                /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(r.name)
            );

            const analyzedImages = images.map(img => {
                const isCached = img.transferSize === 0 || (img.transferSize < img.encodedBodySize && img.encodedBodySize > 0);

                let cacheType = 'Network';
                if (img.transferSize === 0) cacheType = 'Memory Cache';
                else if (img.transferSize < img.encodedBodySize) cacheType = 'Disk Cache';

                return {
                    url: img.name,
                    transferSize: img.transferSize,
                    encodedBodySize: img.encodedBodySize,
                    duration: img.duration,
                    isCached: isCached,
                    cacheType: cacheType,
                    initiator: img.initiatorType
                };
            });

            sendResponse({ images: analyzedImages });
        }
        return true;
    });
}
