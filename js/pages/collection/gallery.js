document.addEventListener("DOMContentLoaded", () => {
    const collectionImages = {
        bassvictim: [
            "../assets/images/collections/bassvictim/bassvictim-1.jpg",
            "../assets/images/collections/bassvictim/bassvictim-2.jpg",
            "../assets/images/collections/bassvictim/bassvictim-3.jpg",
            "../assets/images/collections/bassvictim/bassvictim-4.jpg",
            "../assets/images/collections/bassvictim/bassvictim-5.jpg",
            "../assets/images/collections/bassvictim/bassvictim-6.jpg",
            "../assets/images/collections/bassvictim/bassvictim-7.jpg",
            "../assets/images/collections/bassvictim/bassvictim-8.jpg"
        ],
        berlin56: [
            "../assets/images/collections/berlin56/berlin56-1.jpg",
            "../assets/images/collections/berlin56/berlin56-2.jpg",
            "../assets/images/collections/berlin56/berlin56-3.jpg",
            "../assets/images/collections/berlin56/berlin56-4.jpg",
            "../assets/images/collections/berlin56/berlin56-5.jpg"
        ]
    };

    const container = document.querySelector(".scroll-container");
    if (!container) return;

    const pathname = window.location.pathname.toLowerCase();
    const slug = Object.keys(collectionImages).find(name => pathname.includes(`/${name}.html`) || pathname.endsWith(`/${name}`) || pathname.endsWith(`/${name}/`));
    const images = slug ? collectionImages[slug] : [];
    if (!images.length) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    const IMAGE_GAP_REM = 1;
    const CLONE_COUNT = isIOS ? 3 : 5;
    const PRELOAD_SEQUENCE_COUNT = CLONE_COUNT;
    const CENTER_INDEX = Math.floor(CLONE_COUNT / 2);
    const DRAG_THRESHOLD = 2;
    const CLICK_THRESHOLD = 20;
    const USE_REDUCED_STRIP_QUALITY = window.innerWidth <= 1024;
    const STRIP_QUALITY = 0.3;
    const STRIP_SCALE = 0.6;
    const SHOW_DEBUG = window.location.search.includes("galleryDebug=1");

    let sequenceWidth = 0;
    let isPointerDown = false;
    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;
    let virtualScroll = 0;
    let startClientX = 0;
    let startClientY = 0;
    let pointerDownImage = null;
    let velocity = 0;
    let lastX = 0;
    let lastMoveTime = 0;
    let momentumId = null;
    let overlayJustOpenedUntil = 0;
    let wrapEventCount = 0;
    let debugRaf = 0;
    let debugReason = "init";
    let stripSources = [...images];

    container.style.visibility = "hidden";
    container.style.opacity = "0";
    container.style.transition = "opacity 220ms ease";
    container.style.cursor = "pointer";
    container.style.touchAction = "pan-y";

    const debugOverlay = SHOW_DEBUG ? document.createElement("pre") : null;
    if (debugOverlay) {
        debugOverlay.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:10001;margin:0;padding:8px 10px;background:rgba(0,0,0,0.75);color:#fff;font:11px/1.3 monospace;border:1px solid rgba(255,255,255,0.35);pointer-events:none;white-space:pre-wrap;max-width:90vw;";
        document.body.appendChild(debugOverlay);
    }

    function scheduleDebug(reason = "") {
        if (!debugOverlay) return;
        if (reason) debugReason = reason;
        if (debugRaf) return;

        debugRaf = requestAnimationFrame(() => {
            debugRaf = 0;
            const minScroll = 0;
            const maxScroll = sequenceWidth > 0 ? sequenceWidth : 0;
            debugOverlay.textContent = [
                `reason: ${debugReason}`,
                `slug: ${slug || "none"}`,
                `scrollLeft: ${container.scrollLeft.toFixed(2)}`,
                `virtualScroll: ${virtualScroll.toFixed(2)}`,
                `sequenceWidth: ${sequenceWidth.toFixed(2)}`,
                `min/max: ${minScroll.toFixed(2)} / ${maxScroll.toFixed(2)}`,
                `pointerDown: ${isPointerDown} dragging: ${isDragging}`,
                `velocity: ${velocity.toFixed(4)} wraps: ${wrapEventCount}`,
                `children: ${container.children.length} images: ${container.querySelectorAll("img").length}`
            ].join("\n");
        });
    }

    function createSequence(sequenceIndex) {
        const sequence = document.createElement("div");
        sequence.classList.add("sequence");
        sequence.style.display = "flex";
        sequence.style.flexShrink = "0";
        sequence.style.height = "100%";
        sequence.style.gap = `${IMAGE_GAP_REM}rem`;

        stripSources.forEach((src, index) => {
            const image = document.createElement("img");
            image.src = src;
            image.dataset.fullSrc = images[index];
            image.loading = "eager";
            image.fetchPriority = "auto";
            image.decoding = "async";
            image.draggable = false;
            image.style.display = "block";
            image.style.height = "100%";
            image.style.width = "auto";
            image.style.flexShrink = "0";
            image.style.cursor = "inherit";
            sequence.appendChild(image);
        });

        return sequence;
    }

    function renderSequences() {
        container.innerHTML = "";
        for (let index = 0; index < CLONE_COUNT; index += 1) {
            container.appendChild(createSequence(index));
        }
    }

    function measureSequenceWidth() {
        const sequences = container.querySelectorAll(".sequence");
        if (sequences.length >= 2) {
            const firstRect = sequences[0].getBoundingClientRect();
            const secondRect = sequences[1].getBoundingClientRect();
            sequenceWidth = secondRect.left - firstRect.left;
        } else {
            const firstSequence = container.querySelector(".sequence");
            sequenceWidth = firstSequence ? firstSequence.getBoundingClientRect().width : 0;
        }

        if (sequenceWidth < 0) {
            sequenceWidth = Math.abs(sequenceWidth);
        }

        scheduleDebug("measure");
        return sequenceWidth > 0;
    }

    function centerStrip() {
        if (sequenceWidth <= 0) return;
        virtualScroll = 0;
        container.scrollLeft = 0;
        scheduleDebug("center");
    }

    function normalizeScroll(value) {
        if (sequenceWidth <= 0) return 0;
        return ((value % sequenceWidth) + sequenceWidth) % sequenceWidth;
    }

    function handleInfiniteScroll() {
        if (sequenceWidth <= 0) return;

        const before = container.scrollLeft;
        const normalized = normalizeScroll(before);
        virtualScroll = normalized;

        if (Math.abs(before - normalized) > 0.5) {
            container.scrollLeft = normalized;
            wrapEventCount += 1;
            scheduleDebug("wrap-adjust");
        }
    }

    function revealStrip() {
        centerStrip();
        handleInfiniteScroll();
        container.style.visibility = "visible";
        container.style.opacity = "1";
        scheduleDebug("reveal");
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

    async function preloadImages() {
        const sources = Array.from({ length: PRELOAD_SEQUENCE_COUNT }, () => stripSources).flat();

        const preloadTasks = sources.map(src => {
            const preloadImage = new Image();
            preloadImage.src = src;
            preloadImage.decoding = "async";
            return waitForImageReady(preloadImage);
        });

        await Promise.all(preloadTasks);
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
        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), "image/jpeg", quality);
        });
    }

    async function buildReducedStripSources() {
        if (!USE_REDUCED_STRIP_QUALITY) return;

        const reducedSources = await Promise.all(images.map(async src => {
            try {
                const image = await loadImage(src);
                const scaledWidth = Math.max(1, Math.round(image.naturalWidth * STRIP_SCALE));
                const scaledHeight = Math.max(1, Math.round(image.naturalHeight * STRIP_SCALE));

                const canvas = document.createElement("canvas");
                canvas.width = scaledWidth;
                canvas.height = scaledHeight;

                const context = canvas.getContext("2d");
                if (!context) return src;

                context.drawImage(image, 0, 0, scaledWidth, scaledHeight);
                const blob = await canvasToBlob(canvas, STRIP_QUALITY);
                if (!blob) return src;

                return URL.createObjectURL(blob);
            } catch {
                return src;
            }
        }));

        stripSources = reducedSources;
    }

    const overlay = document.createElement("div");
    overlay.style.cssText = "position: fixed; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); z-index: 9999;";

    const overlayImage = document.createElement("img");
    overlayImage.style.cssText = "max-width: 75%; max-height: 75%; cursor: zoom-out; user-select: none; -webkit-user-select: none;";
    overlayImage.draggable = false;
    overlay.appendChild(overlayImage);
    document.body.appendChild(overlay);

    function updateOverlayImageSize() {
        const isMobile = window.innerWidth <= 767;
        const isLandscape = overlayImage.naturalWidth > overlayImage.naturalHeight;

        if (isMobile && isLandscape) {
            overlayImage.style.maxWidth = "100%";
            overlayImage.style.maxHeight = "75vh";
            overlayImage.style.width = "100%";
            overlayImage.style.height = "auto";
            return;
        }

        overlayImage.style.maxWidth = "75%";
        overlayImage.style.maxHeight = "75%";
        overlayImage.style.width = "auto";
        overlayImage.style.height = "auto";
    }

    function showOverlay(src) {
        overlayImage.src = src;
        overlayImage.onload = updateOverlayImageSize;
        overlay.style.display = "flex";
        overlayJustOpenedUntil = Date.now() + 200;
    }

    function hideOverlay() {
        overlay.style.display = "none";
        overlayImage.src = "";
    }

    function stopMomentum() {
        if (!momentumId) return;
        cancelAnimationFrame(momentumId);
        momentumId = null;
    }

    function startInteraction(pageX, clientX, clientY, target) {
        isPointerDown = true;
        isDragging = false;
        startX = pageX;
        scrollStart = virtualScroll;
        startClientX = clientX;
        startClientY = clientY;
        pointerDownImage = target?.closest("img") || null;
        velocity = 0;
        lastX = pageX;
        lastMoveTime = performance.now();
        stopMomentum();
        scheduleDebug("start-drag");
    }

    function getTouchPoint(touchList) {
        const touch = touchList[0];
        if (!touch) return null;
        return {
            pageX: touch.pageX,
            clientX: touch.clientX,
            clientY: touch.clientY
        };
    }

    function moveInteraction(pageX, now) {
        if (!isPointerDown) return;

        const delta = pageX - startX;
        if (!isDragging && Math.abs(delta) > DRAG_THRESHOLD) {
            isDragging = true;
            container.style.cursor = "grabbing";
            document.body.style.cursor = "grabbing";
        }
        if (!isDragging) return;

        virtualScroll = normalizeScroll(scrollStart - delta);
        container.scrollLeft = virtualScroll;
        handleInfiniteScroll();

        const dt = Math.max(1, now - lastMoveTime);
        velocity = (pageX - lastX) / dt;
        lastX = pageX;
        lastMoveTime = now;
        scheduleDebug("move");
    }

    function applyMomentum() {
        velocity *= 0.92;
        if (Math.abs(velocity) < 0.02) {
            velocity = 0;
            momentumId = null;
            scheduleDebug("momentum-stop");
            return;
        }

        virtualScroll = normalizeScroll(virtualScroll - velocity * 16);
        container.scrollLeft = virtualScroll;
        handleInfiniteScroll();
        momentumId = requestAnimationFrame(applyMomentum);
        scheduleDebug("momentum");
    }

    function endInteraction(clientX, clientY) {
        if (!isPointerDown) return;
        isPointerDown = false;

        const movedDistance = Math.hypot(clientX - startClientX, clientY - startClientY);

        if (isDragging) {
            isDragging = false;
            applyMomentum();
        } else if (movedDistance <= CLICK_THRESHOLD && pointerDownImage && container.contains(pointerDownImage)) {
            showOverlay(pointerDownImage.dataset.fullSrc || pointerDownImage.src);
        }

        pointerDownImage = null;
        container.style.cursor = "pointer";
        document.body.style.cursor = "";
        scheduleDebug("end-drag");
    }

    overlay.addEventListener("click", event => {
        if (Date.now() < overlayJustOpenedUntil) return;
        if (event.target === overlay || event.target === overlayImage) {
            hideOverlay();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            hideOverlay();
        }
    });

    container.addEventListener("contextmenu", event => {
        if (event.target.closest("img")) {
            event.preventDefault();
        }
    });

    container.addEventListener("scroll", () => {
        handleInfiniteScroll();
        scheduleDebug("scroll");
    }, { passive: true });

    container.addEventListener("mousedown", event => {
        if (event.button !== 0) return;
        startInteraction(event.pageX, event.clientX, event.clientY, event.target);
    });

    window.addEventListener("mousemove", event => {
        if (!isPointerDown) return;
        event.preventDefault();
        moveInteraction(event.pageX, performance.now());
    });

    window.addEventListener("mouseup", event => {
        endInteraction(event.clientX, event.clientY);
    });

    container.addEventListener("touchstart", event => {
        const touch = getTouchPoint(event.touches);
        if (!touch) return;
        startInteraction(touch.pageX, touch.clientX, touch.clientY, event.target);
    }, { passive: true });

    container.addEventListener("touchmove", event => {
        const touch = getTouchPoint(event.touches);
        if (!touch || !isPointerDown) return;
        event.preventDefault();
        moveInteraction(touch.pageX, performance.now());
    }, { passive: false });

    container.addEventListener("touchend", event => {
        const touch = getTouchPoint(event.changedTouches);
        if (!touch) return;
        endInteraction(touch.clientX, touch.clientY);
    });

    container.addEventListener("touchcancel", event => {
        const touch = getTouchPoint(event.changedTouches);
        if (!touch) return;
        endInteraction(touch.clientX, touch.clientY);
    });

    container.addEventListener("wheel", event => {
        event.preventDefault();
        virtualScroll = normalizeScroll(virtualScroll + event.deltaY);
        container.scrollLeft = virtualScroll;
        handleInfiniteScroll();
        scheduleDebug("wheel");
    });

    window.addEventListener("resize", () => {
        if (!measureSequenceWidth()) return;
        revealStrip();
        scheduleDebug("resize");
    });

    (async () => {
        await buildReducedStripSources();
        await preloadImages();
        renderSequences();

        if (!measureSequenceWidth()) {
            requestAnimationFrame(() => {
                if (measureSequenceWidth()) {
                    revealStrip();
                    scheduleDebug("raf-ready");
                }
            });
            return;
        }

        revealStrip();
        scheduleDebug("ready");
    })();
});
