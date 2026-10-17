"use strict";

/* gallery settings */
const CIRCLE = 520;
const PREVIEW_H = 629;
const PREVIEW_W = PREVIEW_H * 3 / 4;
const OVERLAP = 0.85;
const FRICTION = 2.4;
const BACKGROUND_LOAD_LIMIT = 3;

/* shared helpers */
const $ = selector => document.querySelector(selector);
const rnd = (min, max) => min + Math.random() * (max - min);
const clamp = (value, max) => Math.max(-max, Math.min(max, value));
const mq = matchMedia("(max-width:768px),(max-aspect-ratio:4/5)");
const REDUCE = matchMedia("(prefers-reduced-motion:reduce)");
const body = document.body;
const ring = $(".ring");
const pv = $(".pv img");
const tick = $(".tick");
const nav = $("#nav");
const liveEl = $("#status");
const artistEl = $("#artist");

/* placeholder images */
function ph(index) {
    const sizes = [
        [800, 1000],
        [1000, 700],
        [700, 1000],
        [900, 900],
        [1000, 800],
    ];
    const palettes = [
        ["#8fa6b3", "#0c1216"],
        ["#f2f2f2", "#6b6b73"],
        ["#d8a7b1", "#2a1a22"],
        ["#e9f4ff", "#0a0a0a"],
        ["#9a9aa5", "#111"],
        ["#5f8f8a", "#06100f"],
    ];
    const size = sizes[Math.random() * sizes.length | 0];
    const palette = palettes[Math.random() * palettes.length | 0];
    const number = String(index + 1).padStart(2, "0");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size[0]}" height="${size[1]}" viewBox="0 0 ${size[0]} ${size[1]}"><defs><radialGradient id="g" cx="${Math.random().toFixed(2)}" cy="${Math.random().toFixed(2)}" r=".9"><stop offset="0" stop-color="${palette[0]}"/><stop offset="1" stop-color="${palette[1]}"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="40" y="${size[1] - 40}" font-family="Helvetica,Arial,sans-serif" font-size="56" fill="#fff" fill-opacity=".75">${number}</text></svg>`;

    return "data:image/svg+xml," + encodeURIComponent(svg);
}

/* gallery data */
const list = (IMAGES.length
    ? IMAGES
    : Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => ({
        src: ph(index),
        alt: "Placeholder image " + (index + 1),
    })))
    .map((entry, index) => typeof entry === "string"
        ? { src: entry, alt: "Photograph " + (index + 1), artist: "" }
        : {
            src: entry.src,
            alt: entry.alt || "Photograph " + (index + 1),
            artist: entry.artist || "",
        });
const AR = [0.72, 0.8, 1, 1.25, 1.5];
const items = list
    .map(entry => ({
        s: entry.src,
        alt: entry.alt,
        artist: entry.artist,
        k: rnd(0.82, 1.18),
        ar: AR[Math.random() * AR.length | 0],
    }))
    .sort(() => Math.random() - 0.5);

items.forEach((item, index) => {
    const element = document.createElement("div");
    element.className = "it";
    element.style.transitionDelay = index * 70 + "ms";
    element.setAttribute("aria-hidden", "true");

    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = "low";
    image.onload = () => {
        item.nw = image.naturalWidth;
        item.nh = image.naturalHeight;
        item.loaded = true;

        if (items[cur] === item) {
            sizePreview();
        }
    };
    image.alt = "";
    image.draggable = false;
    element.appendChild(image);
    ring.appendChild(element);

    item.el = element;
    item.im = image;
    item.nw = 4;
    item.nh = 5;
    item.loading = false;
    item.loaded = false;
});

/* gallery state */
let R = 0;
let r = 0;
let tx = 0;
let ty = 0;
let rot = rnd(0, 6.28);
let vel = 0;
let drag = false;
let la = 0;
let lt = 0;
let cur = -1;
let displayed = -1;
let pendingPreview = -1;
let ready = false;
let hapticsReady = false;
let said;

/* image loading */
function loadImage(item, priority) {
    if (item.loaded || item.loading) {
        if (priority === "high") {
            item.im.fetchPriority = "high";
        }

        return;
    }

    item.loading = true;
    item.im.fetchPriority = priority;
    item.im.src = item.s;
}

function loadRemainingImages() {
    const queue = items.filter(item => !item.loading);
    let activeLoads = 0;

    function loadNext() {
        while (activeLoads < BACKGROUND_LOAD_LIMIT && queue.length) {
            const item = queue.shift();
            if (!item || item.loading) {
                continue;
            }

            activeLoads++;
            const onComplete = () => {
                activeLoads--;
                loadNext();
            };
            item.im.addEventListener("load", onComplete, { once: true });
            item.im.addEventListener("error", onComplete, { once: true });
            loadImage(item, "low");
        }
    }

    loadNext();
}

/* gallery layout */
function scale() {
    const previewBounds = pv.parentElement.getBoundingClientRect();
    const ringBounds = ring.parentElement.getBoundingClientRect();

    return Math.min(
        1,
        previewBounds.width * 0.7 / PREVIEW_W,
        ringBounds.width * 0.9 / CIRCLE,
        innerHeight * 0.62 / PREVIEW_H,
        innerHeight * 0.7 / CIRCLE,
    );
}

function layout() {
    const mobile = mq.matches;
    const ringBounds = ring.parentElement.getBoundingClientRect();
    const diameter = mobile
        ? Math.max(100, Math.min(660, ringBounds.width * 0.78, innerHeight * 0.32))
        : Math.max(200, CIRCLE * scale());

    R = diameter / 2;
    ring.style.width = ring.style.height = diameter + "px";

    const count = items.length;
    items.forEach(item => {
        item.u = Math.min(Math.sqrt(item.ar), 1 / Math.sqrt(item.ar)) * item.k;
    });

    let circumference = 0;
    items.forEach((item, index) => {
        circumference += OVERLAP * (item.u + items[(index + 1) % count].u) / 2;
    });

    let maxSize = 0;
    items.forEach(item => {
        maxSize = Math.max(
            maxSize,
            item.k * Math.sqrt(item.ar),
            item.k / Math.sqrt(item.ar),
        );
    });

    r = R / (1 + Math.PI * maxSize / circumference);
    const spacing = 2 * Math.PI * r / circumference;
    let position = 0;

    items.forEach((item, index) => {
        const arc = spacing * item.k;
        item.w = arc * Math.sqrt(item.ar);
        item.h = arc / Math.sqrt(item.ar);
        item.a = position / r;
        position += OVERLAP * (item.u + items[(index + 1) % count].u) / 2 * spacing;
        item.el.style.width = item.w + "px";
        item.el.style.height = item.h + "px";
    });

    const offset = R * 0.04;
    if (mobile) {
        tx = R;
        ty = R - (r - offset);
    } else {
        tx = R - (r + offset);
        ty = R;
    }

    syncMode();
    sizePreview();
}

function sizePreview() {
    const item = items[Math.max(cur, 0)];
    const dpr = devicePixelRatio || 1;
    const hair = dpr >= 1 ? 1 / dpr : 1;
    const snap = value => Math.round(value * dpr) / dpr;

    if (mq.matches) {
        pv.style.width = pv.style.height = "";
        const bounds = ring.getBoundingClientRect();
        Object.assign(tick.style, {
            left: snap(bounds.left + R) - bounds.left + "px",
            top: snap(bounds.top + ty) - bounds.top + "px",
            width: hair + "px",
            height: R - ty + "px",
        });
        return;
    }

    const previewBounds = pv.parentElement.getBoundingClientRect();
    const ringBounds = ring.getBoundingClientRect();
    const aspectRatio = item.nw / item.nh;
    const maxWidth = PREVIEW_W * scale();
    const width = maxWidth;
    const height = width / Math.max(aspectRatio, 3 / 4);
    pv.style.width = width + "px";
    pv.style.height = height + "px";

    const distance = ringBounds.left + tx
        - (previewBounds.left + previewBounds.width / 2 + width / 2);
    const length = Math.max(R * 0.12, Math.min(R * 0.8, distance * 2 / 3));

    Object.assign(tick.style, {
        left: snap(ringBounds.left + tx - length) - ringBounds.left + "px",
        top: snap(ringBounds.top + ty) - ringBounds.top + "px",
        width: snap(length) + "px",
        height: hair + "px",
    });
}

/* preview and accessibility */
function showPreview(index) {
    if (index === displayed || index === pendingPreview) {
        return;
    }

    pendingPreview = index;
    const item = items[index];
    const image = item.im;
    loadImage(item, "high");

    const update = () => {
        if (pendingPreview !== index) {
            return;
        }

        pendingPreview = -1;
        if (index !== cur) {
            return;
        }

        pv.src = image.src;
        pv.alt = item.alt;
        displayed = index;
        label();
        sizePreview();
    };

    if (image.decode) {
        image.decode().then(update, update);
    } else {
        image.addEventListener("load", update, { once: true });
        image.addEventListener("error", update, { once: true });
    }
}

function announce() {
    clearTimeout(said);
    said = setTimeout(() => {
        if (ready) {
            liveEl.textContent = `${items[cur].alt} (${cur + 1} of ${items.length})`;
        }
    }, 600);
}

function isOpen() {
    return body.classList.contains("open");
}

function label() {
    if (mq.matches) {
        pv.setAttribute(
            "aria-label",
            items[Math.max(cur, 0)].alt
                + (isOpen() ? ". Activate or press Escape to close." : ". Activate to enlarge."),
        );
    } else {
        pv.removeAttribute("aria-label");
    }
}

function setOpen(value) {
    body.classList.toggle("open", value);
    pv.setAttribute("aria-expanded", value);
    ring.inert = nav.inert = value;
    label();

    if (value) {
        pv.focus();
    }
}

function syncMode() {
    if (mq.matches) {
        pv.setAttribute("role", "button");
        pv.tabIndex = 0;
        pv.setAttribute("aria-expanded", isOpen());
    } else {
        pv.removeAttribute("role");
        pv.removeAttribute("tabindex");
        pv.removeAttribute("aria-expanded");

        if (isOpen()) {
            setOpen(false);
        }
    }

    label();
}

/* gallery selection */
function place() {
    let best = 0;
    let bestDistance = 1e12;
    let hit = -1;
    let hitDistance = 1e12;

    items.forEach((item, index) => {
        const angle = item.a + rot;
        const x = R + r * Math.cos(angle);
        const y = R + r * Math.sin(angle);
        item.el.style.transform = `translate3d(${x - item.w / 2}px,${y - item.h / 2}px,0)`;

        const dx = tx - x;
        const dy = ty - y;
        const distance = dx * dx + dy * dy;

        if (Math.abs(dx) <= item.w / 2 && Math.abs(dy) <= item.h / 2 && distance < hitDistance) {
            hitDistance = distance;
            hit = index;
        }

        if (distance < bestDistance) {
            bestDistance = distance;
            best = index;
        }
    });

    const index = hit >= 0 ? hit : best;
    if (index !== cur) {
        cur = index;
        artistEl.textContent = items[index].artist;
        artistEl.hidden = !items[index].artist;
        label();
        announce();
        showPreview(index);

        if (mq.matches && hapticsReady && navigator.userActivation?.hasBeenActive
            && typeof navigator.vibrate === "function") {
            navigator.vibrate(10);
        }
    }
}

function step(direction) {
    if (!REDUCE.matches) {
        vel = clamp(vel + 1.5 * direction, 14);
        scheduleFrame();
        return;
    }

    const index = (cur + direction + items.length) % items.length;
    const target = mq.matches ? -Math.PI / 2 : Math.PI;
    const delta = target - (items[index].a + rot);
    rot += Math.atan2(Math.sin(delta), Math.cos(delta));
    scheduleFrame();
}

/* gallery interaction */
const ang = event => {
    const bounds = ring.getBoundingClientRect();
    return Math.atan2(
        event.clientY - bounds.top - R,
        event.clientX - bounds.left - R,
    );
};

ring.addEventListener("pointerdown", event => {
    hapticsReady = true;
    drag = true;
    ring.setPointerCapture(event.pointerId);
    ring.classList.add("drag");
    la = ang(event);
    lt = performance.now();
    vel = 0;
});

ring.addEventListener("pointermove", event => {
    if (!drag) {
        return;
    }

    const angle = ang(event);
    const time = performance.now();
    let delta = angle - la;
    if (delta > Math.PI) {
        delta -= 2 * Math.PI;
    }
    if (delta < -Math.PI) {
        delta += 2 * Math.PI;
    }

    rot += delta;
    const elapsed = (time - lt) / 1000;
    if (elapsed > 0) {
        vel = vel * 0.6 + delta / elapsed * 0.4;
    }
    la = angle;
    lt = time;
    scheduleFrame();
});

const end = () => {
    if (!drag) {
        return;
    }

    drag = false;
    ring.classList.remove("drag");
    if (performance.now() - lt > 90) {
        vel = 0;
    }
    vel = clamp(vel, 14);
    scheduleFrame();
};

ring.addEventListener("pointerup", end);
ring.addEventListener("pointercancel", end);

addEventListener("wheel", event => {
    if (event.ctrlKey) {
        return;
    }

    hapticsReady = true;
    event.preventDefault();
    vel = clamp(vel + (event.deltaY + event.deltaX) * 0.008, 14);
    scheduleFrame();
}, { passive: false });

ring.addEventListener("keydown", event => {
    const direction = {
        ArrowRight: 1,
        ArrowDown: 1,
        ArrowLeft: -1,
        ArrowUp: -1,
    }[event.key];

    if (direction) {
        event.preventDefault();
        hapticsReady = true;
        step(direction);
    }
});

document.addEventListener("click", event => {
    if (isOpen()) {
        return setOpen(false);
    }
    if (mq.matches && event.target === pv) {
        setOpen(true);
    }
});

pv.addEventListener("keydown", event => {
    if (mq.matches && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        setOpen(!isOpen());
    }
});

addEventListener("keydown", event => {
    if (event.key === "Escape" && isOpen()) {
        setOpen(false);
    }
});

/* animation */
let last = performance.now();
let frameId = 0;

function scheduleFrame() {
    if (!frameId) {
        frameId = requestAnimationFrame(frame);
    }
}

function frame(time) {
    frameId = 0;
    const elapsed = Math.min(0.05, (time - last) / 1000);
    last = time;

    if (!drag) {
        rot += vel * elapsed;
        vel *= Math.exp(-(REDUCE.matches ? 14 : FRICTION) * elapsed);
        if (Math.abs(vel) < 0.0005) {
            vel = 0;
        }
    }

    place();
    if (!drag && vel !== 0) {
        scheduleFrame();
    }
}

/* startup */
addEventListener("resize", () => {
    layout();
    place();
});

layout();
place();
requestAnimationFrame(loadRemainingImages);

const initialImage = items[Math.max(cur, 0)].im;
const initialReady = initialImage.complete
    ? Promise.resolve()
    : initialImage.decode
        ? initialImage.decode().catch(() => {})
        : new Promise(resolve => {
            initialImage.addEventListener("load", resolve, { once: true });
            initialImage.addEventListener("error", resolve, { once: true });
        });

Promise.race([
    initialReady,
    new Promise(resolve => setTimeout(resolve, 2500)),
]).then(() => requestAnimationFrame(() => {
    body.classList.add("ready");
    ready = true;
    announce();
}));
