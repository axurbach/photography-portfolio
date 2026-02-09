// ------------- slideshow + ring logic for homepage -------------

const images = [
    "assets/images/collections/bassvictim/bassvictim-1.jpg",
    "assets/images/collections/bassvictim/bassvictim-2.jpg",
    "assets/images/collections/bassvictim/bassvictim-3.jpg"
];

let currentIndex = 0;
const duration = 7000; // same as slideshow interval

const imageElement = document.getElementById("hero-image");
const overlay = document.querySelector(".tech-overlay");
const ring = document.querySelector(".ring-progress");

function startProgress() {
    ring.style.transition = "none";
    ring.style.strokeDashoffset = "100";

    // force reflow so reset actually applies
    ring.getBoundingClientRect();

    ring.style.transition = `stroke-dashoffset ${duration}ms ease-in-out`;
    ring.style.strokeDashoffset = "0";
}

startProgress();

setInterval(() => {
    overlay.style.opacity = "0.6";
    imageElement.classList.add("fade-out");

    setTimeout(() => {
        currentIndex = (currentIndex + 1) % images.length;
        imageElement.src = images[currentIndex];
        imageElement.classList.remove("fade-out");
        overlay.style.opacity = "0";

        startProgress();
    }, 600);
}, duration);
