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
import { useGastosVariables } from "../hooks/useGastosVariables";
import { useIngresos } from "../hooks/useIngresos";

// ============================================
// CONFIGURACIÓN DE BANCOS SOPORTADOS
// ============================================
const BANK_CONFIGS = {
  SALEM_FIVE: {
    name: "Salem Five",
    patterns: ["salem five", "account activity", "salemfive"],
    dateFormat: "MM/DD/YYYY",
    dateRegex: /^\d{2}\/\d{2}\/\d{4}\b/,
  },
  EASTERN_BANK: {
    name: "Eastern Bank",
    patterns: ["eastern bank", "free business checking", "easternbank"],
    dateFormat: "Mon DD",
    dateRegex: /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b/i,
  },
  BANK_OF_AMERICA: {
    name: "Bank of America",
    patterns: ["bank of america", "bofa", "boa "],
    dateFormat: "MM/DD/YY",
    dateRegex: /^\d{2}\/\d{2}\/\d{2}\b/,
  },
  CHASE: {
    name: "Chase",
    patterns: ["chase", "jpmorgan"],
    dateFormat: "MM/DD",
    dateRegex: /^\d{2}\/\d{2}\b/,
  },
  WELLS_FARGO: {
    name: "Wells Fargo",
    patterns: ["wells fargo", "wellsfargo"],
    dateFormat: "MM/DD/YY",
    dateRegex: /^\d{2}\/\d{2}\/\d{2}\b/,
  },
  CITIBANK: {
    name: "Citibank",
    patterns: ["citibank", "citi "],
    dateFormat: "MM/DD",
    dateRegex: /^\d{2}\/\d{2}\b/,
  },
  CAPITAL_ONE: {
    name: "Capital One",
    patterns: ["capital one", "capitalone"],
    dateFormat: "Mon DD, YYYY",
    dateRegex: /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s*\d{4}/i,
  },
  GENERIC: {
    name: "Genérico",
    patterns: [],
    dateFormat: "Variable",
    dateRegex: /(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/,
  },
};

// ============================================
// PATRONES DE EXCLUSIÓN (SKIP PATTERNS)
// ============================================
const SKIP_PATTERNS = [
  "beginning balance", "ending balance", "total", "summary of accounts",
  "account summary", "daily balances", "overdraft", "returned item",
  "total overdraft", "total returned", "page", "statement ending",
  "service charges", "how to balance", "important:", "check #",
  "total for this period", "total year-to-date", "continuation",
  "please notify us", "in case of errors", "did you know", "make your move",
  "mortgage rates", "electronic statement delivery",
  "check the figures", "verify your addition", "compare the dollar amounts",
  "list the checks that have not yet been listed as paid"
];

// ============================================
// CATEGORÍAS EXPANDIDAS
// ============================================
const CATEGORY_RULES = [
  // Transporte
  { cat: "🚗 Transporte", keywords: ["uber", "lyft", "didi", "mbta", "taxi", "parking", "toll", "ezpass", "zipcar", "turo", "massport"] },
  { cat: "✈️ Viajes", keywords: ["jetblue", "delta", "american airlines", "united", "southwest", "airbnb", "hotel", "expedia", "booking"] },
  { cat: "⛽ Gasolina", keywords: ["shell", "citgo", "cumberland", "speedway", "exxon", "mobil", "chevron", "bp ", "gas station", "sunoco", "76 "] },
  
  // Comida
  { cat: "🍔 Restaurantes", keywords: ["restaurant", "doordash", "grubhub", "ubereats", "mcdonald", "burger", "pizza", "taco", "chipotle", "starbucks", "dunkin"] },
  { cat: "🛒 Supermercado", keywords: ["market basket", "walmart", "target", "costco", "whole foods", "trader joe", "stop & shop", "aldi", "kroger", "publix", "safeway"] },
  
  // Servicios y Suscripciones
  { cat: "📱 Suscripciones", keywords: ["netflix", "spotify", "apple.com/bill", "hulu", "disney+", "hbo", "amazon prime", "youtube premium"] },
  { cat: "📞 Telecomunicaciones", keywords: ["verizon", "t-mobile", "tmobile", "at&t", "att ", "comcast", "xfinity", "spectrum"] },
  { cat: "☁️ Software/Tech", keywords: ["namecheap", "squarespace", "godaddy", "aws ", "google cloud", "microsoft", "adobe", "dropbox", "zoom"] },
  
  // Hogar y Servicios
  { cat: "🏠 Hogar", keywords: ["home depot", "lowes", "ikea", "wayfair", "bed bath", "rent", "mortgage", "hoa "] },
  { cat: "⚡ Servicios Públicos", keywords: ["electric", "water", "gas bill", "utility", "eversource", "national grid", "pgande"] },
  { cat: "🔧 Mantenimiento", keywords: ["repair", "plumber", "mechanic", "service", "maintenance"] },
  
  // Salud
  { cat: "💪 Salud/Fitness", keywords: ["planet fitness", "gym", "fitness", "pharmacy", "cvs", "walgreens", "doctor", "medical", "dental", "hospital"] },
  { cat: "🏥 Seguro", keywords: ["insurance", "geico", "state farm", "allstate", "progressive", "liberty mutual", "safety insurance"] },
  
  // Compras
  { cat: "🛒 Compras Online", keywords: ["amazon", "ebay", "etsy", "paypal", "shopify", "wish.com"] },
  { cat: "👕 Ropa", keywords: ["zara", "h&m", "gap ", "old navy", "nordstrom", "macy", "tj maxx", "marshalls"] },
  
  // Entretenimiento
  { cat: "🎮 Entretenimiento", keywords: ["playstation", "xbox", "nintendo", "steam", "epic games", "fanduel", "draftkings", "casino", "oculus"] },
  { cat: "🎬 Cine/Eventos", keywords: ["amc ", "regal", "cinemark", "ticketmaster", "stubhub", "eventbrite"] },
  
  // Financiero
  { cat: "💳 Servicios Financieros", keywords: ["credit one", "discover", "identityiq", "kikoff", "credit karma", "experian", "transunion", "equifax"] },
  { cat: "💸 Transferencias", keywords: ["zelle", "venmo", "cash app", "paypal transfer", "wire transfer", "ach ", "boss money"] },
  { cat: "🏦 Pagos Préstamo", keywords: ["loan payment", "student loan", "car payment", "toyota financial", "honda financial"] },
  { cat: "💰 Fees/Cargos", keywords: ["nsf fee", "overdraft", "monthly fee", "service charge", "late fee", "interest charge"] },
  
  // Trabajo
  { cat: "💼 Trabajo/Negocio", keywords: ["pixieset", "smartsheet", "smartshoot", "payoneer", "stripe", "square", "doordash"] },
];

// ============================================
// UTILIDADES MEJORADAS
// ============================================
function clampStr(s = "", max = 80) {
  const t = String(s || "").trim().replace(/\s+/g, " ");
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

function moneyToNumber(token) {
  if (!token) return NaN;
  let s = String(token).trim();
  let negative = false;
  
  if (s.includes("(") && s.includes(")")) negative = true;
  if (s.startsWith("-") || s.endsWith("-")) negative = true;
  if (s.toLowerCase().includes("dr") || s.toLowerCase().includes("debit")) negative = true;
  
  s = s.replace(/[()\s-]/g, "").replace(/[$,]/g, "").replace(/[a-zA-Z]/g, "");
  
  const n = parseFloat(s);
  if (Number.isNaN(n)) return NaN;
  return negative ? -Math.abs(n) : n;
}

function extractMoneyTokens(line) {
  const re = /(\(?-?\$?\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\)?|\(?-?\$?\s?\d+(?:\.\d{2})?\)?)/g;
  const matches = line.match(re) || [];
  return matches
    .map((m) => m.trim())
    .filter((m) => /\d/.test(m))
    .filter((m) => {
      const n = moneyToNumber(m);
      return Number.isFinite(n) && Math.abs(n) > 0.01 && Math.abs(n) < 1000000;
    });
}

function normalizeDesc(desc) {
  if (!desc) return "";
  let cleaned = String(desc)
    .replace(/\s+/g, " ")
    .replace(/[#*]+/g, " ")
    .replace(/\d{4}\*+\d{4}/g, "") 
    .replace(/x{4,}/gi, "")
    .trim();
  
  cleaned = cleaned.replace(/\+\d{1,3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{4}/g, "");
  cleaned = cleaned.replace(/P\d{10,}/g, ""); 
  cleaned = cleaned.replace(/ST-\w{10,}/g, ""); 
  
  return cleaned.trim();
}

function guessCategory(desc) {
  const d = (desc || "").toLowerCase();
  
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => d.includes(k))) {
      return rule.cat;
    }
  }
  return "📦 Otros";
}

function guessType(desc, amountSignHint, amount) {
  const d = (desc || "").toLowerCase();

  if (d.includes("zelle to")) return "gasto";
  if (d.includes("zelle from")) return "ingreso";
  
  if (d.includes("venmo to") || d.includes("venmo transfer")) return "gasto";
  if (d.includes("venmo cashout") || d.includes("venmo from")) return "ingreso";

  const incomeKeywords = [
    "deposit", "credit", "preauthorized credit", "transfer credit",
    "interest", "refund", "cashback", "payroll", "direct dep",
    "payoneer", "salary", "irs", "treasury", "interest credit"
  ];

  const expenseKeywords = [
    "withdrawal", "debit", "point of sale", "pos purchase", "pos debit",
    "atm withdrawal", "purchase", "payment", "autopay", "preauthorized withdrawal",
    "fee", "charge", "insurance", "tax"
  ];

  if (incomeKeywords.some((k) => d.includes(k))) return "ingreso";
  if (expenseKeywords.some((k) => d.includes(k))) return "gasto";

  if (amountSignHint === "credit" || amount > 0) return "ingreso";
  if (amountSignHint === "debit" || amount < 0) return "gasto";

  return "gasto";
}

function inferYearFromText(text) {
  const patterns = [
    /(?:Statement\s+)?(?:Period|Date)[:\s]+.*?(\b20\d{2}\b)/i,
    /(?:Ending|thru|through)\s+.*?(\b20\d{2}\b)/i,
    /(\b20\d{2}\b)\s+(?:Statement|Summary)/i,
    /\b(20\d{2})\b/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return Number(match[1]);
  }
  
  return new Date().getFullYear();
}

function monthNameToNumber(mon) {
  const m = String(mon || "").slice(0, 3).toLowerCase();
  const map = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  return map[m] || null;
}

function toISODate(mm, dd, yyyy) {
  const m = String(mm).padStart(2, "0");
  const d = String(dd).padStart(2, "0");
  let y = String(yyyy);
  if (y.length === 2) y = `20${y}`;
  return `${y}-${m}-${d}`;
}

function stableTxKey(tx) {
  const d = tx.fecha || "";
  const a = Number(tx.monto || 0).toFixed(2);
  const desc = (tx.descripcion || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 30);
  return `${d}|${a}|${desc}`;
}

function detectBank(text) {
  const lowerText = text.toLowerCase();
  
  for (const [key, config] of Object.entries(BANK_CONFIGS)) {
    if (key === "GENERIC") continue;
    if (config.patterns.some(p => lowerText.includes(p))) {
      return { key, ...config };
    }
  }
  
  return { key: "GENERIC", ...BANK_CONFIGS.GENERIC };
}

// ============================================
// PARSER UNIVERSAL MEJORADO (CORRECCIÓN FINAL: DAILY BALANCES)
// ============================================
function parseTransactionsUniversal(rawText) {
  const text = String(rawText || "");
  const year = inferYearFromText(text);
  const bank = detectBank(text);
  
  console.log(`🏦 Banco detectado: ${bank.name}`);
  console.log(`📅 Año inferido: ${year}`);

  const lines = text
    .split("\n")
    .map((l) => l.replace(/\u00A0/g, " ").trim())
    .filter(Boolean);

  const txs = [];
  const seenKeys = new Set();
  let isSkippingDailyBalances = false;

  const datePatterns = [
    { regex: /^(\d{2})\/(\d{2})\/(\d{4})\b/, parse: (m) => toISODate(m[1], m[2], m[3]) },
    { regex: /^(\d{2})\/(\d{2})\/(\d{2})\b/, parse: (m) => toISODate(m[1], m[2], m[3]) },
    { regex: /^(\d{2})\/(\d{2})\b(?!\/)/, parse: (m) => toISODate(m[1], m[2], year) },
    { regex: /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s*(\d{4})/i, 
      parse: (m) => toISODate(monthNameToNumber(m[1]), m[2], m[3]) },
    { regex: /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\b/i, 
      parse: (m) => toISODate(monthNameToNumber(m[1]), m[2], year) },
    { regex: /^(\d{4})-(\d{2})-(\d{2})\b/, parse: (m) => `${m[1]}-${m[2]}-${m[3]}` },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // DETENCIÓN EN "DAILY BALANCES"
    if (lowerLine.includes("daily balances")) {
      isSkippingDailyBalances = true;
    }
    
    if (isSkippingDailyBalances) {
      continue;
    }

    // FILTRO DE SEGURIDAD: Saltar líneas de resumen y totales
    if (SKIP_PATTERNS.some(p => lowerLine.includes(p))) continue;
    
    // Saltar líneas sin fecha
    let fecha = null;
    let restOfLine = line;

    for (const pattern of datePatterns) {
      const match = line.match(pattern.regex);
      if (match) {
        fecha = pattern.parse(match);
        restOfLine = line.replace(match[0], "").trim();
        break;
      }
    }

    if (!fecha) continue;

    // Extraer montos
    const moneyTokens = extractMoneyTokens(restOfLine);
    if (moneyTokens.length === 0) continue;

    // Lógica para evitar confundir Balance con Transacción
    if (moneyTokens.length === 1 && lowerLine.includes("balance")) continue;

    let amountToken, balanceToken;
    
    if (moneyTokens.length >= 2) {
      balanceToken = moneyTokens[moneyTokens.length - 1];
      amountToken = moneyTokens[moneyTokens.length - 2];
    } else {
      amountToken = moneyTokens[0];
    }

    const amount = moneyToNumber(amountToken);
    if (!Number.isFinite(amount) || amount === 0) continue;

    // Limpiar descripción
    let desc = restOfLine;
    moneyTokens.forEach(t => {
      desc = desc.replace(t, "");
    });
    desc = normalizeDesc(desc);

    // Detectar tipo
    const tipo = guessType(desc, null, amount);
    const monto = tipo === "gasto" ? -Math.abs(amount) : Math.abs(amount);
    const categoria = tipo === "gasto" ? guessCategory(desc) : "💰 Ingresos";

    const tx = {
      fecha,
      descripcion: clampStr(desc || "Movimiento", 80),
      monto,
      tipo,
      categoria,
      meta: { 
        balance: balanceToken ? moneyToNumber(balanceToken) : null,
        banco: bank.name,
        lineaOriginal: line.slice(0, 100)
      },
    };

    // Deduplicación
    const key = stableTxKey(tx);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      txs.push(tx);
    }
  }

  const totalGastos = txs
    .filter(t => t.tipo === "gasto")
    .reduce((sum, t) => sum + Math.abs(t.monto), 0);
  
  const totalIngresos = txs
    .filter(t => t.tipo === "ingreso")
    .reduce((sum, t) => sum + Math.abs(t.monto), 0);

  txs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return {
    transacciones: txs,
    resumen: { 
      total_gastos: totalGastos, 
      total_ingresos: totalIngresos,
      total_transacciones: txs.length
    },
    meta: { 
      banco: bank.name, 
      bancoKey: bank.key,
      year,
      lineasProcesadas: lines.length
    },
  };
}

// ============================================
// PDF PROCESSING
// ============================================
async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  try {
    const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = worker?.default || worker;
  } catch (e) {
    console.warn("Worker not loaded:", e);
  }
  return pdfjs;
}

async function extractTextFromPdf(file, onProgress) {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = "";
  const total = pdf.numPages;

  for (let p = 1; p <= total; p++) {
    const page = await pdf.getPage(p);
    const textContent = await page.getTextContent();
    
    let lastY = null;
    let pageText = "";
    
    for (const item of textContent.items) {
      if (!item.str) continue;
      
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        pageText += "\n";
      }
      
      pageText += item.str + " ";
      lastY = item.transform[5];
    }
    
    fullText += pageText + "\n\n";
    if (onProgress) onProgress(Math.round((p / total) * 100));
  }

  return { text: fullText, numPages: total };
}

// ============================================
// IMAGE PREPROCESSING
// ============================================
function preprocessImageForOCR(canvas) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const contrast = 1.5;
    const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
    const newGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
    const threshold = 140;
    const finalValue = newGray > threshold ? 255 : newGray < 60 ? 0 : newGray;
    
    data[i] = finalValue;
    data[i + 1] = finalValue;
    data[i + 2] = finalValue;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

async function ocrImage(imageSource, onProgress) {
  const { data } = await Tesseract.recognize(imageSource, "eng+spa", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
    tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$.,/-() ",
    preserve_interword_spaces: "1",
  });
  return data?.text || "";
}

async function ocrPdfByPages(file, onProgress) {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = "";
  const total = pdf.numPages;
  const maxPages = Math.min(total, 8); 

  for (let p = 1; p <= maxPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 2.5 });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;
    preprocessImageForOCR(canvas);

    const dataUrl = canvas.toDataURL("image/png");
    
    const pageText = await ocrImage(dataUrl, (pct) => {
      const base = ((p - 1) / maxPages) * 100;
      const add = (pct / maxPages);
      onProgress?.(Math.round(base + add));
    });

    fullText += `\n--- Page ${p} ---\n${pageText}\n`;
  }

  return { text: fullText, numPages: total, ocrPages: maxPages };
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
  const [dedupeEnabled, setDedupeEnabled] = useState(true);
  const [showRawText, setShowRawText] = useState(false);
  const [rawText, setRawText] = useState("");

  const { addGasto } = useGastosVariables();
  const { addIngreso } = useIngresos();
  const inputRef = useRef(null);

  const totals = useMemo(() => {
    const txs = editableTx || [];
    let gastos = 0;
    let ingresos = 0;
    for (const t of txs) {
      const n = Number(t.monto || 0);
      if (!Number.isFinite(n)) continue;
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

    if (selectedFile.size > 15 * 1024 * 1024) {
      setError("El archivo supera los 15MB permitidos.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
    setEditableTx([]);
    setProgress(0);
    setMode("idle");

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const analyzeText = (text) => {
    setRawText(text);
    const parsed = parseTransactionsUniversal(text);
    setResult(parsed);
    setEditableTx(parsed.transacciones);
    setMode("reviewing");
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
        setProgress(5);
        
        const { text: directText, numPages } = await extractTextFromPdf(file, (p) => {
          setProgress(Math.round(p * 0.3));
        });

        extractedText = directText || "";
        
        // ==========================================
        // CORRECCIÓN CRÍTICA: DETECTAR EXTRACCIÓN INCOMPLETA
        // ==========================================
        // Si el PDF tiene más de 2 páginas pero el texto es muy corto,
        // es muy probable que la extracción digital haya fallado o se cortado.
        // Forzamos OCR.
        const textLength = extractedText.replace(/\s+/g, "").length;
        const likelyIncomplete = numPages > 2 && textLength < 3000;
        
        // Si el texto extraído está incompleto (corto para un PDF de 6 páginas)
        if (likelyIncomplete) {
          console.warn("⚠️ Texto digital parece incompleto. Forzando OCR...");
          setProgressText("Extracción digital incompleta. Usando OCR...");
          setProgress(35);
          
          const { text: ocrText } = await ocrPdfByPages(file, (p) => {
            setProgress(35 + Math.round(p * 0.6));
          });
          
          extractedText = ocrText || extractedText;
        }
      } else {
        // Imagen: Preprocesar y OCR
        setProgressText("Procesando imagen...");
        setProgress(10);
        
        const img = new Image();
        img.src = preview;
        await new Promise(resolve => { img.onload = resolve; });
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const scale = Math.max(1, 1500 / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        preprocessImageForOCR(canvas);
        
        setProgressText("Reconociendo texto...");
        const dataUrl = canvas.toDataURL("image/png");
        extractedText = await ocrImage(dataUrl, (p) => {
          setProgress(10 + Math.round(p * 0.85));
        });
      }

      setProgress(95);
      setProgressText("Analizando transacciones...");

      const cleaned = String(extractedText || "").trim();
      if (!cleaned || cleaned.length < 100) {
        setError("No se pudo extraer suficiente texto. Intenta con una imagen más clara o un PDF de mejor calidad.");
        setMode("idle");
        return;
      }

      setProgress(100);
      analyzeText(cleaned);
      
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

  const handleSaveTransactions = async () => {
    if (!editableTx?.length) return;

    setLoading(true);
    setMode("saving");
    setError(null);
    setProgress(0);

    try {
      const seen = new Set();
      const list = [];

      for (const tx of editableTx) {
        const clean = {
          ...tx,
          descripcion: clampStr(normalizeDesc(tx.descripcion), 80),
          categoria: tx.tipo === "gasto" ? (tx.categoria || "📦 Otros") : "💰 Ingresos",
          monto: Number(tx.monto || 0),
          tipo: tx.tipo || (Number(tx.monto) < 0 ? "gasto" : "ingreso"),
        };

        if (!Number.isFinite(clean.monto) || clean.monto === 0) continue;
        if (!clean.fecha) continue;

        const k = stableTxKey(clean);
        if (dedupeEnabled && seen.has(k)) continue;
        seen.add(k);
        list.push(clean);
      }

      if (!list.length) {
        setError("No hay transacciones válidas para guardar.");
        setMode("reviewing");
        return;
      }

      let saved = 0;
      let errors = 0;

      for (let i = 0; i < list.length; i++) {
        const trans = list[i];
        setProgress(Math.round(((i + 1) / list.length) * 100));
        
        try {
          if (trans.tipo === "gasto" || trans.monto < 0) {
            await addGasto({
              fecha: trans.fecha,
              categoria: trans.categoria || "📦 Otros",
              descripcion: trans.descripcion,
              monto: Math.abs(trans.monto),
              metodo: "Estado de Cuenta",
            });
          } else {
            await addIngreso({
              fecha: trans.fecha,
              fuente: trans.categoria || "Estado de Cuenta",
              descripcion: trans.descripcion,
              monto: Math.abs(trans.monto),
            });
          }
          saved++;
        } catch (e) {
          console.error("Error guardando transacción:", e);
          errors++;
        }
        
        await new Promise((r) => setTimeout(r, 50));
      }

      if (errors > 0) {
        setError(`Se guardaron ${saved} transacciones. ${errors} tuvieron errores.`);
      }

      onClose?.();
      resetAll();
      
    } catch (err) {
      console.error("Error guardando:", err);
      setError("Error al guardar: " + (err?.message || "Error desconocido"));
      setMode("reviewing");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "scanning" || mode === "saving") {
    const title = mode === "saving" ? "Guardando..." : "Procesando...";

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-blue-500/30 rounded-3xl p-8 max-w-sm w-full text-center">
          <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin mb-4" />
          <p className="text-white font-bold text-lg">{title}</p>
          <p className="text-gray-400 text-sm mb-4">{progressText || "Por favor espera..."}</p>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <p className="text-xs text-gray-500">{progress}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-gray-900 w-full md:max-w-4xl md:h-auto md:max-h-[90vh] h-[95vh] rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-white/10 flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gray-900/80 backdrop-blur-sm">
          <h2 className="text-white font-bold text-lg md:text-xl flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg">
              <Zap className="w-5 h-5" />
            </div>
            Escáner de Estados de Cuenta
          </h2>
          <div className="flex items-center gap-2">
            {result && (
              <button 
                onClick={() => setShowRawText(!showRawText)} 
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition" 
                title="Ver texto extraído"
              >
                <Eye className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={resetAll} 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition" 
              title="Reiniciar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose} 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition" 
              title="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          
          {!result && (
            <>
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-blue-300 text-sm font-medium mb-2">🏦 Bancos soportados:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.values(BANK_CONFIGS).filter(b => b.name !== "Genérico").map((bank) => (
                    <span key={bank.name} className="text-xs bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full">
                      {bank.name}
                    </span>
                  ))}
                  <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full">
                    + Otros formatos
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-8 md:p-10 text-center transition-all hover:border-blue-400/50 hover:bg-white/10 group relative overflow-hidden">
                  <input 
                    ref={inputRef} 
                    type="file" 
                    className="absolute inset-0 w-full h-full cursor-pointer z-10 opacity-0" 
                    onChange={handleFileChange} 
                    accept=".pdf,.png,.jpg,.jpeg,.webp" 
                  />

                  <div className="relative z-20 pointer-events-none">
                    {preview ? (
                      <div className="mb-4">
                        <img 
                          src={preview} 
                          alt="Vista previa" 
                          className="max-h-52 mx-auto rounded-lg shadow-lg border border-white/20" 
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform border border-white/10">
                        {file?.type === "application/pdf" ? (
                          <FileText className="w-10 h-10 text-blue-400" />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-purple-400" />
                        )}
                      </div>
                    )}

                    <p className="text-white font-semibold text-lg mb-2">
                      {file ? file.name : "Arrastra o selecciona tu estado de cuenta"}
                    </p>
                    <p className="text-gray-400 text-sm">
                      PDF digital o escaneado, imagen JPG/PNG
                    </p>
                    <p className="text-gray-500 text-xs mt-2">Máx. 15MB</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleScan} 
                disabled={!file || loading} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Zap className="w-5 h-5" />
                {loading ? "Procesando..." : "Analizar Estado de Cuenta"}
              </button>

              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-yellow-300 text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Tip:</strong> Para mejores resultados, usa PDFs digitales (no escaneados) 
                    o imágenes claras y bien iluminadas.
                  </span>
                </p>
              </div>
            </>
          )}

          {result && (
            <div className="animate-in fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-full border border-green-500/30">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-xl">
                    {editableTx.length} Transacciones Detectadas
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {result.meta?.banco || "Formato genérico"} · {result.meta?.year}
                  </p>
                </div>
                <button 
                  onClick={() => { setResult(null); setEditableTx([]); setMode("idle"); }} 
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full" 
                  title="Volver"
                >
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>

              {showRawText && (
                <div className="mb-4 p-4 bg-black/30 rounded-xl border border-white/10 max-h-60 overflow-y-auto">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-400 text-xs font-medium">Texto extraído (debug):</p>
                    <button onClick={() => setShowRawText(false)} className="text-gray-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <pre className="text-gray-300 text-xs whitespace-pre-wrap font-mono">
                    {rawText.slice(0, 3000)}
                    {rawText.length > 3000 && "\n\n... (truncado)"}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-rose-500/10 rounded-xl p-4 border border-rose-500/20">
                  <p className="text-gray-400 text-xs uppercase mb-1">Gastos</p>
                  <p className="text-rose-400 text-xl font-bold">
                    ${totals.gastos.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <p className="text-gray-400 text-xs uppercase mb-1">Ingresos</p>
                  <p className="text-emerald-400 text-xl font-bold">
                    ${totals.ingresos.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`rounded-xl p-4 border ${totals.neto >= 0 ? "bg-blue-500/10 border-blue-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                  <p className="text-gray-400 text-xs uppercase mb-1">Balance</p>
                  <p className={`text-xl font-bold ${totals.neto >= 0 ? "text-blue-400" : "text-red-400"}`}>
                    ${totals.neto.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-gray-400 text-xs uppercase mb-1">Opciones</p>
                  <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={dedupeEnabled} 
                      onChange={(e) => setDedupeEnabled(e.target.checked)}
                      className="rounded"
                    />
                    Evitar duplicados
                  </label>
                </div>
              </div>

              <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto pr-1">
                {editableTx.map((trans, idx) => {
                  const isGasto = trans.tipo === "gasto";
                  const montoAbs = Math.abs(Number(trans.monto || 0));

                  return (
                    <div 
                      key={`${idx}-${trans.fecha}-${montoAbs}`} 
                      className={`bg-white/5 border rounded-xl p-3 transition-all hover:bg-white/10 ${
                        isGasto ? "border-rose-500/20" : "border-emerald-500/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTipo(idx)}
                          className={`p-2 rounded-lg transition-all ${
                            isGasto 
                              ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" 
                              : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          }`}
                          title="Cambiar tipo"
                        >
                          {isGasto ? <TrendingDown className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <input
                            className="w-full bg-transparent text-white font-medium text-sm outline-none truncate"
                            value={trans.descripcion}
                            onChange={(e) => updateTx(idx, { descripcion: e.target.value })}
                            placeholder="Descripción"
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              className="bg-transparent text-gray-400 text-xs outline-none w-24"
                              value={trans.fecha}
                              onChange={(e) => updateTx(idx, { fecha: e.target.value })}
                              placeholder="Fecha"
                            />
                            <select
                              className="bg-transparent text-gray-400 text-xs outline-none cursor-pointer"
                              value={trans.categoria}
                              onChange={(e) => updateTx(idx, { categoria: e.target.value })}
                              disabled={!isGasto}
                            >
                              {CATEGORY_RULES.map(r => (
                                <option key={r.cat} value={r.cat}>{r.cat}</option>
                              ))}
                              <option value="📦 Otros">📦 Otros</option>
                              <option value="💰 Ingresos">💰 Ingresos</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">$</span>
                          <input
                            className={`w-20 bg-transparent text-right font-bold outline-none ${
                              isGasto ? "text-rose-400" : "text-emerald-400"
                            }`}
                            value={montoAbs.toFixed(2)}
                            onChange={(e) => {
                              const v = Number(e.target.value || 0);
                              updateTx(idx, { monto: isGasto ? -Math.abs(v) : Math.abs(v) });
                            }}
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>

                        <button 
                          onClick={() => removeTx(idx)} 
                          className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Eliminar"
                        >
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

              <button 
                onClick={handleSaveTransactions} 
                disabled={loading || !editableTx.length} 
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Save className="w-5 h-5" />
                {loading ? "Guardando..." : `Guardar ${editableTx.length} Transacciones`}
              </button>
            </div>
          )}

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