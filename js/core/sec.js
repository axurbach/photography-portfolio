const protectedImageSelectors = ['.hero-image', '.scroll-container img', '.banner-strip img'];

protectedImageSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(img => {
        img.addEventListener('contextmenu', e => e.preventDefault());
    });
});

window.addEventListener("load", () => {
    document.body.classList.remove("js-hidden");
});