// server.js
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();

// ✅ Configurar CORS (corregido: sin espacios en los dominios)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://teknocr1ver.vercel.app',
    'https://www.teknocr.com'
  ],
  credentials: true
}));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Eurocomp Scraper API funcionando' });
});

// Endpoint principal: solo extrae nombre, imagen y descripción
app.post('/extract-eurocomp', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL requerida' });
    }

    if (!url.includes('eurocompcr.com')) {
      return res.status(400).json({ error: 'Solo se admiten URLs de Eurocomp CR' });
    }

    console.log('Extrayendo datos de:', url);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // ✅ Extraer SOLO nombre, imagen y descripción
    const data = await page.evaluate(() => {
      // Nombre
      const nameEl = document.querySelector('#main_div > div > div.card.hoverable.mb-5.p-2 > div.card-body > div > div.col-lg-7.p-3 > h3 strong');
      const name = nameEl ? nameEl.innerText.trim() : '';
      
      // Imagen
      const imgEl = document.querySelector('#main_div > div > div.card.hoverable.mb-5.p-2 > div.card-body > div > div.col-lg-5.p-3 > img');
      const image = imgEl ? imgEl.src : '';
      
      // Descripción
      const descEl = document.querySelector('#main_div > div > div.card.hoverable.mb-5.p-2 > div.card-body > div > div.col-lg-7.p-3 > p');
      const description = descEl ? descEl.innerText.trim() : '';

      return {
        name,
        image,
        description
        // ❌ Sin price_usd ni price_crc
      };
    });

    await browser.close();
    console.log('Extracción exitosa (sin precio):', data);
    res.json(data);

  } catch (error) {
    console.error('Error en extracción:', error);
    res.status(500).json({ 
      error: 'Error al extraer datos de Eurocomp',
      details: error.message 
    });
  }
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
