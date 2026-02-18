document.addEventListener("DOMContentLoaded", () => {
    const collectionImages = {
        "bassvictim": [
            "../assets/images/collections/bassvictim/bassvictim-1.jpg",
            "../assets/images/collections/bassvictim/bassvictim-2.jpg",
            "../assets/images/collections/bassvictim/bassvictim-3.jpg",
            "../assets/images/collections/bassvictim/bassvictim-4.jpg",
            "../assets/images/collections/bassvictim/bassvictim-5.jpg",
            "../assets/images/collections/bassvictim/bassvictim-6.jpg",
            "../assets/images/collections/bassvictim/bassvictim-7.jpg",
            "../assets/images/collections/bassvictim/bassvictim-8.jpg"
        ],
        "berlin56": [
            "../assets/images/collections/berlin56/berlin56-1.jpg",
            "../assets/images/collections/berlin56/berlin56-2.jpg",
            "../assets/images/collections/berlin56/berlin56-3.jpg",
            "../assets/images/collections/berlin56/berlin56-4.jpg",
            "../assets/images/collections/berlin56/berlin56-5.jpg"
        ]
    };

    const currentPage = window.location.pathname.toLowerCase();
    const knownSlugs = Object.keys(collectionImages);
    const pageSlug = knownSlugs.find(slug => {
        const slugPattern = new RegExp(`(?:^|/)${slug}(?:\\.html)?/?$`, "i");
        return slugPattern.test(currentPage);
    }) || "";
    const images = collectionImages[pageSlug] || [];
    const container = document.querySelector(".scroll-container");
    if (!container || !images.length) return;

    const IMAGE_GAP_REM = 1;
    const CLONE_COUNT = 9;
    const DRAG_THRESHOLD = 1;
    const CLICK_THRESHOLD = 20;

    function createSequence() {
        const seq = document.createElement("div");
        seq.classList.add("sequence");
        seq.style.display = "flex";
        seq.style.flexShrink = "0";

        images.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            img.loading = "auto";
            img.decoding = "async";
            img.style.marginRight = IMAGE_GAP_REM + "rem";
            img.style.cursor = "pointer";
            img.style.flexShrink = "0";
            img.draggable = false;
            seq.appendChild(img);
        });

        return seq;
    }

    function renderSequences(count) {
        container.innerHTML = "";
        for (let i = 0; i < count; i++) {
            container.appendChild(createSequence());
        }
    }

    renderSequences(CLONE_COUNT);

    let sequenceWidth = 0;

    function preloadCollectionImages() {
        const preloadTasks = images.map(src => new Promise(resolve => {
            const preloadImage = new Image();
            preloadImage.decoding = "async";
            preloadImage.onload = resolve;
            preloadImage.onerror = resolve;
            preloadImage.src = src;
        }));

        return Promise.allSettled(preloadTasks);
    }

    function centerOnMiddleSequence() {
        if (sequenceWidth <= 0) return;
        const centerBand = Math.floor(CLONE_COUNT / 2);
        container.scrollLeft = sequenceWidth * centerBand;
    }

    function updateSequenceWidth() {
        const firstSequence = container.querySelector(".sequence");
        sequenceWidth = firstSequence ? Math.round(firstSequence.getBoundingClientRect().width) : 0;

        if (sequenceWidth > 0 && container.scrollLeft === 0) {
            centerOnMiddleSequence();
        }

        handleInfiniteScroll();
    }

    function ensureReady(attempt = 0) {
        updateSequenceWidth();

        if (sequenceWidth > 0) {
            centerOnMiddleSequence();
            return;
        }

        if (attempt >= 60) return;
        requestAnimationFrame(() => ensureReady(attempt + 1));
    }

    function attachImageLoadListeners() {
        const allImages = Array.from(container.querySelectorAll("img"));
        allImages.forEach(img => {
            if (!img.complete) {
                img.addEventListener("load", () => ensureReady(), { once: true });
                img.addEventListener("error", () => ensureReady(), { once: true });
            }
        });
    }

    preloadCollectionImages().finally(() => {
        ensureReady();
    });

    attachImageLoadListeners();

    window.addEventListener("resize", () => ensureReady());
    window.addEventListener("load", () => ensureReady());

    container.addEventListener("scroll", handleInfiniteScroll, { passive: true });

    container.style.cursor = "pointer";
    container.style.touchAction = "pan-y";

    // drag & momentum
    let isPointerDown = false;
    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;
    let velocity = 0;
    let lastX = 0;
    let lastMoveTime = 0;
    let momentumID = null;
    let startClientX = 0;
    let startClientY = 0;
    let pointerDownImg = null;

    // overlay / lightbox
    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position: fixed; inset: 0; display: none; 
        align-items: center; justify-content: center; 
        background: rgba(0,0,0,0.8); z-index: 9999;
    `;

    const overlayImg = document.createElement("img");
    overlayImg.style.cssText = `
        max-width: 75%; max-height: 75%; cursor: zoom-out; 
        user-select: none; -webkit-user-select: none; 
    `;
    overlayImg.draggable = false;
    overlay.appendChild(overlayImg);
    document.body.appendChild(overlay);

    let overlayJustOpenedUntil = 0;

    function updateOverlayImageSize() {
        const img = overlayImg;
        const isLandscape = img.naturalWidth > img.naturalHeight;
        const isMobile = window.innerWidth <= 767;

        if (isMobile && isLandscape) {
            img.style.maxWidth = "100%";
            img.style.maxHeight = "75vh";
            img.style.width = "100%";
            img.style.height = "auto";
        } else {
            img.style.maxWidth = "75%";
            img.style.maxHeight = "75%";
            img.style.width = "auto";
            img.style.height = "auto";
        }
    }

    function showOverlay(src) {
        overlayImg.src = src;
        overlayImg.onload = updateOverlayImageSize;
        overlay.style.display = "flex";
        overlayJustOpenedUntil = Date.now() + 150;
    }

    function hideOverlay() {
        overlay.style.display = "none";
        overlayImg.src = "";
    }

    overlay.addEventListener("click", e => {
        if (Date.now() < overlayJustOpenedUntil) return;
        if (e.target === overlay || e.target === overlayImg) hideOverlay();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") hideOverlay();
    });

    function startInteraction(pageX, clientX, clientY, target) {
        isPointerDown = true;
        isDragging = false;
        startX = pageX;
        scrollStart = container.scrollLeft;
        lastX = pageX;
        lastMoveTime = performance.now();
        velocity = 0;
        if (momentumID) cancelAnimationFrame(momentumID);
        momentumID = null;

        startClientX = clientX;
        startClientY = clientY;
        pointerDownImg = target?.closest("img") || null;
    }

    function moveInteraction(pageX, nowTime) {
        if (!isPointerDown) return;

        const dx = pageX - startX;
        if (!isDragging && Math.abs(dx) > DRAG_THRESHOLD) {
            isDragging = true;
            container.style.cursor = "grabbing";
        }
        if (!isDragging) return;

        container.scrollLeft = scrollStart - dx;
        const dt = Math.max(1, nowTime - lastMoveTime);
        const deltaX = pageX - lastX;
        velocity = deltaX / dt;
        lastX = pageX;
        lastMoveTime = nowTime;
        handleInfiniteScroll();
    }

    function endInteraction(clientX, clientY) {
        if (!isPointerDown) return;
        isPointerDown = false;

        const movedX = clientX - startClientX;
        const movedY = clientY - startClientY;
        const movedDistance = Math.hypot(movedX, movedY);

        if (isDragging) {
            isDragging = false;
            applyMomentum();
            handleInfiniteScroll();
        } else if (movedDistance <= CLICK_THRESHOLD) {
            if (pointerDownImg && container.contains(pointerDownImg)) {
                showOverlay(pointerDownImg.src);
            }
        }

        pointerDownImg = null;
        container.style.cursor = "pointer";
    }

    container.addEventListener("mousedown", e => {
        if (e.button !== 0) return;
        startInteraction(e.pageX, e.clientX, e.clientY, e.target);
    });

    window.addEventListener("mousemove", e => {
        if (!isPointerDown) return;
        e.preventDefault();
        moveInteraction(e.pageX, performance.now());
    });

    window.addEventListener("mouseup", e => {
        endInteraction(e.clientX, e.clientY);
    });

    container.addEventListener("touchstart", e => {
        if (sequenceWidth <= 0) ensureReady();
        const touch = e.touches[0];
        if (!touch) return;
        startInteraction(touch.pageX, touch.clientX, touch.clientY, e.target);
    }, { passive: true });

    container.addEventListener("touchmove", e => {
        const touch = e.touches[0];
        if (!touch || !isPointerDown) return;
        e.preventDefault();
        moveInteraction(touch.pageX, performance.now());
    }, { passive: false });

    container.addEventListener("touchend", e => {
        const touch = e.changedTouches[0];
        if (!touch) return;
        endInteraction(touch.clientX, touch.clientY);
    });

    container.addEventListener("touchcancel", e => {
        const touch = e.changedTouches[0];
        if (!touch) return;
        endInteraction(touch.clientX, touch.clientY);
    });

    container.addEventListener("wheel", e => {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
        handleInfiniteScroll();
    });

    // momentum & infinite scroll
    function applyMomentum() {
        velocity *= 0.92;
        if (Math.abs(velocity) < 0.02) {
            velocity = 0;
            momentumID = null;
            return;
        }
        container.scrollLeft -= velocity * 16;
        handleInfiniteScroll();
        momentumID = requestAnimationFrame(applyMomentum);
    }

    function handleInfiniteScroll() {
        if (sequenceWidth <= 0) return;

        const centerBand = Math.floor(CLONE_COUNT / 2);
        const minScroll = sequenceWidth * (centerBand - 1);
        const maxScroll = sequenceWidth * (centerBand + 1);

        while (container.scrollLeft < minScroll) {
            container.scrollLeft += sequenceWidth;
        }

        while (container.scrollLeft >= maxScroll) {
            container.scrollLeft -= sequenceWidth;
        }
    }
});
