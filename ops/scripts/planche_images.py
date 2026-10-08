"""planche_images.py DOSSIER MOTIF COLONNES LARGEUR SORTIE — planche de vignettes titrées (choix d'images)."""
import glob, os, sys
from PIL import Image, ImageDraw, ImageFont
dossier, motif, cols, W, sortie = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
fs = sorted(p for p in glob.glob(f'{dossier}/{motif}') if not p.endswith('.txt'))
H = W * 9 // 16
f = ImageFont.truetype('arial.ttf', 16)
rows = (len(fs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (W + 6), rows * (H + 26)), (20, 20, 20)); d = ImageDraw.Draw(sheet)
for i, p in enumerate(fs):
    im = Image.open(p).convert('RGB')
    im = im.resize((W, H), Image.LANCZOS)
    x, y = (i % cols) * (W + 6), (i // cols) * (H + 26)
    sheet.paste(im, (x, y + 26)); d.text((x + 4, y + 4), os.path.basename(p).rsplit('.', 1)[0], fill=(255, 255, 255), font=f)
sheet.save(sortie, quality=88); print(sortie, sheet.size, len(fs))
