# 17099450a

Concert photography portfolio by Alexander Urbach, showcasing live music from Ottawa, Montreal, and Toronto.

## About

Personal photography portfolio featuring concert collections with an immersive, interactive gallery experience. Built with vanilla HTML, CSS, and JavaScript—no frameworks or dependencies.

## Features

- **Responsive Design** - Mobile-first approach with adaptive layouts for all screen sizes
- **Interactive Galleries** - Touch-enabled image carousels with kinetic scrolling and momentum
- **Lightbox Viewer** - Full-screen image viewer with smooth transitions
- **Collection Navigation** - Seamless browsing between photography collections
- **Contact Form** - Integrated form for inquiries and bookings
- **Professional SEO** - Complete meta tags for search engines and social sharing

## Tech Stack

- HTML5
- CSS3 (Custom Properties, Flexbox, Grid)
- JavaScript (Vanilla ES6+)
- No external dependencies

## File Structure

```
├── index.html              # Homepage with featured collection
├── about.html              # About page
├── contact.html            # Contact form
├── collections/            # Collection pages
│   ├── bassvictim.html
│   └── berlin56.html
├── css/
│   ├── base.css            # Base styles and typography
│   ├── layout.css          # Global layout and navigation
│   └── pages/              # Page-specific styles
├── js/
│   ├── core/               # Core utilities (nav, security)
│   └── pages/              # Page-specific scripts
├── assets/
│   ├── images/             # Photography and UI assets
│   └── fonts/              # Custom fonts
├── robots.txt              # Search engine directives
└── sitemap.xml             # SEO sitemap

```

## Local Development

Open `index.html` in a browser or use a local server:

### Python 3
```bash
python -m http.server 8000
```

### Node.js
```bash
npx serve
```

Then navigate to `http://localhost:8000`

## Deployment

1. Upload all files to your web server
2. Update Open Graph URLs in HTML `<head>` sections with your domain
3. Ensure absolute paths work correctly (all paths start with `/`)
4. Add favicons to `/assets/icons/` directory

### Favicon Checklist
Required files for `/assets/icons/`:
- `favicon.ico` (16x16 and 32x32)
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` (180x180)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS 12+)
- Chrome Mobile (Android)

## License

© 2026 Alexander Urbach. All rights reserved.

## Contact

For inquiries: [axurbach@gmail.com](mailto:axurbach@gmail.com)
