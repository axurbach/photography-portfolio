document.addEventListener("DOMContentLoaded", () => {

    const hamburger = document.getElementById("hamburger-btn");
    const mobileMenu = document.getElementById("mobile-menu");

    if (!hamburger || !mobileMenu) {
        console.error("hamburger or mobile menu not found.");
        return;
    }

    function setMenuState(isOpen) {
        mobileMenu.classList.toggle("active", isOpen);
        hamburger.setAttribute("aria-expanded", String(isOpen));
        mobileMenu.setAttribute("aria-hidden", String(!isOpen));
    }

    setMenuState(false);

    hamburger.addEventListener("click", () => {
        const isOpen = mobileMenu.classList.contains("active");
        setMenuState(!isOpen);
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            setMenuState(false);
        }
    });

    mobileMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => setMenuState(false));
    });

    document.addEventListener("click", e => {
        if (!mobileMenu.classList.contains("active")) return;
        if (hamburger.contains(e.target) || mobileMenu.contains(e.target)) return;
        setMenuState(false);
    });

});
