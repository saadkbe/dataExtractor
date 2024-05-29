const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createWorker } = require('tesseract.js');

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

    const extractedPrice = extractPrice(data.text);

    res.json({ price: extractedPrice });
  } catch (error) {
    console.error('Error extracting text:', error);
    res.status(500).json({ error });
  }
});

function extractPrice(text) {
  const regex = /total\s*\:?\s*\$?(\d+(\.\d{1,2})?)/i;
  const match = text.match(regex);
  if (match) {
    const price = match[1];
    return parseFloat(price).toFixed(2);
  } else {
    return null;
  }
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
