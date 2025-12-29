const Anthropic = require('@anthropic-ai/sdk').default;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file, fileType } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    let base64Data = file;
    let mediaType = 'image/jpeg';

    // Procesar según el tipo de archivo
    if (fileType === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      
      // Extraer texto del PDF
      const pdfBuffer = Buffer.from(file.split(',')[1] || file, 'base64');
      const data = await pdfParse(pdfBuffer);
      
      // Enviar el texto extraído a Claude
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Analiza este estado de cuenta bancario o de tarjeta de crédito y extrae TODAS las transacciones.

Texto del estado de cuenta:
${data.text}

Devuelve SOLO un JSON válido (sin markdown, sin comentarios) con este formato EXACTO:
{
  "transacciones": [
    {
      "fecha": "2025-10-15",
      "descripcion": "WALMART SUPERCENTER",
      "monto": -45.67,
      "categoria": "Supermercado",
      "tipo": "gasto"
    }
  ],
  "resumen": {
    "total_ingresos": 0,
    "total_gastos": 0,
    "cantidad_transacciones": 0
  }
}

REGLAS IMPORTANTES:
- fecha: formato YYYY-MM-DD
- monto: número negativo para gastos, positivo para ingresos/depósitos
- categoria: una de estas: Supermercado, Gasolina, Restaurante, Entretenimiento, Salud, Transporte, Servicios, Otros
- tipo: "gasto" o "ingreso"
- NO incluyas pagos de tarjeta (payments) ni balances
- SOLO transacciones reales de compras/gastos/depósitos`
        }]
      });

      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No se pudo parsear la respuesta de Claude');
      }

      const result = JSON.parse(jsonMatch[0]);
      return res.status(200).json(result);

    } else {
      // Procesar imagen (JPEG, PNG, WEBP)
      if (file.includes('base64,')) {
        base64Data = file.split(',')[1];
      }

      if (file.startsWith('data:image/png')) {
        mediaType = 'image/png';
      } else if (file.startsWith('data:image/webp')) {
        mediaType = 'image/webp';
      }

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Analiza esta imagen de un estado de cuenta bancario o de tarjeta de crédito y extrae TODAS las transacciones visibles.

Devuelve SOLO un JSON válido (sin markdown, sin comentarios) con este formato EXACTO:
{
  "transacciones": [
    {
      "fecha": "2025-10-15",
      "descripcion": "WALMART SUPERCENTER",
      "monto": -45.67,
      "categoria": "Supermercado",
      "tipo": "gasto"
    }
  ],
  "resumen": {
    "total_ingresos": 0,
    "total_gastos": 0,
    "cantidad_transacciones": 0
  }
}

REGLAS IMPORTANTES:
- fecha: formato YYYY-MM-DD (si no está el año, usa 2025)
- monto: número negativo para gastos, positivo para ingresos/depósitos
- categoria: una de estas: Supermercado, Gasolina, Restaurante, Entretenimiento, Salud, Transporte, Servicios, Otros
- tipo: "gasto" o "ingreso"
- NO incluyas pagos de tarjeta (payments) ni balances
- SOLO transacciones reales de compras/gastos/depósitos
- Si ves abreviaturas, expándelas (ej: "WM" = "WALMART")`
            }
          ]
        }]
      });

      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No se pudo parsear la respuesta de Claude');
      }

      const result = JSON.parse(jsonMatch[0]);
      return res.status(200).json(result);
    }

  } catch (error) {
    console.error('Error processing statement:', error);
    return res.status(500).json({ 
      error: 'Error processing statement',
      details: error.message 
    });
  }
};
