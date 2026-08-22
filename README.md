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

The newsletter controls open a pre-addressed email draft to `emily@renewed.rest`. Emily manually adds each submitted address to the newsletter BCC list.

The free-guide form posts to the first-party Vercel Function at `/api/guide-signup`, which emails Emily before returning access to the guide. Configure these encrypted Vercel environment variables:

- `SMTP_USER`: Emily's complete Google Workspace email address.
- `SMTP_APP_PASSWORD`: a dedicated Google app password, never her regular password.
- `GUIDE_NOTIFICATION_EMAIL`: optional destination override; defaults to `SMTP_USER`.
