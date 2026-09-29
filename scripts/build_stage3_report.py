"""Build the Stage 3 report: one LaTeX source -> PDF (xelatex, 2 passes) and DOCX (pandoc).

Usage: python scripts/build_stage3_report.py
Needs: xelatex (MiKTeX/TeX Live with TH Sarabun New), pandoc, python-docx.
Output: docs/01_Reports/G21_Disney_Lorcana_PlayLab_Cloud_Phase3_Report.{pdf,docx}
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from docx.shared import Pt

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / "docs" / "01_Reports"
STEM = "G21_Disney_Lorcana_PlayLab_Cloud_Phase3_Report"
THAI_FONT = "TH Sarabun New"


def run(cmd, cwd, log):
    print("$", " ".join(str(c) for c in cmd))
    res = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    log.write_text((res.stdout or "") + (res.stderr or ""), encoding="utf-8")
    if res.returncode != 0:
        print(f"FAILED (exit {res.returncode}); see {log}")
        sys.exit(res.returncode)


def thai_reference_docx(dest: Path, tmp: Path):
    """pandoc's default reference.docx with Thai-capable fonts (the w:cs attribute is what Word uses for Thai)."""
    base = tmp / "default_reference.docx"
    with open(base, "wb") as f:
        subprocess.run(["pandoc", "--print-default-data-file", "reference.docx"], stdout=f, check=True)
    doc = Document(str(base))
    sizes = {"Normal": 16, "Body Text": 16, "First Paragraph": 16, "Compact": 16, "Heading 1": 24, "Heading 2": 20, "Heading 3": 18, "Title": 26}
    for st in doc.styles:
        if st.type != 1:  # paragraph styles only
            continue
        st.font.name = THAI_FONT
        rpr = st.element.get_or_add_rPr()
        rfonts = rpr.find(qn("w:rFonts"))
        if rfonts is None:
            rfonts = rpr.makeelement(qn("w:rFonts"), {})
            rpr.append(rfonts)
        for attr in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
            rfonts.set(qn(attr), THAI_FONT)
        if st.name in sizes:
            st.font.size = Pt(sizes[st.name])
    doc.save(str(dest))


def main():
    tex = REPORTS / f"{STEM}.tex"
    if not tex.exists():
        sys.exit(f"missing {tex}")
    with tempfile.TemporaryDirectory(prefix="lorcana_report_") as t:
        tmp = Path(t)

        # 1) PDF: two xelatex passes so the table of contents and \ref numbers settle
        for i in (1, 2):
            run(["xelatex", "-interaction=nonstopmode", "-halt-on-error", f"-output-directory={tmp}", tex.name], REPORTS, tmp / f"xelatex{i}.log")
        shutil.copyfile(tmp / f"{STEM}.pdf", REPORTS / f"{STEM}.pdf")

        # 2) DOCX from the same source
        ref = tmp / "reference.docx"
        thai_reference_docx(ref, tmp)
        run(
            ["pandoc", tex.name, "-f", "latex", "-t", "docx", "--toc", "--toc-depth=2", f"--reference-doc={ref}", f"--resource-path={REPORTS}", "-o", str(REPORTS / f"{STEM}.docx")],
            REPORTS,
            tmp / "pandoc.log",
        )
    for ext in ("pdf", "docx"):
        p = REPORTS / f"{STEM}.{ext}"
        print(f"[OK] {p} ({p.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
