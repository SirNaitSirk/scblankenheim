# UI Contract: Registration dialog layout

| Viewport | Dialog max width | Contact / Registration columns | Camp input columns | Toggle columns |
| --- | --- | --- | --- | --- |
| < 640 px | full width minus 16 px margin | 1 | 1 | 1 |
| 640 to 1023 px | 672 px | 2 | 2 | 2 |
| ≥ 1024 px | 1024 px | 4 | 3 | 3 |

Rules:

- Textarea fields span the full row from 640 px.
- Toggles render after all input fields, original order kept within each group.
- Header (title, close) and footer (delete or restore, cancel, save) stay fixed; only the body scrolls.
- Field errors and hints stay inside their grid cell.
- No horizontal scrolling at any width.
