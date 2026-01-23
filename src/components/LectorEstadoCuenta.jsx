import React, { useMemo, useRef, useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  XCircle,
  TrendingDown,
  Wallet,
  X,
  Save,
  RefreshCw,
  Zap,
  AlertTriangle,
  Eye,
} from "lucide-react";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { useGastosVariables } from "../hooks/useGastosVariables";
import { useIngresos } from "../hooks/useIngresos";

// Configurar PDF.js worker para v5.x
// La versión 5.x usa un formato diferente de worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// ============================================
// CATEGORÍAS Y REGLAS DE CLASIFICACIÓN
// ============================================
const CATEGORY_RULES = [
  { cat: "🚗 Transporte", keywords: ["uber", "lyft", "didi", "mbta", "taxi", "parking", "toll", "ezpass", "zipcar", "logan", "massport"] },
  { cat: "✈️ Viajes", keywords: ["jetblue", "delta", "american airlines", "united", "southwest", "airbnb", "hotel", "expedia", "booking"] },
  { cat: "⛽ Gasolina", keywords: ["shell", "citgo", "cumberland", "speedway", "exxon", "mobil", "chevron", "gas station", "sunoco", "super petro", "route 114"] },
  { cat: "🍔 Restaurantes", keywords: ["restaurant", "doordash", "grubhub", "ubereats", "mcdonald", "burger", "pizza", "taco", "chipotle", "starbucks", "dunkin"] },
  { cat: "🛒 Supermercado", keywords: ["market basket", "walmart", "wal-mart", "target", "costco", "whole foods", "trader joe", "stop & shop", "cvs", "a.l. prime"] },
  { cat: "📱 Suscripciones", keywords: ["netflix", "spotify", "apple.com/bill", "apple com bill", "hulu", "disney+", "hbo", "amazon prime", "youtube", "oculus"] },
  { cat: "📞 Telecomunicaciones", keywords: ["verizon", "t-mobile", "tmobile", "at&t", "att ", "comcast", "xfinity", "spectrum"] },
  { cat: "☁️ Software/Tech", keywords: ["namecheap", "name-cheap", "squarespace", "sqsp", "godaddy", "aws ", "google cloud", "microsoft", "adobe", "openai"] },
  { cat: "🏠 Hogar", keywords: ["home depot", "lowes", "ikea", "wayfair", "rent", "mortgage", "howley", "prestige"] },
  { cat: "💪 Salud/Fitness", keywords: ["planet fitness", "gym", "fitness", "pharmacy", "cvs", "walgreens", "doctor", "medical", "experian"] },
  { cat: "🏥 Seguro", keywords: ["insurance", "geico", "state farm", "allstate", "progressive", "safety insurance"] },
  { cat: "🛒 Compras Online", keywords: ["amazon", "amzn", "ebay", "etsy", "paypal", "shopify"] },
  { cat: "🎮 Entretenimiento", keywords: ["playstation", "sie playstation", "xbox", "nintendo", "steam", "fanduel", "draftkings"] },
  { cat: "💳 Servicios Financieros", keywords: ["credit one", "discover", "identityiq", "kikoff", "credit karma", "experian", "kikoffinc"] },
  { cat: "💸 Transferencias", keywords: ["zelle", "venmo", "cash app", "paypal transfer", "wire transfer", "transfer to", "transfer from", "boss money", "nowrtp"] },
  { cat: "🏦 Pagos/Trabajo", keywords: ["pixieset", "smartshoot", "payoneer", "loan payment", "toyota"] },
  { cat: "💰 Fees/Cargos", keywords: ["nsf fee", "overdraft", "monthly fee", "service charge", "late fee", "interest charge"] },
  { cat: "🚙 Auto", keywords: ["toyota", "honda", "car payment", "auto"] },
  { cat: "🌐 Remesas", keywords: ["boss money", "idt.net", "remittance", "western union", "moneygram"] },
  { cat: "🏢 Membresías", keywords: ["aaa", "costco", "sam's club", "membership"] },
];

// ============================================
// UTILIDADES
// ============================================
function clampStr(s = "", max = 80) {
  const t = String(s || "").trim().replace(/\s+/g, " ");
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

function guessCategory(desc) {
  const d = (desc || "").toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => d.includes(k))) return rule.cat;
  }
  return "📦 Otros";
}

function stableTxKey(tx) {
  const d = tx.fecha || "";
  const a = Number(tx.monto || 0).toFixed(2);
  const desc = (tx.descripcion || "").toLowerCase().slice(0, 20);
  return `${d}|${a}|${desc}`;
}

// ============================================
// PARSER ESPECÍFICO PARA SALEM FIVE
// Formato: MM/DD/YYYY | Description | Debits | Credits | Balance
// ============================================
function parseSalemFive(text) {
  console.log("🏦 Parsing Salem Five statement...");
  
  const transactions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Líneas a ignorar
  const skipPatterns = [
    /beginning balance/i,
    /ending balance/i,
    /credit\(s\) this period/i,
    /debit\(s\) this period/i,
    /service charge/i,
    /account summary/i,
    /daily balance/i,
    /total/i,
    /^date\s+description/i,
    /^post date/i,
    /account activity/i,
    /statement ending/i,
    /page \d+ of/i,
  ];

  // Patrón para líneas de transacción de Salem Five
  // Formato: MM/DD/YYYY Description $Amount $Balance
  const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})\s+(.+)/;
  
  for (const line of lines) {
    // Saltar líneas de encabezado/resumen
    if (skipPatterns.some(p => p.test(line))) continue;
    
    const match = line.match(datePattern);
    if (!match) continue;
    
    const [, mm, dd, yyyy, rest] = match;
    const fecha = `${yyyy}-${mm}-${dd}`;
    
    // Extraer montos (formato $X,XXX.XX o X,XXX.XX)
    const moneyPattern = /\$?([\d,]+\.\d{2})/g;
    const amounts = [];
    let m;
    while ((m = moneyPattern.exec(rest)) !== null) {
      amounts.push({
        value: parseFloat(m[1].replace(/,/g, '')),
        index: m.index
      });
    }
    
    if (amounts.length === 0) continue;
    
    // Limpiar descripción (remover montos y limpiar)
    let desc = rest;
    amounts.forEach(a => {
      desc = desc.replace(`$${a.value.toLocaleString('en-US', {minimumFractionDigits: 2})}`, '');
      desc = desc.replace(a.value.toLocaleString('en-US', {minimumFractionDigits: 2}), '');
      desc = desc.replace(a.value.toString(), '');
    });
    desc = desc.replace(/\s+/g, ' ').trim();
    
    // Remover información redundante
    desc = desc.replace(/\+1-800-850-5000/g, '').trim();
    desc = desc.replace(/MAUS$/i, '').trim();
    desc = desc.replace(/CAUS$/i, '').trim();
    desc = desc.replace(/WAUS$/i, '').trim();
    desc = desc.replace(/NJUS$/i, '').trim();
    desc = desc.replace(/RIUS$/i, '').trim();
    desc = desc.replace(/NVUS$/i, '').trim();
    
    // Determinar tipo basado en descripción de Salem Five
    const isDebit = /withdrawal|debit|payment|nsf fee|fee$/i.test(rest);
    const isCredit = /deposit|credit|cashout/i.test(rest) && !/withdrawal/i.test(rest);
    
    // En Salem Five: primera columna es Debits, segunda es Credits
    // Si hay 2 montos y es un débito, el primer monto es el gasto
    // Si hay 2 montos y es un crédito, el segundo monto (antes del balance) es el ingreso
    let amount;
    let tipo;
    
    if (amounts.length >= 2) {
      // El último monto es siempre el balance
      if (isCredit) {
        // Para créditos, el monto está en la columna de Credits (segundo desde el final si hay 2 montos)
        amount = amounts[amounts.length - 2].value;
        tipo = "ingreso";
      } else {
        // Para débitos, el monto está en la columna de Debits (primero)
        amount = amounts[0].value;
        tipo = "gasto";
      }
    } else {
      amount = amounts[0].value;
      tipo = isCredit ? "ingreso" : "gasto";
    }
    
    // Validar que no sea un balance
    if (amount > 10000 && !isCredit && !isDebit) continue;
    
    transactions.push({
      fecha,
      descripcion: clampStr(desc || "Movimiento", 80),
      monto: tipo === "gasto" ? -Math.abs(amount) : Math.abs(amount),
      tipo,
      categoria: tipo === "gasto" ? guessCategory(desc) : "💰 Ingresos",
    });
  }
  
  console.log(`✅ Salem Five: ${transactions.length} transacciones encontradas`);
  return transactions;
}

// ============================================
// PARSER ESPECÍFICO PARA EASTERN BANK
// Formato: Mon DD | Description | Withdrawal | Deposit | Balance
// ============================================
function parseEasternBank(text, year = 2025) {
  console.log("🏦 Parsing Eastern Bank statement...");
  
  const transactions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Detectar año
  const yearMatch = text.match(/thru\s+\w+\s+\d+,?\s*(\d{4})/i);
  if (yearMatch) year = parseInt(yearMatch[1]);
  
  // Líneas a ignorar
  const skipPatterns = [
    /starting balance/i,
    /ending balance/i,
    /total deposits/i,
    /total withdrawals/i,
    /balance summary/i,
    /statement period/i,
    /account number/i,
    /^date\s+transaction/i,
  ];
  
  const months = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };
  
  // Patrón: Oct 02 Description... amounts
  const datePattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(.+)/i;
  
  for (const line of lines) {
    if (skipPatterns.some(p => p.test(line))) continue;
    
    const match = line.match(datePattern);
    if (!match) continue;
    
    const [, monthName, day, rest] = match;
    const monthNum = months[monthName.toLowerCase()];
    if (!monthNum) continue;
    
    const fecha = `${year}-${monthNum}-${String(day).padStart(2, '0')}`;
    
    // Extraer montos
    const moneyPattern = /([\d,]+\.\d{2})/g;
    const amounts = [];
    let m;
    while ((m = moneyPattern.exec(rest)) !== null) {
      amounts.push(parseFloat(m[1].replace(/,/g, '')));
    }
    
    if (amounts.length === 0) continue;
    
    // Limpiar descripción
    let desc = rest;
    amounts.forEach(a => {
      desc = desc.replace(a.toLocaleString('en-US', {minimumFractionDigits: 2}), '');
      desc = desc.replace(a.toString(), '');
    });
    desc = desc.replace(/\s+/g, ' ').trim();
    
    // Remover info redundante
    desc = desc.replace(/XXXXXXXXXXXX\d{4}/g, '').trim();
    desc = desc.replace(/SEQ #\s*\w+/gi, '').trim();
    desc = desc.replace(/NTE\*OBI\*[\d\s,\\]+/gi, '').trim();
    
    // Determinar tipo
    const isWithdrawal = /withdrawal|debit|transfer to|pos purchase|electronic payment|checking withdrawal/i.test(rest);
    const isDeposit = /credit|deposit|transfer from|preauthorized credit/i.test(rest) && !/withdrawal/i.test(rest);
    
    const tipo = isDeposit ? "ingreso" : (isWithdrawal ? "gasto" : "gasto");
    const amount = amounts[0]; // Primer monto es la transacción
    
    transactions.push({
      fecha,
      descripcion: clampStr(desc || "Movimiento", 80),
      monto: tipo === "gasto" ? -Math.abs(amount) : Math.abs(amount),
      tipo,
      categoria: tipo === "gasto" ? guessCategory(desc) : "💰 Ingresos",
    });
  }
  
  console.log(`✅ Eastern Bank: ${transactions.length} transacciones encontradas`);
  return transactions;
}

// ============================================
// PARSER UNIVERSAL (FALLBACK)
// ============================================
function parseUniversal(text) {
  console.log("🏦 Parsing con método universal...");
  
  const transactions = [];
  const year = new Date().getFullYear();
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Patrón MM/DD/YYYY
    const mmddMatch = line.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(.+)/);
    if (!mmddMatch) continue;
    
    const [, mm, dd, yy, rest] = mmddMatch;
    const yyyy = yy.length === 2 ? `20${yy}` : yy;
    const fecha = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    
    // Extraer montos
    const moneyPattern = /\$?([\d,]+\.\d{2})/g;
    const amounts = [];
    let m;
    while ((m = moneyPattern.exec(rest)) !== null) {
      amounts.push(parseFloat(m[1].replace(/,/g, '')));
    }
    
    if (amounts.length === 0) continue;
    
    // Descripción
    let desc = rest;
    amounts.forEach(a => {
      desc = desc.replace(`$${a}`, '').replace(a.toString(), '');
    });
    desc = desc.replace(/\s+/g, ' ').trim();
    
    const isCredit = /deposit|credit/i.test(rest);
    const tipo = isCredit ? "ingreso" : "gasto";
    
    transactions.push({
      fecha,
      descripcion: clampStr(desc || "Movimiento", 80),
      monto: tipo === "gasto" ? -Math.abs(amounts[0]) : Math.abs(amounts[0]),
      tipo,
      categoria: tipo === "gasto" ? guessCategory(desc) : "💰 Ingresos",
    });
  }
  
  console.log(`✅ Universal: ${transactions.length} transacciones encontradas`);
  return transactions;
}

// ============================================
// DETECTOR DE BANCO Y PARSER PRINCIPAL
// ============================================
function parseTransactions(text) {
  const lowerText = text.toLowerCase();
  
  let banco = "Desconocido";
  let transactions = [];
  
  if (lowerText.includes("salem five") || lowerText.includes("salemfive") || lowerText.includes("free checking - 8")) {
    banco = "Salem Five";
    transactions = parseSalemFive(text);
  } else if (lowerText.includes("eastern bank") || lowerText.includes("free business checking") || lowerText.includes("free business ckg")) {
    banco = "Eastern Bank";
    transactions = parseEasternBank(text);
  } else {
    banco = "Genérico";
    transactions = parseUniversal(text);
  }
  
  // Deduplicar
  const seen = new Set();
  const unique = transactions.filter(tx => {
    const key = stableTxKey(tx);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Calcular totales
  const totalGastos = unique.filter(t => t.tipo === "gasto").reduce((s, t) => s + Math.abs(t.monto), 0);
  const totalIngresos = unique.filter(t => t.tipo === "ingreso").reduce((s, t) => s + Math.abs(t.monto), 0);
  
  // Ordenar por fecha (más reciente primero)
  unique.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  return {
    transacciones: unique,
    resumen: { total_gastos: totalGastos, total_ingresos: totalIngresos },
    meta: { banco, total: unique.length }
  };
}

// ============================================
// PDF PROCESSING - Usa pdfjsLib importado globalmente
// ============================================
async function extractTextFromPdf(file, onProgress) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
    });
    
    const pdf = await loadingTask.promise;
    let fullText = "";
    const total = pdf.numPages;

    for (let p = 1; p <= total; p++) {
      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent();
      
      // Reconstruir texto con saltos de línea basados en posición Y
      const items = textContent.items || [];
      let lastY = null;
      let lineText = "";
      
      for (const item of items) {
        if (!item.str) continue;
        
        const y = item.transform ? item.transform[5] : 0;
        
        if (lastY !== null && Math.abs(y - lastY) > 5) {
          fullText += lineText.trim() + "\n";
          lineText = "";
        }
        
        lineText += item.str + " ";
        lastY = y;
      }
      
      fullText += lineText.trim() + "\n\n";
      
      if (onProgress) {
        onProgress(Math.round((p / total) * 100));
      }
    }

    return { text: fullText.trim(), numPages: total };
    
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw error;
  }
}

// ============================================
// OCR para imágenes SOLAMENTE
// ============================================
async function ocrImage(imageSource, onProgress) {
  try {
    const { data } = await Tesseract.recognize(imageSource, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });
    return data?.text || "";
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Error al procesar la imagen con OCR");
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function LectorEstadoCuenta({ onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [editableTx, setEditableTx] = useState([]);
  const [showRawText, setShowRawText] = useState(false);
  const [rawText, setRawText] = useState("");

  const { addGasto } = useGastosVariables();
  const { addIngreso } = useIngresos();
  const inputRef = useRef(null);

  const totals = useMemo(() => {
    let gastos = 0, ingresos = 0;
    for (const t of editableTx || []) {
      const n = Number(t.monto || 0);
      if (t.tipo === "gasto" || n < 0) gastos += Math.abs(n);
      else ingresos += Math.abs(n);
    }
    return { gastos, ingresos, neto: ingresos - gastos };
  }, [editableTx]);

  const resetAll = useCallback(() => {
    setFile(null);
    setPreview(null);
    setLoading(false);
    setMode("idle");
    setProgress(0);
    setProgressText("");
    setError(null);
    setResult(null);
    setEditableTx([]);
    setRawText("");
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Solo aceptamos JPG, PNG, WEBP o PDF.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
    setEditableTx([]);

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleScan = async () => {
    if (!file) return;

    setLoading(true);
    setMode("scanning");
    setError(null);
    setProgress(0);

    try {
      let extractedText = "";

      if (file.type === "application/pdf") {
        setProgressText("Extrayendo texto del PDF...");
        
        const { text } = await extractTextFromPdf(file, (p) => {
          setProgress(Math.round(p * 0.8));
        });
        extractedText = text || "";
        console.log("📄 Texto extraído del PDF:", extractedText.slice(0, 1000));
        
      } else {
        // Solo usar OCR para imágenes
        setProgressText("Procesando imagen con OCR...");
        extractedText = await ocrImage(preview, (p) => {
          setProgress(Math.round(p * 0.8));
        });
      }

      setProgress(90);
      setProgressText("Analizando transacciones...");
      setRawText(extractedText);

      if (!extractedText || extractedText.length < 50) {
        setError("No se pudo extraer suficiente texto del documento.");
        setMode("idle");
        return;
      }

      // Parsear transacciones
      const parsed = parseTransactions(extractedText);
      
      setProgress(100);
      setResult(parsed);
      setEditableTx(parsed.transacciones);
      setMode("reviewing");
      
      console.log(`✅ Resultado: ${parsed.transacciones.length} transacciones de ${parsed.meta.banco}`);

    } catch (err) {
      console.error("Error procesando:", err);
      setError("Error al procesar: " + (err?.message || "Error desconocido"));
      setMode("idle");
    } finally {
      setLoading(false);
      setProgressText("");
    }
  };

  const updateTx = (idx, patch) => {
    setEditableTx((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const removeTx = (idx) => {
    setEditableTx((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleTipo = (idx) => {
    setEditableTx((prev) => prev.map((t, i) => {
      if (i !== idx) return t;
      const nuevoTipo = t.tipo === "gasto" ? "ingreso" : "gasto";
      return {
        ...t,
        tipo: nuevoTipo,
        monto: nuevoTipo === "gasto" ? -Math.abs(t.monto) : Math.abs(t.monto),
        categoria: nuevoTipo === "gasto" ? guessCategory(t.descripcion) : "💰 Ingresos"
      };
    }));
  };

  const handleSave = async () => {
    if (!editableTx?.length) return;

    setLoading(true);
    setMode("saving");
    setProgress(0);

    try {
      let saved = 0;
      
      for (let i = 0; i < editableTx.length; i++) {
        const tx = editableTx[i];
        setProgress(Math.round(((i + 1) / editableTx.length) * 100));
        
        if (!tx.fecha || tx.monto === 0) continue;
        
        try {
          if (tx.tipo === "gasto" || tx.monto < 0) {
            await addGasto({
              fecha: tx.fecha,
              categoria: tx.categoria || "📦 Otros",
              descripcion: tx.descripcion,
              monto: Math.abs(tx.monto),
              metodo: "Estado de Cuenta",
            });
          } else {
            await addIngreso({
              fecha: tx.fecha,
              fuente: tx.categoria || "Estado de Cuenta",
              descripcion: tx.descripcion,
              monto: Math.abs(tx.monto),
            });
          }
          saved++;
        } catch (e) {
          console.error("Error guardando:", e);
        }
        
        await new Promise(r => setTimeout(r, 30));
      }

      alert(`✅ ${saved} transacciones guardadas exitosamente`);
      onClose?.();
      resetAll();

    } catch (err) {
      console.error("Error guardando:", err);
      setError("Error al guardar: " + err.message);
      setMode("reviewing");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER: Loading State
  // ============================================
  if (mode === "scanning" || mode === "saving") {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-blue-500/30 rounded-3xl p-8 max-w-sm w-full text-center">
          <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin mb-4" />
          <p className="text-white font-bold text-lg">{mode === "saving" ? "Guardando..." : "Procesando..."}</p>
          <p className="text-gray-400 text-sm mb-4">{progressText || "Por favor espera..."}</p>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">{progress}%</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: Main UI
  // ============================================
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-gray-900 w-full md:max-w-4xl md:max-h-[90vh] h-[95vh] rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-white/10 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gray-900/80">
          <h2 className="text-white font-bold text-lg flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Zap className="w-5 h-5 text-white" />
            </div>
            Escáner de Estados de Cuenta
          </h2>
          <div className="flex items-center gap-2">
            {result && (
              <button onClick={() => setShowRawText(!showRawText)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300" title="Ver texto">
                <Eye className="w-5 h-5" />
              </button>
            )}
            <button onClick={resetAll} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300" title="Reset">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300" title="Cerrar">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          
          {/* Upload View */}
          {!result && (
            <>
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-blue-300 text-sm font-medium mb-2">🏦 Bancos soportados:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full">Salem Five</span>
                  <span className="text-xs bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full">Eastern Bank</span>
                  <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full">+ Otros</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-blue-400/50 transition-all relative">
                  <input ref={inputRef} type="file" className="absolute inset-0 w-full h-full cursor-pointer opacity-0" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg,.webp" />
                  
                  {preview ? (
                    <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg mb-4" />
                  ) : (
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      {file?.type === "application/pdf" ? <FileText className="w-8 h-8 text-blue-400" /> : <ImageIcon className="w-8 h-8 text-purple-400" />}
                    </div>
                  )}
                  
                  <p className="text-white font-medium mb-2">{file ? file.name : "Selecciona tu estado de cuenta"}</p>
                  <p className="text-gray-400 text-sm">PDF digital o imagen (JPG, PNG)</p>
                </div>
              </div>

              <button onClick={handleScan} disabled={!file || loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50">
                <Zap className="w-5 h-5 inline mr-2" />
                Analizar Estado de Cuenta
              </button>

              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-300 text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>Nota:</strong> Los PDFs digitales funcionan mejor que los escaneados. Para imágenes, asegúrate de que el texto sea legible.</span>
                </p>
              </div>
            </>
          )}

          {/* Review View */}
          {result && (
            <div className="animate-in fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-full border border-green-500/30">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-xl">{editableTx.length} Transacciones</h3>
                  <p className="text-gray-400 text-sm">{result.meta?.banco}</p>
                </div>
                <button onClick={() => { setResult(null); setEditableTx([]); }} className="p-2 bg-white/5 rounded-full">
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>

              {showRawText && (
                <div className="mb-4 p-4 bg-black/30 rounded-xl border border-white/10 max-h-60 overflow-y-auto">
                  <p className="text-gray-500 text-xs mb-2">Texto extraído (primeros 3000 caracteres):</p>
                  <pre className="text-gray-300 text-xs whitespace-pre-wrap font-mono">{rawText.slice(0, 3000)}</pre>
                </div>
              )}

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-rose-500/10 rounded-xl p-4 border border-rose-500/20">
                  <p className="text-gray-400 text-xs uppercase">Gastos</p>
                  <p className="text-rose-400 text-xl font-bold">${totals.gastos.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <p className="text-gray-400 text-xs uppercase">Ingresos</p>
                  <p className="text-emerald-400 text-xl font-bold">${totals.ingresos.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                </div>
                <div className={`rounded-xl p-4 border ${totals.neto >= 0 ? "bg-blue-500/10 border-blue-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                  <p className="text-gray-400 text-xs uppercase">Balance</p>
                  <p className={`text-xl font-bold ${totals.neto >= 0 ? "text-blue-400" : "text-red-400"}`}>${totals.neto.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-2 mb-6 max-h-[350px] overflow-y-auto pr-1">
                {editableTx.map((tx, idx) => {
                  const isGasto = tx.tipo === "gasto";
                  const montoAbs = Math.abs(Number(tx.monto || 0));

                  return (
                    <div key={idx} className={`bg-white/5 border rounded-xl p-3 ${isGasto ? "border-rose-500/20" : "border-emerald-500/20"}`}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleTipo(idx)} className={`p-2 rounded-lg ${isGasto ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                          {isGasto ? <TrendingDown className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <input className="w-full bg-transparent text-white font-medium text-sm outline-none truncate" value={tx.descripcion} onChange={(e) => updateTx(idx, { descripcion: e.target.value })} />
                          <div className="flex items-center gap-2 mt-1">
                            <input className="bg-transparent text-gray-400 text-xs outline-none w-24" value={tx.fecha} onChange={(e) => updateTx(idx, { fecha: e.target.value })} />
                            <select className="bg-transparent text-gray-400 text-xs outline-none" value={tx.categoria} onChange={(e) => updateTx(idx, { categoria: e.target.value })}>
                              {CATEGORY_RULES.map(r => <option key={r.cat} value={r.cat}>{r.cat}</option>)}
                              <option value="📦 Otros">📦 Otros</option>
                              <option value="💰 Ingresos">💰 Ingresos</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">$</span>
                          <input className={`w-20 bg-transparent text-right font-bold outline-none ${isGasto ? "text-rose-400" : "text-emerald-400"}`} value={montoAbs.toFixed(2)} onChange={(e) => updateTx(idx, { monto: isGasto ? -Math.abs(Number(e.target.value)) : Math.abs(Number(e.target.value)) })} type="number" step="0.01" />
                        </div>

                        <button onClick={() => removeTx(idx)} className="p-2 text-gray-500 hover:text-rose-400">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {editableTx.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No se detectaron transacciones</p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button onClick={handleSave} disabled={loading || !editableTx.length} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50">
                <Save className="w-5 h-5 inline mr-2" />
                Guardar {editableTx.length} Transacciones
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl flex items-start gap-3">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}