from pathlib import Path
from zipfile import ZipFile
from PIL import Image, ImageDraw, ImageFont

out = Path('output/study-check'); out.mkdir(parents=True, exist_ok=True)
text = 'Photosynthesis converts light energy into chemical energy stored in glucose. Chlorophyll absorbs light in chloroplasts. Plants use carbon dioxide and water to produce glucose and oxygen. The Calvin cycle occurs in the stroma.'
with ZipFile(out / 'biology.docx', 'w') as archive:
 archive.writestr('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
 archive.writestr('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
 archive.writestr('word/document.xml', f'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{text}</w:t></w:r></w:p></w:body></w:document>')
lines = ['Photosynthesis study notes', 'Photosynthesis converts light energy into chemical energy stored in glucose.', 'Plants use carbon dioxide and water to produce glucose and oxygen.', 'Chlorophyll absorbs light in chloroplasts.', 'The Calvin cycle occurs in the stroma.']
stream = ('BT /F1 12 Tf 50 750 Td ' + ' 0 -24 Td '.join(f'({line}) Tj' for line in lines) + ' ET').encode()
objects = [b'<< /Type /Catalog /Pages 2 0 R >>', b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>', b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', b'<< /Length '+str(len(stream)).encode()+b' >>\nstream\n'+stream+b'\nendstream']
pdf = b'%PDF-1.4\n'; offsets = [0]
for number, obj in enumerate(objects, 1):
 offsets.append(len(pdf)); pdf += f'{number} 0 obj\n'.encode() + obj + b'\nendobj\n'
xref = len(pdf); pdf += f'xref\n0 {len(offsets)}\n0000000000 65535 f \n'.encode()
for offset in offsets[1:]: pdf += f'{offset:010} 00000 n \n'.encode()
pdf += f'trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF'.encode()
(out / 'biology.pdf').write_bytes(pdf)
image = Image.new('RGB', (1300, 400), 'white'); draw = ImageDraw.Draw(image)
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 25)
for index, line in enumerate(lines): draw.text((35, 35 + index * 65), line, font=font, fill='black')
image.save(out / 'biology.png')
print('Created PDF, DOCX, and PNG fixtures.')
