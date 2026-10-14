"use strict";

const menuToggle = document.querySelector("#menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const menuClose = document.querySelector("#menu-close");
const mobileQuery = matchMedia("(max-width:768px),(max-aspect-ratio:4/5)");

function closeMenu() {
  if (!mobileMenu.open) return;
  mobileMenu.close();
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open menu");
}

menuToggle.addEventListener("click", () => {
  mobileMenu.showModal();
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "Close menu");
});

menuClose.addEventListener("click", closeMenu);
mobileMenu.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
mobileMenu.addEventListener("close", () => {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open menu");
});
mobileQuery.addEventListener("change", event => {
  if (!event.matches) closeMenu();
});
