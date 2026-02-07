console.log("dev ruler loaded");

let devRulerEnabled = true;

let ruler = null;
let startX = 0;
let startY = 0;

// Track all placed rulers
const rulers = [];

document.addEventListener("mousedown", (e) => {
    if (!devRulerEnabled) return;
    startX = e.clientX;
    startY = e.clientY;

    // Create new ruler container
    ruler = document.createElement("div");
    ruler.className = "dev-ruler";

    // Label for dimensions
    const label = document.createElement("div");
    label.className = "dev-ruler-label";
    label.innerText = "w0 h0";
    ruler.appendChild(label);

    ruler.style.left = `${startX}px`;
    ruler.style.top = `${startY}px`;
    ruler.style.width = "0px";
    ruler.style.height = "0px";

    document.body.appendChild(ruler);
    rulers.push(ruler); // save reference
});

document.addEventListener("mousemove", (e) => {
    if (!devRulerEnabled || !ruler) return;

    const width = e.clientX - startX;
    const height = e.clientY - startY;

    ruler.style.width = `${Math.abs(width)}px`;
    ruler.style.height = `${Math.abs(height)}px`;
    ruler.style.left = `${Math.min(startX, e.clientX)}px`;
    ruler.style.top = `${Math.min(startY, e.clientY)}px`;

    // Update label
    const label = ruler.querySelector(".dev-ruler-label");
    label.innerText = `w${Math.abs(width)}px h${Math.abs(height)}px`;
});

document.addEventListener("mouseup", () => {
    if (!devRulerEnabled) return;
    ruler = null;
});

// Delete all rulers on Delete key
document.addEventListener("keydown", (e) => {
    if (e.key === "/" || e.code === "Slash") {
        devRulerEnabled = !devRulerEnabled;

        if (!devRulerEnabled) {
            rulers.forEach(r => r.remove());
            rulers.length = 0;
            ruler = null;
        }

        console.log(`Dev ruler ${devRulerEnabled ? "ON" : "OFF"}`);
    }

    if (e.key === "e" && devRulerEnabled) {
        rulers.forEach(r => r.remove());
        rulers.length = 0;
    }
});