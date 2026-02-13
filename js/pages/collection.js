document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------
    // Image data for each collection
    // -----------------------------
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

    // Get images for this page
    const currentPage = window.location.pathname;
    const images = collectionImages[currentPage] || [];

    const container = document.querySelector(".scroll-container");
    const IMAGE_GAP_REM = 1;
    const CLONE_COUNT = 4;
    const DRAG_THRESHOLD = 1;

    // -----------------------------
    // Create sequence
    // -----------------------------
    function createSequence() {
        const seq = document.createElement("div");
        seq.classList.add("sequence");
        seq.style.display = "flex";

        images.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            img.style.marginRight = IMAGE_GAP_REM + "rem";
            img.style.cursor = "pointer";
            seq.appendChild(img);
        });

        return seq;
    }

    for (let i = 0; i < CLONE_COUNT; i++) {
        container.appendChild(createSequence());
    }

    // Start near the middle
    container.scrollLeft = container.scrollWidth / 2;
    container.style.cursor = "pointer";

    // -----------------------------
    // Drag & momentum state
    // -----------------------------
    let isMouseDown = false;
    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;
    let velocity = 0;
    let lastX = 0;
    let momentumID;

    // -----------------------------
    // Overlay / lightbox
    // -----------------------------
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = 0;
    overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
    overlay.style.display = "none";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999";

    const overlayImg = document.createElement("img");
    overlayImg.style.maxWidth = "75%";
    overlayImg.style.maxHeight = "75%";
    overlayImg.style.cursor = "zoom-out";
    overlay.appendChild(overlayImg);
    document.body.appendChild(overlay);

    function showOverlay(src) {
        overlayImg.src = src;
        overlay.style.display = "flex";
    }

    function hideOverlay() {
        overlay.style.display = "none";
        overlayImg.src = "";
    }

    overlay.addEventListener("click", e => {
        if (e.target === overlay || e.target === overlayImg) hideOverlay();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") hideOverlay();
    });

    // -----------------------------
    // Pointer logic for click vs drag
    // -----------------------------
    let pointerDownX = 0;
    let pointerDownY = 0;
    const CLICK_THRESHOLD = 20; // pixels

    container.addEventListener("pointerdown", e => {
        pointerDownX = e.clientX;
        pointerDownY = e.clientY;
    });

    // -----------------------------
    // Mouse events for drag
    // -----------------------------
    container.addEventListener("mousedown", e => {
        isMouseDown = true;
        startX = e.pageX;
        scrollStart = container.scrollLeft;
        lastX = e.pageX;
        velocity = 0;

        if (momentumID) cancelAnimationFrame(momentumID);

        pointerDownX = e.clientX;
        pointerDownY = e.clientY;
    });

    container.addEventListener("mousemove", e => {
        if (!isMouseDown) return;

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

        if (isDragging) {
            isDragging = false;
            applyMomentum();
        } else {
            // Only trigger overlay if not dragging
            const allImages = container.querySelectorAll("img");
            for (const img of allImages) {
                const rect = img.getBoundingClientRect();
                if (
                    pointerDownX >= rect.left &&
                    pointerDownX <= rect.right &&
                    pointerDownY >= rect.top &&
                    pointerDownY <= rect.bottom
                ) {
                    showOverlay(img.src);
                    break;
                }
            }
        }

        container.style.cursor = "pointer";
    }

    container.addEventListener("mouseup", stopInteraction);
    container.addEventListener("mouseleave", stopInteraction);

    container.addEventListener("wheel", e => {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
        handleInfiniteScroll();
    });

    // -----------------------------
    // Momentum
    // -----------------------------
    function applyMomentum() {
        velocity *= 0.95;

        if (Math.abs(velocity) < 0.5) return;

        container.scrollLeft -= velocity;
        handleInfiniteScroll();

        momentumID = requestAnimationFrame(applyMomentum);
    }

    // -----------------------------
    // Infinite scroll
    // -----------------------------
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

    // -----------------------------
    // Read story logic
    // -----------------------------
    const readBtn = document.querySelector(".read-story");
    const extraContent = document.querySelector(".collection-desc");

    readBtn.addEventListener("click", () => {
        extraContent.classList.toggle("show");

        if (extraContent.classList.contains("show")) {
            readBtn.textContent = "hide story";
        } else {
            readBtn.textContent = "read story";
        }

        extraContent.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // -----------------------------
    // Collection page navigation
    // -----------------------------
    const collectionPages = [
        "/collections/bassvictim.html",
        "/collections/berlin56.html"
    ];

    let currentIndex = collectionPages.indexOf(currentPage);
    if (currentIndex === -1) currentIndex = 0;

    document.querySelectorAll(".collection-prev").forEach(btn => {
        btn.addEventListener("click", () => {
            const prevIndex = (currentIndex - 1 + collectionPages.length) % collectionPages.length;
            window.location.href = collectionPages[prevIndex];
        });
    });

    document.querySelectorAll(".collection-next").forEach(btn => {
        btn.addEventListener("click", () => {
            const nextIndex = (currentIndex + 1) % collectionPages.length;
            window.location.href = collectionPages[nextIndex];
        });
    });

});
