const protectedImageSelectors = ['.hero-image', '.scroll-container img', '.banner-strip img'];

protectedImageSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(img => {
        img.addEventListener('contextmenu', e => e.preventDefault());
    });
});

function revealBody() {
    document.body.classList.remove("js-hidden");
}

document.addEventListener("DOMContentLoaded", revealBody, { once: true });
window.addEventListener("load", revealBody, { once: true });