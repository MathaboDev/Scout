"""
FR5: the student's application summary as a PDF, on Scout letterhead.

build_summary_pdf(...) returns the PDF as bytes. The view in views.py
supplies the data (from the raw summary query in queries.py) and sends
the bytes back as a download.

Uses reportlab's "platypus" layout engine: we build a list of blocks
(paragraphs, tables, spacers) and it flows them onto as many pages as
needed. The letterhead and footer are drawn on every page by _draw_page.
"""

from io import BytesIO
from pathlib import Path

from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

LOGO = Path(__file__).resolve().parent.parent / "core" / "assets" / "scout-logo.png"

BRAND = colors.HexColor("#E16041")  # logo orange
INK = colors.HexColor("#101014")
MUTED = colors.HexColor("#6B6A63")
LINE = colors.HexColor("#E3E1D6")
ZEBRA = colors.HexColor("#F7F6F1")

STATUS_COLOURS = {
    "Submitted": colors.HexColor("#2F5FA0"),
    "Under Review": colors.HexColor("#966B1F"),
    "Outcome Received": colors.HexColor("#3F7A33"),
}

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm
HEADER_H = 34 * mm  # space reserved at the top of every page for the letterhead

_body = ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, leading=13, textColor=INK)
_small = ParagraphStyle("small", parent=_body, fontSize=8.5, leading=11, textColor=MUTED)
_cell = ParagraphStyle("cell", parent=_body, fontSize=8.5, leading=11)
_cell_bold = ParagraphStyle("cellb", parent=_cell, fontName="Helvetica-Bold")
_h2 = ParagraphStyle("h2", parent=_body, fontName="Helvetica-Bold", fontSize=12, leading=16, spaceAfter=6)
_right_small = ParagraphStyle("rs", parent=_small, alignment=TA_RIGHT)


def _esc(value):
    """Escape text for reportlab's mini-HTML (company names can contain '&')."""
    return (str(value or "")).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _date(value, with_time=False):
    if not value:
        return ""
    value = timezone.localtime(value) if timezone.is_aware(value) else value
    return value.strftime("%d %b %Y, %H:%M" if with_time else "%d %b %Y")


class _NumberedCanvas(pdf_canvas.Canvas):
    """Holds every page until the end so the footer can say 'Page 2 of 3'."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._pages = []

    def showPage(self):
        self._pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._pages)
        for state in self._pages:
            self.__dict__.update(state)
            self.setFont("Helvetica", 8)
            self.setFillColor(MUTED)
            self.drawRightString(PAGE_W - MARGIN, 12 * mm, f"Page {self._pageNumber} of {total}")
            super().showPage()
        super().save()


def _draw_page(canvas, doc):
    """Letterhead + footer, drawn on every page."""
    canvas.saveState()

    # orange strip along the very top edge
    canvas.setFillColor(BRAND)
    canvas.rect(0, PAGE_H - 4 * mm, PAGE_W, 4 * mm, stroke=0, fill=1)

    # logo, left
    logo_size = 18 * mm
    top = PAGE_H - 10 * mm
    canvas.drawImage(
        str(LOGO), MARGIN, top - logo_size, logo_size, logo_size, mask="auto", preserveAspectRatio=True
    )

    # organisation lines next to the logo
    x = MARGIN + logo_size + 5 * mm
    canvas.setFillColor(INK)
    canvas.setFont("Helvetica-Bold", 13)
    canvas.drawString(x, top - 7 * mm, "Scout")
    canvas.setFont("Helvetica", 8.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(x, top - 11.5 * mm, "Student opportunity matching")
    canvas.drawString(x, top - 15.5 * mm, "Internships  ·  Learnerships  ·  Graduate programmes")

    # document title, right
    canvas.setFillColor(INK)
    canvas.setFont("Helvetica-Bold", 15)
    canvas.drawRightString(PAGE_W - MARGIN, top - 7 * mm, "Application Summary")
    canvas.setFont("Helvetica", 8.5)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(PAGE_W - MARGIN, top - 11.5 * mm, doc.scout_reference)

    # rule under the letterhead
    canvas.setStrokeColor(BRAND)
    canvas.setLineWidth(1.2)
    rule_y = PAGE_H - HEADER_H + 4 * mm
    canvas.line(MARGIN, rule_y, PAGE_W - MARGIN, rule_y)

    # footer
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN, 16 * mm, PAGE_W - MARGIN, 16 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(
        MARGIN,
        12 * mm,
        "Confidential: contains personal information. Handle in line with POPIA (Act 4 of 2013).",
    )
    canvas.restoreState()


def _totals_table(t):
    tiles = [
        ("Total applications", t["total"]),
        ("Submitted", t["submitted"]),
        ("Under review", t["under_review"]),
        ("Outcome received", t["outcome_received"]),
    ]
    value_style = ParagraphStyle("v", parent=_body, fontName="Helvetica-Bold", fontSize=18, leading=22)
    row = [[Paragraph(str(n), value_style), Paragraph(label, _small)] for label, n in tiles]
    table = Table([row], colWidths=[(PAGE_W - 2 * MARGIN) / 4] * 4)
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LINEAFTER", (0, 0), (-2, -1), 0.6, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def _applications_table(applications):
    header = ["Reference", "Opportunity", "Provider", "Submitted", "Status"]
    rows = [[Paragraph(f"<b>{h}</b>", _small) for h in header]]
    for a in applications:
        status = a["status"]
        if status == "Outcome Received" and a.get("outcome_result"):
            status_text = f"{status}<br/><font color='#6B6A63'>{_esc(a['outcome_result'])}</font>"
        else:
            status_text = _esc(status)
        colour = STATUS_COLOURS.get(a["status"], INK).hexval()[2:]
        rows.append(
            [
                Paragraph(_esc(a["reference_number"]), _cell_bold),
                Paragraph(_esc(a["opportunity_title"]), _cell),
                Paragraph(_esc(a["company_name"]), _cell),
                Paragraph(_date(a["submitted_at"]), _cell),
                Paragraph(f"<font color='#{colour}'><b>{status_text}</b></font>", _cell),
            ]
        )

    width = PAGE_W - 2 * MARGIN
    table = Table(
        rows,
        colWidths=[width * f for f in (0.18, 0.28, 0.21, 0.13, 0.20)],
        repeatRows=1,  # repeat the header row on every page
    )
    style = [
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, INK),
        ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
    ]
    for i in range(2, len(rows), 2):
        style.append(("BACKGROUND", (0, i), (-1, i), ZEBRA))
    table.setStyle(TableStyle(style))
    return table


def build_summary_pdf(*, student_id, student_name, email, generated_at, totals, applications):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        # reportlab pads the text frame by 6pt; subtract it so the content
        # lines up exactly with the letterhead at MARGIN
        leftMargin=MARGIN - 6,
        rightMargin=MARGIN - 6,
        topMargin=HEADER_H + 4 * mm,
        bottomMargin=22 * mm,
        title="Scout application summary",
        author="Scout",
    )
    stamp = timezone.localtime(generated_at)
    doc.scout_reference = f"Ref SUM-{student_id}-{stamp:%Y%m%d}"

    # "prepared for" block: student on the left, date on the right
    meta = Table(
        [
            [
                Paragraph(f"<font color='#6B6A63'>Prepared for</font><br/><b>{_esc(student_name)}</b><br/>{_esc(email)}", _body),
                Paragraph(f"Generated<br/><font color='#101014'><b>{_date(generated_at, True)}</b></font>", _right_small),
            ]
        ],
        colWidths=[(PAGE_W - 2 * MARGIN) * 0.6, (PAGE_W - 2 * MARGIN) * 0.4],
    )
    meta.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))

    t = totals
    story = [
        meta,
        Spacer(1, 8 * mm),
        Paragraph("Overview", _h2),
        _totals_table(t),
        Spacer(1, 3 * mm),
        Paragraph(
            f"Of the outcomes received, <b>{t['successful']}</b> successful and "
            f"<b>{t['unsuccessful']}</b> unsuccessful.",
            _small,
        ),
        Spacer(1, 8 * mm),
        Paragraph("Applications", _h2),
    ]
    if applications:
        story.append(_applications_table(applications))
    else:
        story.append(Paragraph("No applications submitted yet.", _small))

    story += [
        Spacer(1, 8 * mm),
        Paragraph(
            "Statuses are updated by each provider on Scout. For the latest status of any "
            "application, log in to your Scout watchlist.",
            _small,
        ),
    ]

    doc.build(story, onFirstPage=_draw_page, onLaterPages=_draw_page, canvasmaker=_NumberedCanvas)
    return buffer.getvalue()
