#!/usr/bin/env python3
"""Regenera el icono y el splash de iOS de FinGuide.

Fuente: public/FinGuide_AppIcon_1024.png (el logo oficial de la app).
Genera:
  - ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
    (1024x1024, sin transparencia: la App Store no acepta iconos con alfa.
    El fondo blanco es el mismo que usa el icono de Android.)
  - ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732*.png
    (3 copias iguales, fondo blanco, logo centrado).

Uso (desde la raíz del repo):
    pip3 install Pillow   # solo si no tienes Pillow
    python3 scripts/ios-icons.py

Estos archivos PNG no se pueden subir a GitHub con las herramientas de
este proyecto (solo suben texto), así que se regeneran en la Mac con
este script antes de abrir Xcode por primera vez.
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Falta Pillow. Instálalo con: pip3 install Pillow")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "FinGuide_AppIcon_1024.png"
ICON_OUT = (
    ROOT
    / "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
)
SPLASH_DIR = ROOT / "ios/App/App/Assets.xcassets/Splash.imageset"

if not SRC.exists():
    print(f"No encontré el logo en {SRC}")
    sys.exit(1)

icon = Image.open(SRC).convert("RGBA")

# El logo trae una banda blanca con el escudo y los bordes transparentes.
# Se aplana sobre blanco: así el icono no tiene transparencia.
white_bg = Image.new("RGBA", icon.size, (255, 255, 255, 255))
flat = Image.alpha_composite(white_bg, icon).convert("RGB")

ICON_OUT.parent.mkdir(parents=True, exist_ok=True)
flat.save(ICON_OUT)
print(f"Icono: {ICON_OUT.relative_to(ROOT)} ({flat.size[0]}x{flat.size[1]}, sin transparencia)")

# Splash: lienzo blanco 2732x2732 con el logo centrado.
canvas = Image.new("RGB", (2732, 2732), (255, 255, 255))
logo = flat.copy()
logo.thumbnail((1024, 1024), Image.LANCZOS)
x = (2732 - logo.width) // 2
y = (2732 - logo.height) // 2
canvas.paste(logo, (x, y))
SPLASH_DIR.mkdir(parents=True, exist_ok=True)
for name in ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]:
    canvas.save(SPLASH_DIR / name)
    print(f"Splash: {(SPLASH_DIR / name).relative_to(ROOT)}")

print("Listo. Ya puedes abrir ios/App/App.xcworkspace en Xcode.")
