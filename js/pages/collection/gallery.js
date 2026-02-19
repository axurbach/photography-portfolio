document.addEventListener("DOMContentLoaded", () => {
    const COLLECTION_IMAGES = {
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

    const path = window.location.pathname.toLowerCase();
    const slug = Object.keys(COLLECTION_IMAGES).find(name =>
        path.includes(`/${name}.html`) || path.endsWith(`/${name}`) || path.endsWith(`/${name}/`)
    );
    const originalSources = slug ? COLLECTION_IMAGES[slug] : [];
    if (!originalSources.length) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const config = {
        gapRem: 1,
        cloneCount: isIOS ? 3 : 5,
        dragThreshold: 2,
        clickThreshold: 20,
        reduceStripQuality: window.innerWidth <= 1024,
        stripQuality: 0.3,
        stripScale: 0.6,
        showDebug: window.location.search.includes("galleryDebug=1")
    };

    const state = {
        sequenceWidth: 0,
        virtualScroll: 0,
        isPointerDown: false,
        isDragging: false,
        startX: 0,
        startClientX: 0,
        startClientY: 0,
        scrollStart: 0,
        pointerDownImage: null,
        velocity: 0,
        lastX: 0,
        lastMoveTime: 0,
        momentumId: null,
        overlayJustOpenedUntil: 0,
        wrapEventCount: 0,
        debugReason: "init",
        debugRaf: 0,
        stripSources: [...originalSources],
        objectUrls: []
    };

    Object.assign(container.style, {
        visibility: "hidden",
        opacity: "0",
        transition: "opacity 220ms ease",
        cursor: "pointer",
        touchAction: "pan-y"
    });

    const debugOverlay = config.showDebug ? document.createElement("pre") : null;
    if (debugOverlay) {
        debugOverlay.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:10001;margin:0;padding:8px 10px;background:rgba(0,0,0,0.75);color:#fff;font:11px/1.3 monospace;border:1px solid rgba(255,255,255,0.35);pointer-events:none;white-space:pre-wrap;max-width:90vw;";
        document.body.appendChild(debugOverlay);
    }

    const normalizeScroll = value => state.sequenceWidth <= 0 ? 0 : ((value % state.sequenceWidth) + state.sequenceWidth) % state.sequenceWidth;

    function scheduleDebug(reason = "") {
        if (!debugOverlay) return;
        if (reason) state.debugReason = reason;
        if (state.debugRaf) return;

        state.debugRaf = requestAnimationFrame(() => {
            state.debugRaf = 0;
            debugOverlay.textContent = [
                `reason: ${state.debugReason}`,
                `slug: ${slug || "none"}`,
                `scrollLeft: ${container.scrollLeft.toFixed(2)}`,
                `virtualScroll: ${state.virtualScroll.toFixed(2)}`,
                `sequenceWidth: ${state.sequenceWidth.toFixed(2)}`,
                `min/max: 0.00 / ${state.sequenceWidth.toFixed(2)}`,
                `pointerDown: ${state.isPointerDown} dragging: ${state.isDragging}`,
                `velocity: ${state.velocity.toFixed(4)} wraps: ${state.wrapEventCount}`,
                `children: ${container.children.length} images: ${container.querySelectorAll("img").length}`
            ].join("\n");
        });
    }

    function syncVirtualFromDom(reason = "") {
        if (state.sequenceWidth <= 0) return;
        const before = container.scrollLeft;
        const normalized = normalizeScroll(before);
        state.virtualScroll = normalized;
        if (Math.abs(before - normalized) > 0.5) {
            container.scrollLeft = normalized;
            state.wrapEventCount += 1;
            scheduleDebug("wrap-adjust");
            return;
        }
        scheduleDebug(reason);
    }

    function setVirtualScroll(value, reason = "") {
        state.virtualScroll = normalizeScroll(value);
        container.scrollLeft = state.virtualScroll;
        syncVirtualFromDom(reason);
    }

    function createSequence() {
        const sequence = document.createElement("div");
        Object.assign(sequence.style, {
            display: "flex",
            flexShrink: "0",
            height: "100%",
            gap: `${config.gapRem}rem`
        });
        sequence.classList.add("sequence");

        state.stripSources.forEach((src, index) => {
            const image = document.createElement("img");
            image.src = src;
            image.dataset.fullSrc = originalSources[index];
            image.loading = "eager";
            image.fetchPriority = "auto";
            image.decoding = "async";
            image.draggable = false;
            Object.assign(image.style, {
                display: "block",
                height: "100%",
                width: "auto",
                flexShrink: "0",
                cursor: "inherit"
            });
            sequence.appendChild(image);
        });

        return sequence;
    }

    function renderSequences() {
        container.innerHTML = "";
        for (let index = 0; index < config.cloneCount; index += 1) {
            container.appendChild(createSequence());
        }
    }

    function measureSequenceWidth() {
        const sequences = container.querySelectorAll(".sequence");
        if (sequences.length >= 2) {
            const first = sequences[0].getBoundingClientRect();
            const second = sequences[1].getBoundingClientRect();
            state.sequenceWidth = Math.abs(second.left - first.left);
        } else {
            const first = container.querySelector(".sequence");
            state.sequenceWidth = first ? first.getBoundingClientRect().width : 0;
        }
        scheduleDebug("measure");
        return state.sequenceWidth > 0;
    }

    function revealStrip() {
        setVirtualScroll(0, "center");
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

    async function buildReducedStripSources() {
        if (!config.reduceStripQuality) return;

        state.stripSources = await Promise.all(originalSources.map(async src => {
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
                state.objectUrls.push(objectUrl);
                return objectUrl;
            } catch {
                return src;
            }
        }));
    }

    async function preloadStripSources() {
        const allSources = Array.from({ length: config.cloneCount }, () => state.stripSources).flat();
        await Promise.all(allSources.map(src => {
            const image = new Image();
            image.src = src;
            image.decoding = "async";
            return waitForImageReady(image);
        }));
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
            Object.assign(overlayImage.style, { maxWidth: "100%", maxHeight: "75vh", width: "100%", height: "auto" });
            return;
        }
        Object.assign(overlayImage.style, { maxWidth: "75%", maxHeight: "75%", width: "auto", height: "auto" });
    }

    function showOverlay(src) {
        overlayImage.src = src;
        overlayImage.onload = updateOverlayImageSize;
        overlay.style.display = "flex";
        state.overlayJustOpenedUntil = Date.now() + 200;
    }

    function hideOverlay() {
        overlay.style.display = "none";
        overlayImage.src = "";
    }

    function stopMomentum() {
        if (!state.momentumId) return;
        cancelAnimationFrame(state.momentumId);
        state.momentumId = null;
    }

    function startInteraction(pageX, clientX, clientY, target) {
        state.isPointerDown = true;
        state.isDragging = false;
        state.startX = pageX;
        state.scrollStart = state.virtualScroll;
        state.startClientX = clientX;
        state.startClientY = clientY;
        state.pointerDownImage = target?.closest("img") || null;
        state.velocity = 0;
        state.lastX = pageX;
        state.lastMoveTime = performance.now();
        stopMomentum();
        scheduleDebug("start-drag");
    }

    function moveInteraction(pageX, now) {
        if (!state.isPointerDown) return;
        const delta = pageX - state.startX;
        if (!state.isDragging && Math.abs(delta) > config.dragThreshold) {
            state.isDragging = true;
            container.style.cursor = "grabbing";
            document.body.style.cursor = "grabbing";
        }
        if (!state.isDragging) return;

        setVirtualScroll(state.scrollStart - delta, "move");
        const dt = Math.max(1, now - state.lastMoveTime);
        state.velocity = (pageX - state.lastX) / dt;
        state.lastX = pageX;
        state.lastMoveTime = now;
    }

    function applyMomentum() {
        state.velocity *= 0.92;
        if (Math.abs(state.velocity) < 0.02) {
            state.velocity = 0;
            state.momentumId = null;
            scheduleDebug("momentum-stop");
            return;
        }
        setVirtualScroll(state.virtualScroll - state.velocity * 16, "momentum");
        state.momentumId = requestAnimationFrame(applyMomentum);
    }

    function endInteraction(clientX, clientY) {
        if (!state.isPointerDown) return;
        state.isPointerDown = false;
        const movedDistance = Math.hypot(clientX - state.startClientX, clientY - state.startClientY);

        if (state.isDragging) {
            state.isDragging = false;
            applyMomentum();
        } else if (movedDistance <= config.clickThreshold && state.pointerDownImage && container.contains(state.pointerDownImage)) {
            showOverlay(state.pointerDownImage.dataset.fullSrc || state.pointerDownImage.src);
        }

        state.pointerDownImage = null;
        container.style.cursor = "pointer";
        document.body.style.cursor = "";
        scheduleDebug("end-drag");
    }

    const touchPoint = list => {
        const touch = list[0];
        return touch ? { pageX: touch.pageX, clientX: touch.clientX, clientY: touch.clientY } : null;
    };

    overlay.addEventListener("click", event => {
        if (Date.now() < state.overlayJustOpenedUntil) return;
        if (event.target === overlay || event.target === overlayImage) hideOverlay();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") hideOverlay();
    });

    container.addEventListener("contextmenu", event => {
        if (event.target.closest("img")) event.preventDefault();
    });

    container.addEventListener("scroll", () => syncVirtualFromDom("scroll"), { passive: true });

    container.addEventListener("mousedown", event => {
        if (event.button !== 0) return;
        startInteraction(event.pageX, event.clientX, event.clientY, event.target);
    });

    window.addEventListener("mousemove", event => {
        if (!state.isPointerDown) return;
        event.preventDefault();
        moveInteraction(event.pageX, performance.now());
    });

    window.addEventListener("mouseup", event => endInteraction(event.clientX, event.clientY));

    container.addEventListener("touchstart", event => {
        const touch = touchPoint(event.touches);
        if (!touch) return;
        startInteraction(touch.pageX, touch.clientX, touch.clientY, event.target);
    }, { passive: true });

    container.addEventListener("touchmove", event => {
        const touch = touchPoint(event.touches);
        if (!touch || !state.isPointerDown) return;
        event.preventDefault();
        moveInteraction(touch.pageX, performance.now());
    }, { passive: false });

    container.addEventListener("touchend", event => {
        const touch = touchPoint(event.changedTouches);
        if (!touch) return;
        endInteraction(touch.clientX, touch.clientY);
    });

    container.addEventListener("touchcancel", event => {
        const touch = touchPoint(event.changedTouches);
        if (!touch) return;
        endInteraction(touch.clientX, touch.clientY);
    });

    container.addEventListener("wheel", event => {
        event.preventDefault();
        setVirtualScroll(state.virtualScroll + event.deltaY, "wheel");
    });

    window.addEventListener("resize", () => {
        if (!measureSequenceWidth()) return;
        revealStrip();
        scheduleDebug("resize");
    });

    window.addEventListener("beforeunload", () => {
        state.objectUrls.forEach(url => URL.revokeObjectURL(url));
    });

    (async () => {
        await buildReducedStripSources();
        await preloadStripSources();
        renderSequences();

        if (!measureSequenceWidth()) {
            requestAnimationFrame(() => {
                if (!measureSequenceWidth()) return;
                revealStrip();
                scheduleDebug("raf-ready");
            });
            return;
        }

        revealStrip();
        scheduleDebug("ready");
    })();
});
