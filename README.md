# Renewed Rest

Static marketing site for [Renewed Rest](https://www.renewed.rest), a pediatric sleep-consulting practice.

## Local preview

Run `python -m http.server 8000`, then open `http://localhost:8000`.

## Content and deployment

- Shared design tokens and components live in `brand.css` and `main.js`.
- Pages are plain HTML and deploy automatically through Vercel from `main`.
- Optimize photos before committing them and prefer WebP or AVIF for new assets.
- The downloadable guide is intentionally marked `noindex`; access control must be handled by the sales/delivery platform.

## Forms

The current newsletter controls open an email draft. Connect them to the chosen mailing-list provider before treating them as automated subscriptions.
