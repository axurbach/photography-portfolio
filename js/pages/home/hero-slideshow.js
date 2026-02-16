let isInitialLoad = true;

// hero image & overlay
const imageElement = document.getElementById("hero-image");
const overlay = document.querySelector(".tech-overlay");
const ring = document.querySelector(".ring-progress");

// collection link & nav buttons
const linkEl = document.getElementById("square-link");
const squarePrevBtn = document.getElementById("square-prev");
const squareNextBtn = document.getElementById("square-next");

// state
let currentCollectionIndex = 0;
let currentImageIndex = 0;
const duration = 7000;
let slideshowInterval = null;

// ------------ collections data ------------
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
            [ "Bass Victim paragraph 1 line 1", "Bass Victim paragraph 1 line 2" ],
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

// ------------ progress ring ------------
function startProgress() {
    ring.style.transition = "none";
    ring.style.strokeDashoffset = "100";
    ring.getBoundingClientRect(); // force reflow
    ring.style.transition = `stroke-dashoffset ${duration}ms linear`;
    ring.style.strokeDashoffset = "0";
}

// ------------ text update ------------
const paragraphEl = document.getElementById("info-text"); 
function updateText() {
    paragraphEl.classList.add("fade-out");
    setTimeout(() => {
        const paragraphs = collections[currentCollectionIndex].texts[currentImageIndex] || [];
        paragraphEl.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join("");
        paragraphEl.classList.remove("fade-out");
    }, 400);
}

// ------------ show next image ------------
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
        updateText();
    }, 500);
}

// ------------ square nav link ------------
function updateLink() {
    linkEl.classList.add("fade-out");
    setTimeout(() => {
        const col = collections[currentCollectionIndex];
        linkEl.innerHTML = `<a href="/collections/${col.file}.html">${col.name}</a>`;
        linkEl.classList.remove("fade-out");
    }, 200);
}

// ------------ switch collection ------------
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
switchCollection(0);

// ------------ hero border click ------------
const heroBorder = document.querySelector(".hero-border");
heroBorder.style.cursor = "pointer";
heroBorder.addEventListener("click", () => {
    const col = collections[currentCollectionIndex];
    window.location.href = `/collections/${col.file}.html`;
});
