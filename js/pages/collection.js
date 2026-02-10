document.addEventListener("DOMContentLoaded", () => {
    const images = [
        "/assets/images/collections/bassvictim/bassvictim-1.jpg",
        "/assets/images/collections/bassvictim/bassvictim-2.jpg",
        "/assets/images/collections/bassvictim/bassvictim-3.jpg",
        "/assets/images/collections/bassvictim/bassvictim-4.jpg",
        "/assets/images/collections/bassvictim/bassvictim-5.jpg",
        "/assets/images/collections/bassvictim/bassvictim-6.jpg",
        "/assets/images/collections/bassvictim/bassvictim-7.jpg",
        "/assets/images/collections/bassvictim/bassvictim-8.jpg"
    ];

    const container = document.querySelector(".scroll-container");
    const IMAGE_GAP = 1;
    const CLONE_COUNT = 4;

    // Create a sequence fragment
    function createSequence() {
        const seq = document.createElement("div");
        seq.classList.add("sequence");
        seq.style.display = "flex";
        seq.style.gap = IMAGE_GAP + "rem";

        images.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            seq.appendChild(img);
        });

        return seq;
    }

    // Add initial sequences
    for (let i = 0; i < CLONE_COUNT; i++) {
        container.appendChild(createSequence());
    }

    // Start roughly in middle
    container.scrollLeft = container.scrollWidth / 2;

    // Drag & velocity variables
    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;
    let velocity = 0;
    let lastX = 0;
    let momentumID;
    let isMomentumActive = false;

    // Auto-scroll variables
    const AUTO_SCROLL_SPEED = 30; // pixels per second (adjust)
    let lastTime = performance.now();

    // -----------------------------
    // Drag & mouse events
    // -----------------------------
    container.addEventListener("mousedown", e => {
        isDragging = true;
        startX = e.pageX;
        scrollStart = container.scrollLeft;
        lastX = e.pageX;
        velocity = 0;
        container.style.cursor = "grabbing";

        if (momentumID) cancelAnimationFrame(momentumID);
    });

    container.addEventListener("mousemove", e => {
        if (!isDragging) return;
        e.preventDefault();

        const dx = e.pageX - startX;
        container.scrollLeft = scrollStart - dx;

        // calculate velocity
        velocity = e.pageX - lastX;
        lastX = e.pageX;

        handleInfiniteScroll();
    });

    container.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            container.style.cursor = "grab";
            applyMomentum();
        }
    });

    container.addEventListener("mouseleave", () => {
        if (isDragging) {
            isDragging = false;
            container.style.cursor = "grab";
            applyMomentum();
        }
    });

    container.addEventListener("wheel", e => {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
        handleInfiniteScroll();
    });

    // -----------------------------
    // Momentum / flick
    // -----------------------------
    function applyMomentum() {
        isMomentumActive = true;
        velocity *= 0.95; // friction factor

        if (Math.abs(velocity) < 0.5) {
            isMomentumActive = false; // stop momentum
            return;
        }

        container.scrollLeft -= velocity;
        handleInfiniteScroll();

        momentumID = requestAnimationFrame(applyMomentum);
    }

    // -----------------------------
    // Infinite scroll logic
    // -----------------------------
    function handleInfiniteScroll() {
        const sequences = Array.from(container.querySelectorAll(".sequence"));
        if (sequences.length === 0) return;

        const firstSeq = sequences[0];
        const lastSeq = sequences[sequences.length - 1];
        const containerRect = container.getBoundingClientRect();
        const seqWidth = firstSeq.getBoundingClientRect().width + IMAGE_GAP;

        // Scroll left: first sequence is fully out of view
        if (firstSeq.getBoundingClientRect().right < containerRect.left) {
            container.appendChild(firstSeq);
            container.scrollLeft -= seqWidth;
        }

        // Scroll right: last sequence fully out of view
        if (lastSeq.getBoundingClientRect().left > containerRect.right) {
            container.insertBefore(lastSeq, firstSeq);
            container.scrollLeft += seqWidth;
        }
    }
});
