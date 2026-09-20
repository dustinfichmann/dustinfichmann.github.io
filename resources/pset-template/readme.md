# Problem-set template

Last updated: 2026-09-19

1. Edit `metadata.tex`: name (default: Generic), set number, and date (`\today` uses the compilation date).
2. Write questions and solutions in `problems/`. Copy a problem file and add its `\input` line to `problems.tex` for more problems; numbering is automatic.
3. From this folder, run `latexmk -pdf main.tex` with a full MacTeX/TeX Live installation. Open `build/main.pdf`. On Overleaf, upload this folder's contents and choose `main.tex` with pdfLaTeX.

Use `problem` (optional `[Title]`), `solution`, and `problempart` (automatic letters). For formatting examples, see `examples.tex`; compile it with `latexmk -pdf examples.tex`.

Math shortcuts (inside `$...$` or `\[...\]`):

| Commands | Meaning |
| --- | --- |
| `\N`, `\Z`, `\Q`, `\R`, `\CC` | Natural, integer, rational, real, complex numbers |
| `\Prob`, `\E`, `\Var`, `\Cov` | Probability, expectation, variance, covariance |
| `\argmin`, `\argmax` | Minimizer, maximizer |
| `\abs{x}`, `\norm{x}`, `\floor{x}`, `\ceil{x}` | Absolute value, norm, floor, ceiling; add `*` for automatic sizing |

Built with help from OpenAI Codex. Share the source folder without `build/`.
