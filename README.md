# Alexander Urbach - Photography Portfolio

A rotating circle of photos with a ticker line. The photo the line touches is shown large on the left (on mobile, on top).

**Jump to:** [Quick start](#quick-start) | [Add or remove photos](#add-or-remove-photos) | [Contact page](#contact-page) | [SEO and social sharing](#seo-and-social-sharing) | [Analytics](#analytics-google-tag-manager) | [Change links](#change-the-nav-links) | [Tweak the design](#tweak-the-design) | [Mobile](#how-it-works-on-mobile) | [Accessibility](#accessibility) | [Go live checklist](#go-live-checklist) | [Troubleshooting](#troubleshooting)

---

## Quick start

1. Unzip the folder.
2. Double-click `index.html`. It opens in your browser, no server or install needed.
3. The portfolio already includes a photo list. Replace the entries in `js/images.js` with your own photos when ready.

```
portfolio/
  index.html        page structure (rarely needs editing)
  contact/index.html contact form structure (live URL: `/contact/`)
  css/style.css     all styling
  js/images.js     YOUR PHOTO LIST - the file you will edit most
  js/gallery.js     the circle, momentum, ticker, keyboard and mobile logic
  js/contact.js     contact form validation and delivery (Formspree)
  images/           put your photo files here
  icons/            favicon, app icons and web manifest
  sitemap.xml       pages listed for search engines
  robots.txt        search engine rules and sitemap link
  CNAME             keeps the custom domain on GitHub Pages
  README.md         this file
```

## Add or remove photos

1. Copy your photos into the `images/` folder (JPG, PNG or WebP).
2. Open `js/images.js` and list them, one line each:

```js
const IMAGES = [
  { src: "images/01.jpg", alt: "Singer in a long coat reaching toward the crowd" },
  { src: "images/02.jpg", alt: "Two pairs of white boots on a dark stage" },
];
```

3. Save and refresh. To remove a photo, delete its line.

- The circle re-spaces itself and resizes the photos so it always stays the same size and has no gaps. **10-20 photos works best.**
- Fewer than about 8 photos can leave gaps in the ring.
- `alt` is a short description for screen-reader users. Please fill it in for every photo.
- Order, sizes and frame shapes are shuffled on every page load, on purpose.
- Keep files reasonably small (about 300-600 KB each, around 1600px on the long side) so the page loads quickly.
- Photos taller than 3:4 are cropped to a 3:4 frame in the large preview, from the center. Keep the subject near the middle.

## Contact page

- The form has required name, email and message fields and sends through [Formspree](https://formspree.io). The endpoint is already set at the top of `js/contact.js` (`CONTACT_ENDPOINT`).
- Messages go to the email address set in your Formspree form settings. Spam rules, allowed domains and notifications are managed in the Formspree dashboard.
- Visitors see a status message under the form (sending, sent, or an error). Nothing pops up in an alert.
- Under the form is a direct email link (`axurbach@gmail.com`). To change it, edit the `contact-email` line in `contact/index.html`.
- Replace `images/contact.jpg` and its alt text in `contact/index.html` to use your own contact-page image.

## SEO and social sharing

Both pages carry the same set of tags in the `<head>`:

| What | Where to change it |
|---|---|
| Page title and description | `<title>` and `<meta name="description">` in each HTML file |
| Keywords and author | `<meta name="keywords">` and `<meta name="author">` |
| Link previews (Facebook, Instagram, iMessage, LinkedIn, Slack) | the `og:` tags |
| Link previews (X / Twitter) | the `twitter:` tags |
| Preview image | `og:image` and `twitter:image` (full `https://17099450a.com/images/...` URL, required by social sites) |
| Canonical URL | `<link rel="canonical">` |
| Structured data (name, job, Instagram) | the `application/ld+json` block in `index.html` |
| Favicons and home-screen icon | `icons/` folder, linked in each `<head>` |
| Search engine files | `sitemap.xml` and `robots.txt` |

If you add another page, add it to `sitemap.xml` and copy the `<head>` tags from `contact/index.html`.

## Analytics (Google Tag Manager)

Google Tag Manager container `GTM-MWJ2LZ3M` is installed on both pages (script at the top of `<head>`, noscript right after `<body>`). It is the same container the old site used, so your existing tags and reports carry over. To use a different container, search for `GTM-MWJ2LZ3M` and replace it in `index.html` and `contact/index.html`.

## Change the nav links

The Contact link points to `/contact/`. The homepage is served at `/` (from `index.html`). Email lives on the contact page. The `17099450a` links open the Instagram profile in `index.html` and `contact/index.html`:

| Link | Example |
|---|---|
| Contact | `href="contact/"` |
| 17099450a | `href="https://www.instagram.com/17099450a/"` |

## Tweak the design

Sizes are set at the top of `js/gallery.js`:

| Constant | What it does | Default |
|---|---|---|
| `CIRCLE` | Circle diameter at full size (px) | `520` |
| `PREVIEW_H` | Preview max height (px). Width is always 3:4 of this | `629` |
| `OVERLAP` | How much neighbouring photos overlap. Keep below `1` or gaps can appear | `.85` |
| `FRICTION` | Momentum. Higher stops sooner | `2.4` |

- **Circle vs preview:** both are scaled together on smaller screens, so the proportions you approved stay the same. To make the circle smaller relative to the preview, lower `CIRCLE`.
- **Maximum page width:** `max-width:1470px` on `.stage` in `css/style.css`. On larger screens the whole composition stays this size and is centered.
- **Colors and fonts:** the top of `css/style.css` (`--bg` and `--fg`).

## How it works on mobile

The mobile layout is used on narrow screens (768px or less) and on portrait-shaped screens.

- The circle sits centered toward the bottom, with the preview above it.
- The ticker becomes a vertical line in the center of the circle, inside its border.
- Tap the preview to enlarge it. Tap anywhere to close and use the circle again.
- Drag around the circle to spin it. Phones give a tiny vibration on each tick where supported.

## Accessibility

Design is unchanged for mouse and touch users. Added:

- **Keyboard:** Tab to the gallery, then use the arrow keys to move to the next or previous photo. A thin outline shows where focus is. On mobile, Tab to the preview and press Enter or Space to enlarge, Escape to close.
- **Screen readers:** page landmarks and a heading, a "Skip to gallery" link (appears on Tab), a labelled gallery, the large photo's `alt` text, and a spoken update (for example "Photograph 3 of 14") once the circle stops. The photos inside the circle are hidden from screen readers so they are not read twice.
- **Reduced motion:** if the visitor's device asks for it, fades are removed, momentum is nearly off, and arrow keys jump directly to the next photo.
- **Touch targets:** nav links have a 44px+ tappable area without moving.
- **Zoom:** pinch and browser zoom (Ctrl + scroll) still work. Static text is not selectable; form fields remain editable.
- **High-contrast modes:** the ticker line follows the system text color.
- **Contrast:** black text on white.

## Go live checklist

1. **Back up the current site:** download or clone the currently published repository before replacing files. Keep this backup until the new site has been tested.
2. **Check the publishing target:** in the site's GitHub repository, open **Settings → Pages** and confirm which branch and folder are published. The files in this project must go directly in that published folder, not inside an extra `photography-portfolio-v4` folder.
3. **Check the custom domain:** keep the existing `CNAME` file at the publishing root; it should contain `17099450a.com`. Do not change DNS if the current site already uses this domain and the domain settings are correct.
4. **Check the contact form:** in Formspree, confirm the endpoint in `js/contact.js` is active, submissions notify the right email, and `17099450a.com` is allowed if domain restrictions are enabled.
5. **Publish the files:** replace the old site's files with the contents of this project at the publishing root. Keep `CNAME` and the `css/`, `icons/`, `images/`, `js/`, and `contact/` folders in their existing structure. Keep `contact.html`; it redirects visitors from the previous contact URL to `/contact/`.
6. **Wait for deployment:** in the repository's **Actions** tab, confirm the Pages deployment finishes successfully. If Pages is not already enabled, enable it under **Settings → Pages** using the branch and folder identified in step 2.
7. **Test the live site:** check `https://17099450a.com/`, `https://17099450a.com/contact/`, and `https://17099450a.com/contact.html` on desktop and mobile. Confirm images load, navigation works, and the old contact URL redirects.
8. **Test the form for real:** submit a test message from `/contact/` and verify it arrives. Check spam if needed.
9. **Check analytics:** in Google Tag Manager, use Preview with `https://17099450a.com` and confirm it connects on both pages.
10. **Handle old page URLs:** `/about.html` redirects to the homepage, and the custom `404.html` redirects missing `/collections/...` URLs to the homepage. Add explicit redirects for other old URLs you need to preserve before removing the old site.
11. **Update search engines:** submit `https://17099450a.com/sitemap.xml` in Google Search Console and request indexing for `/` and `/contact/`. Refresh social link previews if desired.
12. **Retire the old site only after verification:** keep the backup, and do not cancel the old hosting or change domain DNS until the replacement is confirmed live.

## Troubleshooting

| Problem | Fix |
|---|---|
| Still see placeholders | `IMAGES` in `js/images.js` is empty, or every line still starts with `//` |
| A photo is missing | Check the `src` path and capitalization (`images/Photo.JPG` is not `images/photo.jpg`) |
| Gaps in the circle | Add photos (aim for 10-20), or make sure `OVERLAP` is below `1` |
| Nothing moves | Make sure `js/images.js` loads before `js/gallery.js` in `index.html` |
| Changes do not show | Hard refresh (Ctrl/Cmd + Shift + R) |
