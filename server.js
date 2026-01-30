// server.js
const express = require('express');
const app = express();

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Eurocomp Scraper API funcionando' });
});

// Endpoint principal (acepta POST)
app.post('/extract-eurocomp', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || !url.includes('eurocompcr.com')) {
      return res.status(400).json({ 
        error: 'URL de Eurocomp requerida',
        received: url
      });
    }

    // Simular extracción (sin Puppeteer por ahora)
    console.log('Extrayendo:', url);
    
    // Datos de prueba
    const mockData = {
      name: 'Producto de prueba Eurocomp',
      price_usd: '185.00',
      price_crc: '105872',
      image: 'https://via.placeholder.com/300x200?text=Imagen+de+prueba',
      description: 'Descripción de prueba del producto de Eurocomp'
    };

    res.json(mockData);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
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
