document.addEventListener("DOMContentLoaded", () => {
    const readBtn = document.querySelector(".read-story");
    const extraContent = document.querySelector(".collection-desc");

    function updateExpandedHeight() {
        if (!extraContent?.classList.contains("show")) return;
        extraContent.style.maxHeight = `${extraContent.scrollHeight}px`;
    }

    function syncExpandedState() {
        const isExpanded = extraContent?.classList.contains("show");
        document.body.classList.toggle("collection-expanded", Boolean(isExpanded));
        document.documentElement.classList.toggle("collection-expanded", Boolean(isExpanded));

        if (!extraContent) return;

        if (isExpanded) {
            extraContent.style.maxHeight = `${extraContent.scrollHeight}px`;
        } else {
            extraContent.style.maxHeight = "0px";
        }
    }

    readBtn?.addEventListener("click", () => {
        extraContent?.classList.toggle("show");
        const isExpanded = extraContent?.classList.contains("show");
        readBtn.textContent = isExpanded ? "hide description" : "read description";
        syncExpandedState();

        if (isExpanded) {
            requestAnimationFrame(updateExpandedHeight);
            setTimeout(updateExpandedHeight, 250);
        }

        if (isExpanded) {
            extraContent?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    });

    syncExpandedState();

    window.addEventListener("resize", updateExpandedHeight);
    window.addEventListener("load", updateExpandedHeight);

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
