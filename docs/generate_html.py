#!/usr/bin/env python3
"""
Convert XMBot markdown documents to HTML for PDF conversion.
Open HTML files in browser and press Ctrl+P to save as PDF.
"""

import markdown
import os

def md_to_html(md_file, html_file, title):
    """Convert markdown file to styled HTML."""
    with open(md_file, 'r') as f:
        md_content = f.read()
    
    html_body = markdown.markdown(
        md_content,
        extensions=['tables', 'fenced_code', 'toc']
    )
    
    html_full = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        @page {{ size: A4; margin: 20mm; }}
        @media print {{
            body {{ padding: 0; }}
            .no-print {{ display: none; }}
            h1 {{ page-break-before: always; }}
            h1:first-of-type {{ page-break-before: avoid; }}
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.7; 
            color: #333; 
            max-width: 900px; 
            margin: 0 auto; 
            padding: 40px; 
            background: white; 
        }}
        .print-btn {{
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1E3A5F;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            z-index: 1000;
        }}
        .print-btn:hover {{ background: #2d5a87; }}
        h1 {{ 
            color: #1E3A5F; 
            font-size: 26px; 
            border-bottom: 3px solid #F4B942; 
            padding-bottom: 10px; 
            margin: 30px 0 20px; 
        }}
        h2 {{ 
            color: #1E3A5F; 
            font-size: 20px; 
            margin: 25px 0 15px; 
            border-left: 4px solid #F4B942; 
            padding-left: 10px; 
        }}
        h3 {{ 
            color: #2d5a87; 
            font-size: 16px; 
            margin: 20px 0 10px; 
        }}
        p {{ margin: 10px 0; }}
        table {{ 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0; 
            font-size: 13px; 
        }}
        th {{ 
            background: #1E3A5F; 
            color: white; 
            padding: 10px; 
            text-align: left; 
        }}
        td {{ 
            padding: 8px 10px; 
            border-bottom: 1px solid #ddd; 
        }}
        tr:nth-child(even) {{ background: #f8f9fa; }}
        code {{ 
            background: #f4f4f4; 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
        }}
        pre {{ 
            background: #1E3A5F; 
            color: #f4f4f4; 
            padding: 15px; 
            border-radius: 8px; 
            overflow-x: auto; 
            margin: 15px 0; 
        }}
        pre code {{ background: none; color: inherit; padding: 0; }}
        strong {{ color: #1E3A5F; }}
        blockquote {{ 
            border-left: 4px solid #F4B942; 
            padding: 10px 20px; 
            margin: 15px 0; 
            background: #fffbf0; 
            font-style: italic; 
        }}
        hr {{ border: none; border-top: 2px solid #eee; margin: 30px 0; }}
        ul, ol {{ margin: 10px 0 10px 25px; }}
        li {{ margin: 5px 0; }}
    </style>
</head>
<body>
    <button class="print-btn no-print" onclick="window.print()">📥 Save as PDF</button>
    {html_body}
</body>
</html>"""
    
    with open(html_file, 'w') as f:
        f.write(html_full)
    
    print(f"✅ Created: {html_file}")

def main():
    docs_dir = os.path.dirname(os.path.abspath(__file__))
    
    documents = [
        ("INVESTOR_PITCH.md", "INVESTOR_PITCH.html", "XMBot Investor Pitch"),
        ("INTERNAL_TEAM.md", "INTERNAL_TEAM.html", "XMBot Internal Documentation"),
        ("EXECUTIVE_SUMMARY.md", "EXECUTIVE_SUMMARY.html", "XMBot Executive Summary"),
    ]
    
    for md_file, html_file, title in documents:
        md_path = os.path.join(docs_dir, md_file)
        html_path = os.path.join(docs_dir, html_file)
        
        if os.path.exists(md_path):
            md_to_html(md_path, html_path, title)
        else:
            print(f"⚠️  File not found: {md_file}")
    
    print("\n📚 HTML files created!")
    print("\nTo generate PDFs:")
    print("1. Open each .html file in your browser")
    print("2. Click the 'Save as PDF' button (or press Ctrl+P)")
    print("3. Select 'Save as PDF' as the destination")

if __name__ == "__main__":
    main()