import React, { useMemo, useRef, useState } from "react";
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
} from "lucide-react";
import Tesseract from "tesseract.js";
import { useGastosVariables } from "../hooks/useGastosVariables";
import { useIngresos } from "../hooks/useIngresos";

// ============================================
// UTILIDADES
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
  s = s.replace(/[()\s]/g, "");
  if (s.startsWith("-")) negative = true;
  s = s.replace(/[$,]/g, "");
  
  const n = parseFloat(s);
  if (Number.isNaN(n)) return NaN;
  return negative ? -Math.abs(n) : n;
}

function extractMoneyTokens(line) {
  const re = /(\(?-?\$?\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})\)?|\(?-?\$?\s?\d+(?:\.\d{2})\)?)/g;
  const matches = line.match(re) || [];
  return matches
    .map((m) => m.trim())
    .filter((m) => /\d/.test(m))
    .filter((m) => {
      const n = moneyToNumber(m);
      return Number.isFinite(n);
    });
}

function normalizeDesc(desc) {
  return String(desc || "")
    .replace(/\s+/g, " ")
    .replace(/[#*]+/g, " ")
    .trim();
}

function guessCategory(desc) {
  const d = (desc || "").toLowerCase();

  const rules = [
    { cat: "🚗 Transporte", hit: ["uber", "lyft", "didi", "mbta", "jetblue", "delta", "american", "logan", "massport"] },
    { cat: "⛽ Gasolina", hit: ["shell", "citgo", "cumberland", "speedway", "petro", "gas station"] },
    { cat: "🍔 Comida", hit: ["doordash", "market basket", "walmart", "wal-mart", "cvs", "restaurant", "dunkin", "mcdonald", "pizza"] },
    { cat: "📱 Suscripciones", hit: ["netflix", "spotify", "apple.com/bill", "apple com bill", "prime", "name-cheap", "namecheap", "squarespace", "sqsp"] },
    { cat: "💪 Salud/Fitness", hit: ["planet fitness", "fitness", "insurance", "safety insurance", "experian"] },
    { cat: "📞 Telecomunicaciones", hit: ["verizon", "t-mobile", "tmobile", "att"] },
    { cat: "🏠 Hogar", hit: ["home depot", "howley", "rent", "building", "prestige"] },
    { cat: "🛒 Compras Online", hit: ["amazon", "etsy", "paypal", "oculus"] },
    { cat: "💳 Servicios Financieros", hit: ["credit one", "discover", "identityiq", "kikoff", "nsf fee"] },
    { cat: "🎮 Entretenimiento", hit: ["playstation", "fanduel", "sie playstation"] },
    { cat: "📸 Fotografía/Trabajo", hit: ["pixieset", "smartsheet", "smartshoot", "payoneer"] },
    { cat: "💸 Transferencias", hit: ["zelle", "venmo", "transfer", "nowrtp", "boss money"] },
    { cat: "🚙 Auto/Pagos", hit: ["toyota", "car payment", "auto payment"] },
    { cat: "⚡ Servicios", hit: ["openai", "internet", "electric", "water"] },
  ];

  for (const r of rules) {
    if (r.hit.some((h) => d.includes(h))) return r.cat;
  }
  return "📦 Otros";
}

function guessType(desc, amountSignHint) {
  const d = (desc || "").toLowerCase();

  const incomeKeywords = [
    "deposit",
    "credit",
    "preauthorized credit",
    "transfer credit",
    "zelle from",
    "venmo - cashout",
    "payoneer",
    "pixieset",
    "smartshoot",
    "doordash",
    "edi paymnt",
  ];

  const expenseKeywords = [
    "withdrawal",
    "debit",
    "point of sale",
    "pos purchase",
    "atm withdrawal",
    "zelle to",
    "nsf fee",
    "fee",
    "service charge",
    "electronic payment",
    "preauthorized withdrawal",
  ];

  if (amountSignHint === "credit") return "ingreso";
  if (amountSignHint === "debit") return "gasto";

  if (incomeKeywords.some((k) => d.includes(k))) return "ingreso";
  if (expenseKeywords.some((k) => d.includes(k))) return "gasto";

  return "gasto";
}

function inferYearFromText(text) {
  const y1 = text.match(/(?:Ending|Period:|thru)\s+.*?(\b20\d{2}\b)/i);
  if (y1 && y1[1]) return Number(y1[1]);
  const y2 = text.match(/\b(20\d{2})\b/);
  return y2 ? Number(y2[1]) : new Date().getFullYear();
}

function monthNameToNumber(mon) {
  const m = String(mon || "").slice(0, 3).toLowerCase();
  const map = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  return map[m] || null;
}

function toISODateFromMDY(mm, dd, yyyy) {
  const m = String(mm).padStart(2, "0");
  const d = String(dd).padStart(2, "0");
  const y = String(yyyy).length === 2 ? `20${yyyy}` : String(yyyy);
  return `${y}-${m}-${d}`;
}

function toISODateFromMonDay(monName, day, year) {
  const m = monthNameToNumber(monName);
  if (!m) return null;
  return toISODateFromMDY(m, day, year);
}

function stableTxKey(tx) {
  const d = tx.fecha || "";
  const a = Number(tx.monto || 0).toFixed(2);
  const desc = (tx.descripcion || "").toLowerCase().replace(/\s+/g, " ").trim();
  const t = tx.tipo || "";
  return `${d}|${a}|${t}|${desc}`;
}

// ============================================
// PARSER INTELIGENTE
// ============================================
function parseTransactionsSmart(rawText) {
  const text = String(rawText || "");
  const year = inferYearFromText(text);

  const lines = text
    .split("\n")
    .map((l) => l.replace(/\u00A0/g, " ").trim())
    .filter(Boolean);

  const txs = [];
  let totalGastos = 0;
  let totalIngresos = 0;

  const mdyLine = /^\d{2}\/\d{2}\/\d{4}\b/;
  const monDayLine = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b/i;

  const looksLikeSalem = lines.some((l) => mdyLine.test(l)) && text.toLowerCase().includes("account activity");
  const looksLikeEastern = lines.some((l) => monDayLine.test(l)) && text.toLowerCase().includes("free business");

  // ---------- SALEM FIVE ----------
  if (looksLikeSalem) {
    for (const line of lines) {
      if (!mdyLine.test(line)) continue;

      const dateStr = line.slice(0, 10);
      const rest = line.slice(10).trim();
      const moneyTokens = extractMoneyTokens(rest);
      
      if (moneyTokens.length < 2) continue;

      const balanceToken = moneyTokens[moneyTokens.length - 1];
      const amountToken = moneyTokens[moneyTokens.length - 2];

      const amount = moneyToNumber(amountToken);
      const balance = moneyToNumber(balanceToken);
      
      if (!Number.isFinite(amount) || !Number.isFinite(balance)) continue;

      let desc = rest;
      const tail = `${amountToken} ${balanceToken}`;
      if (desc.endsWith(tail)) desc = desc.slice(0, -tail.length).trim();
      desc = desc.replace(amountToken, "").replace(balanceToken, "").trim();

      const signHint = /credit|deposit|zelle from|venmo - cashout/i.test(rest) ? "credit" 
                     : /debit|withdrawal|point of sale|zelle to|fee/i.test(rest) ? "debit" 
                     : null;

      const tipo = guessType(desc, signHint);
      const monto = tipo === "gasto" ? -Math.abs(amount) : Math.abs(amount);
      const categoria = tipo === "gasto" ? guessCategory(desc) : "💰 Ingresos";

      txs.push({
        fecha: dateStr,
        descripcion: clampStr(normalizeDesc(desc) || "Movimiento detectado", 80),
        monto,
        tipo,
        categoria,
        meta: { balance },
      });

      if (tipo === "gasto") totalGastos += Math.abs(monto);
      else totalIngresos += Math.abs(monto);
    }

    return {
      transacciones: txs,
      resumen: { total_gastos: totalGastos, total_ingresos: totalIngresos },
      meta: { detected: "Salem Five", year },
    };
  }

  // ---------- EASTERN BANK ----------
  if (looksLikeEastern) {
    for (const line of lines) {
      if (!monDayLine.test(line)) continue;

      const m = line.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\b/i);
      if (!m) continue;

      const mon = m[1];
      const day = Number(m[2]);
      const iso = toISODateFromMonDay(mon, day, year) || "";
      const rest = line.replace(m[0], "").trim();
      const moneyTokens = extractMoneyTokens(rest);
      
      if (moneyTokens.length < 2) continue;

      const balanceToken = moneyTokens[moneyTokens.length - 1];
      const primaryToken = moneyTokens[moneyTokens.length - 2];

      const balance = moneyToNumber(balanceToken);
      const primary = moneyToNumber(primaryToken);
      
      if (!Number.isFinite(primary) || !Number.isFinite(balance)) continue;

      let desc = rest;
      const tail = `${primaryToken} ${balanceToken}`;
      if (desc.endsWith(tail)) desc = desc.slice(0, -tail.length).trim();
      desc = desc.replace(primaryToken, "").replace(balanceToken, "").trim();

      const signHint = /credit|deposit|preauthorized credit/i.test(line) ? "credit" 
                     : /debit|withdrawal|payment|purchase/i.test(line) ? "debit" 
                     : null;

      const tipo = guessType(desc, signHint);
      const monto = tipo === "gasto" ? -Math.abs(primary) : Math.abs(primary);
      const categoria = tipo === "gasto" ? guessCategory(desc) : "💰 Ingresos";

      txs.push({
        fecha: iso || `${mon} ${day}, ${year}`,
        descripcion: clampStr(normalizeDesc(desc) || "Movimiento detectado", 80),
        monto,
        tipo,
        categoria,
        meta: { balance },
      });

      if (tipo === "gasto") totalGastos += Math.abs(monto);
      else totalIngresos += Math.abs(monto);
    }

    return {
      transacciones: txs,
      resumen: { total_gastos: totalGastos, total_ingresos: totalIngresos },
      meta: { detected: "Eastern Bank", year },
    };
  }

  // ---------- FALLBACK GENÉRICO ----------
  // Corrección Regex: Eliminados escapes innecesarios en la clase de caracteres
  const genericDate = /(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/;
  for (const line of lines) {
    const dm = line.match(genericDate);
    if (!dm) continue;
    
    const moneyTokens = extractMoneyTokens(line);
    if (moneyTokens.length < 1) continue;

    const amountToken = moneyTokens[moneyTokens.length - 1];
    const amount = moneyToNumber(amountToken);
    
    if (!Number.isFinite(amount) || amount === 0) continue;

    const mm = dm[1];
    const dd = dm[2];
    const yyyy = dm[3];
    const iso = toISODateFromMDY(mm, dd, yyyy);

    let desc = line.replace(dm[0], "").replace(amountToken, "").replace(/[()]/g, "").trim();

    const tipo = guessType(desc, null);
    const monto = tipo === "gasto" ? -Math.abs(amount) : Math.abs(amount);
    const categoria = tipo === "gasto" ? guessCategory(desc) : "💰 Ingresos";

    txs.push({
      fecha: iso,
      descripcion: clampStr(normalizeDesc(desc) || "Movimiento detectado", 80),
      monto,
      tipo,
      categoria,
      meta: {},
    });

    if (tipo === "gasto") totalGastos += Math.abs(monto);
    else totalIngresos += Math.abs(monto);
  }

  return {
    transacciones: txs,
    resumen: { total_gastos: totalGastos, total_ingresos: totalIngresos },
    meta: { detected: "Genérico", year },
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
  } catch {}
  return pdfjs;
}

async function extractTextFromPdf(file, onProgress) {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let out = "";
  const total = pdf.numPages;

  for (let p = 1; p <= total; p++) {
    const page = await pdf.getPage(p);
    const textContent = await page.getTextContent();
    const pageText = (textContent.items || [])
      .map((it) => (it && it.str ? it.str : ""))
      .join(" ");
    out += `\n${pageText}\n`;
    if (onProgress) onProgress(Math.round((p / total) * 100));
  }

  return { text: out, numPages: total };
}

async function ocrPdfByPages(file, onProgress) {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let out = "";
  const total = pdf.numPages;
  const maxPages = Math.min(total, 6);

  for (let p = 1; p <= maxPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL("image/png");
    const { data } = await Tesseract.recognize(dataUrl, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          const base = (p - 1) / maxPages;
          const pct = base + (m.progress / maxPages);
          onProgress(Math.round(pct * 100));
        }
      },
    });

    out += `\n${data.text}\n`;
  }

  return { text: out, numPages: total, ocrPages: maxPages };
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
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [editableTx, setEditableTx] = useState([]);
  const [dedupeEnabled, setDedupeEnabled] = useState(true);

  const { agregarGasto } = useGastosVariables();
  const { agregarIngreso } = useIngresos();
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

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setLoading(false);
    setMode("idle");
    setProgress(0);
    setError(null);
    setResult(null);
    setEditableTx([]);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Solo aceptamos JPG, PNG, WEBP o PDF.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("El archivo supera los 10MB permitidos.");
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
    const parsed = parseTransactionsSmart(text);

    const unique = [];
    const seen = new Set();
    for (const tx of parsed.transacciones) {
      const k = stableTxKey(tx);
      if (seen.has(k)) continue;
      seen.add(k);
      unique.push(tx);
    }

    const finalParsed = {
      ...parsed,
      transacciones: unique,
      resumen: {
        total_gastos: unique
          .filter((t) => t.tipo === "gasto" || Number(t.monto) < 0)
          .reduce((s, t) => s + Math.abs(Number(t.monto || 0)), 0),
        total_ingresos: unique
          .filter((t) => t.tipo === "ingreso" && Number(t.monto) > 0)
          .reduce((s, t) => s + Math.abs(Number(t.monto || 0)), 0),
      },
    };

    setResult(finalParsed);
    setEditableTx(finalParsed.transacciones);
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
        setProgress(5);
        const { text } = await extractTextFromPdf(file, (p) => {
          setProgress(Math.max(5, Math.min(70, Math.round(p * 0.65))));
        });

        extractedText = text || "";

        const usable = extractedText.replace(/\s+/g, "").length >= 400;

        if (!usable) {
          const { text: ocrText } = await ocrPdfByPages(file, (p) => {
            setProgress(70 + Math.round((p / 100) * 30));
          });
          extractedText = `${extractedText}\n${ocrText}`;
        }
      } else {
        const { data } = await Tesseract.recognize(file, "eng", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProgress(Math.round(m.progress * 100));
            }
          },
        });
        extractedText = data?.text || "";
      }

      const cleaned = String(extractedText || "").trim();
      if (!cleaned || cleaned.length < 50) {
        setError("No pude extraer texto suficiente.");
        setMode("idle");
        return;
      }

      analyzeText(cleaned);
    } catch (err) {
      console.error(err);
      setError("Error al procesar: " + (err?.message || err));
      setMode("idle");
    } finally {
      setLoading(false);
    }
  };

  const updateTx = (idx, patch) => {
    setEditableTx((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const removeTx = (idx) => {
    setEditableTx((prev) => prev.filter((_, i) => i !== idx));
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
          categoria: tx.tipo === "gasto" ? (tx.categoria || "Varios") : "💰 Ingresos",
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
        setError("No hay transacciones válidas.");
        setMode("reviewing");
        return;
      }

      for (let i = 0; i < list.length; i++) {
        const trans = list[i];
        setProgress(Math.round(((i + 1) / list.length) * 100));
        await new Promise((r) => setTimeout(r, 10));

        if (trans.tipo === "gasto" || trans.monto < 0) {
          await agregarGasto({
            fecha: trans.fecha,
            categoria: trans.categoria || "Varios",
            descripcion: trans.descripcion,
            monto: Math.abs(trans.monto),
            metodo: "Estado de Cuenta",
          });
        } else {
          await agregarIngreso({
            fecha: trans.fecha,
            fuente: "Estado de Cuenta",
            descripcion: trans.descripcion,
            monto: Math.abs(trans.monto),
          });
        }
      }

      onClose?.();
      resetAll();
    } catch (err) {
      console.error(err);
      setError("Error al guardar: " + (err?.message || err));
      setMode("reviewing");
    } finally {
      setLoading(false);
    }
  };

  // UI: SCANNING/SAVING
  if (mode === "scanning" || mode === "saving") {
    const title = mode === "saving" ? "Guardando..." : "Procesando...";
    const subtitle = mode === "saving" ? "Insertando transacciones" : "Extrayendo texto";

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-blue-500/30 rounded-3xl p-8 max-w-sm w-full text-center">
          <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin mb-4" />
          <p className="text-white font-bold text-lg">{title}</p>
          <p className="text-gray-400 text-sm mb-2">{subtitle}</p>
          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2 overflow-hidden">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500">{progress}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-gray-900 w-full md:max-w-4xl md:h-auto md:max-h-[90vh] h-[95vh] rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-white/10 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gray-900">
          <h2 className="text-white font-bold text-lg md:text-2xl flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <Upload className="w-6 h-6" />
            </div>
            Escáner de Estados de Cuenta
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={resetAll} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition" title="Reset">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition" title="Cerrar">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {!result ? (
            <>
              <div className="mb-6">
                <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-8 md:p-10 text-center transition-all hover:border-blue-400/50 hover:bg-white/10 group relative overflow-hidden">
                  <input ref={inputRef} type="file" className="absolute inset-0 w-full h-full cursor-pointer z-10 opacity-0" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg,.webp" />

                  <div className="relative z-20 pointer-events-none">
                    {preview ? (
                      <div className="mb-4">
                        <img src={preview} alt="Vista previa" className="max-h-52 mx-auto rounded-lg shadow-lg border border-white/20" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        {file?.type === "application/pdf" ? (
                          <FileText className="w-8 h-8 text-gray-300" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        )}
                      </div>
                    )}

                    <p className="text-white font-medium text-lg mb-2">
                      {file ? file.name : "Subir estado de cuenta"}
                    </p>
                    <p className="text-gray-400 text-sm">Salem Five, Eastern Bank, o cualquier PDF/imagen</p>
                    <p className="text-gray-500 text-xs mt-2">Máx. 10MB • PDF, JPG, PNG, WEBP</p>
                  </div>
                </div>
              </div>

              <button onClick={handleScan} disabled={!file || loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 hover:shadow-indigo-900/40 active:scale-[0.98]">
                <ImageIcon className="w-5 h-5" />
                {loading ? "Procesando..." : "Analizar Estado de Cuenta"}
              </button>
            </>
          ) : (
            <div className="animate-in fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-full border border-green-500/30">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">Revisión</h3>
                  <p className="text-gray-400 text-sm">
                    {editableTx.length} transacciones · {result.meta?.detected || "Desconocido"}
                  </p>
                </div>
                <button onClick={() => { setResult(null); setEditableTx([]); setMode("idle"); }} className="ml-auto p-2 bg-white/5 hover:bg-white/10 rounded-full" title="Volver">
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-gray-400 text-xs uppercase">Gastos</p>
                  <p className="text-rose-400 text-xl font-bold">${totals.gastos.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-gray-400 text-xs uppercase">Ingresos</p>
                  <p className="text-emerald-400 text-xl font-bold">${totals.ingresos.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-gray-400 text-xs uppercase">Neto</p>
                  <p className={`text-xl font-bold ${totals.neto >= 0 ? "text-blue-400" : "text-red-400"}`}>${totals.neto.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-gray-400 text-xs uppercase">Deduplicar</p>
                  <label className="flex items-center gap-2 mt-2 text-sm text-gray-200">
                    <input type="checkbox" checked={dedupeEnabled} onChange={(e) => setDedupeEnabled(e.target.checked)} />
                    Evitar repetidos
                  </label>
                </div>
              </div>

              <div className="space-y-3 mb-6 max-h-[360px] overflow-y-auto">
                {editableTx.map((trans, idx) => {
                  const isGasto = trans.tipo === "gasto" || Number(trans.monto) < 0;
                  const montoAbs = Math.abs(Number(trans.monto || 0));

                  return (
                    <div key={`${idx}-${stableTxKey(trans)}`} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {isGasto ? (
                            <div className="p-1 bg-rose-500/20 rounded text-rose-400">
                              <TrendingDown className="w-3 h-3" />
                            </div>
                          ) : (
                            <div className="p-1 bg-emerald-500/20 rounded text-emerald-400">
                              <Wallet className="w-3 h-3" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-white font-semibold truncate">{trans.descripcion}</p>
                            <p className="text-xs text-gray-400">
                              {trans.fecha} • <span className="text-gray-300">{trans.categoria}</span>
                            </p>
                          </div>
                        </div>
                        <div className={`font-bold text-lg ${isGasto ? "text-rose-400" : "text-emerald-400"}`}>${montoAbs.toLocaleString()}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        <input className="md:col-span-2 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-400/50" value={trans.descripcion} onChange={(e) => updateTx(idx, { descripcion: e.target.value })} placeholder="Descripción" />
                        <input className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-400/50" value={trans.fecha} onChange={(e) => updateTx(idx, { fecha: e.target.value })} placeholder="Fecha" />
                        <select className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-400/50" value={isGasto ? "gasto" : "ingreso"} onChange={(e) => { const tipo = e.target.value; const monto = Number(trans.monto || 0); updateTx(idx, { tipo, monto: tipo === "gasto" ? -Math.abs(monto) : Math.abs(monto), categoria: tipo === "gasto" ? (trans.categoria || "Varios") : "💰 Ingresos" }); }}>
                          <option value="gasto">Gasto</option>
                          <option value="ingreso">Ingreso</option>
                        </select>
                        <input className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-400/50" value={montoAbs} onChange={(e) => { const v = Number(e.target.value || 0); updateTx(idx, { monto: isGasto ? -Math.abs(v) : Math.abs(v) }); }} type="number" step="0.01" min="0" placeholder="Monto" />
                        <div className="flex items-center gap-2">
                          <select className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-400/50" value={trans.categoria || (isGasto ? "Varios" : "💰 Ingresos")} onChange={(e) => updateTx(idx, { categoria: e.target.value })} disabled={!isGasto}>
                            <option>📦 Otros</option>
                            <option>🚗 Transporte</option>
                            <option>⛽ Gasolina</option>
                            <option>🍔 Comida</option>
                            <option>📱 Suscripciones</option>
                            <option>💪 Salud/Fitness</option>
                            <option>🏠 Hogar</option>
                            <option>🛒 Compras Online</option>
                            <option>💳 Servicios Financieros</option>
                            <option>🎮 Entretenimiento</option>
                            <option>📸 Fotografía/Trabajo</option>
                            <option>💸 Transferencias</option>
                            <option>🚙 Auto/Pagos</option>
                            <option>⚡ Servicios</option>
                          </select>
                          <button onClick={() => removeTx(idx)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg" title="Eliminar">
                            <XCircle className="w-5 h-5 text-rose-300" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={handleSaveTransactions} disabled={loading || !editableTx.length} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2">
                <Save className="w-5 h-5" />
                {loading ? "Guardando..." : "Guardar Transacciones"}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl flex items-center gap-3">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}