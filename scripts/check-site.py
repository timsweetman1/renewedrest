#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
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

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "title":
            self.has_title = True
        if tag == "meta" and values.get("name") == "description":
            self.has_description = True
        element_id = values.get("id")
        if element_id:
            if element_id in self.ids:
                errors.append(f"duplicate id #{element_id}")
            self.ids.add(element_id)
        for attribute in ("href", "src"):
            if values.get(attribute):
                self.refs.append(values[attribute] or "")


for page in ROOT.glob("*.html"):
    if page.name in {"nav.html", "footer.html", "sleep-guide-download.html"}:
        continue
    parser = PageParser()
    parser.feed(page.read_text(encoding="utf-8"))
    if not parser.has_title:
        errors.append(f"{page.name}: missing title")
    if not parser.has_description:
        errors.append(f"{page.name}: missing meta description")
    for ref in parser.refs:
        parsed = urlsplit(ref)
        if parsed.scheme or parsed.netloc or ref.startswith(("mailto:", "tel:", "#")):
            continue
        target = ROOT / unquote(parsed.path)
        if parsed.path and not target.exists():
            errors.append(f"{page.name}: missing local target {parsed.path}")

if errors:
    raise SystemExit("\n".join(errors))

print("Site checks passed")
