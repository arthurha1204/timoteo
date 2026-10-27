"""Monta as imagens da Play Store a partir dos prints brutos do site.

Uso: python scripts/montar_loja.py PASTA_DOS_PRINTS_BRUTOS PASTA_DE_SAIDA
Saída: grafico-1024x500.png (imagem de destaque) e telefone-01..06.png (1080x1920, proporção 9:16).
Fonte: Segoe UI (Windows) ou Arial; ajuste CAMINHOS_FONTE se rodar em outro sistema.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

AZUL = (4, 98, 211)
BRANCO = (255, 255, 255)
CAMINHOS_FONTE = ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf",
                  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/System/Library/Fonts/Helvetica.ttc"]

LEGENDAS = [
    ("cel-01-mapa", "Veja onde evangelizar perto de você"),
    ("cel-03-ficha", "Uma ficha padrão para cada lugar"),
    ("cel-05-lista-eventos", "Eventos abertos a todas as igrejas"),
    ("cel-06-evento-trajeto", "Trajeto no mapa e responsável identificado"),
    ("cel-07-orar", "Ore hoje por um povo"),
    ("cel-08-povos", "Guias por povo, com respeito"),
]


def fonte(tamanho):
    for c in CAMINHOS_FONTE:
        if Path(c).exists():
            return ImageFont.truetype(c, tamanho)
    return ImageFont.load_default()


def quebrar(desenho, texto, f, largura):
    linhas, atual = [], ""
    for palavra in texto.split():
        teste = (atual + " " + palavra).strip()
        if desenho.textlength(teste, font=f) <= largura:
            atual = teste
        else:
            linhas.append(atual)
            atual = palavra
    return linhas + [atual]


def arredondar(img, raio):
    mascara = Image.new("L", img.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle([0, 0, *img.size], radius=raio, fill=255)
    saida = img.convert("RGBA")
    saida.putalpha(mascara)
    return saida


def cruz(desenho, x, y, lado, cor):
    # a mesma cruz do ícone do site (grade de 24)
    pontos = [(10.5, 3), (13.5, 3), (13.5, 9.5), (20, 9.5), (20, 12.5), (13.5, 12.5), (13.5, 21), (10.5, 21), (10.5, 12.5), (4, 12.5), (4, 9.5), (10.5, 9.5)]
    k = lado / 24
    desenho.polygon([(x + px * k, y + py * k) for px, py in pontos], fill=cor)


def grafico(saida):
    img = Image.new("RGB", (1024, 500), AZUL)
    d = ImageDraw.Draw(img)
    cruz(d, 70, 90, 320, (255, 255, 255))
    d.text((430, 140), "Timóteo", font=fonte(110), fill=BRANCO)
    d.text((434, 275), "Evangelizar em conjunto,", font=fonte(40), fill=BRANCO)
    d.text((434, 325), "com respeito.", font=fonte(40), fill=BRANCO)
    img.save(saida / "grafico-1024x500.png")


def telefone(brutos, saida):
    for n, (nome, legenda) in enumerate(LEGENDAS, 1):
        arq = brutos / f"{nome}.png"
        if not arq.exists():
            print("sem print:", arq)
            continue
        tela = Image.open(arq).convert("RGB")
        img = Image.new("RGB", (1080, 1920), AZUL)
        d = ImageDraw.Draw(img)
        f = fonte(66)
        y = 90
        for linha in quebrar(d, legenda, f, 940):
            d.text(((1080 - d.textlength(linha, font=f)) / 2, y), linha, font=f, fill=BRANCO)
            y += 84
        alvo_h = 1920 - 330 - 60
        alvo_w = round(tela.width * alvo_h / tela.height)
        tela = arredondar(tela.resize((alvo_w, alvo_h), Image.LANCZOS), 40)
        img.paste(tela, ((1080 - alvo_w) // 2, 330), tela)
        img.save(saida / f"telefone-{n:02d}.png")


if __name__ == "__main__":
    brutos, saida = Path(sys.argv[1]), Path(sys.argv[2])
    saida.mkdir(parents=True, exist_ok=True)
    grafico(saida)
    telefone(brutos, saida)
    print("imagens da loja em", saida)
