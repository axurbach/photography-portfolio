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

    const IMAGE_GAP_REM = 1;
    const CLONE_COUNT = 7;
    const PRELOAD_SEQUENCE_COUNT = 4;
    const CENTER_INDEX = Math.floor(CLONE_COUNT / 2);
    const DRAG_THRESHOLD = 2;
    const CLICK_THRESHOLD = 20;

    let sequenceWidth = 0;
    let isPointerDown = false;
    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;
    let startClientX = 0;
    let startClientY = 0;
    let pointerDownImage = null;
    let velocity = 0;
    let lastX = 0;
    let lastMoveTime = 0;
    let momentumId = null;
    let overlayJustOpenedUntil = 0;

    container.style.visibility = "hidden";
    container.style.opacity = "0";
    container.style.transition = "opacity 220ms ease";
    container.style.cursor = "pointer";
    container.style.touchAction = "pan-y";

    function createSequence() {
        const sequence = document.createElement("div");
        sequence.classList.add("sequence");
        sequence.style.display = "flex";
        sequence.style.flexShrink = "0";
        sequence.style.gap = `${IMAGE_GAP_REM}rem`;

        images.forEach(src => {
            const image = document.createElement("img");
            image.src = src;
            image.loading = "eager";
            image.decoding = "async";
            image.draggable = false;
            image.style.flexShrink = "0";
            image.style.cursor = "inherit";
            sequence.appendChild(image);
        });

        return sequence;
    }

    function renderSequences() {
        container.innerHTML = "";
        for (let index = 0; index < CLONE_COUNT; index += 1) {
            container.appendChild(createSequence());
        }
    }

    function measureSequenceWidth() {
        const firstSequence = container.querySelector(".sequence");
        sequenceWidth = firstSequence ? firstSequence.getBoundingClientRect().width : 0;
        return sequenceWidth > 0;
    }

    function centerStrip() {
        if (sequenceWidth <= 0) return;
        container.scrollLeft = sequenceWidth * CENTER_INDEX;
    }

    function handleInfiniteScroll() {
        if (sequenceWidth <= 0) return;

        const minScroll = sequenceWidth;
        const wrapSpan = sequenceWidth * (CLONE_COUNT - 2);
        const normalized = ((container.scrollLeft - minScroll) % wrapSpan + wrapSpan) % wrapSpan;
        const wrappedScrollLeft = minScroll + normalized;

        if (Math.abs(container.scrollLeft - wrappedScrollLeft) > 0.5) {
            container.scrollLeft = wrappedScrollLeft;
        }
    }

    function revealStrip() {
        centerStrip();
        handleInfiniteScroll();
        container.style.visibility = "visible";
        container.style.opacity = "1";
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
        const sources = Array.from({ length: PRELOAD_SEQUENCE_COUNT }, () => images).flat();

        const preloadTasks = sources.map(src => {
            const preloadImage = new Image();
            preloadImage.src = src;
            preloadImage.decoding = "async";
            return waitForImageReady(preloadImage);
        });

        await Promise.all(preloadTasks);
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
        scrollStart = container.scrollLeft;
        startClientX = clientX;
        startClientY = clientY;
        pointerDownImage = target?.closest("img") || null;
        velocity = 0;
        lastX = pageX;
        lastMoveTime = performance.now();
        stopMomentum();
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

        container.scrollLeft = scrollStart - delta;
        handleInfiniteScroll();

        const dt = Math.max(1, now - lastMoveTime);
        velocity = (pageX - lastX) / dt;
        lastX = pageX;
        lastMoveTime = now;
    }

    function applyMomentum() {
        velocity *= 0.92;
        if (Math.abs(velocity) < 0.02) {
            velocity = 0;
            momentumId = null;
            return;
        }

        container.scrollLeft -= velocity * 16;
        handleInfiniteScroll();
        momentumId = requestAnimationFrame(applyMomentum);
    }

    function endInteraction(clientX, clientY) {
        if (!isPointerDown) return;
        isPointerDown = false;

        const movedDistance = Math.hypot(clientX - startClientX, clientY - startClientY);

        if (isDragging) {
            isDragging = false;
            applyMomentum();
        } else if (movedDistance <= CLICK_THRESHOLD && pointerDownImage && container.contains(pointerDownImage)) {
            showOverlay(pointerDownImage.src);
        }

        pointerDownImage = null;
        container.style.cursor = "pointer";
        document.body.style.cursor = "";
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

    container.addEventListener("scroll", handleInfiniteScroll, { passive: true });

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
        container.scrollLeft += event.deltaY;
        handleInfiniteScroll();
    });

    window.addEventListener("resize", () => {
        if (!measureSequenceWidth()) return;
        revealStrip();
    });

    (async () => {
        await preloadImages();
        renderSequences();

        if (!measureSequenceWidth()) {
            requestAnimationFrame(() => {
                if (measureSequenceWidth()) {
                    revealStrip();
                }
            });
            return;
        }

        revealStrip();
    })();
});
