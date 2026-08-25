import os
import subprocess
import fitz

def compile_latex():
    print('Compiling XeLaTeX 2-Pass...')
    subprocess.run('xelatex -interaction=nonstopmode G21_Disney_Lorcana_PlayLab_Cloud_Phase2_Report.tex', shell=True, check=True)
    subprocess.run('xelatex -interaction=nonstopmode G21_Disney_Lorcana_PlayLab_Cloud_Phase2_Report.tex', shell=True, check=True)
    print('PDF Compiled Successfully!')

def generate_previews():
    print('Generating page previews...')
    doc = fitz.open('G21_Disney_Lorcana_PlayLab_Cloud_Phase2_Report.pdf')
    for p in [0, 13, 14, 18, 20]:
        if p < len(doc):
            pix = doc[p].get_pixmap(dpi=150)
            pix.save(f'page_{p+1}_preview.png')
            print(f'Saved page_{p+1}_preview.png')

if __name__ == '__main__':
    compile_latex()
    generate_previews()
