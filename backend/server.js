const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createWorker, worker } = require('tesseract.js');

const app = express();
const port = 5000;

// Allow requests from localhost:3000
app.use(cors());

// Multer configuration for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Define a route to handle image uploads and text extraction

app.post('/extract-text', upload.single('image'), async (req, res) => {
  try {
    console.log(req);
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }


    const worker = createWorker({
      logger: m => console.log(m) // Optional logger
    });
    await worker.load();
    await worker.loadLanguage('eng+ara');
    await worker.initialize('eng+ara');
    const { data } = await worker.recognize(req.file.path);
    await worker.terminate();

    res.json({ text: data.text });
  } catch (error) {
    console.error('Error extracting text:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
