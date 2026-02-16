document.addEventListener("DOMContentLoaded", () => {
    const collectionImages = {
        "/collections/bassvictim.html": [
            "/assets/images/collections/bassvictim/bassvictim-1.jpg",
            "/assets/images/collections/bassvictim/bassvictim-2.jpg",
            "/assets/images/collections/bassvictim/bassvictim-3.jpg",
            "/assets/images/collections/bassvictim/bassvictim-4.jpg",
            "/assets/images/collections/bassvictim/bassvictim-5.jpg",
            "/assets/images/collections/bassvictim/bassvictim-6.jpg",
            "/assets/images/collections/bassvictim/bassvictim-7.jpg",
            "/assets/images/collections/bassvictim/bassvictim-8.jpg"
        ],
        "/collections/berlin56.html": [
            "/assets/images/collections/berlin56/berlin56-1.jpg",
            "/assets/images/collections/berlin56/berlin56-2.jpg",
            "/assets/images/collections/berlin56/berlin56-3.jpg",
            "/assets/images/collections/berlin56/berlin56-4.jpg",
            "/assets/images/collections/berlin56/berlin56-5.jpg"
        ]
    };

    const currentPage = window.location.pathname;
    const images = collectionImages[currentPage] || [];
    const container = document.querySelector(".scroll-container");
    const IMAGE_GAP_REM = 1;
    const CLONE_COUNT = 4;
    const DRAG_THRESHOLD = 1;

    function createSequence() {
        const seq = document.createElement("div");
        seq.classList.add("sequence");
        seq.style.display = "flex";

        images.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            img.style.marginRight = IMAGE_GAP_REM + "rem";
            img.style.cursor = "pointer";
            img.draggable = false;
            seq.appendChild(img);
        });

        return seq;
    }

    for (let i = 0; i < CLONE_COUNT; i++) {
        container.appendChild(createSequence());
    }

    container.scrollLeft = container.scrollWidth / 2;
    container.style.cursor = "pointer";
    container.style.touchAction = "pan-y";

    // drag & momentum
    let isMouseDown = false, isDragging = false;
    let startX = 0, scrollStart = 0, velocity = 0, lastX = 0, momentumID;

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

    // pointer logic
    let pointerDownX = 0, pointerDownY = 0, activePointerId = null, pointerDownImg = null;
    const CLICK_THRESHOLD = 20;

    container.addEventListener("pointerdown", e => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        activePointerId = e.pointerId;
        container.setPointerCapture(activePointerId);
        isMouseDown = true;
        startX = e.pageX;
        scrollStart = container.scrollLeft;
        lastX = e.pageX;
        velocity = 0;
        if (momentumID) cancelAnimationFrame(momentumID);

        pointerDownX = e.clientX;
        pointerDownY = e.clientY;
        pointerDownImg = e.target.closest("img");
    });

    container.addEventListener("pointermove", e => {
        if (!isMouseDown || (activePointerId !== null && e.pointerId !== activePointerId)) return;
        const dx = e.pageX - startX;
        if (!isDragging && Math.abs(dx) > DRAG_THRESHOLD) {
            isDragging = true;
            container.style.cursor = "grabbing";
        }
        if (!isDragging) return;

        e.preventDefault();
        container.scrollLeft = scrollStart - dx;
        velocity = e.pageX - lastX;
        lastX = e.pageX;

        handleInfiniteScroll();
    });

    function stopInteraction(e) {
        if (!isMouseDown) return;
        isMouseDown = false;
        if (activePointerId !== null) {
            container.releasePointerCapture(activePointerId);
            activePointerId = null;
        }

        const movedX = e.clientX - pointerDownX;
        const movedY = e.clientY - pointerDownY;
        const movedDistance = Math.hypot(movedX, movedY);

        if (isDragging) {
            isDragging = false;
            applyMomentum();
        } else if (movedDistance <= CLICK_THRESHOLD) {
            if (pointerDownImg && container.contains(pointerDownImg)) {
                showOverlay(pointerDownImg.src);
            }
        }

        pointerDownImg = null;
        container.style.cursor = "pointer";
    }

    container.addEventListener("pointerup", stopInteraction);
    container.addEventListener("pointercancel", stopInteraction);
    container.addEventListener("pointerleave", stopInteraction);

    container.addEventListener("wheel", e => {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
        handleInfiniteScroll();
    });

    // momentum & infinite scroll
    function applyMomentum() {
        velocity *= 0.95;
        if (Math.abs(velocity) < 0.5) return;
        container.scrollLeft -= velocity;
        handleInfiniteScroll();
        momentumID = requestAnimationFrame(applyMomentum);
    }

    function handleInfiniteScroll() {
        const sequences = Array.from(container.querySelectorAll(".sequence"));
        if (!sequences.length) return;
        const first = sequences[0];
        const last = sequences[sequences.length - 1];
        const containerRect = container.getBoundingClientRect();
        const seqWidth = first.getBoundingClientRect().width;

        if (first.getBoundingClientRect().right < containerRect.left) {
            container.appendChild(first);
            container.scrollLeft -= seqWidth;
        }
        if (last.getBoundingClientRect().left > containerRect.right) {
            container.insertBefore(last, first);
            container.scrollLeft += seqWidth;
        }
    }
});
