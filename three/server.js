import express from 'express';
import { readFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3333;
const PUBLIC_DIR = join(__dirname, '..', 'public');

// Extract kdoc number from filename
function extractKdocNumber(filename) {
  const match = filename.match(/--kdoc-(\d+)-/);
  return match ? parseInt(match[1]) : null;
}

// Find file with specific kdoc number
async function findKdocFile(kdocNumber) {
  const files = await readdir(PUBLIC_DIR);
  return files.find(f => {
    const num = extractKdocNumber(f);
    return num === kdocNumber;
  });
}

// Three.js import map script
const IMPORTMAP_SCRIPT = `<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
  }
}
</script>
<script type="module" src="js/drum-scroll.js"></script>`;

// Middleware to inject scripts into HTML files
app.use(async (req, res, next) => {
  // Only process .html files
  if (!req.path.endsWith('.html')) {
    return next();
  }

  try {
    const decodedPath = decodeURIComponent(req.path);
    const filePath = join(PUBLIC_DIR, decodedPath);
    const html = await readFile(filePath, 'utf-8');

    // Check if scripts are already injected
    if (html.includes('three@0.170.0')) {
      return res.send(html);
    }

    // Inject scripts after <head> tag
    const modifiedHtml = html.replace(
      /(<head[^>]*>)/i,
      `$1\n${IMPORTMAP_SCRIPT}`
    );

    res.send(modifiedHtml);
  } catch (error) {
    // If file not found, continue to static file handler
    next();
  }
});

// API: Get next KDOC page
app.get('/api/next', async (req, res) => {
  const current = decodeURIComponent(req.query.current || '').replace(/^\//, '');
  const currentKdocNumber = extractKdocNumber(current);

  if (!currentKdocNumber) {
    return res.json({ next: null });
  }

  try {
    const files = await readdir(PUBLIC_DIR);
    const kdocFiles = files
      .map(f => ({ filename: f, number: extractKdocNumber(f) }))
      .filter(f => f.number !== null)
      .sort((a, b) => a.number - b.number);

    const nextFile = kdocFiles.find(f => f.number > currentKdocNumber);

    if (nextFile) {
      res.json({
        next: `/${nextFile.filename}`,
        kdocNumber: nextFile.number
      });
    } else {
      res.json({ next: null });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get next page' });
  }
});

// API: Get previous KDOC page
app.get('/api/prev', async (req, res) => {
  const current = decodeURIComponent(req.query.current || '').replace(/^\//, '');
  const currentKdocNumber = extractKdocNumber(current);

  if (!currentKdocNumber) {
    return res.json({ prev: null });
  }

  try {
    const files = await readdir(PUBLIC_DIR);
    const kdocFiles = files
      .map(f => ({ filename: f, number: extractKdocNumber(f) }))
      .filter(f => f.number !== null)
      .sort((a, b) => a.number - b.number);

    const prevFiles = kdocFiles.filter(f => f.number < currentKdocNumber);
    const prevFile = prevFiles[prevFiles.length - 1];

    if (prevFile) {
      res.json({
        prev: `/${prevFile.filename}`,
        kdocNumber: prevFile.number
      });
    } else {
      res.json({ prev: null });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get previous page' });
  }
});

// API: Get random KDOC page
app.get('/api/random', async (req, res) => {
  try {
    const files = await readdir(PUBLIC_DIR);
    const kdocFiles = files.filter(f => f.match(/--kdoc-\d+-.*\.html$/));

    if (kdocFiles.length === 0) {
      return res.json({ random: null });
    }

    const randomFile = kdocFiles[Math.floor(Math.random() * kdocFiles.length)];
    const kdocNumber = extractKdocNumber(randomFile);

    res.json({
      random: `/${randomFile}`,
      kdocNumber: kdocNumber
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get random page' });
  }
});

// Serve drum-scroll.js from three directory
app.get('/js/drum-scroll.js', async (req, res) => {
  try {
    const drumScrollPath = join(__dirname, 'drum-scroll.js');
    const content = await readFile(drumScrollPath, 'utf-8');
    res.type('application/javascript').send(content);
  } catch (error) {
    res.status(404).send('Not found');
  }
});

// Serve navigation-buttons.js from three directory
app.get('/js/navigation-buttons.js', async (req, res) => {
  try {
    const navButtonsPath = join(__dirname, 'navigation-buttons.js');
    const content = await readFile(navButtonsPath, 'utf-8');
    res.type('application/javascript').send(content);
  } catch (error) {
    res.status(404).send('Not found');
  }
});

// Serve static files from public directory
app.use(express.static(PUBLIC_DIR));

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`3D Viewer Server running at http://0.0.0.0:${PORT}`);
  console.log(`Serving files from: ${PUBLIC_DIR}`);
});

// Handle port already in use error
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\nError: Port ${PORT} is already in use.`);
    console.error(`Please try a different port by setting the PORT environment variable:`);
    console.error(`  PORT=3334 npm start\n`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});
