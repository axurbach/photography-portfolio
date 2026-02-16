let isInitialLoad = true;

// ------------ homepage slideshow + collection nav ------------

const collections = [
    {
        file: "bassvictim",
        name: "collection :: bassvictim",
        images: [
            "/assets/images/collections/bassvictim/bassvictim-1.jpg",
            "/assets/images/collections/bassvictim/bassvictim-2-c.jpg",
            "/assets/images/collections/bassvictim/bassvictim-7.jpg"
        ],
        texts: [
            [ "Bass Victim paragraph 1 line 1 line 1Bass Victim paragraph 1 line 1", "Bass Victim paragraph 1 line 1 line 1Bass Victim paragraph 1 line 1" ],
            [ "Bass Victim paragraph 2 line 1", "Bass Victim paragraph 2 line 2" ],
            [ "Bass Victim paragraph 3 line 1", "Bass Victim paragraph 3 line 2" ]
        ]
    },
    {
        file: "berlin56",
        name: "collection :: berlin56",
        images: [
            "/assets/images/collections/berlin56/berlin56-1.jpg",
            "/assets/images/collections/berlin56/berlin56-2-c.jpg",
            "/assets/images/collections/berlin56/berlin56-3.jpg"
        ],
        texts: [
            [ "Berlin 56 paragraph 1 line 1", "Berlin 56 paragraph 1 line 2" ],
            [ "Berlin 56 paragraph 2 line 1", "Berlin 56 paragraph 2 line 2" ],
            [ "Berlin 56 paragraph 3 line 1", "Berlin 56 paragraph 3 line 2" ]
        ]
    }
];

// dom elements
const imageElement = document.getElementById("hero-image");
const overlay = document.querySelector(".tech-overlay");
const ring = document.querySelector(".ring-progress");

const linkEl = document.getElementById("square-link");
const squarePrevBtn = document.getElementById("square-prev");
const squareNextBtn = document.getElementById("square-next");

// state
let currentCollectionIndex = 0;
let currentImageIndex = 0;
const duration = 7000;
let slideshowInterval = null;

// ------------ ring progress ------------

function startProgress() {
    ring.style.transition = "none";
    ring.style.strokeDashoffset = "100";
    ring.getBoundingClientRect();
    ring.style.transition = `stroke-dashoffset ${duration}ms linear`;
    ring.style.strokeDashoffset = "0";
}

// ------------ update paragraphs ------------

const paragraphEl = document.getElementById("info-text"); 

function updateText() {
    const col = collections[currentCollectionIndex];
    paragraphEl.classList.add("fade-out");

    setTimeout(() => {
        const paragraphs = col.texts[currentImageIndex] || [];
        paragraphEl.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join("");
        paragraphEl.classList.remove("fade-out");
    }, 400); 
}


// ------------ show next image in current collection ------------

function showNextImage() {
    const images = collections[currentCollectionIndex].images;

    overlay.style.opacity = "0.6";
    imageElement.classList.add("fade-out");

    setTimeout(() => {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        imageElement.src = images[currentImageIndex];
        imageElement.classList.remove("fade-out");
        overlay.style.opacity = "0";
        startProgress();

        // update paragraph for this image
        updateText();
    }, 500);
}

// ------------ update square nav link ------------

function updateLink() {
    linkEl.classList.add("fade-out");

    setTimeout(() => {
        const col = collections[currentCollectionIndex];
        linkEl.innerHTML = `<a href="/collections/${col.file}.html">${col.name}</a>`;
        linkEl.classList.remove("fade-out");
    }, 200);
}

// ------------ switch collection manually ------------

function switchCollection(index) {
    currentCollectionIndex = index;
    currentImageIndex = 0;

    if (!isInitialLoad) {
        overlay.style.opacity = "0.6";
        imageElement.classList.add("fade-out");
    }

    setTimeout(() => {
        imageElement.src = collections[currentCollectionIndex].images[0];
        imageElement.classList.remove("fade-out");
        overlay.style.opacity = "0";
        startProgress();
    }, isInitialLoad ? 0 : 300);

    updateLink();
    updateText();

    clearInterval(slideshowInterval);
    slideshowInterval = setInterval(showNextImage, duration);

    isInitialLoad = false;
}

// ------------ square nav buttons ------------

squarePrevBtn.addEventListener("click", () => {
    const newIndex = (currentCollectionIndex - 1 + collections.length) % collections.length;
    switchCollection(newIndex);
});

squareNextBtn.addEventListener("click", () => {
    const newIndex = (currentCollectionIndex + 1) % collections.length;
    switchCollection(newIndex);
});

// ------------ initialize ------------

switchCollection(0); // starts first collection

// clicking on hero border area / image opens specific collection

const heroBorder = document.querySelector(".hero-border");

heroBorder.style.cursor = "pointer";

heroBorder.addEventListener("click", () => {
    const col = collections[currentCollectionIndex];
    window.location.href = `/collections/${col.file}.html`;
});

// ------------ banner ------------

document.addEventListener("DOMContentLoaded", () => {
    const images = [
        "/assets/images/home/home-banner.png"
    ];

    const container = document.querySelector(".banner-strip");
    const IMAGE_GAP = 0; // vertical spacing
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
            img.addEventListener("dragstart", (e) => e.preventDefault());
            seq.appendChild(img);
        });

        return seq;
    }

    // add sequences
    for (let i = 0; i < CLONE_COUNT; i++) {
        container.appendChild(createSequence());
    }

    // start in middle
    container.scrollTop = container.querySelector(".sequence").offsetHeight;

    // drag & momentum
    let isMouseDown = false;
    let isDragging = false;
    let startY = 0;
    let scrollStart = 0;
    let velocity = 0;
    let lastY = 0;
    let momentumID;
    let isMomentumActive = false;
    const DRAG_THRESHOLD = 1;

    // auto-scroll speed
    const AUTO_SCROLL_CYCLE_TIME = 29900; // milliseconds to scroll through one sequence height
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

        // start drag if threshold exceeded
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

        if (container.scrollTop >= firstSeqHeight * 2) {
            container.scrollTop = Math.round(container.scrollTop - firstSeqHeight);
        }

        if (container.scrollTop <= 0) {
            container.scrollTop = Math.round(container.scrollTop + firstSeqHeight);
        }
    }

    function autoScroll(currentTime) {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        if (!isDragging && !isMomentumActive) {
            // calculate scroll speed proportional to sequence height
            const seqHeight = container.querySelector(".sequence").offsetHeight;
            // scroll through one full sequence height in AUTO_SCROLL_CYCLE_TIME milliseconds
            const scrollPerMs = seqHeight / AUTO_SCROLL_CYCLE_TIME;
            container.scrollTop -= scrollPerMs * deltaTime;
            handleInfiniteScroll();
        }

        requestAnimationFrame(autoScroll);
    }

    requestAnimationFrame(autoScroll);
});