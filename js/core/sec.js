document.querySelectorAll('img').forEach(img => {
    img.addEventListener('contextmenu', e => e.preventDefault());
});
