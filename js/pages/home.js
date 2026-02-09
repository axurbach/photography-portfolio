// -----------------------------
// Homepage Slideshow + Collection Nav
// -----------------------------

// 1️⃣ Collections with their images
const collections = [
    {
        name: "bassvictim",
        images: [
            "assets/images/collections/bassvictim/bassvictim-1.jpg",
            "assets/images/collections/bassvictim/bassvictim-2.jpg",
            "assets/images/collections/bassvictim/bassvictim-3.jpg"
        ],
        texts: [
            [ "Bass Victim paragraph 1 line 1", "Bass Victim paragraph 1 line 2" ],
            [ "Bass Victim paragraph 2 line 1", "Bass Victim paragraph 2 line 2" ],
            [ "Bass Victim paragraph 3 line 1", "Bass Victim paragraph 3 line 2" ]
        ]
    },
    {
        name: "berlin56",
        images: [
            "assets/images/collections/berlin56/berlin56-1.jpg",
            "assets/images/collections/berlin56/berlin56-2.jpg",
            "assets/images/collections/berlin56/berlin56-3.jpg"
        ],
        texts: [
            [ "Berlin 56 paragraph 1 line 1", "Berlin 56 paragraph 1 line 2" ],
            [ "Berlin 56 paragraph 2 line 1", "Berlin 56 paragraph 2 line 2" ],
            [ "Berlin 56 paragraph 3 line 1", "Berlin 56 paragraph 3 line 2" ]
        ]
    }
];

// 2️⃣ DOM elements
const imageElement = document.getElementById("hero-image");
const overlay = document.querySelector(".tech-overlay");
const ring = document.querySelector(".ring-progress");

const linkEl = document.getElementById("square-link");
const squarePrevBtn = document.getElementById("square-prev");
const squareNextBtn = document.getElementById("square-next");

// 3️⃣ State
let currentCollectionIndex = 0;
let currentImageIndex = 0;
const duration = 7000;
let slideshowInterval = null;

// -----------------------------
// Ring progress
// -----------------------------
function startProgress() {
    ring.style.transition = "none";
    ring.style.strokeDashoffset = "100";
    ring.getBoundingClientRect();
    ring.style.transition = `stroke-dashoffset ${duration}ms linear`;
    ring.style.strokeDashoffset = "0";
}

// -----------------------------
// Update the paragraph / text
// -----------------------------
const paragraphEl = document.getElementById("info-text"); // make sure you have this in HTML

function updateText() {
    const col = collections[currentCollectionIndex];
    paragraphEl.classList.add("fade-out");

    setTimeout(() => {
        const paragraphs = col.texts[currentImageIndex] || [];
        paragraphEl.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join("");
        paragraphEl.classList.remove("fade-out");
    }, 400); // match your fade timing
}


// -----------------------------
// Show next image in current collection
// -----------------------------
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

// -----------------------------
// Update the square nav link
// -----------------------------
function updateLink() {
    linkEl.classList.add("fade-out");

    setTimeout(() => {
        const col = collections[currentCollectionIndex];
        linkEl.innerHTML = `collection :: <a href="collections/${col.name}.html" target="_blank">${col.name}</a>`;
        linkEl.classList.remove("fade-out");
    }, 200);
}

// -----------------------------
// Switch collection manually
// -----------------------------
function switchCollection(index) {
    currentCollectionIndex = index;
    currentImageIndex = 0;

    // update hero image immediately
    overlay.style.opacity = "0.6";
    imageElement.classList.add("fade-out");

    setTimeout(() => {
        imageElement.src = collections[currentCollectionIndex].images[0];
        imageElement.classList.remove("fade-out");
        overlay.style.opacity = "0";
        startProgress();
    }, 300);

    // update nav link + paragraphs 
    updateLink();
    updateText();

    // reset interval so slideshow stays synced
    clearInterval(slideshowInterval);
    slideshowInterval = setInterval(showNextImage, duration);
}

// -----------------------------
// Square nav buttons
// -----------------------------
squarePrevBtn.addEventListener("click", () => {
    const newIndex = (currentCollectionIndex - 1 + collections.length) % collections.length;
    switchCollection(newIndex);
});

squareNextBtn.addEventListener("click", () => {
    const newIndex = (currentCollectionIndex + 1) % collections.length;
    switchCollection(newIndex);
});

// -----------------------------
// Initialize
// -----------------------------
switchCollection(0); // starts first collection
