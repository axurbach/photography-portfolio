(function () {
    function detectIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    }

    function waitForImageReady(image) {
        return new Promise(resolve => {
            const finalize = () => {
                if (typeof image.decode === "function") {
                    image.decode().catch(() => {}).finally(resolve);
                } else {
                    resolve();
                }
            };

            if (image.complete && image.naturalWidth > 0) {
                finalize();
                return;
            }

            const onLoad = () => {
                image.removeEventListener("error", onError);
                finalize();
            };

            const onError = () => {
                image.removeEventListener("load", onLoad);
                resolve();
            };

            image.addEventListener("load", onLoad, { once: true });
            image.addEventListener("error", onError, { once: true });
        });
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.decoding = "async";
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = src;
        });
    }

    function canvasToBlob(canvas, quality) {
        return new Promise(resolve => canvas.toBlob(blob => resolve(blob), "image/jpeg", quality));
    }

    async function buildReducedStripSources(originalSources, config) {
        if (!config.reduceStripQuality) {
            return { stripSources: [...originalSources], objectUrls: [] };
        }

        const objectUrls = [];
        const stripSources = await Promise.all(originalSources.map(async src => {
            try {
                const image = await loadImage(src);
                const width = Math.max(1, Math.round(image.naturalWidth * config.stripScale));
                const height = Math.max(1, Math.round(image.naturalHeight * config.stripScale));
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext("2d");
                if (!context) return src;

                context.drawImage(image, 0, 0, width, height);
                const blob = await canvasToBlob(canvas, config.stripQuality);
                if (!blob) return src;

                const objectUrl = URL.createObjectURL(blob);
                objectUrls.push(objectUrl);
                return objectUrl;
            } catch {
                return src;
            }
        }));

        return { stripSources, objectUrls };
    }

    async function preloadStripSources(stripSources, cloneCount) {
        const allSources = Array.from({ length: cloneCount }, () => stripSources).flat();
        await Promise.all(allSources.map(src => {
            const image = new Image();
            image.src = src;
            image.decoding = "async";
            return waitForImageReady(image);
        }));
    }

    function getTouchPoint(touchList) {
        const touch = touchList[0];
        return touch ? { pageX: touch.pageX, clientX: touch.clientX, clientY: touch.clientY } : null;
    }

    window.GalleryUtils = {
        detectIOS,
        buildReducedStripSources,
        preloadStripSources,
        getTouchPoint
    };
})();
