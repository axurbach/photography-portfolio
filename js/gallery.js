/* Photography portfolio gallery. To change photos, edit js/images.js (not this file). */
"use strict";

/* ---- Design constants (reference size = the approved design at full size) ---- */
const CIRCLE = 520;              /* circle diameter, px */
const PREVIEW_H = 629;           /* preview max height, px (3:4 frame) */
const PREVIEW_W = PREVIEW_H * 3 / 4;
const OVERLAP = .85;             /* below 1 = neighbours always overlap, no gaps */
const FRICTION = 2.4;            /* higher = momentum dies sooner */

const $ = s => document.querySelector(s), rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, m) => Math.max(-m, Math.min(m, v));
const mq = matchMedia("(max-width:768px),(max-aspect-ratio:4/5)");   /* mobile layout */
const REDUCE = matchMedia("(prefers-reduced-motion:reduce)");
const body = document.body, ring = $(".ring"), pv = $(".pv img"), tick = $(".tick"), nav = $("#nav"), liveEl = $("#status"), artistEl = $("#artist");

/* ---- Placeholders (only used while images.js is empty) ---- */
function ph(i) {
  const sz = [[800, 1000], [1000, 700], [700, 1000], [900, 900], [1000, 800]][Math.random() * 5 | 0];
  const pal = [["#8fa6b3", "#0c1216"], ["#f2f2f2", "#6b6b73"], ["#d8a7b1", "#2a1a22"], ["#e9f4ff", "#0a0a0a"], ["#9a9aa5", "#111"], ["#5f8f8a", "#06100f"]][Math.random() * 6 | 0];
  const n = String(i + 1).padStart(2, "0");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz[0]}" height="${sz[1]}" viewBox="0 0 ${sz[0]} ${sz[1]}"><defs><radialGradient id="g" cx="${Math.random().toFixed(2)}" cy="${Math.random().toFixed(2)}" r=".9"><stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="40" y="${sz[1] - 40}" font-family="Helvetica,Arial,sans-serif" font-size="56" fill="#fff" fill-opacity=".75">${n}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

/* ---- Build items. Order, size and frame shape are randomised on every load ---- */
const list = (IMAGES.length ? IMAGES : Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => ({ src: ph(i), alt: "Placeholder image " + (i + 1) })))
  .map((e, i) => typeof e === "string" ? { src: e, alt: "Photograph " + (i + 1), artist: "" } : { src: e.src, alt: e.alt || "Photograph " + (i + 1), artist: e.artist || "" });
const AR = [.72, .8, 1, 1.25, 1.5];
const items = list.map(e => ({ s: e.src, alt: e.alt, artist: e.artist, k: rnd(.82, 1.18), ar: AR[Math.random() * AR.length | 0] })).sort(() => Math.random() - .5);

items.forEach((o, i) => {
  const d = document.createElement("div"); d.className = "it"; d.style.transitionDelay = i * 70 + "ms";
  d.setAttribute("aria-hidden", "true");           /* decorative: the big preview + live region describe the photo */
  const im = new Image();
  im.onload = () => { o.nw = im.naturalWidth; o.nh = im.naturalHeight; if (items[cur] === o) sizePreview(); };
  im.src = o.s; im.alt = ""; im.draggable = false; d.appendChild(im); ring.appendChild(d);
  o.el = d; o.im = im; o.nw = 4; o.nh = 5;
});

let R = 0, r = 0, tx = 0, ty = 0, rot = rnd(0, 6.28), vel = 0, drag = false, la = 0, lt = 0, cur = -1, displayed = -1, pendingPreview = -1, ready = false, hapticsReady = false, said;

/* One shared scale drives BOTH circle and preview so their proportions never change.
   It only ever shrinks, to fit smaller screens. */
function scale() {
  const pb = pv.parentElement.getBoundingClientRect(), rc = ring.parentElement.getBoundingClientRect();
  return Math.min(1, pb.width * .7 / PREVIEW_W, rc.width * .9 / CIRCLE, innerHeight * .62 / PREVIEW_H, innerHeight * .7 / CIRCLE);
}

function layout() {
  const mobile = mq.matches, rc = ring.parentElement.getBoundingClientRect();
  const D = Math.max(200, mobile ? Math.min(660, rc.width - 32, innerHeight * .5) : CIRCLE * scale());
  R = D / 2; ring.style.width = ring.style.height = D + "px";
  const n = items.length;
  items.forEach(o => { o.u = Math.min(Math.sqrt(o.ar), 1 / Math.sqrt(o.ar)) * o.k; });
  let C = 0; items.forEach((o, i) => { C += OVERLAP * (o.u + items[(i + 1) % n].u) / 2; });
  let mu = 0; items.forEach(o => { mu = Math.max(mu, o.k * Math.sqrt(o.ar), o.k / Math.sqrt(o.ar)); });
  r = R / (1 + Math.PI * mu / C);                 /* outer edge of the biggest image touches the border */
  const b = 2 * Math.PI * r / C; let pos = 0;
  items.forEach((o, i) => {
    const a = b * o.k; o.w = a * Math.sqrt(o.ar); o.h = a / Math.sqrt(o.ar); o.a = pos / r;
    pos += OVERLAP * (o.u + items[(i + 1) % n].u) / 2 * b;
    o.el.style.width = o.w + "px"; o.el.style.height = o.h + "px";
  });
  const off = R * .04;
  if (mobile) { tx = R; ty = R - (r - off); } else { tx = R - (r + off); ty = R; }
  syncMode(); sizePreview();
}

function sizePreview() {
  const o = items[Math.max(cur, 0)];
  const dpr = devicePixelRatio || 1, hair = dpr >= 1 ? 1 / dpr : 1, sn = v => Math.round(v * dpr) / dpr;   /* hairline = 1 device pixel */
  if (mq.matches) {                                /* mobile: vertical hairline from the circle centre */
    pv.style.width = pv.style.height = "";
    const q = ring.getBoundingClientRect();
    Object.assign(tick.style, { left: sn(q.left + R) - q.left + "px", top: sn(q.top + ty) - q.top + "px", width: hair + "px", height: R - ty + "px" });
    return;
  }
  const pb = pv.parentElement.getBoundingClientRect(), rb = ring.getBoundingClientRect();
  const ar = o.nw / o.nh, Wm = PREVIEW_W * scale();
  const w = Wm, h = w / Math.max(ar, 3 / 4);       /* fixed 3:4 width; taller photos are cropped by CSS */
  pv.style.width = w + "px"; pv.style.height = h + "px";
  const S = rb.left + tx - (pb.left + pb.width / 2 + w / 2);          /* room between preview and ticker tip */
  const L = Math.max(R * .12, Math.min(R * .8, S * 2 / 3));            /* gap is always half the line length */
  Object.assign(tick.style, { left: sn(rb.left + tx - L) - rb.left + "px", top: sn(rb.top + ty) - rb.top + "px", width: sn(L) + "px", height: hair + "px" });
}

function showPreview(k) {
  if (k === displayed || k === pendingPreview) return;
  pendingPreview = k;
  const im = items[k].im;
  const update = () => {
    if (pendingPreview !== k) return;
    pendingPreview = -1;
    if (k !== cur) return;
    pv.src = im.src; pv.alt = items[k].alt; displayed = k; label(); sizePreview();
  };
  if (im.decode) im.decode().then(update, update);
  else { im.onload = update; im.onerror = update; }
}

function place() {
  let best = 0, bd = 1e12, hit = -1, hd = 1e12;
  items.forEach((o, i) => {
    const a = o.a + rot, x = R + r * Math.cos(a), y = R + r * Math.sin(a);
    o.el.style.transform = `translate3d(${x - o.w / 2}px,${y - o.h / 2}px,0)`;   /* never rotated: images stay upright */
    const dx = tx - x, dy = ty - y, d = dx * dx + dy * dy;
    if (Math.abs(dx) <= o.w / 2 && Math.abs(dy) <= o.h / 2 && d < hd) { hd = d; hit = i; }
    if (d < bd) { bd = d; best = i; }
  });
  const k = hit >= 0 ? hit : best;
  if (k !== cur) {                                 /* static swap, no fade */
    cur = k; artistEl.textContent = items[k].artist; artistEl.hidden = !items[k].artist; label(); announce(); showPreview(k);
    if (mq.matches && hapticsReady && navigator.userActivation?.hasBeenActive && typeof navigator.vibrate === "function") navigator.vibrate(10);
  }
}

/* ---- Accessibility helpers ---- */
function announce() {                              /* tell screen readers once the circle settles */
  clearTimeout(said);
  said = setTimeout(() => { if (ready) liveEl.textContent = `${items[cur].alt} (${cur + 1} of ${items.length})`; }, 600);
}
function isOpen() { return body.classList.contains("open"); }
function label() {
  if (mq.matches) pv.setAttribute("aria-label", items[Math.max(cur, 0)].alt + (isOpen() ? ". Activate or press Escape to close." : ". Activate to enlarge."));
  else pv.removeAttribute("aria-label");
}
function setOpen(v) {
  body.classList.toggle("open", v); pv.setAttribute("aria-expanded", v);
  ring.inert = nav.inert = v; label(); if (v) pv.focus();
}
function syncMode() {                              /* on mobile the preview behaves as a button */
  if (mq.matches) { pv.setAttribute("role", "button"); pv.tabIndex = 0; pv.setAttribute("aria-expanded", isOpen()); }
  else { pv.removeAttribute("role"); pv.removeAttribute("tabindex"); pv.removeAttribute("aria-expanded"); if (isOpen()) setOpen(false); }
  label();
}
function step(d) {                                 /* keyboard: next / previous photo */
  if (!REDUCE.matches) { vel = clamp(vel + 1.5 * d, 14); scheduleFrame(); return; }
  const k = (cur + d + items.length) % items.length, tgt = mq.matches ? -Math.PI / 2 : Math.PI;
  const da = tgt - (items[k].a + rot); rot += Math.atan2(Math.sin(da), Math.cos(da));   /* jump, no spinning */
  scheduleFrame();
}

/* ---- Input: drag is angular, like turning a bearing ---- */
const ang = e => { const b = ring.getBoundingClientRect(); return Math.atan2(e.clientY - b.top - R, e.clientX - b.left - R); };
ring.addEventListener("pointerdown", e => { hapticsReady = true; drag = true; ring.setPointerCapture(e.pointerId); ring.classList.add("drag"); la = ang(e); lt = performance.now(); vel = 0; });
ring.addEventListener("pointermove", e => {
  if (!drag) return;
  const a = ang(e), t = performance.now(); let da = a - la;
  if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
  rot += da; const dt = (t - lt) / 1000; if (dt > 0) vel = vel * .6 + da / dt * .4; la = a; lt = t; scheduleFrame();
});
const end = () => { if (!drag) return; drag = false; ring.classList.remove("drag"); if (performance.now() - lt > 90) vel = 0; vel = clamp(vel, 14); scheduleFrame(); };
ring.addEventListener("pointerup", end); ring.addEventListener("pointercancel", end);
addEventListener("wheel", e => { if (e.ctrlKey) return; hapticsReady = true; e.preventDefault(); vel = clamp(vel + (e.deltaY + e.deltaX) * .008, 14); scheduleFrame(); }, { passive: false });   /* ctrl+wheel (browser zoom) is left alone */
ring.addEventListener("keydown", e => {
  const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (d) { e.preventDefault(); hapticsReady = true; step(d); }
});

/* Mobile: tap preview to enlarge, tap anywhere to close. Enter/Space work too, Escape closes. */
document.addEventListener("click", e => {
  if (isOpen()) return setOpen(false);
  if (mq.matches && e.target === pv) setOpen(true);
});
pv.addEventListener("keydown", e => {
  if (mq.matches && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setOpen(!isOpen()); }
});
addEventListener("keydown", e => { if (e.key === "Escape" && isOpen()) setOpen(false); });

/* ---- Loop and start ---- */
let last = performance.now();
let frameId = 0;
function scheduleFrame() {
  if (!frameId) frameId = requestAnimationFrame(frame);
}
function frame(t) {
  frameId = 0;
  const dt = Math.min(.05, (t - last) / 1000); last = t;
  if (!drag) { rot += vel * dt; vel *= Math.exp(-(REDUCE.matches ? 14 : FRICTION) * dt); if (Math.abs(vel) < .0005) vel = 0; }
  place();
  if (!drag && vel !== 0) scheduleFrame();
}
addEventListener("resize", () => { layout(); place(); });
layout(); place();
const waits = [...ring.querySelectorAll("img"), pv].map(im => im.decode ? im.decode().catch(() => {}) : 0);
Promise.race([Promise.all(waits), new Promise(r => setTimeout(r, 2500))]).then(() => requestAnimationFrame(() => { body.classList.add("ready"); ready = true; announce(); }));
