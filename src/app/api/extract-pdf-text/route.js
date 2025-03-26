import { NextResponse } from 'next/server';
import * as pdfjs from 'pdfjs-dist';

// Initialize the PDF.js worker
if (typeof window === 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

export async function POST(req) {
  try {
    const { pdfData, pageNumber } = await req.json();
    
    if (!pdfData || !pageNumber) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // Convert base64 to array buffer
    const pdfDataArray = Uint8Array.from(atob(pdfData.replace(/^data:application\/pdf;base64,/, '')), c => c.charCodeAt(0));
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: pdfDataArray });
    const pdf = await loadingTask.promise;
    
    // Get the specified page
    const page = await pdf.getPage(pageNumber);
    
    // Extract text content
    const textContent = await page.getTextContent();
    
    // Process text items
    const textItems = textContent.items.map(item => item.str.trim()).filter(text => text.length > 0);
    
    return NextResponse.json({ 
      text: textItems,
      pageCount: pdf.numPages
    });
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
