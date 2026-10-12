from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from pypdf import PdfReader
import pymupdf
root=Path(__file__).resolve().parents[1]
target=root/'output/pdf/northstar-invoice.pdf'
target.parent.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(target),pagesize=(612,792),invariant=1)
c.setTitle('Synthetic Northstar invoice DEMO-1042')
c.setFillColor(HexColor('#b9253f'));c.rect(0,740,612,52,fill=1,stroke=0)
c.setFillColor(HexColor('#ffffff'));c.setFont('Helvetica-Bold',16);c.drawString(48,759,'NORTHSTAR CONSULTING')
c.setFillColor(HexColor('#26384a'));c.setFont('Helvetica-Bold',26);c.drawString(48,680,'Invoice DEMO-1042')
c.setFont('Helvetica',12);c.drawString(48,648,'Prepared for Avery Morgan')
c.drawString(48,628,'Due date: November 15, 2026')
c.setStrokeColor(HexColor('#dce3e9'));c.line(48,598,564,598)
for y,title,amount in [(560,'Consultation','$300.00'),(520,'Preparation','$125.00')]:
 c.drawString(48,y,title);c.drawRightString(564,y,amount)
c.line(48,490,564,490);c.setFont('Helvetica-Bold',18);c.drawString(48,455,'Total');c.drawRightString(564,455,'$425.00')
c.setFont('Helvetica-Bold',12);c.setFillColor(HexColor('#b9253f'));c.drawString(48,365,'FICTIONAL DEVELOPER SAMPLE')
c.setFont('Helvetica',11);c.setFillColor(HexColor('#526579'))
c.drawString(48,343,'Not a payment request. No real customer, invoice, account or banking data.')
c.drawString(48,324,'This file is a safe inline attachment for an explicitly authorized SMTP test.')
c.showPage();c.save()
assert len(PdfReader(target).pages)==1
assert 'DEMO-1042' in PdfReader(target).pages[0].extract_text()
(root/'public/assets/northstar-invoice.pdf').write_bytes(target.read_bytes())
icon=pymupdf.open(stream=(root/'public/assets/email-icon.svg').read_bytes(),filetype='svg')
page=icon[0]
page.get_pixmap(matrix=pymupdf.Matrix(96/page.rect.width,96/page.rect.height),alpha=True).save(str(root/'public/assets/email-inline.png'))
print('Synthetic PDF and rasterized official icon created; no credentials or private documents')
