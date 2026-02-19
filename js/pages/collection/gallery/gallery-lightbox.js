(function () {
    function createGalleryLightbox() {
        const overlay = document.createElement("div");
        overlay.style.cssText = "position: fixed; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); z-index: 9999;";

        const image = document.createElement("img");
        image.style.cssText = "max-width: 75%; max-height: 75%; cursor: zoom-out; user-select: none; -webkit-user-select: none;";
        image.draggable = false;
        overlay.appendChild(image);
        document.body.appendChild(overlay);

        let justOpenedUntil = 0;

        function updateSize() {
            const isMobile = window.innerWidth <= 767;
            const isLandscape = image.naturalWidth > image.naturalHeight;

            if (isMobile && isLandscape) {
                Object.assign(image.style, { maxWidth: "100%", maxHeight: "75vh", width: "100%", height: "auto" });
                return;
            }

            Object.assign(image.style, { maxWidth: "75%", maxHeight: "75%", width: "auto", height: "auto" });
        }

        function show(src) {
            image.src = src;
            image.onload = updateSize;
            overlay.style.display = "flex";
            justOpenedUntil = Date.now() + 200;
        }

        function hide() {
            overlay.style.display = "none";
            image.src = "";
        }

        overlay.addEventListener("click", event => {
            if (Date.now() < justOpenedUntil) return;
            if (event.target === overlay || event.target === image) hide();
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") hide();
        });

        return { show, hide };
    }

    window.createGalleryLightbox = createGalleryLightbox;
})();
