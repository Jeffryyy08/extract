// server.js
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint para extraer datos de Eurocomp
app.post('/extract-eurocomp', async (req, res) => {
  try {
    const { url } = req.body;
    
    // Validación básica
    if (!url || !url.includes('eurocompcr.com')) {
      return res.status(400).json({ error: 'URL de Eurocomp requerida' });
    }

    console.log('Extrayendo datos de:', url);
    
    // Configuración de Puppeteer para Railway
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
      
      // Precio
      const priceElement = document.querySelector('#main_div > div > div.card.hoverable.mb-5.p-2 > div.card-body > div > div.col-lg-7.p-3 > h4 > strong');
      let priceUsd = '';
      let priceCrc = '';
      
      if (priceElement) {
        const priceText = priceElement.innerText.trim();
        const priceMatch = priceText.match(/[\d,\.]+/);
        if (priceMatch) {
          const cleanPrice = priceMatch[0].replace(/,/g, '');
          const usdNum = parseFloat(cleanPrice);
          if (!isNaN(usdNum) && usdNum > 0) {
            priceUsd = cleanPrice;
            // Conversión: USD → CRC (505) + IVA (13%)
            const crcWithoutIva = usdNum * 505;
            const crcWithIva = crcWithoutIva * 1.13;
            priceCrc = Math.round(crcWithIva).toString();
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

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Eurocomp Scraper API funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
