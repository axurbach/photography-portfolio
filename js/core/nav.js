document.addEventListener("DOMContentLoaded", () => {

    const hamburger = document.getElementById("hamburger-btn");
    const mobileMenu = document.getElementById("mobile-menu");

    if (!hamburger || !mobileMenu) {
        console.error("Hamburger or mobile menu not found.");
        return;
    }

    hamburger.addEventListener("click", () => {
        mobileMenu.classList.toggle("active");
    });

});
