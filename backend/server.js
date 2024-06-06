const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createWorker } = require('tesseract.js');
const fs = require('fs');

const app = express();
const port = 5000;

app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/text', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const worker = await createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data } = await worker.recognize(req.file.path);
    await worker.terminate();

    // Log the recognized text
    console.log('Recognized text:', data.text);

    const { company, date, email, invoiceNumber, duePrice } = extractDetails(data.text);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ company, date, email, invoiceNumber, duePrice });
  } catch (error) {
    console.error('Error extracting text:', error);
    res.status(500).json({ error });
  }
});

function extractDetails(text) {
  const companyRegex = /^(\S+.*)/m;
  const dateRegex = /\b(\w{3,9} \d{1,2}, \d{4})\b/;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const invoiceNumberRegex = /# (\d+)/;
  const duePriceRegex = /balance\s*due\s*[:\-]?\s*\$?\s*(\d+(?:\.\d{1,2})?)/i;
  
  // Additional regex patterns for Subtotal, Tax, Total, and Amount Paid
  const subtotalRegex = /Subtotal:\s*\$?(\d+(?:\.\d{1,2})?)/i;
  const taxRegex = /Tax\s*\(\s*20%\s*\):\s*\$?(\d+(?:\.\d{1,2})?)/i;
  const totalRegex = /Total:\s*\$?(\d+(?:\.\d{1,2})?)/i;
  const amountPaidRegex = /Amount\s*Paid:\s*\$?(\d+(?:\.\d{1,2})?)/i;

  const companyMatch = text.match(companyRegex);
  const dateMatch = text.match(dateRegex);
  const emailMatch = text.match(emailRegex);
  const invoiceNumberMatch = text.match(invoiceNumberRegex);
  const duePriceMatch = text.match(duePriceRegex);

  // Additional matches for Subtotal, Tax, Total, and Amount Paid
  const subtotalMatch = text.match(subtotalRegex);
  const taxMatch = text.match(taxRegex);
  const totalMatch = text.match(totalRegex);
  const amountPaidMatch = text.match(amountPaidRegex);

  const company = companyMatch ? companyMatch[1].trim() : null;
  const date = dateMatch ? dateMatch[1] : null;
  const email = emailMatch ? emailMatch[0] : null;
  const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[1] : null;
  const duePrice = duePriceMatch ? parseFloat(duePriceMatch[1]).toFixed(2) : null;

  // Extracted Subtotal, Tax, Total, and Amount Paid
  const subtotal = subtotalMatch ? parseFloat(subtotalMatch[1]).toFixed(2) : null;
  const tax = taxMatch ? parseFloat(taxMatch[1]).toFixed(2) : null;
  const total = totalMatch ? parseFloat(totalMatch[1]).toFixed(2) : null;
  const amountPaid = amountPaidMatch ? parseFloat(amountPaidMatch[1]).toFixed(2) : null;

  // Log extracted details
  console.log('Extracted Company:', company);
  console.log('Extracted Date:', date);
  console.log('Extracted Email:', email);
  console.log('Extracted Invoice Number:', invoiceNumber);
  console.log('Extracted Due Price:', duePrice);
  console.log('Extracted Subtotal:', subtotal);
  console.log('Extracted Tax:', tax);
  console.log('Extracted Total:', total);
  console.log('Extracted Amount Paid:', amountPaid);

  return { company, date, email, invoiceNumber, duePrice, subtotal, tax, total, amountPaid };
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
