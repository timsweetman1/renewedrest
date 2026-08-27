#!/usr/bin/env python3
from html.parser import HTMLParser
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
errors: list[str] = []


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.refs: list[str] = []
        self.has_title = False
        self.has_description = False
        self.h1_count = 0
        self.in_jsonld = False
        self.jsonld_buffer: list[str] = []
        self.jsonld_documents: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "title":
            self.has_title = True
        if tag == "meta" and values.get("name") == "description":
            self.has_description = True
        if tag == "h1":
            self.h1_count += 1
        if tag == "script" and values.get("type") == "application/ld+json":
            self.in_jsonld = True
            self.jsonld_buffer = []
        element_id = values.get("id")
        if element_id:
            if element_id in self.ids:
                errors.append(f"duplicate id #{element_id}")
            self.ids.add(element_id)
        for attribute in ("href", "src"):
            if values.get(attribute):
                self.refs.append(values[attribute] or "")

    def handle_data(self, data: str) -> None:
        if self.in_jsonld:
            self.jsonld_buffer.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self.in_jsonld:
            self.jsonld_documents.append("".join(self.jsonld_buffer))
            self.in_jsonld = False


for page in ROOT.glob("*.html"):
    if page.name in {"nav.html", "footer.html", "sleep-guide-download.html"}:
        continue
    parser = PageParser()
    parser.feed(page.read_text(encoding="utf-8"))
    if not parser.has_title:
        errors.append(f"{page.name}: missing title")
    if not parser.has_description:
        errors.append(f"{page.name}: missing meta description")
    if parser.h1_count != 1:
        errors.append(f"{page.name}: expected one h1, found {parser.h1_count}")
    for document in parser.jsonld_documents:
        try:
            json.loads(document)
        except json.JSONDecodeError as exc:
            errors.append(f"{page.name}: invalid JSON-LD: {exc}")
    for ref in parser.refs:
        parsed = urlsplit(ref)
        if parsed.scheme or parsed.netloc or ref.startswith(("mailto:", "tel:", "#")):
            continue
        target = ROOT / unquote(parsed.path)
        if parsed.path and not target.exists():
            errors.append(f"{page.name}: missing local target {parsed.path}")

try:
    ET.parse(ROOT / "sitemap.xml")
except (ET.ParseError, FileNotFoundError) as exc:
    errors.append(f"sitemap.xml: {exc}")

robots = ROOT / "robots.txt"
if not robots.exists() or "OAI-SearchBot" not in robots.read_text(encoding="utf-8"):
    errors.append("robots.txt: missing OAI-SearchBot policy")

if errors:
    raise SystemExit("\n".join(errors))

print("Site checks passed")
