document.addEventListener("DOMContentLoaded", () => {
    const images = ["/assets/images/home/home-banner.png"];
    const container = document.querySelector(".banner-strip");
    const IMAGE_GAP = 0;
    const CLONE_COUNT = 3;

    function createSequence() {
        const seq = document.createElement("div");
        seq.classList.add("sequence");
        seq.style.display = "flex";
        seq.style.flexDirection = "column";
        seq.style.gap = IMAGE_GAP + "px";

        images.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            img.style.userSelect = "none";
            img.style.pointerEvents = "none";
            img.addEventListener("dragstart", e => e.preventDefault());
            seq.appendChild(img);
        });

        return seq;
    }

    for (let i = 0; i < CLONE_COUNT; i++) container.appendChild(createSequence());
    container.scrollTop = container.querySelector(".sequence").offsetHeight;

    // ------------ drag & momentum ------------
    let isMouseDown = false, isDragging = false, startY = 0, scrollStart = 0;
    let velocity = 0, lastY = 0, momentumID;
    let isMomentumActive = false;
    const DRAG_THRESHOLD = 1;
    const AUTO_SCROLL_CYCLE_TIME = 29900;
    let lastTime = performance.now();

    container.addEventListener("mousedown", e => {
        isMouseDown = true;
        startY = e.pageY;
        scrollStart = container.scrollTop;
        lastY = e.pageY;
        velocity = 0;
        if (momentumID) cancelAnimationFrame(momentumID);
    });

    container.addEventListener("mousemove", e => {
        if (!isMouseDown) return;
        const dy = e.pageY - startY;
        if (!isDragging && Math.abs(dy) > DRAG_THRESHOLD) {
            isDragging = true;
            container.style.cursor = "grabbing";
        }
        if (!isDragging) return;
        e.preventDefault();
        container.scrollTop = scrollStart - dy;
        velocity = e.pageY - lastY;
        lastY = e.pageY;
        handleInfiniteScroll();
    });

    function stopDrag() {
        if (!isMouseDown) return;
        isMouseDown = false;
        if (isDragging) {
            isDragging = false;
            applyMomentum();
        }
        container.style.cursor = "grab";
    }

    container.addEventListener("mouseup", stopDrag);
    container.addEventListener("mouseleave", stopDrag);
    container.addEventListener("wheel", e => {
        e.preventDefault();
        container.scrollTop += e.deltaY;
        handleInfiniteScroll();
    });

    function applyMomentum() {
        isMomentumActive = true;
        velocity *= 0.95;
        if (Math.abs(velocity) < 0.5) {
            isMomentumActive = false;
            return;
        }
        container.scrollTop -= velocity;
        handleInfiniteScroll();
        momentumID = requestAnimationFrame(applyMomentum);
    }

    function handleInfiniteScroll() {
        const sequences = Array.from(container.querySelectorAll(".sequence"));
        if (sequences.length !== CLONE_COUNT) return;
        const firstSeqHeight = Math.round(sequences[0].getBoundingClientRect().height);
        if (container.scrollTop >= firstSeqHeight * 2) container.scrollTop = Math.round(container.scrollTop - firstSeqHeight);
        if (container.scrollTop <= 0) container.scrollTop = Math.round(container.scrollTop + firstSeqHeight);
    }

    function autoScroll(currentTime) {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        if (!isDragging && !isMomentumActive) {
            const seqHeight = container.querySelector(".sequence").offsetHeight;
            const scrollPerMs = seqHeight / AUTO_SCROLL_CYCLE_TIME;
            container.scrollTop -= scrollPerMs * deltaTime;
            handleInfiniteScroll();
        }
        requestAnimationFrame(autoScroll);
    }

    requestAnimationFrame(autoScroll);
});
