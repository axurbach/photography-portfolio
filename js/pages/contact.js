// ------------ contact form submission - formspree.io ------------
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('.contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');

            const name = nameInput?.value.trim() || '';
            const email = emailInput?.value.trim() || '';
            const message = messageInput?.value.trim() || '';

            if (!name || !email || !message) {
                alert('please fill in all fields.');
                return;
            }

            const formData = new FormData(contactForm);

            try {
                const response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: formData,
                    headers: {
                        Accept: 'application/json'
                    }
                });

                if (response.ok) {
                    alert(`thanks, ${name}! your message has been sent.`);
                    contactForm.reset();
                } else {
                    alert('oops! there was a problem submitting your message.');
                }
            } catch (error) {
                alert('oops! network error. please try again.');
            }
        });
    }

    // ------------ contact nav carousel ------------
    const links = [
        { label: 'email', value: 'axurbach@gmail.com', href: 'mailto:axurbach@gmail.com' },
        { label: 'instagram', value: '@17099450a', href: 'https://instagram.com/17099450a' }
    ];

    let current = 0;
    const linkEl = document.getElementById('contact-link');
    const prevBtn = document.getElementById('contact-prev');
    const nextBtn = document.getElementById('contact-next');

    function updateLink(index) {
        if (!linkEl) return;

        linkEl.classList.add('fade-out');

        setTimeout(() => {
            linkEl.textContent = `${links[index].label} :: `;

            const anchor = document.createElement('a');
            anchor.href = links[index].href;
            anchor.textContent = links[index].value;

            if (links[index].href.startsWith('http')) {
                anchor.target = '_blank';
                anchor.rel = 'noopener noreferrer';
            }

            linkEl.appendChild(anchor);
            linkEl.classList.remove('fade-out');
        }, 500);
    }

    prevBtn?.addEventListener('click', () => {
        current = (current - 1 + links.length) % links.length;
        updateLink(current);
    });

    nextBtn?.addEventListener('click', () => {
        current = (current + 1) % links.length;
        updateLink(current);
    });
});
