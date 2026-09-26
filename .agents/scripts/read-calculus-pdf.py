import pathlib
import pymupdf

out = pathlib.Path(".agents/outputs/calculus-source")
out.mkdir(parents=True, exist_ok=True)
doc = pymupdf.open("attached_assets/calculus-course_1790452344822.pdf")
for number in [0, 21, 23]:
    doc[number].get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5)).save(out / f"page-{number + 1}.png")
(out / "course.txt").write_text("\n\n".join(page.get_text() for page in doc))
print(f"Extracted {len(doc)} pages; rendered pages 1, 22, and 24.")