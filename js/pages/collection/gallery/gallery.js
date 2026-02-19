document.addEventListener("DOMContentLoaded", () => {
    const { detectIOS, buildReducedStripSources, preloadStripSources, getTouchPoint } = window.GalleryUtils || {};
    const createGalleryLightbox = window.createGalleryLightbox;
    if (!detectIOS || !buildReducedStripSources || !preloadStripSources || !getTouchPoint || !createGalleryLightbox) return;

    const COLLECTION_IMAGES = window.COLLECTION_IMAGES || {};

    const container = document.querySelector(".scroll-container");
    if (!container) return;

    const path = window.location.pathname.toLowerCase();
    const slug = Object.keys(COLLECTION_IMAGES).find(name =>
        path.includes(`/${name}.html`) || path.endsWith(`/${name}`) || path.endsWith(`/${name}/`)
    );
    const originalSources = slug ? COLLECTION_IMAGES[slug] : [];
    if (!originalSources.length) return;

    const isIOS = detectIOS();
    const config = {
        gapRem: 1,
        cloneCount: isIOS ? 3 : 5,
        dragThreshold: 2,
        clickThreshold: 20,
        reduceStripQuality: window.innerWidth <= 1024,
        stripQuality: 0.3,
        stripScale: 0.6
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

    const normalizeScroll = value => state.sequenceWidth <= 0 ? 0 : ((value % state.sequenceWidth) + state.sequenceWidth) % state.sequenceWidth;

    function syncVirtualFromDom() {
        if (state.sequenceWidth <= 0) return;
        const before = container.scrollLeft;
        const normalized = normalizeScroll(before);
        state.virtualScroll = normalized;
        if (Math.abs(before - normalized) > 0.5) {
            container.scrollLeft = normalized;
        }
    }

    function setVirtualScroll(value) {
        state.virtualScroll = normalizeScroll(value);
        container.scrollLeft = state.virtualScroll;
        syncVirtualFromDom();
    }

    function createSequence() {
        const sequence = document.createElement("div");
        Object.assign(sequence.style, {
            display: "flex",
            flexShrink: "0",
            height: "100%"
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
                cursor: "inherit",
                marginRight: `${config.gapRem}rem`
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
        return state.sequenceWidth > 0;
    }

    function revealStrip() {
        setVirtualScroll(0);
        container.style.visibility = "visible";
        container.style.opacity = "1";
    }

    const lightbox = createGalleryLightbox();

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

        setVirtualScroll(state.scrollStart - delta);
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
            return;
        }
        setVirtualScroll(state.virtualScroll - state.velocity * 16);
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
            lightbox.show(state.pointerDownImage.dataset.fullSrc || state.pointerDownImage.src);
        }

        state.pointerDownImage = null;
        container.style.cursor = "pointer";
        document.body.style.cursor = "";
    }

    container.addEventListener("contextmenu", event => {
        if (event.target.closest("img")) event.preventDefault();
    });

    container.addEventListener("scroll", syncVirtualFromDom, { passive: true });

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
        const touch = getTouchPoint(event.touches);
        if (!touch) return;
        startInteraction(touch.pageX, touch.clientX, touch.clientY, event.target);
    }, { passive: true });

    container.addEventListener("touchmove", event => {
        const touch = getTouchPoint(event.touches);
        if (!touch || !state.isPointerDown) return;
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
        setVirtualScroll(state.virtualScroll + event.deltaY);
    });

    window.addEventListener("resize", () => {
        if (!measureSequenceWidth()) return;
        revealStrip();
    });

    window.addEventListener("beforeunload", () => {
        state.objectUrls.forEach(url => URL.revokeObjectURL(url));
    });

    (async () => {
        const reduced = await buildReducedStripSources(originalSources, config);
        state.stripSources = reduced.stripSources;
        state.objectUrls = reduced.objectUrls;
        await preloadStripSources(state.stripSources, config.cloneCount);
        renderSequences();

        if (!measureSequenceWidth()) {
            requestAnimationFrame(() => {
                if (!measureSequenceWidth()) return;
                revealStrip();
            });
            return;
        }

        revealStrip();
    })();
});
