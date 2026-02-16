document.addEventListener("DOMContentLoaded", () => {
    const readBtn = document.querySelector(".read-story");
    const extraContent = document.querySelector(".collection-desc");

    readBtn?.addEventListener("click", () => {
        extraContent?.classList.toggle("show");
        readBtn.textContent = extraContent?.classList.contains("show") ? "hide story" : "read story";
        extraContent?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const collectionPages = [
        "/collections/bassvictim.html",
        "/collections/berlin56.html"
    ];

    const currentPage = window.location.pathname;
    let currentIndex = collectionPages.indexOf(currentPage);
    if (currentIndex === -1) currentIndex = 0;

    document.querySelectorAll(".collection-prev").forEach(btn => {
        btn.addEventListener("click", () => {
            const prevIndex = (currentIndex - 1 + collectionPages.length) % collectionPages.length;
            window.location.href = collectionPages[prevIndex];
        });
    });

    document.querySelectorAll(".collection-next").forEach(btn => {
        btn.addEventListener("click", () => {
            const nextIndex = (currentIndex + 1) % collectionPages.length;
            window.location.href = collectionPages[nextIndex];
        });
    });
});
