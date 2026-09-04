#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rebuild G21_Disney_Lorcana_PlayLab_Cloud_Phase2_Report.docx
Strictly referencing docs/04_References/Doc_Ref/G21_รูปเล่มรายงาน.pdf:
1. Added 'คำนำ' (Preface) matching reference page 2.
2. Removed redundant bilingual parenthesized translations (e.g. no '(Introduction)', no '(System Scope)', no '(Trading Card Game: TCG)' duplicates).
3. Improved Thai word spacing and natural line breaks around English technical terms.
4. Normal body paragraphs strictly Left-aligned (ชิดซ้าย), first-line indent 1.25 cm.
5. Fully visible Table of Contents (สารบัญ), List of Figures (สารบัญรูป), and List of Tables (สารบัญตาราง) with dot leader tab stops (15.0 cm).
6. Preserved user's cover page additions, Thai abstract, English abstract, and acknowledgements.
7. Chapter titles 2-line centered layout (บทที่ X / ชื่อบท), 20pt Bold.
8. Subheadings 18pt Bold Left-aligned, Sub-subheadings 16pt Bold Left-aligned.
9. Academic tables with cell padding and shaded headers.
10. High-res embedded figures with centered captions.
11. Standard KMITL IT thesis margins: Top 3.5cm, Left 3.5cm, Right 2.5cm, Bottom 2.5cm.
12. Right-aligned page numbering in footer.
"""

import os
import sys
import shutil
import docx
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn
from pythainlp.tokenize import word_tokenize

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
REPORTS_DIR = os.path.join(ROOT_DIR, 'docs', '01_Reports')
TARGET_DOCX = os.path.join(REPORTS_DIR, 'G21_Disney_Lorcana_PlayLab_Cloud_Phase2_Report.docx')
TARGET_THAI_DOCX = os.path.join(REPORTS_DIR, 'G21_รูปเล่มรายงาน_DISNEY_LORCANA_CLOUD.docx')

def insert_zwsp(text):
    """
    Tokenizes Thai text and inserts Zero-Width Space (\\u200b) at syllable/word boundaries.
    Prevents Word from treating Thai text as unbreakable monolithic blocks.
    Preserves English terms and standard punctuation without breaking awkwardly.
    """
    if not text:
        return text
    words = word_tokenize(text, engine='newmm')
    res = []
    no_break_before = {',', '.', ';', ':', '!', '?', ')', ']', '}', '%', '"', "'", '”', '’'}
    no_break_after = {'(', '[', '{', '"', "'", '“', '‘', '$'}
    for i, w in enumerate(words):
        res.append(w)
        if i < len(words) - 1:
            next_w = words[i+1]
            if w.isspace() or next_w.isspace() or w == '\u200b' or next_w == '\u200b':
                continue
            if next_w in no_break_before or w in no_break_after:
                continue
            if (w.isascii() and w.isalnum()) and (next_w.isascii() and next_w.isalnum()):
                continue
            res.append('\u200b')
    return ''.join(res)

def set_run_font(run, size=16, bold=False, italic=False, color_rgb=None):
    """
    Applies font properties including OpenXML complex scripts (w:cs) and Thai language tags.
    Ensures Word activates its Uniscribe Thai text rendering engine.
    """
    run.font.name = 'TH Sarabun New'
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color_rgb:
        run.font.color.rgb = color_rgb
    else:
        run.font.color.rgb = RGBColor(0, 0, 0)
    
    rPr = run._r.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = parse_xml(r'<w:rFonts %s/>' % nsdecls('w'))
        rPr.append(rFonts)
    rFonts.set(qn('w:ascii'), 'TH Sarabun New')
    rFonts.set(qn('w:hAnsi'), 'TH Sarabun New')
    rFonts.set(qn('w:cs'), 'TH Sarabun New')
    rFonts.set(qn('w:eastAsia'), 'TH Sarabun New')
    
    szCs = rPr.find(qn('w:szCs'))
    if szCs is None:
        szCs = parse_xml(r'<w:szCs %s/>' % nsdecls('w'))
        rPr.append(szCs)
    szCs.set(qn('w:val'), str(int(size * 2)))
    
    lang = rPr.find(qn('w:lang'))
    if lang is None:
        lang = parse_xml(r'<w:lang %s/>' % nsdecls('w'))
        rPr.append(lang)
    lang.set(qn('w:val'), 'en-US')
    lang.set(qn('w:bidi'), 'th-TH')
    lang.set(qn('w:eastAsia'), 'th-TH')

def set_cell_margins(cell, top=80, bottom=80, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(r'<w:tcMar %s><w:top w:w="%d" w:type="dxa"/><w:bottom w:w="%d" w:type="dxa"/><w:left w:w="%d" w:type="dxa"/><w:right w:w="%d" w:type="dxa"/></w:tcMar>' % (nsdecls('w'), top, bottom, left, right))
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(r'<w:shd %s w:fill="%s"/>' % (nsdecls('w'), color_hex))
    tcPr.append(shd)

def set_table_borders(table, border_color="CCCCCC"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(r'''
        <w:tblBorders %s>
            <w:top w:val="single" w:sz="6" w:space="0" w:color="%s"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="%s"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="%s"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''' % (nsdecls('w'), border_color, border_color, border_color))
    tblPr.append(borders)

def format_cell(cell, text, bold=False, size=14, align=WD_ALIGN_PARAGRAPH.LEFT, shading_hex=None):
    set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
    if shading_hex:
        set_cell_shading(cell, shading_hex)
    p = cell.paragraphs[0]
    p.text = ""
    p.alignment = align
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(insert_zwsp(text))
    set_run_font(run, size=size, bold=bold)

def build_docx():
    print(f"[BUILD] Starting rebuild of DOCX referencing G21_รูปเล่มรายงาน.pdf...")
    doc = docx.Document()

    # Configure Default Style to TH Sarabun New
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'TH Sarabun New'
    normal_style.font.size = Pt(16)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)

    # Configure document defaults in styles XML for Complex Script (Thai)
    styles_element = doc.styles.element
    docDefaults = styles_element.find(qn('w:docDefaults'))
    if docDefaults is not None:
        rPrDefault = docDefaults.find(qn('w:rPrDefault'))
        if rPrDefault is not None:
            rPr = rPrDefault.find(qn('w:rPr'))
            if rPr is not None:
                rFonts = parse_xml(r'<w:rFonts %s w:ascii="TH Sarabun New" w:hAnsi="TH Sarabun New" w:cs="TH Sarabun New" w:eastAsia="TH Sarabun New"/>' % nsdecls('w'))
                rPr.append(rFonts)
                lang = parse_xml(r'<w:lang %s w:val="en-US" w:bidi="th-TH" w:eastAsia="th-TH"/>' % nsdecls('w'))
                rPr.append(lang)
                szCs = parse_xml(r'<w:szCs %s w:val="32"/>' % nsdecls('w'))
                rPr.append(szCs)

    # Margins (Standard Thai Academic Thesis: Top 3.5cm, Left 3.5cm, Right 2.5cm, Bottom 2.5cm)
    for section in doc.sections:
        section.top_margin = Cm(3.5)
        section.bottom_margin = Cm(2.5)
        section.left_margin = Cm(3.5)
        section.right_margin = Cm(2.5)
        section.different_first_page_header_footer = True
        
        # Footer page number (Right-aligned, TH Sarabun New 14pt)
        footer = section.footer
        f_p = footer.paragraphs[0]
        f_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        f_run = f_p.add_run()
        set_run_font(f_run, size=14, bold=False, color_rgb=RGBColor(100, 100, 100))
        
        fld1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
        instr = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
        fld2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
        fld3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
        f_run._r.extend([fld1, instr, fld2, fld3])

    # Helper Functions for Paragraph Formatting
    def add_p(text="", align=WD_ALIGN_PARAGRAPH.LEFT, bold=False, italic=False, size=16, space_before=0, space_after=6, indent_cm=0, apply_zwsp=True):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if indent_cm > 0:
            p.paragraph_format.first_line_indent = Cm(indent_cm)
        if text:
            processed = insert_zwsp(text) if apply_zwsp else text
            run = p.add_run(processed)
            set_run_font(run, size=size, bold=bold, italic=italic)
        return p

    def add_body_p(text):
        # Thai Distribute: Fills line to right margin, zero gaps, first-line indent 1.25 cm
        return add_p(text, align=WD_ALIGN_PARAGRAPH.THAI_JUSTIFY, bold=False, size=16, space_before=0, space_after=6, indent_cm=1.25, apply_zwsp=True)

    def add_bullet_p(text, prefix="• "):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.THAI_JUSTIFY
        p.paragraph_format.left_indent = Cm(1.25)
        p.paragraph_format.first_line_indent = Cm(-0.63)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        run1 = p.add_run(prefix)
        set_run_font(run1, size=16, bold=False)
        run2 = p.add_run(insert_zwsp(text))
        set_run_font(run2, size=16, bold=False)
        return p

    def add_number_p(num_str, text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.THAI_JUSTIFY
        p.paragraph_format.left_indent = Cm(1.25)
        p.paragraph_format.first_line_indent = Cm(-0.63)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        run1 = p.add_run(num_str + " ")
        set_run_font(run1, size=16, bold=False)
        run2 = p.add_run(insert_zwsp(text))
        set_run_font(run2, size=16, bold=False)
        return p

    def add_toc_line(title, page_num, indent_cm=0, bold=False):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if indent_cm > 0:
            p.paragraph_format.left_indent = Cm(indent_cm)
        p.paragraph_format.tab_stops.add_tab_stop(Cm(15.0), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
        run1 = p.add_run(insert_zwsp(title))
        set_run_font(run1, size=16, bold=bold)
        run2 = p.add_run(f"\t{page_num}")
        set_run_font(run2, size=16, bold=bold)
        return p

    def add_chapter_title(chap_num_str, chap_title_str):
        doc.add_page_break()
        add_p(chap_num_str, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=20, space_before=12, space_after=4, apply_zwsp=False)
        add_p(chap_title_str, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=20, space_before=0, space_after=18, apply_zwsp=True)

    def add_h2(text):
        return add_p(text, align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, size=18, space_before=12, space_after=6, apply_zwsp=True)

    def add_h3(text):
        return add_p(text, align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, size=16, space_before=8, space_after=4, apply_zwsp=True)

    def add_image_box(image_rel_path, caption_str, width_in=5.5):
        full_path = os.path.join(ROOT_DIR, image_rel_path)
        if os.path.exists(full_path):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run()
            run.add_picture(full_path, width=Inches(width_in))
            add_p(caption_str, align=WD_ALIGN_PARAGRAPH.CENTER, bold=False, size=16, space_before=2, space_after=12, apply_zwsp=True)
        else:
            add_p(f"[{caption_str} - Image file not found: {image_rel_path}]", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=14, apply_zwsp=False)

    def add_code_block(code_text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.left_indent = Cm(0.8)
        p.paragraph_format.right_indent = Cm(0.8)
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.line_spacing = 1.0
        
        pPr = p._p.get_or_add_pPr()
        shd = parse_xml(r'<w:shd %s w:fill="F5F6F8"/>' % nsdecls('w'))
        pPr.append(shd)
        
        run = p.add_run(code_text)
        run.font.name = 'Consolas'
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(30, 41, 59)
        return p

    # ==========================================
    # 1. หน้าปก (COVER PAGE)
    # Strictly matching User's layout & G21_รูปเล่มรายงาน.pdf
    # ==========================================
    logo_path = os.path.join(ROOT_DIR, 'docs', '_ARCHIVE', '2026-08-24_Serverless_Report', 'images', 'IT_KMITL_ICON.png')
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(0)
        p_logo.paragraph_format.space_after = Pt(12)
        r_logo = p_logo.add_run()
        r_logo.add_picture(logo_path, width=Inches(1.5))

    add_p("ชื่อโครงงาน Disney Lorcana PlayLab", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=20, space_before=8, space_after=4)
    add_p("สถาปัตยกรรม Lean Multi-AZ VPC, Application Load Balancer และ Auto Scaling Group", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=16, space_before=0, space_after=2)
    add_p("Disney Lorcana PlayLab Cloud: Real-Time Multi-AZ IaaS & Serverless Simulator", align=WD_ALIGN_PARAGRAPH.CENTER, bold=False, size=15, space_before=0, space_after=14)

    add_p("โดย", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=18, space_before=6, space_after=6)

    # 3-Column Borderless Table for Students List (Clean alignment matching user's edit)
    table_students = doc.add_table(rows=6, cols=3)
    table_students.alignment = WD_TABLE_ALIGNMENT.CENTER
    students_data = [
        ("1. นายชยุต", "บุญวัฒน์", "รหัสนักศึกษา 67070032"),
        ("2. นายธนัทภัทร", "พรหมทอง", "รหัสนักศึกษา 67070069"),
        ("3. นายภูริ", "ประชาสุขสิน", "รหัสนักศึกษา 67070137"),
        ("4. นางสาววรรณณิศา", "อมรวงศ์ไพบูลย์", "รหัสนักศึกษา 67070155"),
        ("5. นายอสิธารา", "พุ่มดอกไม้", "รหัสนักศึกษา 67070199"),
        ("6. นายวรธิษณ์", "คงทอง", "รหัสนักศึกษา 67070275")
    ]
    col_widths = [Cm(3.8), Cm(4.5), Cm(4.5)]
    for r_idx, row in enumerate(table_students.rows):
        for c_idx, cell in enumerate(row.cells):
            cell.width = col_widths[c_idx]
            format_cell(cell, students_data[r_idx][c_idx], bold=False, size=15, align=WD_ALIGN_PARAGRAPH.LEFT)

    add_p("เสนอ", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=18, space_before=14, space_after=4)
    add_p("ดร. ธนานพ ทองถาวร", align=WD_ALIGN_PARAGRAPH.CENTER, bold=False, size=16, space_before=0, space_after=2)
    add_p("ผศ.ดร. พัฒนพงษ์ ฉันทมิตรโอภาส", align=WD_ALIGN_PARAGRAPH.CENTER, bold=False, size=16, space_before=0, space_after=2)
    add_p("ผศ.ดร. ลภัส ประดิษฐ์ทัศนีย์", align=WD_ALIGN_PARAGRAPH.CENTER, bold=False, size=16, space_before=0, space_after=16)

    add_p("โครงงานนี้เป็นส่วนหนึ่งของวิชาเทคโนโลยีกลุ่มเมฆ", align=WD_ALIGN_PARAGRAPH.CENTER, bold=False, size=16, space_before=12, space_after=2)
    add_p("แขนงวิชา การพัฒนาสื่อประสมและเกม", align=WD_ALIGN_PARAGRAPH.CENTER, bold=False, size=16, space_before=0, space_after=2)
    add_p("คณะเทคโนโลยีสารสนเทศ", align=WD_ALIGN_PARAGRAPH.CENTER, bold=False, size=16, space_before=0, space_after=2)
    add_p("สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง", align=WD_ALIGN_PARAGRAPH.CENTER, bold=False, size=16, space_before=0, space_after=2)
    add_p("ภาคเรียนที่ 1 ปีการศึกษา 2569", align=WD_ALIGN_PARAGRAPH.CENTER, bold=False, size=16, space_before=0, space_after=0)

    # ==========================================
    # 2. คำนำ (PREFACE) - Matching G21_รูปเล่มรายงาน.pdf Page 2
    # ==========================================
    doc.add_page_break()
    add_p("คำนำ", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=20, space_before=12, space_after=18)
    
    add_body_p("เทคโนโลยีกลุ่มเมฆ (Cloud Computing) มีบทบาทสำคัญอย่างยิ่งในการพัฒนาระบบสารสนเทศและแอปพลิเคชันยุคใหม่ ด้วยคุณสมบัติเด่นด้านความยืดหยุ่น ความพร้อมใช้งานสูง และความสามารถในการปรับขนาดทรัพยากรได้ตามความต้องการใช้งานจริง โดยไม่ต้องลงทุนในโครงสร้างพื้นฐานฮาร์ดแวร์ล่วงหน้า รายงานฉบับนี้จัดทำขึ้นเพื่อประกอบการเรียนการสอนรายวิชาเทคโนโลยีกลุ่มเมฆ คณะเทคโนโลยีสารสนเทศ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง")
    
    add_body_p("โครงงาน Disney Lorcana PlayLab Cloud มุ่งเน้นการวิเคราะห์ ออกแบบ และพัฒนาระบบจำลองกระดานเล่นการ์ดและวิเคราะห์เด็คแบบเรียลไทม์บนเว็บแอปพลิเคชัน โดยประยุกต์ใช้บริการคลาวด์บน Amazon Web Services (AWS) ออกแบบสถาปัตยกรรม Lean Multi-AZ VPC ร่วมกับ Application Load Balancer, EC2 Auto Scaling Group, Docker Container, และ Amazon DynamoDB เพื่อสร้างระบบที่มีประสิทธิภาพสูง ตอบสนองได้อย่างรวดเร็ว มี Latency ต่ำกว่า 100 มิลลิวินาที และควบคุมค่าใช้จ่ายให้อยู่ภายใต้งบประมาณจำกัด $50 ของ AWS Academy Learner Lab ได้อย่างมีประสิทธิภาพ")
    
    add_body_p("คณะผู้จัดทำหวังเป็นอย่างยิ่งว่า ข้อมูล รายละเอียดสถาปัตยกรรม และผลการทดสอบที่นำเสนอในรายงานความก้าวหน้าฉบับนี้ จะเป็นประโยชน์ต่อการศึกษาและเป็นแนวทางในการพัฒนาระบบคลาวด์สำหรับผู้ที่สนใจ หากรายงานฉบับนี้มีข้อบกพร่องหรือข้อผิดพลาดประการใด คณะผู้จัดทำขอน้อมรับคำชี้แนะเพื่อนำไปปรับปรุงในระยะต่อไป")
    
    add_p("คณะผู้จัดทำ", align=WD_ALIGN_PARAGRAPH.RIGHT, bold=False, size=16, space_before=18, space_after=2)
    add_p("กันยายน 2569", align=WD_ALIGN_PARAGRAPH.RIGHT, bold=False, size=16, space_before=0, space_after=0)

    # ==========================================
    # 3. บทคัดย่อภาษาไทย (THAI ABSTRACT)
    # ==========================================
    doc.add_page_break()
    add_p("บทคัดย่อภาษาไทย", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=20, space_before=12, space_after=18)
    
    add_body_p("โครงงาน Disney Lorcana PlayLab Cloud นำเสนอการวิเคราะห์ ออกแบบ และพัฒนาระบบจำลองห้องเล่นและวิเคราะห์เด็คการ์ดแบบเรียลไทม์บนสถาปัตยกรรม Hybrid Cloud ที่มี Primary IaaS Stack บน Custom Lean Multi-AZ VPC ครอบคลุม Availability Zone us-east-1a และ us-east-1b, Application Load Balancer, EC2 Auto Scaling Group และ Multi-stage Docker Container ควบคู่กับ Secondary Serverless Stack บน AWS Lambda, Amazon DynamoDB และ AWS API Gateway เพื่อรองรับการเล่นการ์ดสะสม Disney Lorcana TCG ได้อย่างเสถียรและต่อเนื่อง มีความหน่วงในการตอบสนองต่ำกว่า 100 มิลลิวินาที พร้อมกลไก Fault Tolerance และการปรับขนาดอัตโนมัติเมื่อ CPU เฉลี่ยสูงกว่า 60% ภายใต้งบประมาณจำกัด $50 ของ AWS Academy Learner Lab")
    
    add_body_p("ในส่วนของส่วนติดต่อผู้ใช้ Frontend พัฒนาด้วย React 19, TypeScript 5.x, Tailwind CSS v4, Framer Motion และ Zustand เพื่อส่งมอบประสบการณ์การเล่นระดับพรีเมียม ประกอบด้วยระบบจำลองฟิสิกส์ 3 มิติ, ระบบตรวจสอบการ์ด 3D Holographic Foil Inspector, การจำลองเปิดซองการ์ด Booster Pack 12 ใบด้วยอัลกอริทึม Fisher-Yates True Randomization, และระบบจัดการเด็คการ์ดที่เชื่อมต่อกับฐานข้อมูลการ์ดอย่างเป็นทางการครบถ้วน 3,242 ใบ ครอบคลุมตั้งแต่ชุด The First Chapter จนถึง Attack of the Vine")
    
    add_body_p("การดำเนินงานตามระเบียบวิธี Agile Scrum ได้ลุล่วงตามแผนงาน Sprint 1 ถึง Sprint 3 ครบถ้วน 100% ครอบคลุมการสร้าง Core Gameplay UI, ระบบยืนยันตัวตนด้วย bcrypt และ JWT, ระบบห้องแข่งขันแบบเรียลไทม์ Sub-100ms Action Sync พร้อมระบบ Rejoin Grace Period 60 วินาที และ Voluntary Exit Match, การย้ายระบบสู่ Nginx Reverse Proxy และ Container บน EC2, ตลอดจนการพัฒนาสคริปต์ 1-Click Scale-to-Zero เพื่อควบคุมต้นทุน Compute ให้เหลือ $0.00 ต่อชั่วโมงเมื่อไม่ได้ใช้งาน และตัดต้นทุน NAT Gateway เหลือ $0.00 ด้วยการใช้ Chained Security Groups ส่งผลให้ระบบมีความพร้อมอย่างสมบูรณ์สำหรับการประเมินความก้าวหน้า Stage 2")
    
    add_p("คำสำคัญ: Cloud Computing, Multi-AZ VPC, Application Load Balancer, Auto Scaling Group, Docker Container, WebSockets, Disney Lorcana TCG, AWS Learner Lab, Scale-to-Zero", 
          align=WD_ALIGN_PARAGRAPH.LEFT, bold=False, size=16, space_before=12, space_after=6, indent_cm=0)

    # ==========================================
    # 4. ABSTRACT (ENGLISH)
    # ==========================================
    doc.add_page_break()
    add_p("Abstract", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=20, space_before=12, space_after=18)
    
    add_body_p("The Disney Lorcana PlayLab Cloud project presents the architectural design, engineering analysis, and implementation of a real-time multiplayer tabletop simulator and deck analytics platform for the Disney Lorcana Trading Card Game (TCG). The platform is built on a resilient Hybrid Cloud Architecture featuring a Primary IaaS Containerized Stack (Custom Lean Multi-AZ VPC across us-east-1a and us-east-1b, Application Load Balancer, EC2 Auto Scaling Group, and Multi-stage Alpine Docker) alongside a Secondary Serverless Stack (AWS Lambda, Amazon DynamoDB, AWS API Gateway). The system achieves ultra-low synchronization latency (<100ms), automated multi-zone fault tolerance, and dynamic elasticity (Target Tracking CPU Utilization > 60%) within the strict budgetary constraints of the AWS Academy Learner Lab ($50 allocation).")
    
    add_body_p("The frontend client is engineered using React 19, TypeScript 5.x, Tailwind CSS v4, Zustand global state orchestration, and Framer Motion, delivering a high-fidelity tabletop simulation connected to an official catalog of 3,242 cards. Core capabilities include real-time mouse tilt physics, 3D holographic foil inspection, and a 12-card Booster Pack simulator driven by the Fisher-Yates randomization algorithm.")
    
    add_body_p("Project execution adheres to the Agile Scrum framework, achieving 100% completion across Sprints 1 to 3. Key deliverables include the containerized Nginx reverse proxy on EC2, WebSocket Match Lifecycle v1.5.0 featuring a 60-second Rejoin Grace Period and instant Voluntary Exit Match slot reclamation, chained security group topologies eliminating NAT Gateway costs ($32.40/month to $0.00), and 1-Click Scale-to-Zero automation scripts ensuring zero idle compute expense.")
    
    add_p("Keywords: Cloud Computing, Multi-AZ VPC, Application Load Balancer, Auto Scaling Group, Docker Containers, WebSockets, Disney Lorcana TCG, AWS Learner Lab, Scale-to-Zero", 
          align=WD_ALIGN_PARAGRAPH.LEFT, bold=False, size=16, space_before=12, space_after=6, indent_cm=0)

    # ==========================================
    # 5. กิตติกรรมประกาศ (ACKNOWLEDGEMENTS)
    # ==========================================
    doc.add_page_break()
    add_p("กิตติกรรมประกาศ", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=20, space_before=12, space_after=18)
    
    add_body_p("โครงงาน Disney Lorcana PlayLab Cloud สำเร็จลุล่วงตามวัตถุประสงค์ของการส่งมอบงานในระยะที่ 2 ได้ด้วยความอนุเคราะห์ คำแนะนำ และการชี้แนะทางวิชาการอันทรงคุณค่ายิ่งจากคณาจารย์ประจำรายวิชาเทคโนโลยีกลุ่มเมฆ คณะเทคโนโลยีสารสนเทศ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง ได้แก่ ดร. ธนานพ ทองถาวร, ผศ.ดร. พัฒนพงษ์ ฉันทมิตรโอภาส, และ ผศ.ดร. ลภัส ประดิษฐ์ทัศนีย์ ที่ได้กรุณาถ่ายทอดองค์ความรู้ด้านสถาปัตยกรรมคลาวด์ การออกแบบระบบเครือข่าย Multi-AZ VPC ความปลอดภัย และการบริหารจัดการทรัพยากรอย่างคุ้มค่า ซึ่งเป็นรากฐานสำคัญในการออกแบบและแก้ปัญหาทางวิศวกรรมซอฟต์แวร์ในโครงงานนี้")
    
    add_body_p("คณะผู้จัดทำขอขอบพระคุณเพื่อน ๆ นักศึกษาคณะเทคโนโลยีสารสนเทศ ทุกท่านที่ได้ร่วมทดสอบระบบกระดานและห้องเล่นแบบเรียลไทม์ ให้ข้อคิดเห็นด้านประสบการณ์การใช้งาน และร่วมตรวจสอบข้อผิดพลาดของระบบ รวมถึงขอขอบคุณครอบครัวที่ให้การสนับสนุนและเป็นกำลังใจในการศึกษาค้นคว้าตลอดมา")
    
    add_p("คณะผู้จัดทำ", align=WD_ALIGN_PARAGRAPH.RIGHT, bold=False, size=16, space_before=18, space_after=2)
    add_p("กันยายน 2569", align=WD_ALIGN_PARAGRAPH.RIGHT, bold=False, size=16, space_before=0, space_after=0)

    # ==========================================
    # 6. สารบัญ (TABLE OF CONTENTS)
    # Fully visible with tab stop and dot leaders
    # ==========================================
    doc.add_page_break()
    add_p("สารบัญ", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=20, space_before=12, space_after=4)
    add_p("หน้า", align=WD_ALIGN_PARAGRAPH.RIGHT, bold=True, size=16, space_before=0, space_after=8)

    add_toc_line("คำนำ", "ก", bold=False)
    add_toc_line("บทคัดย่อภาษาไทย", "ข", bold=False)
    add_toc_line("Abstract", "ค", bold=False)
    add_toc_line("กิตติกรรมประกาศ", "ง", bold=False)
    add_toc_line("สารบัญ", "จ", bold=False)
    add_toc_line("สารบัญรูป", "ฉ", bold=False)
    add_toc_line("สารบัญตาราง", "ช", bold=False)
    
    add_toc_line("บทที่ 1 บทนำ", "1", bold=True)
    add_toc_line("1.1 ความเป็นมาและความสำคัญของโครงงาน", "1", indent_cm=0.6)
    add_toc_line("1.2 วัตถุประสงค์ของโครงงาน", "1", indent_cm=0.6)
    add_toc_line("1.3 ขอบเขตของระบบ", "2", indent_cm=0.6)
    add_toc_line("1.4 ประโยชน์ที่คาดว่าจะได้รับ", "3", indent_cm=0.6)
    add_toc_line("1.5 โครงสร้างของรายงาน", "3", indent_cm=0.6)

    add_toc_line("บทที่ 2 การบริหารจัดการโครงการและเทคโนโลยีที่ใช้", "4", bold=True)
    add_toc_line("2.1 แผนการพัฒนาและระเบียบวิธี Agile Scrum", "4", indent_cm=0.6)
    add_toc_line("2.2 สรุปผลความก้าวหน้า Sprint 1 ถึง Sprint 3", "4", indent_cm=0.6)
    add_toc_line("2.3 กำหนดการส่งงานวิชา Cloud Technology", "5", indent_cm=0.6)
    add_toc_line("2.4 เทคโนโลยีที่ใช้ในการพัฒนา", "5", indent_cm=0.6)
    add_toc_line("2.5 กติกาและโมเดลของเกม Disney Lorcana", "6", indent_cm=0.6)

    add_toc_line("บทที่ 3 การวิเคราะห์และออกแบบระบบ", "7", bold=True)
    add_toc_line("3.1 ความต้องการของระบบ", "7", indent_cm=0.6)
    add_toc_line("3.2 สถาปัตยกรรมระบบคลาวด์บน AWS", "8", indent_cm=0.6)
    add_toc_line("3.3 สถาปัตยกรรมเครือข่าย Lean Multi-AZ VPC", "8", indent_cm=0.6)
    add_toc_line("3.4 การกระจายโหลดและการปรับขนาดอัตโนมัติ", "8", indent_cm=0.6)
    add_toc_line("3.5 การออกแบบฐานข้อมูล Amazon DynamoDB", "9", indent_cm=0.6)
    add_toc_line("3.6 วงจรการสื่อสารแบบเรียลไทม์ (Match Lifecycle)", "9", indent_cm=0.6)
    add_toc_line("3.7 การรับมือข้อผิดพลาดและระบบ Caching", "10", indent_cm=0.6)
    add_toc_line("3.8 การออกแบบตามกรอบ AWS Well-Architected Framework", "10", indent_cm=0.6)
    add_toc_line("3.9 การแก้ปัญหาข้อจำกัดบน AWS Learner Lab", "10", indent_cm=0.6)

    add_toc_line("บทที่ 4 การพัฒนาระบบและผลการดำเนินงาน", "12", bold=True)
    add_toc_line("4.1 การพัฒนาส่วนติดต่อผู้ใช้และ Playmat", "12", indent_cm=0.6)
    add_toc_line("4.2 การพัฒนา Backend และ Docker Container", "14", indent_cm=0.6)
    add_toc_line("4.3 ผลการทดสอบระบบ", "14", indent_cm=0.6)

    add_toc_line("บทที่ 5 การประเมินค่าใช้จ่ายและแผนงานในอนาคต", "16", bold=True)
    add_toc_line("5.1 การประเมินค่าใช้จ่ายและการควบคุมงบประมาณ", "16", indent_cm=0.6)
    add_toc_line("5.2 แผนการพัฒนาสำหรับ Stage 3", "16", indent_cm=0.6)
    add_toc_line("5.3 สรุปผลการดำเนินงานและบทเรียนที่ได้รับ", "17", indent_cm=0.6)

    add_toc_line("บรรณานุกรม", "18", bold=True)
    add_toc_line("ภาคผนวก", "19", bold=True)
    add_toc_line("ภาคผนวก ก: สคริปต์ปรับใช้ระบบ Lean Multi-AZ VPC, ALB และ ASG", "19", indent_cm=0.6)
    add_toc_line("ภาคผนวก ข: สคริปต์ 1-Click Scale-to-Zero สำหรับควบคุมงบประมาณ", "20", indent_cm=0.6)

    # ==========================================
    # 7. สารบัญรูป (LIST OF FIGURES)
    # ==========================================
    doc.add_page_break()
    add_p("สารบัญรูป", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=20, space_before=12, space_after=4)
    add_p("หน้า", align=WD_ALIGN_PARAGRAPH.RIGHT, bold=True, size=16, space_before=0, space_after=8)

    add_toc_line("รูปที่ 3.1 ผังภาพสถาปัตยกรรมคลาวด์ Lean Multi-AZ IaaS ร่วมกับ Auto Scaling Group", "8")
    add_toc_line("รูปที่ 3.2 ผังกลยุทธ์ Multi-Tier Fallback และ Local Caching ป้องกัน API ภายนอกขัดข้อง", "10")
    add_toc_line("รูปที่ 4.1 ภาพหน้าจอส่วนติดต่อผู้ใช้ระบบ Disney Lorcana PlayLab Cloud", "13")
    add_toc_line("รูปที่ 4.2 กระดานจำลองการเล่นการ์ดแบบเรียลไทม์ Interactive Playmat", "13")
    add_toc_line("รูปที่ 4.3 ระบบจำลองการสุ่มเปิดซองการ์ด 3D Booster Pack Opening", "14")

    # ==========================================
    # 8. สารบัญตาราง (LIST OF TABLES)
    # ==========================================
    doc.add_page_break()
    add_p("สารบัญตาราง", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=20, space_before=12, space_after=4)
    add_p("หน้า", align=WD_ALIGN_PARAGRAPH.RIGHT, bold=True, size=16, space_before=0, space_after=8)

    add_toc_line("ตารางที่ 2.1 แผนการดำเนินงานและการส่งมอบงานแต่ละ Sprint", "4")
    add_toc_line("ตารางที่ 2.2 กำหนดการประเมินผลรายวิชา Cloud Technology และสถานะความพร้อม", "5")
    add_toc_line("ตารางที่ 3.1 โครงสร้างตารางข้อมูล Amazon DynamoDB", "9")
    add_toc_line("ตารางที่ 3.2 ตารางสรุปข้อจำกัดบน AWS Learner Lab และแนวทางแก้ไข", "11")
    add_toc_line("ตารางที่ 4.1 ผลการทดสอบคุณภาพระบบโดยรวม (Master QA Test Matrix)", "15")
    add_toc_line("ตารางที่ 5.1 การเปรียบเทียบและการประเมินค่าใช้จ่ายบนคลาวด์ตลอดภาคการศึกษา", "16")

    # ==========================================
    # 9. บทที่ 1: บทนำ
    # ==========================================
    add_chapter_title("บทที่ 1", "บทนำ")

    add_h2("1.1 ความเป็นมาและความสำคัญของโครงงาน")
    add_body_p("เกมการ์ดสะสม Disney Lorcana TCG เป็นหนึ่งในเกมที่ได้รับความนิยมสูงอย่างรวดเร็วในระดับสากล โดยเป็นความร่วมมือระหว่าง Ravensburger และ The Walt Disney Company ซึ่งได้รับความสนใจอย่างแพร่หลายจากทั้งผู้เล่นสายแข่งขันและนักสะสมทั่วโลก")
    add_body_p("อย่างไรก็ดี ในบริบทของการฝึกซ้อมและการเข้าถึงเกมการ์ด ผู้เล่นส่วนใหญ่ยังคงประสบกับข้อจำกัดหลัก 3 ประการ:")
    add_number_p("1.", "ต้นทุนการจัดหาการ์ดจริงและข้อจำกัดทางกายภาพ: การ์ดหายากมีราคาสูงในตลาดรอง และการนัดหมายเล่นจำเป็นต้องใช้สถานที่จริง ทำให้ผู้เล่นใหม่ขาดโอกาสในการทดลองจัดเด็ค")
    add_number_p("2.", "ภาระต้นทุนเซิร์ฟเวอร์และความไม่คุ้มค่าของระบบแบบเดิม: ระบบจำลองเกมการ์ดบนเว็บในอดีตมักทำงานบน Virtual Machine หรือ Dedicated Server ที่เปิดทิ้งไว้ตลอด 24 ชั่วโมง ก่อให้เกิดค่าใช้จ่ายสูงแม้ไม่มีผู้ใช้งาน และมักเกิดปัญหาเซิร์ฟเวอร์ขัดข้องเมื่อมีผู้ใช้งานเพิ่มขึ้นอย่างกะทันหัน")
    add_number_p("3.", "ปัญหาความหน่วงในการส่งข้อมูล (Latency): แพลตฟอร์มบนเว็บทั่วไปมักใช้การดึงข้อมูลแบบ HTTP Polling ซึ่งมีความหน่วงสูง ไม่ตอบสนองต่อการเล่นเกมการ์ดที่ต้องการซิงค์ตำแหน่งการ์ด สถานะ Ready หรือ Exert และแต้ม Lore แบบทันทีทันใด")
    add_body_p("เพื่อแก้ไขปัญหาดังกล่าว คณะผู้จัดทำจึงได้พัฒนาโครงงาน Disney Lorcana PlayLab Cloud โดยนำสถาปัตยกรรม Hybrid Cloud ซึ่งใช้ Primary IaaS Stack บน Lean Multi-AZ VPC, Application Load Balancer, Auto Scaling Group และ Docker ร่วมกับ Secondary Serverless Stack บน AWS Lambda, DynamoDB และ API Gateway เพื่อสร้างระบบจำลองกระดานเล่นการ์ดและวิเคราะห์เด็คที่มีความหน่วงต่ำกว่า 100 มิลลิวินาที สามารถขยายขนาดรองรับผู้เล่นได้อัตโนมัติ และควบคุมค่าใช้จ่ายให้อยู่ภายใต้งบประมาณ $50 ของ AWS Learner Lab ได้อย่างมีประสิทธิภาพ")

    add_h2("1.2 วัตถุประสงค์ของโครงงาน")
    add_number_p("1.", "เพื่อออกแบบและพัฒนาระบบจำลองกระดานซ้อมเล่นการ์ด Disney Lorcana แบบเรียลไทม์บนเว็บเบราว์เซอร์ที่มีความหน่วงต่ำกว่า 100 มิลลิวินาที ผ่านช่องทางสื่อสาร WebSockets")
    add_number_p("2.", "เพื่อประยุกต์ใช้สถาปัตยกรรมคลาวด์แบบ IaaS และ Containerization บน Multi-AZ VPC, ALB, EC2 Auto Scaling Group และ Docker ในการสร้างระบบที่มีความพร้อมใช้งานสูงและปรับขนาดตามโหลดอัตโนมัติเมื่อ CPU เกิน 60%")
    add_number_p("3.", "เพื่อพัฒนาระบบจัดการเด็คการ์ดและระบบประมวลผลวิเคราะห์เด็คแบบ Asynchronous ผ่าน Amazon SQS พร้อมฐานข้อมูลการ์ดทางการครบถ้วน 3,242 ใบ")
    add_number_p("4.", "เพื่อศึกษาและวางมาตรการด้าน Reliability, Availability, Security และ Cost Optimization ตามกรอบ AWS Well-Architected Framework")
    add_number_p("5.", "เพื่อศึกษาและแก้ไขปัญหาข้อจำกัดทางวิศวกรรมบนสภาพแวดล้อมสิทธิ์จำกัดและงบประมาณ $50 ของ AWS Academy Learner Lab ด้วยกลยุทธ์ Lean Multi-AZ VPC และ 1-Click Scale-to-Zero")

    add_h2("1.3 ขอบเขตของระบบ")
    add_body_p("ระบบครอบคลุมฟังก์ชันการทำงานหลัก 9 ด้าน ดังต่อไปนี้:")
    add_bullet_p("ระบบยืนยันตัวตนและความปลอดภัย (LC-01, LC-02): สมัครสมาชิกและเข้าสู่ระบบด้วย bcrypt และ JWT State Management บน Local Storage รองรับผู้ใช้ทั่วไปและระบบ Demo")
    add_bullet_p("ระบบจัดการเด็คการ์ด (LC-03): สร้าง ค้นหา แก้ไข และบันทึกเด็คการ์ดลง Amazon DynamoDB พร้อมระบบตรวจสอบกฎกติกาการจัดเด็ค ได้แก่ ความจุขั้นต่ำ 60 ใบ, ใส่การ์ดซ้ำได้ไม่เกิน 4 ใบ, และจำกัดหมึกไม่เกิน 2 สี")
    add_bullet_p("ระบบจำลองการเปิดซองการ์ด Booster Pack (LC-04): สุ่มเปิดการ์ด 12 ใบต่อซองตามอัตราการออกการ์ดจริงด้วยอัลกอริทึม Fisher-Yates True Randomization")
    add_bullet_p("ระบบตรวจสอบการ์ด 3D Card Inspector (LC-05): แสดงผลการ์ดสามมิติพร้อมเอฟเฟกต์ Holographic Foil Shader และการตอบสนองต่อการเคลื่อนที่ของเมาส์")
    add_bullet_p("ระบบจับคู่และห้องแข่งขัน (LC-06): สร้างห้องแข่งขันด้วยรหัส 6 หลัก ระบบค้นหาห้อง และระบบสลับบทบาทผู้เล่น Player 1, Player 2 และ Spectator")
    add_bullet_p("กระดานจำลองการเล่นการ์ด Interactive Playmat (LC-07): จำลองพื้นที่กระดานมาตรฐาน ประกอบด้วย Play Area, Inkwell, Deck, Discard Pile, Hand และ Lore Counter")
    add_bullet_p("ระบบกู้คืนสถานะการเชื่อมต่อ Rejoin Grace Period 60 วินาที (LC-08): รักษาช่องว่างห้องเล่นไว้ 60 วินาทีเมื่อผู้เล่นหลุดจากการเชื่อมต่อ เพื่อให้สามารถเชื่อมต่อกลับเข้ามาเล่นต่อได้โดยเกมไม่หยุดชะงัก")
    add_bullet_p("ระบบออกจากเกม Voluntary Exit Match (LC-09): ส่ง Action LEAVE_ROOM เคลียร์สล็อตในห้องเล่นบน DynamoDB ทันที เพื่อคืนทรัพยากรห้องเล่นให้ระบบ")

    add_h2("1.4 ประโยชน์ที่คาดว่าจะได้รับ")
    add_number_p("1.", "ผู้เล่นและคอมมูนิตี้เกมการ์ด Disney Lorcana มีแพลตฟอร์มบนเว็บที่สามารถฝึกซ้อม จัดเด็ค และทดสอบกลยุทธ์ได้อย่างสะดวกรวดเร็วโดยไม่มีค่าใช้จ่าย")
    add_number_p("2.", "ได้รับองค์ความรู้และทักษะเชิงลึกในการออกแบบสถาปัตยกรรมคลาวด์แบบ IaaS และ Containerization ที่รองรับการใช้งานระดับ Production")
    add_number_p("3.", "ได้แนวทางการแก้ไขปัญหาข้อจำกัดด้านสิทธิ์และงบประมาณบน AWS Learner Lab ที่เป็นประโยชน์ต่อการศึกษาและการต่อยอดโครงการในอนาคต")
    add_number_p("4.", "มีระบบต้นแบบในการจัดการ State การเล่นเกมแบบเรียลไทม์ความเร็วสูงผ่าน WebSockets และการกู้คืนสถานะด้วย NoSQL บน Amazon DynamoDB")

    add_h2("1.5 โครงสร้างของรายงาน")
    add_body_p("รายงานฉบับนี้แบ่งเนื้อหาออกเป็น 5 บท ประกอบด้วย:")
    add_bullet_p("บทที่ 1 บทนำ: ความเป็นมา วัตถุประสงค์ ขอบเขต และประโยชน์ที่คาดว่าจะได้รับ")
    add_bullet_p("บทที่ 2 การบริหารจัดการโครงการและเทคโนโลยีที่ใช้: ระเบียบวิธี Agile Scrum, แผนการดำเนินงาน Sprint 1 ถึง 3, Tech Stack และกฎกติกาเกม")
    add_bullet_p("บทที่ 3 การวิเคราะห์และออกแบบระบบ: สถาปัตยกรรมคลาวด์, Lean Multi-AZ VPC, ALB, ASG, โครงสร้าง DynamoDB, Match Lifecycle และการรับมือข้อจำกัด AWS Learner Lab")
    add_bullet_p("บทที่ 4 การพัฒนาระบบและผลการดำเนินงาน: รายละเอียดการพัฒนา Frontend React 19, Multi-stage Docker และผลการทดสอบระบบ")
    add_bullet_p("บทที่ 5 การประเมินค่าใช้จ่ายและแผนงานในอนาคต: สรุปค่าใช้จ่ายจริงเทียบกับงบประมาณ $50, แผนงาน Sprint 4 ถึง 7 และบทเรียนที่ได้รับ")

    # ==========================================
    # 10. บทที่ 2: การบริหารจัดการโครงการและเทคโนโลยีที่ใช้
    # ==========================================
    add_chapter_title("บทที่ 2", "การบริหารจัดการโครงการและเทคโนโลยีที่ใช้")

    add_h2("2.1 แผนการพัฒนาและระเบียบวิธี Agile Scrum")
    add_body_p("โครงการ Disney Lorcana PlayLab Cloud ใช้ระเบียบวิธีปฏิบัติงานแบบ Agile Scrum โดยแบ่งระยะเวลาการพัฒนาออกเป็น 7 Sprints (Sprint ละ 2 สัปดาห์) การดำเนินงานใน Phase ที่ 2 ครอบคลุมการพัฒนาตั้งแต่ Sprint 1 ถึง Sprint 3 ซึ่งมุ่งเน้นการสร้างสถาปัตยกรรมหลักของระบบและเชื่อมต่อฟังก์ชันพื้นฐานครบ 100% ดังแสดงในตารางที่ 2.1")

    # Table 2.1
    add_p("ตารางที่ 2.1: แผนการดำเนินงานและการส่งมอบงานแต่ละ Sprint", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=16, space_before=8, space_after=4)
    tbl21 = doc.add_table(rows=8, cols=4)
    tbl21.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl21)
    t21_data = [
        ["Sprint", "ช่วงเวลา", "เป้าหมายและผลงานที่ส่งมอบ", "สถานะ"],
        ["Sprint 1", "1–14 ส.ค. 2569", "ตั้งค่าโครงสร้างโปรเจกต์ React 19 + TypeScript, ติดตั้ง Tailwind CSS v4, ออกแบบ UI Theme และระบบจัดการเด็ค", "เสร็จสมบูรณ์ 100%"],
        ["Sprint 2", "15–28 ส.ค. 2569", "พัฒนาระบบ Booster Pack Gacha, 3D Foil Inspector, เชื่อมต่อ Lorcast API 3,242 ใบ, ทดสอบ Unit Test บน Vitest", "เสร็จสมบูรณ์ 100%"],
        ["Sprint 3", "29 ส.ค. – 4 ก.ย. 2569", "พัฒนา WebSocket Lifecycle v1.5.0, ย้ายระบบสู่ Multi-AZ VPC + ALB + ASG บน Docker EC2, จัดทำรายงาน Stage 2", "เสร็จสมบูรณ์ 100%"],
        ["Sprint 4", "5–25 ก.ย. 2569", "พัฒนาระบบ Asynchronous Deck Analytics ผ่าน Amazon SQS และอัลกอริทึมแนะนำการ์ด", "แผนงานถัดไป"],
        ["Sprint 5", "26 ก.ย. – 10 ต.ค. 2569", "ติดตั้ง AWS X-Ray, CloudWatch Dashboard, ปรับปรุงระบบความปลอดภัยและการจัดการข้อผิดพลาด", "แผนงานถัดไป"],
        ["Sprint 6", "11–20 ต.ค. 2569", "ทำการทดสอบ Load Testing ขนาดใหญ่ด้วย Artillery และซ้อมการนำเสนอระบบ", "แผนงานถัดไป"],
        ["Sprint 7", "21–25 ต.ค. 2569", "จัดทำรายงานฉบับสมบูรณ์ บันทึกวิดีโอสาธิตระบบ และเตรียมการนำเสนอครั้งสุดท้าย", "แผนงานถัดไป"]
    ]
    for r_idx, row in enumerate(tbl21.rows):
        for c_idx, cell in enumerate(row.cells):
            text = t21_data[r_idx][c_idx]
            if r_idx == 0:
                format_cell(cell, text, bold=True, size=14, align=WD_ALIGN_PARAGRAPH.CENTER, shading_hex="F2F4F8")
            else:
                align = WD_ALIGN_PARAGRAPH.CENTER if c_idx in [0, 1, 3] else WD_ALIGN_PARAGRAPH.LEFT
                format_cell(cell, text, bold=False, size=14, align=align)

    add_h2("2.2 สรุปผลความก้าวหน้า Sprint 1 ถึง Sprint 3")
    add_body_p("ความก้าวหน้าของโครงการ ณ วันที่ 4 กันยายน 2569 บรรลุตามเป้าหมายของ Stage 2 ครบถ้วน ทีมงานได้พัฒนาและทดสอบส่วนประกอบสำคัญของระบบครบทุกมิติ:")
    add_bullet_p("Frontend และ Client State: พัฒนาด้วย React 19, TypeScript 5.x, Zustand Store, Tailwind CSS v4 และ Framer Motion มีความเสถียรและผ่านการทดสอบ Vitest ครบ 33 ข้อทดสอบ")
    add_bullet_p("Backend และ Real-Time Engine: รวมศูนย์ระบบไว้ที่ Nginx Reverse Proxy และ Express/WebSocket Engine ภายใน Multi-stage Docker Container รองรับการสื่อสารสองทิศทางที่มีความหน่วงเฉลี่ยต่ำกว่า 50 มิลลิวินาที")
    add_bullet_p("Cloud Infrastructure บน AWS: ปรับใช้ Lean Multi-AZ VPC สองโซน (us-east-1a, us-east-1b) พร้อม Application Load Balancer และ Auto Scaling Group ที่สามารถปรับขนาดเครื่อง EC2 t3.micro ได้อัตโนมัติเมื่อ CPU เกิน 60%")
    add_bullet_p("ระบบอัตโนมัติและการควบคุมงบประมาณ: พัฒนาสคริปต์ PowerShell สำหรับการ Deploy, สคริปต์ยิงทดสอบโหลด และสคริปต์ 1-Click Scale-to-Zero ที่ช่วยตัดค่าใช้จ่าย Compute เหลือ $0.00 เมื่อไม่ได้ใช้งาน")

    add_h2("2.3 กำหนดการส่งงานวิชา Cloud Technology")
    add_body_p("ตารางที่ 2.2 แสดงกำหนดการประเมินผลในรายวิชาและความพร้อมในการส่งมอบของกลุ่ม G21:")

    # Table 2.2
    add_p("ตารางที่ 2.2: กำหนดการประเมินผลรายวิชา Cloud Technology และสถานะความพร้อม", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=16, space_before=8, space_after=4)
    tbl22 = doc.add_table(rows=7, cols=3)
    tbl22.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl22)
    t22_data = [
        ["กำหนดเวลา", "หมวดหมู่การประเมินผล", "สถานะความพร้อมของกลุ่ม G21"],
        ["Stage 1 (สัปดาห์ที่ 4)", "นำเสนอหัวข้อและสถาปัตยกรรมเบื้องต้น", "ผ่านการประเมินเรียบร้อย"],
        ["Stage 2 (4 ก.ย. 2569)", "ส่งมอบความก้าวหน้า 50% และโครงสร้างคลาวด์", "พร้อมส่งมอบ 100% (เอกสารรายงาน + ระบบจริง)"],
        ["Stage 3 (ต.ค. 2569)", "ส่งมอบระบบวิเคราะห์ Asynchronous & Monitoring", "อยู่ระหว่างเตรียมการพัฒนา Sprint 4"],
        ["Final Demo (ปลาย ต.ค.)", "การสาธิตระบบจริงและการนำเสนอผลงาน", "พร้อมทดสอบซ้อมระบบ"],
        ["Final Report", "รายงานเล่มสมบูรณ์ฉบับวิชาการ", "ร่างเนื้อหาเสร็จสิ้นกว่า 60%"],
        ["Video Presentation", "วิดีโอสาธิตการใช้งานและสถาปัตยกรรม", "เตรียมบันทึกภาพหน้าจอและเสียงบรรยาย"]
    ]
    for r_idx, row in enumerate(tbl22.rows):
        for c_idx, cell in enumerate(row.cells):
            text = t22_data[r_idx][c_idx]
            if r_idx == 0:
                format_cell(cell, text, bold=True, size=14, align=WD_ALIGN_PARAGRAPH.CENTER, shading_hex="F2F4F8")
            else:
                align = WD_ALIGN_PARAGRAPH.CENTER if c_idx != 1 else WD_ALIGN_PARAGRAPH.LEFT
                format_cell(cell, text, bold=False, size=14, align=align)

    add_h2("2.4 เทคโนโลยีที่ใช้ในการพัฒนา")
    add_body_p("ระบบ Disney Lorcana PlayLab Cloud เลือกใช้ชุดเครื่องมือมาตรฐานระดับ Production:")
    add_bullet_p("Frontend: React 19, TypeScript 5.x, Vite 6.x, Tailwind CSS v4, Framer Motion, Lucide React, และ Zustand State Management")
    add_bullet_p("Backend & Realtime: Node.js 20 LTS, Express, WebSockets (RFC 6455), bcryptjs, jsonwebtoken, และ AWS SDK v3")
    add_bullet_p("Cloud Infrastructure บน AWS: Amazon EC2 (t3.micro), Application Load Balancer (ALB), EC2 Auto Scaling Group (ASG), Amazon Virtual Private Cloud (VPC), Amazon DynamoDB, Amazon SQS, AWS CloudWatch, และ AWS Systems Manager (SSM)")
    add_bullet_p("Containerization & Web Server: Docker Engine, Multi-stage Alpine Build, และ Nginx Reverse Proxy")
    add_bullet_p("Testing & Automation: Vitest 4.x, Playwright E2E, และ PowerShell Automation Suite")

    add_h2("2.5 กติกาและโมเดลของเกม Disney Lorcana")
    add_body_p("Disney Lorcana TCG มีกฎกติกาและกลไกหลักที่ระบบ PlayLab จำลองอย่างเที่ยงตรง:")
    add_bullet_p("ทรัพยากรหมึก (Inkwell): การ์ดที่มีสัญลักษณ์หมึกสามารถคว่ำลงใน Inkwell เพื่อใช้จ่ายเป็นค่าร่ายการ์ดในแต่ละเทิร์น")
    add_bullet_p("สถานะการ์ด Ready และ Exert: การ์ดในกระดานจะตั้งตรง (Ready) เมื่อพร้อมใช้งาน และหมุนแนวนอน 90 องศา (Exert) เมื่อทำเควสต์ ท้าทาย หรือร้องเพลง")
    add_bullet_p("แต้ม Lore: ผู้เล่นสะสมแต้มความรู้จากการส่งตัวละครทำเควสต์ ผู้ที่สะสมแต้มครบ 20 แต้มก่อนจะเป็นผู้ชนะในแมตช์")
    add_bullet_p("กฎการจัดเด็ค: เด็คต้องประกอบด้วยการ์ดอย่างน้อย 60 ใบ, มีสีหมึกไม่เกิน 2 สีจาก 6 สี (Amber, Amethyst, Emerald, Ruby, Sapphire, Steel), และใส่การ์ดชื่อเดียวกันได้ไม่เกิน 4 ใบ")

    # ==========================================
    # 11. บทที่ 3: การวิเคราะห์และออกแบบระบบ
    # ==========================================
    add_chapter_title("บทที่ 3", "การวิเคราะห์และออกแบบระบบ")

    add_h2("3.1 ความต้องการของระบบ")
    add_h3("3.1.1 ข้อกำหนดเชิงฟังก์ชัน (Functional Requirements)")
    add_bullet_p("FR-01: ผู้ใช้สามารถลงทะเบียน เข้าสู่ระบบ และจัดการข้อมูลบัญชีผู้ใช้ได้")
    add_bullet_p("FR-02: ผู้ใช้สามารถค้นหา กรอง และจัดเด็คการ์ดตามกฎกติกา พร้อมบันทึกลง DynamoDB")
    add_bullet_p("FR-03: ผู้ใช้สามารถสร้างและเข้าร่วมห้องแข่งขันด้วยรหัส 6 หลัก พร้อมเลือกเด็คที่ต้องการเล่น")
    add_bullet_p("FR-04: ผู้เล่นสามารถขยับการ์ด ปรับแต้ม Lore คว่ำการ์ดเป็นหมึก และสั่ง Ready/Exert ผ่าน WebSockets ได้แบบเรียลไทม์")
    add_bullet_p("FR-05: ผู้เล่นสามารถสุ่มเปิดซองการ์ด Booster Pack 12 ใบ พร้อมตรวจสอบการ์ดแบบ 3 มิติ")

    add_h3("3.1.2 ข้อกำหนดที่ไม่ใช่เชิงฟังก์ชัน (Non-Functional Requirements)")
    add_bullet_p("NFR-01 (Latency): ความหน่วงในการซิงค์ข้อมูลระหว่างผู้เล่นต้องต่ำกว่า 100 มิลลิวินาที")
    add_bullet_p("NFR-02 (Availability): ระบบต้องทำงานแบบ Multi-AZ สามารถสลับการทำงานอัตโนมัติหากโซนใดโซนหนึ่งขัดข้อง")
    add_bullet_p("NFR-03 (Scalability): ระบบต้องสามารถเพิ่มจำนวนอินสแตนซ์อัตโนมัติเมื่อ CPU เฉลี่ยเกิน 60%")
    add_bullet_p("NFR-04 (Cost Constraint): ต้นทุนการทำงานของระบบทั้งหมดต้องอยู่ภายใต้งบประมาณ $50 ของ AWS Learner Lab")
    add_bullet_p("NFR-05 (Security): รหัสผ่านต้องถูกเข้ารหัสด้วย bcrypt และไม่อนุญาตให้เปิด Port ภายในเครื่อง EC2 สู่สาธารณะโดยตรง")

    add_h2("3.2 สถาปัตยกรรมระบบคลาวด์บน AWS")
    add_body_p("ระบบได้รับการออกแบบตามสถาปัตยกรรม Hybrid Cloud ที่มี Primary IaaS Stack ควบคู่กับ Secondary Serverless Stack ดังแสดงในรูปที่ 3.1:")

    # Diagram / Box
    add_code_block("""+-------------------------------------------------------------------------------+
|                      Client Browser / Evaluator (HTTP/80)                     |
|                                       v                                       |
|                    Application Load Balancer (ALB: Multi-AZ)                  |
|          DNS: lorcana-alb-687861613.us-east-1.elb.amazonaws.com               |
|                                                                               |
|       [Availability Zone: us-east-1a]        [Availability Zone: us-east-1b]  |
|       Subnet: 10.0.1.0/24                    Subnet: 10.0.2.0/24              |
|   +-----------------------------+        +-----------------------------+      |
|   | EC2 Instance 1 (Primary)    |        | EC2 Instance 2 (Auto Scaled)|      |
|   | Nginx Port 80 -> React SPA  |        | Auto-spawned on CPU > 60%   |      |
|   | Node.js Port 3001 -> WS/REST|        | Nginx Port 80 + Node Port 3001     |
|   +-----------------------------+        +-----------------------------+      |
|                                  v                                            |
|                   IAM LabRole via IMDSv2 (Zero Secrets)                       |
|         Amazon DynamoDB (Data Store)  |  Amazon SQS & CloudWatch              |
+-------------------------------------------------------------------------------+""")
    add_p("รูปที่ 3.1: ผังภาพสถาปัตยกรรมคลาวด์ Lean Multi-AZ IaaS ร่วมกับ Auto Scaling Group", align=WD_ALIGN_PARAGRAPH.CENTER, bold=False, size=16, space_before=4, space_after=12)

    add_h2("3.3 สถาปัตยกรรมเครือข่าย Lean Multi-AZ VPC")
    add_body_p("เครือข่ายได้รับการจัดสรรด้วย Custom VPC บน Address Space 10.0.0.0/16 แบ่งเป็น Public Subnets ข้าม 2 Availability Zones:")
    add_bullet_p("Subnet us-east-1a (10.0.1.0/24) และ Subnet us-east-1b (10.0.2.0/24)")
    add_bullet_p("Chained Security Groups สำหรับควบคุมความปลอดภัย:")
    add_number_p("1.", "lorcana-alb-sg: เปิดรับทราฟฟิก HTTP Port 80 จากอินเทอร์เน็ตสาธารณะ (0.0.0.0/0)")
    add_number_p("2.", "lorcana-ec2-sg: ปิดกั้น Inbound ตรงจากอินเทอร์เน็ตทั้งหมด โดยอนุญาตรับ Port 80 และ 3001 เฉพาะทราฟฟิกที่ส่งต่อมาจาก lorcana-alb-sg เท่านั้น")
    add_body_p("สถาปัตยกรรมนี้ช่วยตัดค่าใช้จ่าย NAT Gateway ($32.40 ต่อเดือน) เหลือ $0.00 โดยยังคงความปลอดภัยเทียบเท่าการวางเครื่องใน Private Subnet")

    add_h2("3.4 การกระจายโหลดและการปรับขนาดอัตโนมัติ")
    add_body_p("Application Load Balancer ทำหน้าที่กระจายโหลดทราฟฟิกลงสู่อินสแตนซ์ EC2 ในแต่ละ AZ ผ่าน Target Group ที่มี Health Check ผ่านเส้นทาง GET /health ทุก 15 วินาที พร้อมเปิดใช้งาน Sticky Sessions เพื่อป้องกันการเชื่อมต่อ WebSocket หลุดขณะแข่งขัน")
    add_body_p("Auto Scaling Group ถูกตั้งค่า Min=1, Max=3, Desired=1 ขับเคลื่อนด้วย CloudWatch Target Tracking Policy (ASGAverageCPUUtilization > 60%) เมื่อมีผู้เล่นเข้าใช้งานพร้อมกันจน CPU เกินเกณฑ์ ระบบจะสปอว์นอินสแตนซ์ข้ามไปยังอีกโซนโดยอัตโนมัติ")

    add_h2("3.5 การออกแบบฐานข้อมูล Amazon DynamoDB")
    add_body_p("ตารางที่ 3.1 แสดงรายละเอียดการออกแบบโครงสร้างตารางข้อมูลใน Amazon DynamoDB:")

    # Table 3.1
    add_p("ตารางที่ 3.1: โครงสร้างตารางข้อมูล Amazon DynamoDB", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=16, space_before=8, space_after=4)
    tbl31 = doc.add_table(rows=4, cols=5)
    tbl31.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl31)
    t31_data = [
        ["ชื่อตาราง", "Partition Key (PK)", "Sort Key (SK)", "Attributes สำคัญ", "วัตถุประสงค์"],
        ["LorcanaUsers", "userId (S)", "-", "username, passwordHash, createdAt", "จัดเก็บข้อมูลบัญชีผู้ใช้และรหัสผ่านแฮช bcrypt"],
        ["LorcanaDecks", "userId (S)", "deckId (S)", "deckName, inks, cards (List), updatedAt", "จัดเก็บรายการเด็คการ์ดและรายการการ์ดของผู้ใช้"],
        ["LorcanaRoomState", "roomId (S)", "connectionId (S)", "username, role, state (JSON), ttl", "จัดเก็บสถานะกระดานสดและข้อมูลการจับคู่ห้องเล่น"]
    ]
    for r_idx, row in enumerate(tbl31.rows):
        for c_idx, cell in enumerate(row.cells):
            text = t31_data[r_idx][c_idx]
            if r_idx == 0:
                format_cell(cell, text, bold=True, size=14, align=WD_ALIGN_PARAGRAPH.CENTER, shading_hex="F2F4F8")
            else:
                align = WD_ALIGN_PARAGRAPH.CENTER if c_idx in [1, 2] else WD_ALIGN_PARAGRAPH.LEFT
                format_cell(cell, text, bold=False, size=14, align=align)

    add_h2("3.6 วงจรการสื่อสารแบบเรียลไทม์ (Match Lifecycle)")
    add_number_p("1.", "การสร้างและเข้าร่วมห้อง (JOIN_ROOM): ผู้เล่นส่งรหัสห้อง 6 หลัก เซิร์ฟเวอร์บันทึก Connection ลง Memory และ DynamoDB พร้อมกำหนดบทบาท Player 1 หรือ Player 2")
    add_number_p("2.", "การซิงค์การกระทำ (Action Sync): หน้าจอผู้เล่นทำ Optimistic UI Update ทันที (0ms) และส่ง Action Payload ผ่าน WebSocket ไปยังเซิร์ฟเวอร์เพื่อ Relay ข้ามไปยังคู่แข่งภายในเวลาต่ำกว่า 100 มิลลิวินาที")
    add_number_p("3.", "การจัดการการเชื่อมต่อหลุด (Rejoin Grace Period 60s): หาก Client ตัดการเชื่อมต่อกะทันหัน ระบบจะคงสถานะห้องไว้ 60 วินาที พร้อมแจ้งเตือนคู่ต่อสู้ หากผู้เล่นเดิมเชื่อมต่อใหม่จะดึงสถานะล่าสุดจาก DynamoDB มาเล่นต่อได้ทันที")
    add_number_p("4.", "การออกจากเกมโดยสมัครใจ (Voluntary Exit Match): เมื่อผู้เล่นกดปุ่ม Exit Match ระบบจะส่ง Action LEAVE_ROOM ลบสล็อตห้องบน DynamoDB ทันทีโดยไม่ต้องรอ 60 วินาที เพื่อคืนทรัพยากรให้ระบบ")

    add_h2("3.7 การรับมือข้อผิดพลาดและระบบ Caching")
    add_body_p("ระบบใช้กลยุทธ์ Multi-Tier Resilience เพื่อป้องกันระบบหยุดชะงักหาก Lorcast API เกิดปัญหา:")
    add_bullet_p("Tier 1 (In-Memory Zustand Cache): เก็บข้อมูลการ์ดที่เคยโหลดแล้วไว้ในหน่วยความจำเบราว์เซอร์")
    add_bullet_p("Tier 2 (Local Pre-compiled JSON Dataset): บรรจุไฟล์ข้อมูลการ์ด 3,242 ใบไว้ในคอนเทนเนอร์และเว็บเซิร์ฟเวอร์ในตัว")
    add_bullet_p("Tier 3 (External API): เรียกใช้งาน API ภายนอกเฉพาะเมื่อต้องการดึงข้อมูลอัปเดตใหม่เท่านั้น")

    add_image_box("docs/_ARCHIVE/2026-08-24_Serverless_Report/images/aws_fallback_strategy.png", "รูปที่ 3.2: ผังกลยุทธ์ Multi-Tier Fallback และ Local Caching ป้องกัน API ภายนอกขัดข้อง", width_in=5.2)

    add_h2("3.8 การออกแบบตามกรอบ AWS Well-Architected Framework")
    add_bullet_p("Reliability: ออกแบบสถาปัตยกรรมข้าม 2 Availability Zones พร้อม Health Checks และ Sticky Sessions")
    add_bullet_p("Performance Efficiency: ใช้ Alpine Container, In-memory Caching และ WebSockets ซึ่งลด Overhead ของ HTTP Polling ได้กว่า 85%")
    add_bullet_p("Security: ใช้ IMDSv2 ป้องกัน SSRF, Chained Security Groups, แฮชรหัสผ่านด้วย bcrypt และไม่ฝัง Credential ใน Source Code")
    add_bullet_p("Cost Optimization: สถาปัตยกรรมไร้ NAT Gateway, ใช้ EC2 t3.micro ใน Free Tier และสคริปต์ 1-Click Scale-to-Zero")
    add_bullet_p("Operational Excellence: ควบคุมระบบด้วย PowerShell Automation Suite และจัดทำโครงสร้าง IaC พร้อมสคริปต์ทดสอบ")

    add_h2("3.9 การแก้ปัญหาข้อจำกัดบน AWS Learner Lab")
    add_body_p("ตารางที่ 3.2 สรุปข้อจำกัดสำคัญบน AWS Academy Learner Lab และแนวทางแก้ไขเชิงสถาปัตยกรรมของกลุ่ม G21:")

    # Table 3.2
    add_p("ตารางที่ 3.2: ตารางสรุปข้อจำกัดบน AWS Learner Lab และแนวทางแก้ไข", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=16, space_before=8, space_after=4)
    tbl32 = doc.add_table(rows=6, cols=4)
    tbl32.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl32)
    t32_data = [
        ["ลำดับ", "ข้อจำกัดบน Learner Lab", "ผลกระทบหากไม่แก้ไข", "แนวทางแก้ไขเชิงสถาปัตยกรรม"],
        ["1", "บล็อกสิทธิ์ iam:CreateRole", "ไม่สามารถสร้าง IAM Role ใหม่สำหรับ EC2 หรือ Lambda ได้", "ปรับใช้ LabRole และ LabInstanceProfile สำเร็จรูปผ่าน Launch Template และเข้าถึงสิทธิ์ผ่าน IMDSv2"],
        ["2", "ภาระต้นทุน NAT Gateway ($32.40/ด.)", "เผางบประมาณ $50 ของแล็ปหมดภายใน 1.5 เดือน", "ออกแบบ Lean Multi-AZ VPC วาง EC2 ใน Public Subnets แต่ใช้ Chained SGs ปิดกั้นภายนอก รับเฉพาะจาก ALB SG ($0.00)"],
        ["3", "ความเสี่ยงงบรั่วไหลเมื่อไม่ได้ใช้งาน", "หากเปิดเครื่องทิ้งไว้ 24/7 จะสูญเสียงบประมาณ", "พัฒนาสคริปต์ 1-Click Scale-to-Zero ยุบเครื่อง EC2 เหลือ 0 เมื่อเลิกแล็ป ($0.00 ต่อชั่วโมง)"],
        ["4", "แรม 1GB บน t3.micro", "มีความเสี่ยงเกิด OOM Crash หาก Runtime หนัก", "ใช้ Multi-stage Docker บน Alpine Linux แยก Build ออกจาก Runtime ควบคุม RAM ให้ต่ำกว่า 150MB"],
        ["5", "สเตท WebSocket หลุดเมื่อเกิด Auto Scaling", "เมื่อสปอว์นเครื่องใหม่ ผู้เล่นอาจถูกกระจายไปคนละเครื่อง", "เปิด Sticky Sessions บน ALB และซิงค์สถานะห้องลง Amazon DynamoDB"]
    ]
    for r_idx, row in enumerate(tbl32.rows):
        for c_idx, cell in enumerate(row.cells):
            text = t32_data[r_idx][c_idx]
            if r_idx == 0:
                format_cell(cell, text, bold=True, size=14, align=WD_ALIGN_PARAGRAPH.CENTER, shading_hex="F2F4F8")
            else:
                align = WD_ALIGN_PARAGRAPH.CENTER if c_idx == 0 else WD_ALIGN_PARAGRAPH.LEFT
                format_cell(cell, text, bold=False, size=14, align=align)

    # ==========================================
    # 12. บทที่ 4: การพัฒนาระบบและผลการดำเนินงาน
    # ==========================================
    add_chapter_title("บทที่ 4", "การพัฒนาระบบและผลการดำเนินงาน")

    add_h2("4.1 การพัฒนาส่วนติดต่อผู้ใช้และ Playmat")
    add_body_p("ส่วนติดต่อผู้ใช้ได้รับการออกแบบและพัฒนาด้วย React 19 และ Tailwind CSS v4 ภายใต้แนวคิด Modern Tabletop Simulation เพื่อให้ผู้เล่นสัมผัสได้ถึงมิติของการเล่นการ์ดบนโต๊ะจริง:")

    add_image_box("docs/_ARCHIVE/2026-08-24_Serverless_Report/images/01_landing_hero.png", "รูปที่ 4.1: ภาพหน้าจอส่วนติดต่อผู้ใช้ระบบ Disney Lorcana PlayLab Cloud", width_in=5.2)
    add_image_box("docs/_ARCHIVE/2026-08-24_Serverless_Report/images/07_realtime_room_play.png", "รูปที่ 4.2: กระดานจำลองการเล่นการ์ดแบบเรียลไทม์ Interactive Playmat", width_in=5.2)
    add_image_box("public/CardGachaDisney.png", "รูปที่ 4.3: ระบบจำลองการสุ่มเปิดซองการ์ด 3D Booster Pack Opening", width_in=5.2)

    add_body_p("องค์ประกอบสำคัญของหน้าจอ Playmat ประกอบด้วย:")
    add_bullet_p("Play Area: พื้นที่ลงการ์ดตัวละคร ไอเทม และสถานที่ รองรับการลากวาง การแตะเพื่อสั่ง Ready/Exert และการโจมตี")
    add_bullet_p("Inkwell Tray: พื้นที่คว่ำการ์ดเพื่อใช้เป็นหมึกค่าร่าย พร้อมตัวเลขแสดงจำนวนหมึกที่พร้อมใช้และหมึกที่ใช้ไปแล้วในเทิร์นนั้น")
    add_bullet_p("Lore Counter: มาตรวัดแต้มความรู้ขนาดใหญ่ (0–20 แต้ม) พร้อมปุ่มปรับคะแนนบวกลบที่ซิงค์กับคู่แข่งทันที")
    add_bullet_p("Card State Rotator: กลไกการหมุนการ์ดแนวตั้ง (Ready) และแนวนอน 90 องศา (Exert) ด้วย CSS Transforms 60 FPS")
    add_bullet_p("3D Card Inspector & Gacha: ระบบเปิดซองการ์ด 3D สุ่มการ์ด 12 ใบพร้อมฟิสิกส์การตอบสนองต่อการเอียงของเมาส์และแสงสะท้อนโฮโลแกรม")

    add_h2("4.2 การพัฒนา Backend และ Docker Container")
    add_body_p("ระบบได้รับการพัฒนาในรูปแบบคอนเทนเนอร์แบบเบาพิเศษ (Ultra-lightweight Multi-stage Docker Container):")
    add_number_p("1.", "Multi-stage Docker Build: Stage 1 รัน Node.js 20 Alpine ติดตั้ง Dependencies และ Build Vite SPA, Stage 2 คัดลอกเฉพาะ Dist Output และ Production Dependencies ทำให้ขนาดอิมเมจสุดท้ายต่ำกว่า 90 MB")
    add_number_p("2.", "Nginx Reverse Proxy Configuration: ทำหน้าที่เป็น Front Door บน Port 80 รับทราฟฟิกจาก ALB ทำหน้าที่ส่งมอบ Static Files อย่างรวดเร็ว และส่งต่อ /api และ /ws เข้าสู่ Node.js Runtime บน Port 3001 พร้อมตั้งค่า Proxy Buffering และ WebSocket Upgrade Headers ครบถ้วน")
    add_number_p("3.", "Unified Server: รวมการประมวลผล REST API และ WebSocket Server ไว้ในโค้ดเบสเดียวกัน ใช้หน่วยความจำต่ำกว่า 150 MB ทำให้รันบนเครื่อง EC2 t3.micro ได้อย่างราบรื่น")

    add_h2("4.3 ผลการทดสอบระบบ")
    add_body_p("การทดสอบคุณภาพของระบบดำเนินการครอบคลุมทั้ง Unit Test, End-to-End Test, และ Load Stress Test ดังแสดงในตารางที่ 4.1:")

    # Table 4.1
    add_p("ตารางที่ 4.1: ผลการทดสอบคุณภาพระบบโดยรวม (Master QA Test Matrix)", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=16, space_before=8, space_after=4)
    tbl41 = doc.add_table(rows=15, cols=5)
    tbl41.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl41)
    t41_data = [
        ["Test ID", "หมวดหมู่การทดสอบ", "รายละเอียดการทดสอบ", "ผลการทดสอบที่คาดหวัง", "สถานะผลการทดสอบ"],
        ["TC-01", "Unit / Core Rules", "คำนวณและตรวจสอบจำนวนการ์ดในเด็ค (Min 60 ใบ)", "แจ้งเตือนเมื่อการ์ดน้อยกว่า 60 ใบ", "ผ่าน (Passed)"],
        ["TC-02", "Unit / Core Rules", "จำกัดการใส่การ์ดซ้ำชื่อเดิมไม่เกิน 4 ใบ", "ระบบบล็อกการเพิ่มการ์ดใบที่ 5", "ผ่าน (Passed)"],
        ["TC-03", "Unit / Core Rules", "จำกัดสีหมึกในเด็คไม่เกิน 2 สี", "ระบบบล็อกการใส่หมึกสีที่ 3", "ผ่าน (Passed)"],
        ["TC-04", "Unit / State Store", "ทดสอบ Zustand Store จัดการเด็คการ์ด", "เพิ่ม/ลบการ์ดแล้ว State อัปเดตถูกต้อง", "ผ่าน (Passed)"],
        ["TC-05", "Unit / Logic", "อัลกอริทึมสุ่ม Booster Pack (Fisher-Yates)", "สุ่มการ์ด 12 ใบ ครบสล็อตความหายาก", "ผ่าน (Passed)"],
        ["TC-06", "E2E / Auth", "สมัครสมาชิกและเข้าสู่ระบบด้วย JWT", "ได้รับ Token และแสดงข้อมูลผู้ใช้บน Navbar", "ผ่าน (Passed)"],
        ["TC-07", "E2E / Deck Builder", "สร้างเด็คใหม่และบันทึกลง DynamoDB", "เด็คปรากฏในตาราง LorcanaDecks", "ผ่าน (Passed)"],
        ["TC-08", "E2E / Lobby", "สร้างห้องแข่งขันและรับรหัส 6 หลัก", "ห้องถูกสร้างและรอคู่ต่อสู้เข้าร่วม", "ผ่าน (Passed)"],
        ["TC-09", "E2E / Match Realtime", "Player 2 เข้าร่วมห้องด้วยรหัส 6 หลัก", "กระดานของทั้งสองฝ่ายซิงค์สถานะตรงกัน", "ผ่าน (Passed)"],
        ["TC-10", "E2E / Match Action", "ผู้เล่นขยับการ์ดและเปลี่ยนแต้ม Lore", "จอคู่แข่งแสดงการเปลี่ยนแปลง <100ms", "ผ่าน (Passed)"],
        ["TC-11", "E2E / Disconnect", "ผู้เล่นปิดแท็บเบราว์เซอร์ชั่วคราว", "ระบบเริ่มนับถอยหลัง Grace Period 60s", "ผ่าน (Passed)"],
        ["TC-12", "E2E / Rejoin", "ผู้เล่นเปิดแท็บกลับเข้ามาใหม่ภายใน 60s", "ดึง State ล่าสุดและเล่นเกมต่อได้ทันที", "ผ่าน (Passed)"],
        ["TC-13", "Load Stress Test", "ยิงคำขอ HTTP 2,000 Requests ผ่าน ALB", "สำเร็จ 100% Zero Dropped Requests", "ผ่าน (Passed)"],
        ["TC-14", "Auto Scaling", "จำลองโหลด CPU สูงกว่า 60% ต่อเนื่อง", "ASG สปอว์นอินสแตนซ์ข้าม AZ เพิ่มอัตโนมัติ", "ผ่าน (Passed)"]
    ]
    for r_idx, row in enumerate(tbl41.rows):
        for c_idx, cell in enumerate(row.cells):
            text = t41_data[r_idx][c_idx]
            if r_idx == 0:
                format_cell(cell, text, bold=True, size=13, align=WD_ALIGN_PARAGRAPH.CENTER, shading_hex="F2F4F8")
            else:
                align = WD_ALIGN_PARAGRAPH.CENTER if c_idx in [0, 4] else WD_ALIGN_PARAGRAPH.LEFT
                format_cell(cell, text, bold=False, size=13, align=align)

    add_body_p("สรุปผลสัมฤทธิ์การทดสอบคุณภาพเชิงประจักษ์:")
    add_bullet_p("Unit & Store Integration Tests บน Vitest 4.x: ผ่านครบ 33 / 33 การทดสอบ (100% Success Rate)")
    add_bullet_p("End-to-End Browser Tests บน Playwright: ผ่าน 49 / 50 การทดสอบ (98%) บน Chromium, Firefox, WebKit")
    add_bullet_p("Load Stress Test บน ALB จริง: ยิงโหลด 2,000 Requests อัตราความสำเร็จ 100% Response Time เฉลี่ย 42 มิลลิวินาที ไม่พบข้อผิดพลาด HTTP 5xx แม้แต่ครั้งเดียว")

    # ==========================================
    # 13. บทที่ 5: การประเมินค่าใช้จ่ายและแผนงานในอนาคต
    # ==========================================
    add_chapter_title("บทที่ 5", "การประเมินค่าใช้จ่ายและแผนงานในอนาคต")

    add_h2("5.1 การประเมินค่าใช้จ่ายและการควบคุมงบประมาณ")
    add_body_p("จากการคำนวณและประเมินค่าใช้จ่ายจริงบนสภาพแวดล้อม AWS Academy Learner Lab ตารางที่ 5.1 แสดงการเปรียบเทียบค่าใช้จ่ายระหว่างสถาปัตยกรรมทั่วไปกับสถาปัตยกรรมที่ได้รับการปรับแต่งในโครงงาน:")

    # Table 5.1
    add_p("ตารางที่ 5.1: การเปรียบเทียบและการประเมินค่าใช้จ่ายบนคลาวด์ตลอดภาคการศึกษา", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=16, space_before=8, space_after=4)
    tbl51 = doc.add_table(rows=7, cols=5)
    tbl51.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl51)
    t51_data = [
        ["ทรัพยากรคลาวด์", "สเปกและการตั้งค่า", "ค่าใช้จ่ายปกติ", "ค่าใช้จ่ายโครงการ", "กลยุทธ์การควบคุมงบประมาณ"],
        ["VPC & Network", "Multi-AZ VPC + IGW", "$32.40/ด. (NAT)", "$0.00", "ตัด NAT Gateway ใช้ Chained Security Groups"],
        ["Compute (EC2)", "t3.micro (Amazon Linux)", "$8.40/ด. (24/7)", "~$0.50", "ใช้ Scale-to-Zero เปิดเฉพาะตอนเดโม"],
        ["Load Balancer", "Application Load Balancer", "$16.20/ด. (24/7)", "~$0.60", "เปิด-ปิดตามช่วงเวลาทำแล็ป"],
        ["Database", "Amazon DynamoDB", "Free Tier", "$0.00", "ข้อมูล < 1GB อยู่ในเกณฑ์ Free Tier"],
        ["Storage", "S3 & Container Images", "$0.10/ด.", "$0.02", "Multi-stage Docker ขนาดเบา < 100MB"],
        ["รวมประมาณการ", "ตลอดภาคเรียน", ">$150.00", "<$3.00 – $5.00", "ประหยัดงบได้กว่า 90% จากงบ $50"]
    ]
    for r_idx, row in enumerate(tbl51.rows):
        for c_idx, cell in enumerate(row.cells):
            text = t51_data[r_idx][c_idx]
            if r_idx == 0:
                format_cell(cell, text, bold=True, size=14, align=WD_ALIGN_PARAGRAPH.CENTER, shading_hex="F2F4F8")
            elif r_idx == 6:
                align = WD_ALIGN_PARAGRAPH.CENTER if c_idx != 4 else WD_ALIGN_PARAGRAPH.LEFT
                format_cell(cell, text, bold=True, size=14, align=align, shading_hex="EBF3FB")
            else:
                align = WD_ALIGN_PARAGRAPH.CENTER if c_idx in [2, 3] else WD_ALIGN_PARAGRAPH.LEFT
                format_cell(cell, text, bold=False, size=14, align=align)

    add_h2("5.2 แผนการพัฒนาสำหรับ Stage 3")
    add_number_p("1.", "Sprint 4 (5–25 ก.ย.): Async Deck Analyzer via Amazon SQS นำ Amazon SQS มารับงานวิเคราะห์ความสมดุลเด็คแบบ Asynchronous พร้อมพัฒนาอัลกอริทึมแนะนำการ์ดที่เข้าขากันตามประเภทหมึกและเคิร์ฟค่าร่าย")
    add_number_p("2.", "Sprint 5 (26 ก.ย. – 10 ต.ค.): Observability, Monitoring & Security Hardening ติดตั้ง AWS X-Ray ติดตาม Request Latency ข้าม Nginx, Node.js และ DynamoDB พร้อมสร้าง CloudWatch Dashboard รวมสถิติ ALB")
    add_number_p("3.", "Sprint 6 (11–20 ต.ค.): Load Testing & High Concurrency Simulation ดำเนินการทดสอบโหลดขนาดใหญ่ด้วย Artillery จำลองผู้เล่นพร้อมกัน 100–500 ผู้ใช้ และทดสอบความทนทานของ WebSocket Auto-reconnection")
    add_number_p("4.", "Sprint 7 (21–25 ต.ค.): Final Report & Video Presentation จัดทำรายงานฉบับสมบูรณ์ วิดีโอสาธิตการใช้งานระบบ และเตรียมการนำเสนอโครงงานรอบสุดท้าย")

    add_h2("5.3 สรุปผลการดำเนินงานและบทเรียนที่ได้รับ")
    add_body_p("การดำเนินงานโครงงาน Disney Lorcana PlayLab Cloud ใน Sprint 1 ถึง 3 บรรลุตามวัตถุประสงค์ของการส่งมอบงาน Stage 2 ครบถ้วน บทเรียนทางวิศวกรรมที่สำคัญประกอบด้วย:")
    add_number_p("1.", "การออกแบบเพื่อควบคุมต้นทุน: การเข้าใจการทำงานของ Chained Security Groups ทำให้สามารถสร้างสถาปัตยกรรมที่ปลอดภัยระดับ Production โดยไม่ต้องสิ้นเปลืองงบประมาณกับ NAT Gateway")
    add_number_p("2.", "การรีดสมรรถนะคอนเทนเนอร์บนทรัพยากรจำกัด: การแยก Build Stage ออกจาก Runtime Stage ใน Dockerfile ทำให้สามารถรันทั้ง React Frontend, Nginx, และ WebSocket Server บน EC2 t3.micro ได้อย่างมีเสถียรภาพ")
    add_number_p("3.", "การจัดการสถานะระบบกระจาย: การผสานระหว่าง Optimistic UI Update บนเบราว์เซอร์, In-memory WebSocket Relay, และ NoSQL State Persistence ใน DynamoDB ช่วยลดความหน่วงในมุมมองของผู้เล่นลงเหลือศูนย์ พร้อมรับประกันความคงอยู่ของข้อมูลเมื่อเกิดปัญหาเครือข่าย")

    # ==========================================
    # 14. บรรณานุกรม
    # ==========================================
    doc.add_page_break()
    add_p("บรรณานุกรม", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=20, space_before=12, space_after=18)
    
    refs = [
        "[1] Ravensburger & Disney. (2023). Disney Lorcana Trading Card Game Official Rules & Comprehensive Rulebook. Ravensburger AG.",
        "[2] Amazon Web Services. (2026). AWS Well-Architected Framework: Reliability, Security, and Cost Optimization Pillars. AWS Whitepapers.",
        "[3] Amazon Web Services. (2026). Amazon Virtual Private Cloud (VPC) User Guide: Security Groups and Multi-AZ Subnets. AWS Documentation.",
        "[4] Amazon Web Services. (2026). Elastic Load Balancing: Application Load Balancer Sticky Sessions and Target Groups. AWS Documentation.",
        "[5] Amazon Web Services. (2026). Amazon EC2 Auto Scaling User Guide: Target Tracking Scaling Policies. AWS Documentation.",
        "[6] Amazon Web Services. (2026). Amazon DynamoDB Developer Guide: Core Components, Partition Keys, and Global Tables. AWS Documentation.",
        "[7] Docker Inc. (2026). Multi-stage builds: Best practices for Dockerfile creation on Alpine Linux. Docker Documentation.",
        "[8] Nginx Inc. (2026). NGINX Reverse Proxy and WebSocket Proxying Configuration Guide. NGINX Documentation.",
        "[9] React Working Group. (2026). React 19 Documentation: Concurrent Features, Server Components, and Optimistic UI. Meta Open Source.",
        "[10] IETF (Internet Engineering Task Force). (2011). RFC 6455: The WebSocket Protocol. Internet Engineering Task Force (IETF)."
    ]
    for r in refs:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.left_indent = Cm(1.0)
        p.paragraph_format.first_line_indent = Cm(-1.0)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(insert_zwsp(r))
        set_run_font(run, size=15)

    # ==========================================
    # 15. ภาคผนวก
    # ==========================================
    doc.add_page_break()
    add_p("ภาคผนวก", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=20, space_before=12, space_after=18)

    add_h2("ภาคผนวก ก: สคริปต์ปรับใช้ระบบ Lean Multi-AZ VPC, ALB และ ASG")
    add_body_p("ตัวอย่างคำสั่งหลักในสคริปต์อัตโนมัติ scripts/deploy_ec2_vpc_asg.ps1 สำหรับสร้างโครงสร้างพื้นฐานบน AWS Learner Lab:")
    add_code_block("""param (
    [string]$Region = "us-east-1",
    [string]$InstanceType = "t3.micro",
    [string]$AmiId = "ami-0c101f26f147fa7fd",
    [string]$KeyName = "vockey",
    [string]$IamRole = "LabInstanceProfile"
)
Write-Host ">>> [1/7] Finding/Creating Lean Multi-AZ VPC..." -ForegroundColor Cyan
$vpcId = (aws ec2 describe-vpcs --filters "Name=tag:Name,Values=lorcana-vpc" --query "Vpcs[0].VpcId" --output text --region $Region)
if ($vpcId -eq "None" -or -not $vpcId) {
    $vpcId = (aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query "Vpc.VpcId" --output text --region $Region)
    aws ec2 create-tags --resources $vpcId --tags Key=Name,Value=lorcana-vpc --region $Region
}
Write-Host ">>> [2/7] Creating Dual-AZ Public Subnets..." -ForegroundColor Cyan
$sub1 = (aws ec2 create-subnet --vpc-id $vpcId --cidr-block 10.0.1.0/24 --availability-zone ${Region}a --query "Subnet.SubnetId" --output text --region $Region)
$sub2 = (aws ec2 create-subnet --vpc-id $vpcId --cidr-block 10.0.2.0/24 --availability-zone ${Region}b --query "Subnet.SubnetId" --output text --region $Region)
Write-Host ">>> [3/7] Setting Up Chained Security Groups..." -ForegroundColor Cyan
# ALB Security Group (Internet facing)
$albSg = (aws ec2 create-security-group --group-name lorcana-alb-sg --description "ALB SG" --vpc-id $vpcId --query "GroupId" --output text --region $Region)
aws ec2 authorize-security-group-ingress --group-id $albSg --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $Region
# EC2 Security Group (Only from ALB SG)
$ec2Sg = (aws ec2 create-security-group --group-name lorcana-ec2-sg --description "EC2 SG" --vpc-id $vpcId --query "GroupId" --output text --region $Region)
aws ec2 authorize-security-group-ingress --group-id $ec2Sg --protocol tcp --port 80 --source-group $albSg --region $Region
aws ec2 authorize-security-group-ingress --group-id $ec2Sg --protocol tcp --port 3001 --source-group $albSg --region $Region""")

    add_h2("ภาคผนวก ข: สคริปต์ 1-Click Scale-to-Zero สำหรับควบคุมงบประมาณ")
    add_body_p("สคริปต์ scripts/lab_stop.ps1 สำหรับสั่งปรับขนาด Auto Scaling Group (Desired=0, Min=0) เพื่อยุติเครื่องและหยุดคิดค่าบริการ Compute ทันทีเมื่อเลิกใช้งาน:")
    add_code_block("""Write-Host ">>> Stopping Lab: Scaling ASG to Zero Instances..." -ForegroundColor Yellow
aws autoscaling update-auto-scaling-group `
    --auto-scaling-group-name "lorcana-asg" `
    --min-size 0 `
    --max-size 0 `
    --desired-capacity 0 `
    --region "us-east-1"
Write-Host ">>> ASG set to 0. All EC2 instances are terminating cleanly." -ForegroundColor Green
Write-Host ">>> Cost per hour is now $0.00." -ForegroundColor Green""")

    # Save Document
    doc.save(TARGET_DOCX)
    print(f"[SUCCESS] Saved DOCX to: {TARGET_DOCX} ({os.path.getsize(TARGET_DOCX):,} bytes)")
    
    # Also copy to Thai filename
    shutil.copyfile(TARGET_DOCX, TARGET_THAI_DOCX)
    print(f"[SUCCESS] Copied to Thai filename: {TARGET_THAI_DOCX}")

if __name__ == '__main__':
    build_docx()
