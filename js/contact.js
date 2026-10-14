"use strict";

const CONTACT_ENDPOINT = "https://formspree.io/f/mwvnpvpv";
const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");

contactForm.addEventListener("submit", async event => {
  event.preventDefault();
  formStatus.textContent = "";

  if (!contactForm.reportValidity()) return;
  if (!CONTACT_ENDPOINT) {
    formStatus.textContent = "This form is not connected yet. Please check back soon.";
    return;
  }

  const submitButton = contactForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  formStatus.textContent = "Sending…";

  try {
    const response = await fetch(CONTACT_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(contactForm),
    });
    if (!response.ok) throw new Error(`Contact service returned ${response.status}.`);
    contactForm.reset();
    formStatus.textContent = "Thanks — your message has been sent.";
  } catch (error) {
    console.error("Unable to send contact form.", error);
    formStatus.textContent = "Your message could not be sent. Please try again later.";
  } finally {
    submitButton.disabled = false;
  }
});
