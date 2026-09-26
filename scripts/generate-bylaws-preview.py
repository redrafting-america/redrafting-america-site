#!/usr/bin/env python3
"""Generate the temporary Article XXIII website preview from the controlled DOCX."""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
from lxml import etree


NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
}


def clean(text: str) -> str:
    return " ".join(text.split())


def roman(number: int) -> str:
    values = ((1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"),
              (90, "XC"), (50, "L"), (40, "XL"), (10, "X"), (9, "IX"),
              (5, "V"), (4, "IV"), (1, "I"))
    result = []
    for value, token in values:
        while number >= value:
            result.append(token)
            number -= value
    return "".join(result)


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
    return "".join(parts) if parts else html.escape(paragraph.text)


def block_items(document):
    for child in document.element.body.iterchildren():
        local = etree.QName(child).localname
        if local == "p":
            yield Paragraph(child, document)
        elif local == "tbl":
            yield Table(child, document)


def effective_numbering(paragraph: Paragraph) -> tuple[int, int] | None:
    paragraph_num = paragraph._p.pPr.numPr if paragraph._p.pPr is not None else None
    style_num = paragraph.style.element.pPr.numPr if paragraph.style.element.pPr is not None else None
    num = paragraph_num if paragraph_num is not None else style_num
    if num is None or num.numId is None:
        return None
    num_id = int(num.numId.val)
    if num_id == 0:
        return None
    level = int(num.ilvl.val) if num.ilvl is not None else 0
    return num_id, level


def heading_numbers(blocks) -> dict:
    counters_by_num: dict[int, list[int]] = {}
    result = {}
    for block in blocks:
        if not isinstance(block, Paragraph) or block.style.name not in {"Heading 1", "Heading 2", "Heading 3", "Heading 4"}:
            continue
        numbering = effective_numbering(block)
        if numbering is None:
            continue
        num_id, level = numbering
        counters = counters_by_num.setdefault(num_id, [0] * 9)
        counters[level] += 1
        for deeper in range(level + 1, len(counters)):
            counters[deeper] = 0
        values = counters[:level + 1]
        if level == 0:
            label = f"Article {roman(values[0])}"
        else:
            label = "Section " + ".".join(str(value) for value in values)
        result[block._p] = (level + 1, label)
    return result


def paragraph_image(paragraph: Paragraph, output: Path) -> str | None:
    blips = paragraph._p.xpath(".//a:blip")
    if not blips:
        return None
    rel_id = blips[0].get(f"{{{NS['r']}}}embed")
    if not rel_id:
        return None
    part = paragraph.part.related_parts[rel_id]
    extension = part.content_type.split("/")[-1].replace("jpeg", "jpg")
    filename = f"article-xxiii-figure-1.{extension}"
    (output / filename).write_bytes(part.blob)
    return filename


def render_table(table: Table) -> str:
    rows = []
    for row_index, row in enumerate(table.rows):
        tag = "th" if row_index == 0 else "td"
        cells = []
        for cell in row.cells:
            content = "<br />".join(render_paragraph_text(p) for p in cell.paragraphs if clean(p.text))
            cells.append(f"<{tag}>{content}</{tag}>")
        rows.append("<tr>" + "".join(cells) + "</tr>")
    return '<div class="bylaws-table-wrap"><table>' + "".join(rows) + "</table></div>"


def outline_html(headings) -> str:
    output = []
    current_level = 1
    for index, item in enumerate(headings):
        level = item["level"] - 1
        if index == 0:
            output.append("<ol>")
            current_level = level
        elif level > current_level:
            output.append("<ol>" * (level - current_level))
        elif level < current_level:
            output.append(("</li></ol>" * (current_level - level)) + "</li>")
        else:
            output.append("</li>")
        output.append(
            f'<li><a href="pages/about/bylaws-preview-article-xxiii.html#{item["id"]}"><span class="outline-number">{html.escape(item["number"].replace("Section ", ""))}</span>'
            f'<span>{html.escape(item["title"])}</span></a>'
        )
        current_level = level
    output.append(("</li></ol>" * current_level))
    return "".join(output)


def render_article(blocks, heading_map, image_output: Path):
    start = next(i for i, block in enumerate(blocks) if isinstance(block, Paragraph) and clean(block.text).lstrip("— ").strip().upper() == "EX UNO FLOREMUS" and block.style.name == "Heading 1")
    end = next(i for i in range(start + 1, len(blocks)) if isinstance(blocks[i], Paragraph) and clean(blocks[i].text).lstrip("— ").strip().upper() == "DISSOLUTION" and blocks[i].style.name == "Heading 1")
    article_blocks = blocks[start + 1:end]
    headings = []
    for block in article_blocks:
        if isinstance(block, Paragraph) and block.style.name in {"Heading 2", "Heading 3", "Heading 4"}:
            level, number = heading_map[block._p]
            title = clean(block.text).lstrip("— ").strip()
            anchor = "section-" + number.removeprefix("Section ").replace(".", "-")
            headings.append({"level": level, "number": number, "title": title, "id": anchor})

    rendered = []
    open_levels = []
    index = 0
    heading_index = 0
    while index < len(article_blocks):
        block = article_blocks[index]
        if isinstance(block, Table):
            rendered.append(render_table(block))
            index += 1
            continue
        style = block.style.name
        text = clean(block.text)
        if style == "RDA Figure":
            caption = ""
            if index + 1 < len(article_blocks) and isinstance(article_blocks[index + 1], Paragraph) and article_blocks[index + 1].style.name == "RDA Figure Caption":
                caption = clean(article_blocks[index + 1].text)
                index += 1
            filename = paragraph_image(block, image_output)
            if filename:
                rendered.append('<figure class="bylaws-figure">' + f'<img src="assets/images/bylaws/{filename}" alt="{html.escape(caption, quote=True)}" />' + (f'<figcaption>{html.escape(caption)}</figcaption>' if caption else '') + '</figure>')
            index += 1
            continue
        if not text or style == "Group Banner":
            index += 1
            continue
        if style in {"Heading 2", "Heading 3", "Heading 4"}:
            item = headings[heading_index]
            heading_index += 1
            level = item["level"]
            while open_levels and open_levels[-1] >= level:
                rendered.append("</section>")
                open_levels.pop()
            rendered.append(f'<section class="document-section level-{level}" aria-labelledby="{item["id"]}">')
            rendered.append(f'<h{level} id="{item["id"]}"><span class="section-number">{html.escape(item["number"])}</span><span class="section-title">{html.escape(item["title"])}</span></h{level}>')
            open_levels.append(level)
            index += 1
            continue
        content = render_paragraph_text(block)
        if style in {"RDA Ordered List", "RDA Letter List"}:
            list_style = style
            items = []
            while index < len(article_blocks) and isinstance(article_blocks[index], Paragraph) and article_blocks[index].style.name == list_style:
                items.append(f"<li>{render_paragraph_text(article_blocks[index])}</li>")
                index += 1
            list_type = ' type="a"' if list_style == "RDA Letter List" else ""
            rendered.append(f"<ol{list_type}>" + "".join(items) + "</ol>")
            continue
        classes = {
            "RDA Article Introduction": "article-introduction",
            "RDA Section Introduction": "section-introduction",
            "RDA List Introduction": "list-introduction",
            "RDA Figure Caption": "figure-caption",
        }
        if style == "Intense Quote":
            rendered.append(f"<blockquote>{content}</blockquote>")
        elif style in classes:
            rendered.append(f'<p class="{classes[style]}">{content}</p>')
        else:
            rendered.append(f"<p>{content}</p>")
        index += 1
    while open_levels:
        rendered.append("</section>")
        open_levels.pop()
    return "\n      ".join(rendered), headings


def page_html(body: str, headings) -> str:
    outline = outline_html(headings)
    return f'''<!doctype html>
<html lang="en">
<head>
  <base href="../../" />
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Temporary Preview — Article XXIII | ReDrafting America</title>
  <meta name="description" content="Temporary layout preview for Article XXIII of the pending Bylaws of ReDrafting America." />
  <link rel="icon" type="image/png" sizes="32x32" href="assets/images/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="assets/images/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="assets/images/apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="assets/styles/scaffold-page.css" />
  <link rel="stylesheet" href="assets/styles/bylaws-section.css?v=20260917-1" />
  <link rel="stylesheet" href="assets/styles/bylaws-preview.css?v=20260917-1" />
  <link rel="stylesheet" href="assets/styles/brand-lockup.css" />
  <link rel="stylesheet" href="assets/styles/site-shell.css?v=20260916-1" />
</head>
<body>
  <a class="skip-link" href="pages/about/bylaws-preview-article-xxiii.html#main-content">Skip to main content</a>
  <header class="site-header"><div class="header-inner"><a class="brand" href="index.html"><img src="assets/images/redrafting-america-logo-web.png" alt="" /><span>ReDrafting America</span></a><nav class="main-nav" aria-label="Main navigation"><a href="pages/about/mission.html">Mission</a><a href="index.html#constitution">Constitution v2.0</a><a href="pages/community/drafting-room/index.html">The Drafting Room</a><a href="pages/newsroom/cultural-influences.html">Cultural Influences</a><a href="pages/get-involved/careers.html">Careers</a><a href="pages/get-involved/contact.html">Contact</a></nav><span class="version-pill">v0.7 BETA</span></div></header>
  <main class="main-wrap" id="main-content">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a><a href="pages/about/index.html">About Us</a><a href="pages/about/bylaws.html">Bylaws</a><span aria-current="page">Temporary Article XXIII Preview</span></nav>
    <section class="hero-panel bylaws-article-hero" style="--article-color: #800080; --article-ink: #fffdf8;">
      <span class="eyebrow">Pending Bylaws · Temporary Preview</span>
      <div class="article-banner"><span class="article-number">Article XXIII</span><h1>Ex Uno Floremus</h1></div>
      <div class="notice temporary-preview-note"><strong>Temporary design preview:</strong> This page demonstrates nested Article navigation and reading. Article XXIII is still being finalized and has not been added to the Bylaws contents or sitemap.</div>
    </section>
    <div class="preview-reading-layout">
      <nav class="article-outline" aria-labelledby="article-outline-heading">
        <h2 id="article-outline-heading">In this Article</h2>
        <p class="outline-help">Select any numbered heading to move directly to it.</p>
        {outline}
      </nav>
      <article class="content-panel bylaws-section bylaws-article preview-article" aria-label="Temporary preview of Article XXIII: Ex Uno Floremus">
        {body}
        <nav class="bylaws-page-nav preview-page-nav" aria-label="Preview navigation"><a href="pages/about/bylaws.html#article-XXIII">Return to the Article introductions</a></nav>
      </article>
    </div>
  </main>
  <footer class="site-footer"><div class="footer-inner"><p>&copy; 2026 ReDrafting America.</p><p>Veritas Super Omnia &mdash; The Truth Above All Else.</p></div></footer>
  <script src="assets/scripts/site-shell.js?v=20260917-1"></script>
  <script src="assets/scripts/bylaws-preview.js?v=20260917-2"></script>
</body>
</html>
'''


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: generate-bylaws-preview.py CONTROLLED-BYLAWS.docx")
    source = Path(sys.argv[1]).expanduser().resolve()
    root = Path(__file__).resolve().parents[1]
    document = Document(source)
    blocks = list(block_items(document))
    heading_map = heading_numbers(blocks)
    image_output = root / "assets/images/bylaws"
    image_output.mkdir(parents=True, exist_ok=True)
    body, headings = render_article(blocks, heading_map, image_output)
    if len(headings) != 75:
        raise RuntimeError(f"Expected 75 nested headings in Article XXIII, found {len(headings)}")
    target = root / "pages/about/bylaws-preview-article-xxiii.html"
    target.write_text(page_html(body, headings), encoding="utf-8")
    counts = {level: sum(item["level"] == level for item in headings) for level in (2, 3, 4)}
    print(f"Generated {target.name}: {counts[2]} sections, {counts[3]} subsections, {counts[4]} fourth-level headings")


if __name__ == "__main__":
    main()
