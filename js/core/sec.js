document.querySelectorAll('img').forEach(img => {
    img.addEventListener('contextmenu', e => e.preventDefault());
});

window.addEventListener("load", () => {
    document.body.classList.remove("js-hidden");
});