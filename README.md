# Dustin Fichmann’s website

Static website for https://dustinfichmann.com, hosted with GitHub Pages.
The root folder contains the only website version: About, Research, Teaching,
Coffee, Outdoors, Movies + TV, and Resources. No build step is required.

## Local preview

Run `python3 -m http.server 8001 --bind 127.0.0.1` from this folder and open
http://127.0.0.1:8001/. The movie quiz uses JavaScript modules, so use the local
server rather than opening the HTML file directly.

## Content and downloads

- `assets/CV_Dustin_Fichmann.pdf`: current CV.
- `images/`: the photos and swim map used by the site. Personal image metadata has been
  removed without re-encoding the images; color profiles are preserved.
- `resources/pset-template/` and `resources/pset-template.zip`: LaTeX template.
  Keep generated `build/` output out of the repository and download archive.
- The movie quiz stores answers only in memory and clears them on closing.

## Checks

With Node 22 or later, run:

```sh
node tests/movie-preferences.test.mjs
node tests/mobile-navigation.test.mjs
```

## Publishing

`CNAME` specifies dustinfichmann.com. `.nojekyll` serves the static files without
Jekyll processing. Each page has a canonical URL, and `sitemap.xml` lists all
seven pages. Changes must be reviewed and explicitly approved before pushing.

## Crawler policy

`robots.txt` allows search crawlers and requests opt-outs for Google-Extended,
GPTBot, ClaudeBot, Applebot-Extended, and CCBot. These are voluntary directives,
not access controls; they do not cover copies in public repositories or remove
previously collected data. Google-Extended controls specified Gemini training
and grounding uses without controlling ordinary Google Search inclusion or
ranking. No CDN, DNS, or firewall settings are changed by these files.

Provider documentation:
- https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended
- https://developers.openai.com/api/docs/bots
- https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- https://support.apple.com/en-us/119829
- https://commoncrawl.org/ccbot
