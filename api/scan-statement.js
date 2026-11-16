const Anthropic = require('@anthropic-ai/sdk').default;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

module.exports = async (req, res) => {
  // CORS: only the app's own origin, not '*'.
  // Security (Fase 0): this endpoint spends Anthropic credits on every call,
  // so it now requires the caller's Supabase session token and rejects
  // oversized files. It was previously open to anyone on the internet.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sistema-monarch.vercel.app';
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', origin === siteUrl ? origin : siteUrl);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Require a Supabase session token.
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!process.env.ANTHROPIC_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Statement scan is not configured' });
  }
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { file, fileType } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Reject oversized uploads (base64 string, ~10 MB of file data max).
    if (typeof file !== 'string' || file.length > 15000000) {
      return res.status(413).json({ error: 'File too large' });
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
      error: 'Error processing statement'
    });
  }
};
