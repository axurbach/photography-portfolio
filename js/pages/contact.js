
// ------------ contact form submission - formspree.io ------------

const contactForm = document.querySelector('.contact-form');

contactForm.addEventListener('submit', async function(e) {
    e.preventDefault(); // prevent page reload

    // Get values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    // Basic validation
    if (!name || !email || !message) {
        alert('Please fill in all fields.');
        return;
    }

    // Prepare FormData
    const formData = new FormData(contactForm);

    try {
        const response = await fetch(contactForm.action, {
            method: contactForm.method,
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            // Success: show message and reset form
            alert(`Thanks, ${name}! Your message has been sent.`);
            contactForm.reset();
        } else {
            // Server error
            alert('Oops! There was a problem submitting your message.');
        }
    } catch (error) {
        // Network error
        alert('Oops! Network error. Please try again.');
    }
});

// ------------ contact nav carousel ------------

const links = [
    { text: "email :: axurbach@gmail.com", href: "mailto:axurbach@gmail.com" },
    // { text: "linkedin :: linkedin.com/in/username", href: "https://linkedin.com/in/username" },
    { text: "instagram :: @17099450a", href: "https://instagram.com/17099450a" }
];

let current = 0;
const linkEl = document.getElementById('contact-link');
const prevBtn = document.getElementById('contact-prev');
const nextBtn = document.getElementById('contact-next');

function updateLink(index) {
    // Fade out
    linkEl.classList.add('fade-out');

    setTimeout(() => {
        // Update text and href
        linkEl.innerHTML = links[index].text.replace(/:: (.+)/, `:: <a href="${links[index].href}" target="_blank">$1</a>`);
        // Fade back in
        linkEl.classList.remove('fade-out');
    }, 500); // match transition duration
}

prevBtn.addEventListener('click', () => {
    current = (current - 1 + links.length) % links.length;
    updateLink(current);
});

nextBtn.addEventListener('click', () => {
    current = (current + 1) % links.length;
    updateLink(current);
});
