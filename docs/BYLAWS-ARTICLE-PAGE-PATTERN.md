# Bylaws Article Page Pattern

**Status:** Approved design pattern
**Approved:** September 17, 2026
**Reference implementation:** `pages/about/bylaws-preview-article-xxiii.html`
**Reference source:** Article XXIII, *Ex Uno Floremus*

This specification preserves the approved design for presenting a complete Bylaws Article on the website. It governs the eventual full-Article pages after their text is finalized and publication is separately authorized. The Article XXIII page is a temporary, unlisted demonstration of the pattern; its presence does not authorize publication of the remaining unfinished Articles.

## Reader experience

Each Article page presents the complete hierarchy of the governing document rather than flattening it into an uninterrupted file. A reader must be able to see where each provision sits, move directly to any numbered heading, share a link to that heading, and continue reading without the page reloading.

The page has four visual levels:

1. **Article — H1:** the Article title in the Article banner, such as `Article XXIII / Ex Uno Floremus`.
2. **Section — H2:** a top-level section, such as `Section 23.7 / Our Enduring Legacy`.
3. **Subsection — H3:** a nested provision, such as `Section 23.7.1 / The Archive`.
4. **Fourth-level subsection — H4:** the deepest displayed heading, such as `Section 23.7.1.1 / Archive Mission and Holdings`.

The number and title are visually separated within every H2–H4 heading. Numbers use the compact monospaced treatment; titles retain the serif document hierarchy. The numbering displayed on the site must be the numbering encoded in the controlled Word document.

## Page structure

The approved order is:

1. The shared site header and breadcrumb: `Home / About / Bylaws / [Article]`.
2. The Article banner, using the Article's exact banner color and contrasting ink color from the controlled document.
3. A status notice whenever the Article is pending, under review, or temporarily displayed.
4. The **In this Article** outline.
5. The Article introduction, kept distinct from the banner.
6. The complete Article body with nested H2, H3, and H4 sections.
7. Figures, tables, lists, links, emphasis, and other source content in their source order.
8. Article navigation back to the Bylaws introductions and, after full publication is approved, any authorized previous/next Article links.
9. The shared site footer, which remains fixed in the site shell rather than moving with Article navigation.

When an Article is an Eternity Clause, the sentence identifying it as protected by the Articles of Incorporation is bold. The Article number and Article title belong in the banner; they are not merged into the introduction text.

## In-this-Article outline

The outline mirrors the document hierarchy exactly:

- H2 entries are the outer list.
- H3 entries are nested beneath their H2 parent.
- H4 entries are nested beneath their H3 parent.
- Every entry includes its complete section number and title.
- Every entry targets the corresponding heading ID, such as `#section-23-7-1-1`.

On viewports wider than 1599 pixels, the outline is a sticky left reading aid beside the Article. It stays within the available area between the shared header and footer and scrolls internally when necessary.

At 1599 pixels and below, the outline moves above the Article so the main text retains a readable measure between the site's permanent side panels. Its height is limited to 45 percent of the viewport, with its own vertical scrolling.

On phone-sized screens, the outline and Article remain single-column. H2–H4 numbers and titles stack rather than forcing an undersized text column. The page must not create horizontal overflow.

## Section-link behavior

Section navigation is same-document navigation. Clicking an outline entry must never reload the Article page.

The site uses a root-relative `<base>` strategy so pages also work when opened locally. Because a bare fragment link can resolve against that base instead of the current Article, the HTML retains a complete physical page-and-fragment destination as its non-JavaScript fallback. `assets/scripts/bylaws-preview.js` intercepts a valid outline click and then:

1. prevents the browser's full-page navigation;
2. adds the selected section to the current address with `history.pushState()`;
3. scrolls the existing document directly to the matching heading with `scrollIntoView()`;
4. respects the reader's reduced-motion preference;
5. marks the selected outline entry as current; and
6. leaves the breadcrumb intact.

This behavior prevents the visible jump to the top followed by a second jump to the target. Direct URLs containing a section fragment must still open at the correct heading.

## Content fidelity

Full Article pages are generated from the controlled Bylaws Word document. The website must not infer or manually recreate section numbering.

The generator must:

- resolve numbering inherited through Word paragraph styles and numbering definitions;
- preserve H1–H4 hierarchy and source order;
- preserve paragraphs, ordered and unordered lists, tables, figures, captions, hyperlinks, bold, italics, underline, superscript, and subscript when present;
- generate stable, unique section IDs from the full number;
- create one outline link for every H2–H4 heading; and
- fail validation when the generated hierarchy or content counts do not match the source.

The current reference generator is `scripts/generate-bylaws-preview.py`. The Article XXIII reference contains 9 H2 sections, 44 H3 subsections, 22 H4 subsections, and 75 outline links.

## Temporary-preview safeguards

A temporary Article demonstration must:

- display a plain notice that the Article is still being finalized;
- use `noindex, nofollow`;
- remain absent from `sitemap.xml`;
- remain unlinked from the Bylaws introductions page and shared navigation;
- use a clearly temporary page title and breadcrumb; and
- avoid presenting the preview as an approved, adopted, or finalized governing record.

Removing these safeguards and adding the Article to public navigation requires separate publication authorization.

## Implementation files

- `pages/about/bylaws-preview-article-xxiii.html` — working reference page.
- `assets/styles/bylaws-preview.css` — responsive outline and H2–H4 hierarchy.
- `assets/scripts/bylaws-preview.js` — current-heading tracking and reload-free section navigation.
- `scripts/generate-bylaws-preview.py` — controlled Word-to-HTML generator.
- `assets/styles/bylaws-section.css` — shared Bylaws page and source-content styling.

The preview-specific names may be generalized when the first finalized Article is approved for permanent publication. The behavior and acceptance requirements in this specification remain the standard.

## Acceptance checklist

Before any full Article page is published:

- Confirm the Article number, title, banner color, and contrasting ink color against the controlled document.
- Confirm the Article introduction is complete and distinct from the banner.
- Confirm every source H2, H3, and H4 appears once, in order, with its exact number and title.
- Confirm the outline count equals the combined H2–H4 count.
- Confirm every outline link reaches its heading without a full-page reload.
- Confirm direct fragment URLs open at the correct heading.
- Confirm the current outline entry updates while reading.
- Confirm desktop, intermediate, tablet, and phone layouts remain readable with no horizontal overflow.
- Confirm tables, figures, captions, lists, and inline formatting remain usable and faithful to the source.
- Confirm the breadcrumb and footer remain correct throughout section navigation.
- Confirm the browser console has no errors or warnings caused by the Article page.
- Confirm the static-site build and Cloudflare dry run pass.
- After deployment, repeat the structural, navigation, responsive, and live-content checks on the canonical public URL.
