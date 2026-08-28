#!/usr/bin/env python3
"""Build crawlable article pages from the legacy single-page blog source."""

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BLOG = ROOT / "blog.html"
SOURCE_ARCHIVE = ROOT / "scripts" / "blog-posts-source.txt"

POSTS = {
    "false-starts": {
        "slug": "baby-false-starts.html",
        "title": "Baby False Starts: Why They Happen and What to Try",
        "description": "Learn why a baby may wake 30–45 minutes after bedtime and which schedule, environment, and sleep-association adjustments may help.",
    },
    "sleep-props": {
        "slug": "baby-sleep-props.html",
        "title": "Baby Sleep Props: Five Common Associations",
        "description": "Understand five common baby sleep props, how sleep associations develop, and practical ways to support more independent sleep skills.",
    },
    "co-sleeping": {
        "slug": "co-sleeping-or-independent-sleep.html",
        "title": "Co-Sleeping or Independent Sleep? Questions to Consider",
        "description": "Explore the practical differences between co-sleeping and independent sleep with compassionate guidance for choosing what fits your family.",
    },
    "not-just-babies": {
        "slug": "sleep-skills-for-children.html",
        "title": "Sleep Skill Building for Toddlers and Older Children",
        "description": "Sleep struggles are not limited to babies. Learn how consistent routines and age-appropriate support can help toddlers and older children.",
    },
    "five-ss": {
        "slug": "five-ss-newborn-soothing.html",
        "title": "The 5 S's for Soothing a Newborn",
        "description": "A practical introduction to the 5 S's newborn-soothing approach: swaddling, side or stomach hold, shushing, swinging, and sucking.",
    },
    "why-sleep-train": {
        "slug": "benefits-of-sleep-skill-building.html",
        "title": "Why Build Independent Sleep Skills?",
        "description": "Learn how age-appropriate sleep skill building may support more consistent rest for children and their families.",
    },
    "stay-calm": {
        "slug": "staying-calm-when-baby-cries.html",
        "title": "Seven Reasons to Stay Calm When Your Baby Cries",
        "description": "Practical encouragement for remaining calm when a baby cries and responding with greater patience, confidence, and connection.",
    },
    "favorites": {
        "slug": "favorite-baby-and-mom-products.html",
        "title": "Emily's Favorite Products for Babies and Moms",
        "description": "A mother of five shares her tried-and-true baby and postpartum product favorites, from sleep tools to everyday essentials.",
    },
    "why-i-stopped-saying-sleep-training": {
        "slug": "why-i-stopped-saying-sleep-training.html",
        "title": "Why I Stopped Saying Sleep Training",
        "description": "Emily Sweetman explains why she uses the term sleep skill building and what a supportive, family-centered approach means in practice.",
    },
}

PAGE_STYLE = """
    main { padding-top: var(--nav-h); }
    .article { max-width: 760px; margin: 0 auto; }
    .post-back { display: inline-flex; font-size: .9rem; font-weight: 600; color: var(--teal); margin-bottom: var(--sp8); }
    .post-tag { font-size: .75rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--rose); margin-bottom: var(--sp3); }
    .article h1 { font-family: var(--serif); font-size: clamp(2rem,4vw,3rem); color: var(--navy); line-height: 1.18; margin-bottom: var(--sp4); }
    .author-line { display: flex; align-items: center; gap: var(--sp3); color: var(--text-mid); margin-bottom: var(--sp8); }
    .author-line img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; object-position: center top; }
    .author-line strong { display: block; color: var(--navy); }
    .author-line span { display: block; font-size: .82rem; }
    .post-hero-img { border-radius: var(--r16); overflow: hidden; margin-bottom: var(--sp8); }
    .post-hero-img img { width: 100%; height: 360px; object-fit: cover; }
    .post-body h2 { font-family: var(--serif); font-size: 1.5rem; color: var(--navy); margin: var(--sp8) 0 var(--sp4); }
    .post-body h3 { font-size: 1.05rem; color: var(--navy); margin: var(--sp6) 0 var(--sp3); }
    .post-body p { font-size: 1rem; color: var(--text-mid); line-height: 1.8; margin-bottom: var(--sp5); }
    .post-body ul, .post-body ol { margin: 0 0 var(--sp5) var(--sp6); }
    .post-body li { color: var(--text-mid); line-height: 1.75; margin-bottom: var(--sp2); }
    .assessment-cta { background: var(--teal-light); border-radius: var(--r16); padding: var(--sp8); text-align: center; margin-top: var(--sp10); }
    .assessment-cta h2 { font-family: var(--serif); font-size: 1.55rem; color: var(--navy); margin-bottom: var(--sp3); }
    .assessment-cta p { color: var(--text-mid); max-width: 600px; margin: 0 auto var(--sp5); line-height: 1.7; }
    .assessment-details { display: flex; justify-content: center; flex-wrap: wrap; gap: var(--sp3) var(--sp5); margin-bottom: var(--sp6); color: var(--teal-dark); font-size: .88rem; font-weight: 600; }
    .article-note { border-left: 4px solid var(--teal); background: var(--off-white); padding: var(--sp4) var(--sp5); margin-top: var(--sp8); color: var(--text-mid); font-size: .9rem; line-height: 1.6; }
    @media (max-width: 640px) { .post-hero-img img { height: 220px; } }
"""


def extract(source: str, post_id: str) -> str:
    match = re.search(
        rf'<article class="post" id="post-{re.escape(post_id)}">(.*?)</article>',
        source,
        re.S,
    )
    if not match:
        raise RuntimeError(f"Missing article: {post_id}")
    body = match.group(1)
    body = re.sub(r'<div class="post-back"[^>]*>.*?</div>', '', body, count=1, flags=re.S)
    body = re.sub(r'<h1>.*?</h1>', '', body, count=1, flags=re.S)
    body = re.sub(r'<div class="post-cta">.*?</div>', '', body, count=1, flags=re.S)
    return body.strip()


def nav() -> str:
    return """<nav class="nav" id="mainNav"><div class="nav-inner">
  <a href="index.html" class="nav-logo" aria-label="Renewed Rest home"><img src="logo3-removebg-preview.png" alt="Renewed Rest" height="44"></a>
  <div class="nav-links"><a href="index.html">Home</a><a href="about.html">About</a><a href="packages.html">Packages</a><a href="sleep-guide.html">Digital Guide</a><a href="blog.html">Blog</a><a href="why-not-sleep-training.html">Why Not Sleep Training?</a><a href="contact.html">Contact</a><a href="contact.html" class="nav-cta-btn">Free Sleep Assessment</a></div>
  <button class="hamburger" onclick="toggleMenu()" aria-label="Open menu"><span></span><span></span><span></span></button>
</div></nav>
<div class="mobile-drawer" id="drawer"><button class="drawer-close" onclick="closeMenu()" aria-label="Close menu">✕</button><a href="index.html">Home</a><a href="about.html">About</a><a href="packages.html">Packages</a><a href="sleep-guide.html">Digital Guide</a><a href="blog.html">Blog</a><a href="why-not-sleep-training.html">Why Not Sleep Training?</a><a href="contact.html">Contact</a></div>
<div class="mobile-sticky-cta"><a href="contact.html">Free Sleep Assessment →</a></div>"""


def footer() -> str:
    return """<footer class="footer"><div class="wrap"><div class="footer-grid">
  <div><div class="footer-logo">Renewed Rest</div><p class="footer-tagline">Helping families find the rest they deserve.</p></div>
  <div class="footer-col"><h4>Quick Links</h4><ul><li><a href="index.html">Home</a></li><li><a href="about.html">About Emily</a></li><li><a href="packages.html">Packages</a></li><li><a href="blog.html">Blog</a></li><li><a href="contact.html">Contact</a></li></ul></div>
  <div class="footer-col"><h4>Contact</h4><ul><li><a href="mailto:emily@renewed.rest">emily@renewed.rest</a></li><li><a href="contact.html">Get a Free Sleep Assessment</a></li></ul></div>
  <div class="footer-col"><h4>Credentials</h4><p class="footer-tagline">Emily Sweetman<br>IPSP® Certified Sleep Consultant<br>Mother of five</p></div>
</div><div class="footer-bottom"><span>© 2026 Renewed Rest LLC.</span><div class="footer-badges"><span class="footer-badge">IPSP® Certified</span><span class="footer-badge">Mother of 5</span></div></div></div></footer>"""


index_source = BLOG.read_text(encoding="utf-8")
source = SOURCE_ARCHIVE.read_text(encoding="utf-8") if SOURCE_ARCHIVE.exists() else index_source
if not SOURCE_ARCHIVE.exists():
    SOURCE_ARCHIVE.write_text(source, encoding="utf-8")
for post_id, data in POSTS.items():
    article = extract(source, post_id)
    image_match = re.search(r'<img src="([^"]+)"', article)
    image = image_match.group(1).replace("w=900", "w=1200") if image_match else "https://www.renewed.rest/renewed-rest-logo.avif"
    url = f'https://www.renewed.rest/{data["slug"]}'
    schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": data["title"],
        "description": data["description"],
        "mainEntityOfPage": url,
        "image": image,
        "author": {"@id": "https://www.renewed.rest/#emily-sweetman"},
        "publisher": {"@id": "https://www.renewed.rest/#organization"},
        "inLanguage": "en-US",
    }
    page = f'''<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(data["title"])} | Renewed Rest</title>
  <meta name="description" content="{html.escape(data["description"], quote=True)}">
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="article"><meta property="og:title" content="{html.escape(data["title"], quote=True)}"><meta property="og:description" content="{html.escape(data["description"], quote=True)}"><meta property="og:url" content="{url}"><meta property="og:image" content="{html.escape(image, quote=True)}">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">{json.dumps(schema, ensure_ascii=False, indent=2)}</script>
  <link rel="stylesheet" href="brand.css"><link rel="icon" href="favicon.ico"><meta name="theme-color" content="#3E6B7E">
  <style>{PAGE_STYLE}</style>
</head><body>
{nav()}
<main><section class="section bg-white"><div class="wrap"><article class="article">
  <a class="post-back" href="blog.html">← Back to Blog</a>
  <h1>{html.escape(data["title"])}</h1>
  <div class="author-line"><img src="emily-and-liam.jpg" alt="Emily Sweetman"><div><strong><a href="about.html">Emily Sweetman</a></strong><span>IPSP® Certified Sleep Consultant · Mother of five</span></div></div>
  {article}
  <section class="assessment-cta" aria-labelledby="assessment-heading">
    <h2 id="assessment-heading">Get clarity on your child's sleep—in 30 minutes.</h2>
    <p>Tell Emily what is happening at bedtime, during naps, or overnight. She'll help you identify the likely obstacles, answer your biggest question, and recommend the most sensible next step for your family.</p>
    <div class="assessment-details"><span>✓ One-on-one with Emily</span><span>✓ Video or phone</span><span>✓ No cost or obligation</span></div>
    <a href="contact.html" class="btn btn-rose">Get My Free Sleep Assessment</a>
  </section>
  <aside class="article-note"><strong>Educational note:</strong> This article provides general sleep education and is not medical advice. Ask your child's pediatrician about health, feeding, development, breathing, or safe-sleep concerns.</aside>
</article></div></section></main>
{footer()}
<script src="main.js"></script></body></html>
'''
    (ROOT / data["slug"]).write_text(page, encoding="utf-8")

# Turn JavaScript-only cards into ordinary, crawlable links.
for post_id, data in POSTS.items():
    index_source = index_source.replace(
        f'<div class="bcard" onclick="showPost(\'{post_id}\')">',
        f'<a class="bcard" href="{data["slug"]}">',
    )

# Each card has a stable closing pattern; close the new anchor instead.
index_source = re.sub(
    r'(<span class="bcard-read">Read More →</span></div>)\n          </div>',
    r'\1\n          </a>',
    index_source,
)
index_source = re.sub(
    r'\n  <!-- INDIVIDUAL POSTS -->.*?\n</main>',
    '\n</main>',
    index_source,
    flags=re.S,
)
index_source = re.sub(
    r'\n<script>\n// Blog post routing.*?</script>',
    '',
    index_source,
    flags=re.S,
)
BLOG.write_text(index_source, encoding="utf-8")

print(f"Built {len(POSTS)} article pages")
