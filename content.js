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

                let naturalWidth = 0;
                let naturalHeight = 0;
                let width = 0;
                let height = 0;
                let loading = null;

                // Try to find the DOM element to get dimensions
                const domNode = document.querySelector(`img[src*="${img.name.split('/').pop()}"]`) ||
                    document.querySelector(`img[src="${img.name}"]`);

                if (domNode) {
                    naturalWidth = domNode.naturalWidth;
                    naturalHeight = domNode.naturalHeight;
                    width = domNode.width || domNode.clientWidth;
                    height = domNode.height || domNode.clientHeight;
                    loading = domNode.getAttribute('loading');
                }

                return {
                    url: img.name,
                    transferSize: img.transferSize,
                    encodedBodySize: img.encodedBodySize,
                    duration: img.duration,
                    isCached: isCached,
                    cacheType: cacheType,
                    initiator: img.initiatorType,
                    naturalWidth: naturalWidth,
                    naturalHeight: naturalHeight,
                    width: width,
                    height: height,
                    loading: loading
                };
            });

            sendResponse({ images: analyzedImages });
        }
        return true;
    });
}
