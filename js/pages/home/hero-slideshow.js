let isInitialLoad = true;

// hero image & overlay
const imageElement = document.getElementById("hero-image");
const overlay = document.querySelector(".tech-overlay");
const ring = document.querySelector(".ring-progress");
const loadingRingEl = document.querySelector(".loading-ring");

// collection link & nav buttons
const linkEl = document.getElementById("square-link");
const squarePrevBtn = document.getElementById("square-prev");
const squareNextBtn = document.getElementById("square-next");

// state
let currentCollectionIndex = 0;
let currentImageIndex = 0;
const duration = 9000;
let slideshowInterval = null;
let isTransitioning = false;
let activeTransitionId = 0;
let textTimeoutId = null;
let indexTimeoutId = null;
let imageTimeoutId = null;
let linkTimeoutId = null;

function beginTransition() {
    isTransitioning = true;
    activeTransitionId += 1;
    return activeTransitionId;
}

function endTransition(transitionId) {
    if (transitionId === activeTransitionId) {
        isTransitioning = false;
    }
}

// ------------ collections data ------------
const collections = [
    {
        file: "evanoraunlimited",
        name: "[ view collection :: evanora unlimited ]",
        images: [
            "./assets/images/collections/evanora-unlimited/evanora-unlimited-1-c.jpg",
            "./assets/images/collections/evanora-unlimited/evanora-unlimited-3-c.jpg",
            "./assets/images/collections/evanora-unlimited/evanora-unlimited-5-c.jpg"
        ],
        texts: [
            [ "Evanora Unlimited is a multi-medium project from Oakland artist Orion Ohana, built around music, film, fashion, illustration and performance art", "Raised on the underground rave scene from infancy with both parents DJs, Ohana has spent years in the scene internationally, building a body of work that resists categorization" ],
            [ "The Montreal show at Société des Arts Technologiques was a co-headlining night alongside Elias Rønnenfelt, with John FM also on the bill", "The set pulled from Evanora and Marjorie W.C. Sinclair, his rap-oriented side alias, for a focused hybrid performance" ],
            [ "Crowd interaction ran through the whole show and fan favourites like Dibiyu brought the room together", "This series showcases the ritualized intensity of the performance, accentuating Evanora Unlimited's style and the emotional resonance of each moment" ]
        ]
    },
    {
        file: "mechatok",
        name: "[ view collection :: mechatok ]",
        images: [
            "./assets/images/collections/mechatok/mechatok-1-c.jpg",
            "./assets/images/collections/mechatok/mechatok-4-c.jpg",
            "./assets/images/collections/mechatok/mechatok-6-c.jpg"
        ],
        texts: [
            [ "Munich-born producer Mechatok brought his Wide Awake tour to Bar Le Ritz PDB for a focused, high-energy show at one of Montreal's most beloved live venues", "Mechatok has shaped his sound through years of collaboration with Drain Gang and through Natural Mind, his London-based event series connecting electronic pop, club music and the artists around it" ],
            [ "Wide Awake, his debut solo album released in August 2025, expands on Mechatok's sound through polished dance-pop and trance-influenced rhythms", "The set moved through glossy textures, bright melodic sections and the melancholic euphoria that runs through his solo and collaborative work" ],
            [ "The night also featured an appearance from Isabella Lovestory, the Montreal-based neoperreo artist who joined him onstage to perform \"She's a Director\", one of Wide Awake's featured collaborations", "Saturated light, dynamic text-heavy visuals and the album's vivid live presentation shaped this collection" ]
        ]
    },
    {
        file: "17sport",
        name: "[ view collection :: 17sport ]",
        images: [
            "./assets/images/collections/17sport/17sport-3-c.jpg",
            "./assets/images/collections/17sport/17sport-1-c.jpg",
            "./assets/images/collections/17sport/17sport-6-c.jpg"
        ],
        texts: [
            [ "17sport is a Montreal duo composed of Iris Lou Dune and Del Renee Vise, two bilingual multidisciplinary artists who formed the project in 2024", "Working as musicians and producers, they build songs in GarageBand with distortion, sound transformation and a raw DIY approach at the center of their process" ],
            [ "17sport acts as the duo's main artistic outlet, bringing together music, photography, performance, film, fashion and design inside the same world", "Their sound layers soaring vocals with jagged synth lines and heavy bass, travelling through uncertainty, hope and the pursuit of freedom" ],
            [ "There is tension in their work between tenderness and rage, drawing from an experimental electronic lineage that recalls Ladytron, ear, Bassvictim and Katiejane Garside", "This collection captures 17sport performing at Rainbow Bistro in Ottawa as they move toward a second album, with new singles already arriving in the lead-up" ]
        ]
    },
    {
        file: "malibu", 
        name: "[ view collection :: malibu ]",
        images: [
            "./assets/images/collections/malibu/malibu-3.jpg",
            "./assets/images/collections/malibu/malibu-c-2.jpg",
            "./assets/images/collections/malibu/malibu-6.jpg"
        ],
        texts: [
            [ "French ambient composer and vocalist Malibu is known for her immersive electronic soundscapes and cinematic live performances", "Her debut album Vanities, released in 2025 on the Stockholm label YEAR0001, features thirteen ambient compositions blending wordless vocals and drifting synth textures" ],
            [ "The 2026 show took place at Society for Arts and Technology in Montreal and included supporting performances from ESP, Isla Den, and s1obhan", "Their performances moved between ambient textures, distorted pop structures and original music" ],
            [ "Every photo in this series reflects the meditative atmosphere of the main performance", "Soft light, drifting textures, and the emotional weight that filled the room" ]
        ]
    },
    {
        file: "bassvictim",
        name: "[ view collection :: bassvictim ]",
        images: [
            "./assets/images/collections/bassvictim/bassvictim-1.jpg",
            "./assets/images/collections/bassvictim/bassvictim-2-c.jpg",
            "./assets/images/collections/bassvictim/bassvictim-6.jpg"
        ],
        texts: [
            [ "Bassvictim is a London-based electronic music duo made up of vocalist and songwriter Maria Manow and producer Ike Clateman", "They first connected in Berlin in 2022 and later solidified their collaboration in South London, outside the club Peckham Audio" ],
            [ "Their music blends elements of electronic, electroclash, and bass-driven productions", "Since releasing their first single in 2023, they've built a presence in underground electronic scenes with energetic live performances and subsequent releases" ],
            [ "This photo collection focuses on the 2025 Bassvictim show, live at Bar Le Ritz PDB", "Every photo has been carefully edited to capture the weight of the bass, the flicker of the stage lights, and the energy of the crowd" ]
        ]
    }
];

// ------------ progress ring ------------
function startProgress() {
    ring.style.transition = "none";
    ring.style.strokeDashoffset = "100";
    ring.getBoundingClientRect(); // force reflow
    ring.style.transition = `stroke-dashoffset ${duration}ms linear`;
    ring.style.strokeDashoffset = "0";
}

function updateLoadingRingVisibility() {
    if (!loadingRingEl) return;

    const textSets = collections[currentCollectionIndex].texts || [];
    loadingRingEl.style.display = textSets.length <= 1 ? "none" : "flex";
}

// ------------ text update ------------
const paragraphEl = document.getElementById("info-text"); 
const paragraphIndexEl = document.getElementById("info-index");

function updateParagraphIndex(transitionId = activeTransitionId) {
    if (!paragraphIndexEl) return;

    const textSets = collections[currentCollectionIndex].texts || [];
    const nextIndexText = textSets.length <= 1
        ? ""
        : `${Math.min(currentImageIndex, textSets.length - 1) + 1}`;

    if (paragraphIndexEl.textContent === nextIndexText) return;

    paragraphIndexEl.classList.add("fade-out");
    if (indexTimeoutId) clearTimeout(indexTimeoutId);
    indexTimeoutId = setTimeout(() => {
        if (transitionId !== activeTransitionId) return;
        paragraphIndexEl.textContent = nextIndexText;
        paragraphIndexEl.classList.remove("fade-out");
    }, 600);
}

function updateText(transitionId = activeTransitionId) {
    updateParagraphIndex(transitionId);

    const textSets = collections[currentCollectionIndex].texts || [];
    const textIndex = textSets.length > 0
        ? Math.min(currentImageIndex, textSets.length - 1)
        : 0;
    const paragraphs = textSets[textIndex] || [];
    const nextHtml = paragraphs.map(p => `<p>${p}</p>`).join("");

    if (paragraphEl.innerHTML === nextHtml) return;

    paragraphEl.classList.add("fade-out");
    if (textTimeoutId) clearTimeout(textTimeoutId);
    textTimeoutId = setTimeout(() => {
        if (transitionId !== activeTransitionId) return;
        paragraphEl.innerHTML = nextHtml;
        paragraphEl.classList.remove("fade-out");
    }, 600);
}

// ------------ show next image ------------
function showNextImage() {
    if (isTransitioning) return;
    const transitionId = beginTransition();
    const images = collections[currentCollectionIndex].images;
    overlay.style.opacity = "0.6";
    imageElement.classList.add("fade-out");

    if (imageTimeoutId) clearTimeout(imageTimeoutId);
    imageTimeoutId = setTimeout(() => {
        if (transitionId !== activeTransitionId) return;
        currentImageIndex = (currentImageIndex + 1) % images.length;
        imageElement.src = images[currentImageIndex];
        imageElement.classList.remove("fade-out");
        overlay.style.opacity = "0";
        startProgress();
        updateText(transitionId);
        endTransition(transitionId);
    }, 700);
}

// ------------ square nav link ------------
function updateLink(transitionId = activeTransitionId) {
    linkEl.classList.add("fade-out");
    if (linkTimeoutId) clearTimeout(linkTimeoutId);
    linkTimeoutId = setTimeout(() => {
        if (transitionId !== activeTransitionId) return;
        const col = collections[currentCollectionIndex];
        linkEl.innerHTML = `<a href="./collections/${col.file}.html">${col.name}</a>`;
        linkEl.classList.remove("fade-out");
    }, 300);
}

// ------------ switch collection ------------
function switchCollection(index) {
    if (isTransitioning) return;
    const transitionId = beginTransition();
    currentCollectionIndex = index;
    currentImageIndex = 0;

    if (!isInitialLoad) {
        overlay.style.opacity = "0.6";
        imageElement.classList.add("fade-out");
    }

    if (imageTimeoutId) clearTimeout(imageTimeoutId);
    imageTimeoutId = setTimeout(() => {
        if (transitionId !== activeTransitionId) return;
        imageElement.src = collections[currentCollectionIndex].images[0];
        imageElement.classList.remove("fade-out");
        overlay.style.opacity = "0";
        updateLoadingRingVisibility();
        startProgress();
        endTransition(transitionId);
    }, isInitialLoad ? 0 : 300);

    updateLink(transitionId);
    updateText(transitionId);

    clearInterval(slideshowInterval);
    slideshowInterval = setInterval(showNextImage, duration);

    isInitialLoad = false;
}

// ------------ square nav buttons ------------
squarePrevBtn.addEventListener("click", () => {
    const newIndex = (currentCollectionIndex - 1 + collections.length) % collections.length;
    switchCollection(newIndex);
});

squareNextBtn.addEventListener("click", () => {
    const newIndex = (currentCollectionIndex + 1) % collections.length;
    switchCollection(newIndex);
});

// ------------ initialize ------------
switchCollection(0);

// ------------ hero border click ------------
const heroBorder = document.querySelector(".hero-border");
heroBorder.style.cursor = "pointer";
heroBorder.addEventListener("click", () => {
    const col = collections[currentCollectionIndex];
    window.location.href = `./collections/${col.file}.html`;
});
