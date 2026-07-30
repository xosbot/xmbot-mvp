#!/usr/bin/env python3
"""
Convert XMBot markdown documents to PDF.
Usage: python3 generate_pdfs.py
Requires: pip install markdown weasyprint
"""

import markdown
from weasyprint import HTML
import os

def md_to_pdf(md_file, pdf_file):
    """Convert markdown file to PDF."""
    with open(md_file, 'r') as f:
        md_content = f.read()
    
    # Convert markdown to HTML
    html_body = markdown.markdown(
        md_content,
        extensions=['tables', 'fenced_code', 'codehilite', 'toc']
    )
    
    # Wrap in full HTML with styling
    html_full = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{ size: A4; margin: 2cm; }}
            body {{ 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333;
                font-size: 11pt;
            }}
            h1 {{ 
                color: #1E3A5F; 
                font-size: 24pt; 
                border-bottom: 3px solid #F4B942; 
                padding-bottom: 10px;
                margin-top: 30px;
            }}
            h2 {{ 
                color: #1E3A5F; 
                font-size: 18pt; 
                margin-top: 25px;
                border-left: 4px solid #F4B942;
                padding-left: 10px;
            }}
            h3 {{ 
                color: #2d5a87; 
                font-size: 14pt; 
                margin-top: 20px;
            }}
            table {{ 
                width: 100%; 
                border-collapse: collapse; 
                margin: 15px 0;
                font-size: 10pt;
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
                font-size: 9pt;
            }}
            pre {{ 
                background: #1E3A5F; 
                color: #f4f4f4; 
                padding: 15px; 
                border-radius: 8px;
                overflow-x: auto;
                font-size: 9pt;
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
        {html_body}
    </body>
    </html>
    """
    
    # Generate PDF
    HTML(string=html_full).write_pdf(pdf_file)
    print(f"✅ Generated: {pdf_file}")

def main():
    docs_dir = os.path.dirname(os.path.abspath(__file__))
    
    documents = [
        ("INVESTOR_PITCH.md", "INVESTOR_PITCH.pdf"),
        ("INTERNAL_TEAM.md", "INTERNAL_TEAM.pdf"),
        ("EXECUTIVE_SUMMARY.md", "EXECUTIVE_SUMMARY.pdf"),
    ]
    
    for md_file, pdf_file in documents:
        md_path = os.path.join(docs_dir, md_file)
        pdf_path = os.path.join(docs_dir, pdf_file)
        
        if os.path.exists(md_path):
            try:
                md_to_pdf(md_path, pdf_path)
            except Exception as e:
                print(f"❌ Error converting {md_file}: {e}")
        else:
            print(f"⚠️  File not found: {md_file}")
    
    print("\n📚 PDF generation complete!")
    print("To install dependencies: pip install markdown weasyprint")

if __name__ == "__main__":
    main()