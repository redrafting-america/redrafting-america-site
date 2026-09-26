#!/usr/bin/env python3
"""Generate the 24 public Bylaws Article pages from the controlled DOCX."""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
from lxml import etree
from lxml import html as lxml_html


NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
}


def clean(text: str) -> str:
    return " ".join(text.split())


def render_run(run) -> str:
    text = html.escape(run.text)
    if not text:
        return ""
    if run.font.superscript:
        text = f"<sup>{text}</sup>"
    elif run.font.subscript:
        text = f"<sub>{text}</sub>"
    if run.underline:
        text = f"<u>{text}</u>"
    if run.italic:
        text = f"<em>{text}</em>"
    if run.bold:
        text = f"<strong>{text}</strong>"
    return text


def render_paragraph_text(paragraph: Paragraph) -> str:
    parts = []
    for child in paragraph._p:
        local = etree.QName(child).localname
        if local == "r":
            for run in paragraph.runs:
                if run._r is child:
                    parts.append(render_run(run))
                    break
        elif local == "hyperlink":
            rel_id = child.get(f"{{{NS['r']}}}id")
            href = paragraph.part.rels[rel_id].target_ref if rel_id else ""
            label = "".join(child.xpath(".//w:t/text()"))
            parts.append(f'<a href="{html.escape(href, quote=True)}">{html.escape(label)}</a>')
    if not parts:
        return html.escape(paragraph.text)
    return "".join(parts)


def block_items(document):
    for child in document.element.body.iterchildren():
        local = etree.QName(child).localname
        if local == "p":
            yield Paragraph(child, document)
        elif local == "tbl":
            yield Table(child, document)


def paragraph_image(paragraph: Paragraph, output: Path, stem: str) -> str | None:
    blips = paragraph._p.xpath(".//a:blip")
    if not blips:
        return None
    rel_id = blips[0].get(f"{{{NS['r']}}}embed")
    if not rel_id:
        return None
    part = paragraph.part.related_parts[rel_id]
    extension = part.content_type.split("/")[-1].replace("jpeg", "jpg")
    filename = f"{stem}.{extension}"
    (output / filename).write_bytes(part.blob)
    return filename


def render_table(table: Table) -> str:
    rows = []
    for row_index, row in enumerate(table.rows):
        cells = []
        tag = "th" if row_index == 0 else "td"
        for cell in row.cells:
            content = "<br />".join(
                render_paragraph_text(p) for p in cell.paragraphs if clean(p.text)
            )
            cells.append(f"<{tag}>{content}</{tag}>")
        rows.append("<tr>" + "".join(cells) + "</tr>")
    return '<div class="bylaws-table-wrap"><table>' + "".join(rows) + "</table></div>"


def render_blocks(blocks, image_output: Path, roman: str) -> str:
    rendered = []
    index = 0
    image_number = 0
    while index < len(blocks):
        block = blocks[index]
        if isinstance(block, Table):
            rendered.append(render_table(block))
            index += 1
            continue

        style = block.style.name
        text = clean(block.text)
        if style == "RDA Figure":
            image_number += 1
            caption = ""
            if index + 1 < len(blocks) and isinstance(blocks[index + 1], Paragraph):
                next_block = blocks[index + 1]
                if next_block.style.name == "RDA Figure Caption":
                    caption = clean(next_block.text)
                    index += 1
            filename = paragraph_image(block, image_output, f"article-{roman.lower()}-figure-{image_number}")
            if filename:
                rendered.append(
                    '<figure class="bylaws-figure">'
                    f'<img src="assets/images/bylaws/{filename}" alt="{html.escape(caption, quote=True)}" />'
                    + (f"<figcaption>{html.escape(caption)}</figcaption>" if caption else "")
                    + "</figure>"
                )
            index += 1
            continue
        if not text or style == "Group Banner":
            index += 1
            continue

        content = render_paragraph_text(block)
        if style == "Heading 2":
            rendered.append(f"<h2>{html.escape(text.lstrip('— ').strip())}</h2>")
        elif style == "Heading 3":
            rendered.append(f"<h3>{html.escape(text.lstrip('— ').strip())}</h3>")
        elif style == "Heading 4":
            rendered.append(f"<h4>{html.escape(text.lstrip('— ').strip())}</h4>")
        elif style == "RDA Figure Caption":
            rendered.append(f'<p class="figure-caption">{content}</p>')
        elif style == "RDA Article Introduction":
            rendered.append(f'<p class="article-introduction">{content}</p>')
        elif style == "RDA Section Introduction":
            rendered.append(f'<p class="section-introduction">{content}</p>')
        elif style == "RDA List Introduction":
            rendered.append(f'<p class="list-introduction">{content}</p>')
        elif style in {"RDA Ordered List", "RDA Letter List"}:
            list_style = style
            items = []
            while index < len(blocks) and isinstance(blocks[index], Paragraph) and blocks[index].style.name == list_style:
                items.append(f"<li>{render_paragraph_text(blocks[index])}</li>")
                index += 1
            list_type = ' type="a"' if list_style == "RDA Letter List" else ""
            rendered.append(f"<ol{list_type}>" + "".join(items) + "</ol>")
            continue
        elif style == "Intense Quote":
            rendered.append(f"<blockquote>{content}</blockquote>")
        else:
            rendered.append(f"<p>{content}</p>")
        index += 1
    return "\n      ".join(rendered)


def page_html(meta, body: str, previous_meta, next_meta) -> str:
    roman = meta["roman"]
    title = meta["title"]
    slug = f"bylaws-article-{roman.lower()}.html"
    if previous_meta is None:
        previous_href = "pages/about/bylaws-preamble.html"
        previous_label = "Preamble"
    else:
        previous_href = f"pages/about/bylaws-article-{previous_meta['roman'].lower()}.html"
        previous_label = f"Article {previous_meta['roman']}"
    if next_meta is None:
        next_href = "pages/about/bylaws-epilogue.html"
        next_label = "Epilogue"
    else:
        next_href = f"pages/about/bylaws-article-{next_meta['roman'].lower()}.html"
        next_label = f"Article {next_meta['roman']}"

    return f'''<!doctype html>
<html lang="en">
<head>
  <base href="../../" />
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Article {roman}: {html.escape(title)} — Pending Bylaws | Redrafting America</title>
  <meta name="description" content="Article {roman}, {html.escape(title)}, of the pending Bylaws of Redrafting America." />
  <link rel="canonical" href="https://www.redraftingamerica.org/pages/about/{slug}" />
  <link rel="icon" type="image/png" sizes="32x32" href="assets/images/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="assets/images/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="assets/images/apple-touch-icon.png" />
  <link rel="icon" href="assets/images/redrafting-america-logo-web.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="assets/styles/scaffold-page.css" />
  <link rel="stylesheet" href="assets/styles/bylaws-section.css?v=20260917-1" />
  <link rel="stylesheet" href="assets/styles/brand-lockup.css" />
  <link rel="stylesheet" href="assets/styles/site-shell.css?v=20260916-1" />
  <link rel="alternate" type="application/rss+xml" title="The Drafting Room RSS Feed" href="https://www.redraftingamerica.org/rss.xml" />
</head>
<body>
  <a class="skip-link" href="pages/about/{slug}#main-content">Skip to main content</a>
  <header class="site-header"><div class="header-inner"><a class="brand" href="index.html"><img src="assets/images/redrafting-america-logo-web.png" alt="" /><span>Redrafting America</span></a><nav class="main-nav" aria-label="Main navigation"><a href="pages/about/mission.html">Mission</a><a href="index.html#constitution">Constitution v2.0</a><a href="pages/community/drafting-room/index.html">The Drafting Room</a><a href="pages/newsroom/cultural-influences.html">Cultural Influences</a><a href="pages/get-involved/careers.html">Careers</a><a href="pages/get-involved/contact.html">Contact</a></nav><span class="version-pill">v0.7 BETA</span></div></header>

  <main class="main-wrap" id="main-content">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a><a href="pages/about/index.html">About Us</a><a href="pages/about/bylaws.html">Bylaws</a><span aria-current="page">Article {roman}</span></nav>
    <section class="hero-panel bylaws-article-hero" style="--article-color: {meta['color']}; --article-ink: {meta['ink']};">
      <span class="eyebrow">Pending Bylaws</span>
      <div class="article-banner"><span class="article-number">Article {roman}</span><h1>{html.escape(title)}</h1></div>
      <div class="notice"><strong>Status:</strong> These Bylaws are pending.</div>
    </section>
    <article class="content-panel bylaws-section bylaws-article" aria-label="Article {roman}: {html.escape(title, quote=True)}">
      {body}
      <nav class="bylaws-page-nav" aria-label="Bylaws navigation"><a href="{previous_href}">&larr; {html.escape(previous_label)}</a><a href="pages/about/bylaws.html#article-{roman}">Table of Contents</a><a href="{next_href}">{html.escape(next_label)} &rarr;</a></nav>
    </article>
  </main>
  <footer class="site-footer"><div class="footer-inner"><p>&copy; 2026 ReDrafting America.</p><p>Veritas Super Omnia &mdash; The Truth Above All Else.</p></div></footer>
  <script src="assets/scripts/site-shell.js?v=20260917-1"></script>
</body>
</html>
'''


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: generate-bylaws-articles.py CONTROLLED-BYLAWS.docx")
    source = Path(sys.argv[1]).expanduser().resolve()
    root = Path(__file__).resolve().parents[1]
    toc_path = root / "pages/about/bylaws.html"
    output = root / "pages/about"
    image_output = root / "assets/images/bylaws"
    image_output.mkdir(parents=True, exist_ok=True)

    toc = lxml_html.fromstring(toc_path.read_text(encoding="utf-8"))
    metadata = []
    for card in toc.xpath('//article[starts-with(@id, "article-")]'):
        roman = card.get("id").removeprefix("article-")
        title = clean(card.xpath(".//h2")[0].text_content())
        style = card.get("style", "")
        color = re.search(r"--article-color:\s*([^;]+)", style).group(1).strip()
        ink = re.search(r"--article-ink:\s*([^;]+)", style).group(1).strip()
        metadata.append({"roman": roman, "title": title, "color": color, "ink": ink})
    if len(metadata) != 24:
        raise RuntimeError(f"Expected 24 Article cards, found {len(metadata)}")

    document = Document(source)
    blocks = list(block_items(document))
    heading_positions = {}
    for position, block in enumerate(blocks):
        if isinstance(block, Paragraph) and block.style.name == "Heading 1":
            heading_positions[clean(block.text).lstrip("— ").strip().upper()] = position

    for article_index, meta in enumerate(metadata):
        start = heading_positions[meta["title"].upper()] + 1
        if article_index + 1 < len(metadata):
            end = heading_positions[metadata[article_index + 1]["title"].upper()]
        else:
            end = heading_positions["EPILOGUE"]
        article_blocks = blocks[start:end]
        while article_blocks and isinstance(article_blocks[-1], Paragraph) and (
            not clean(article_blocks[-1].text) or article_blocks[-1].style.name == "Group Banner"
        ):
            article_blocks.pop()
        body = render_blocks(article_blocks, image_output, meta["roman"])
        previous_meta = metadata[article_index - 1] if article_index else None
        next_meta = metadata[article_index + 1] if article_index + 1 < len(metadata) else None
        target = output / f"bylaws-article-{meta['roman'].lower()}.html"
        target.write_text(page_html(meta, body, previous_meta, next_meta), encoding="utf-8")
        print(f"Article {meta['roman']}: {len(article_blocks)} blocks -> {target.name}")


if __name__ == "__main__":
    main()
