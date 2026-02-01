// server.js
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();

// ✅ Configurar CORS para permitir solicitudes desde tu dominio
app.use(cors({
  origin: [
    'http://localhost:3000',           // Desarrollo local
    'https://teknocr1ver.vercel.app/',     // Reemplaza con tu dominio de Vercel
    'https://www.teknocr.com'          // Reemplaza con tu dominio personal si lo tienes
  ],
  credentials: true
}));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Eurocomp Scraper API funcionando' });
});

// Endpoint principal para extraer datos de Eurocomp
app.post('/extract-eurocomp', async (req, res) => {
  try {
    const { url } = req.body;
    
    // Validación básica
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL requerida' });
    }

    if (!url.includes('eurocompcr.com')) {
      return res.status(400).json({ error: 'Solo se admiten URLs de Eurocomp CR' });
    }

    console.log('Extrayendo datos de:', url);
    
    // Iniciar Puppeteer
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
    
    // Navegar a la URL
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });

    // Extraer datos usando selectores exactos
    const data = await page.evaluate(() => {
      // Nombre
      const nameElement = document.querySelector('#main_div > div > div.card.hoverable.mb-5.p-2 > div.card-body > div > div.col-lg-7.p-3 > h3 strong');
      const name = nameElement ? nameElement.innerText.trim() : '';
      
      // ✅ Extraer precio en dólares (versión robusta)
let priceText = '';
const priceSelectors = [
  '#main_div > div > div.card.hoverable.mb-5.p-2 > div.card-body > div > div.col-lg-7.p-3 > h4 > strong',
  '.price',
  'span.price',
  'div.price',
  'strong:contains("$")',
  '[data-price]'
];

for (const selector of priceSelectors) {
  const el = document.querySelector(selector);
  if (el) {
    priceText = el.innerText.trim();
    if (priceText) break;
  }
}

let priceUsd = '';
let priceCrc = '';

if (priceText) {
  // Extraer número (ej: "$185.00" → "185.00")
  const priceMatch = priceText.match(/[\d,\.]+/);
  if (priceMatch) {
    const cleanPrice = priceMatch[0].replace(/,/g, '');
    const usdNum = parseFloat(cleanPrice);
    
    if (!isNaN(usdNum) && usdNum > 0) {
      priceUsd = cleanPrice; // Mantener formato original
      
      // 🔢 Fórmula: USD + 13% → × 505
      const usdWithIva = usdNum * 1.13;     // Sumar 13% de IVA al USD
      const crcFinal = usdWithIva * 505;     // Convertir a colones
      priceCrc = Math.round(crcFinal).toString(); // Redondear
    }
  }
}
      
      // Imagen
      const imgElement = document.querySelector('#main_div > div > div.card.hoverable.mb-5.p-2 > div.card-body > div > div.col-lg-5.p-3 > img');
      const image = imgElement ? imgElement.src : '';
      
      // Descripción
      const descElement = document.querySelector('#main_div > div > div.card.hoverable.mb-5.p-2 > div.card-body > div > div.col-lg-7.p-3 > p');
      const description = descElement ? descElement.innerText.trim().substring(0, 200) : '';

      return {
        name,
        price_usd: priceUsd,
        price_crc: priceCrc,
        image,
        description
      };
    });

    await browser.close();
    
    console.log('Extracción exitosa:', data);
    res.json(data);

  } catch (error) {
    console.error('Error en extracción:', error);
    res.status(500).json({ 
      error: 'Error al extraer datos de Eurocomp',
      details: error.message 
    });
  }
});

// Manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Puerto dinámico de Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
