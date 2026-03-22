// src/utils/exportUtils.js
// Funciones de exportación de datos financieros
// Soporta: CSV, Excel (.xls), PDF (jsPDF), JSON

import { jsPDF } from 'jspdf'

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatMonto = (val) => Number(val || 0).toFixed(2)

const formatFecha = (val) => {
  if (!val) return ''
  try { return new Date(val).toLocaleDateString('en-US') } catch { return val }
}

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const getNombreArchivo = (formato) => {
  const fecha = new Date().toISOString().slice(0, 10)
  return `FinGuide_${fecha}.${formato}`
}

// ─── CSV ────────────────────────────────────────────────────────────────────

export const exportToCSV = ({ ingresos = [], gastos = [], gastosFijos = [], suscripciones = [], deudas = [] }) => {
  const rows = []

  rows.push(['TIPO', 'FECHA', 'DESCRIPCION', 'CATEGORIA', 'AMOUNT (USD)', 'ESTADO'])

  ingresos.forEach(i => rows.push([
    'Ingreso', formatFecha(i.fecha), i.descripcion || i.origen || '', i.categoria || 'Ingreso', formatMonto(i.monto), 'Recibido'
  ]))

  gastos.forEach(g => rows.push([
    'Gasto Variable', formatFecha(g.fecha), g.descripcion || '', g.categoria || 'General', formatMonto(g.monto), 'Pagado'
  ]))

  gastosFijos.forEach(gf => rows.push([
    'Gasto Fijo', '', gf.nombre || '', 'Fijo', formatMonto(gf.monto), gf.auto_pago ? 'Auto-Pago' : 'Manual'
  ]))

  suscripciones.forEach(s => rows.push([
    'Suscripción', formatFecha(s.fecha_cobro), s.nombre || '', 'Suscripción', formatMonto(s.monto), s.activa ? 'Activa' : 'Inactiva'
  ]))

  deudas.forEach(d => rows.push([
    'Deuda', formatFecha(d.vence), d.cuenta || '', 'Deuda', formatMonto(d.saldo), d.estado || 'Activa'
  ]))

  const csvContent = rows.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, getNombreArchivo('csv'))
  return { success: true }
}

// ─── Excel (.xls via HTML table) ────────────────────────────────────────────

export const exportToExcel = ({ ingresos = [], gastos = [], gastosFijos = [], suscripciones = [], deudas = [] }) => {
  const toRows = (items, tipo, mapFn) => items.map(item => {
    const cols = mapFn(item)
    return `<tr><td>${tipo}</td>${cols.map(c => `<td>${c}</td>`).join('')}</tr>`
  }).join('')

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8"><style>
      table { border-collapse: collapse; }
      th { background: #1E3A8A; color: white; padding: 8px; font-weight: bold; }
      td { padding: 6px 10px; border: 1px solid #ddd; }
      tr:nth-child(even) { background: #f0f4ff; }
    </style></head>
    <body>
    <h2>FinGuide — Reporte Financiero ${new Date().toLocaleDateString('en-US')}</h2>
    <table>
      <thead><tr><th>Tipo</th><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Amount (USD)</th><th>Estado</th></tr></thead>
      <tbody>
        ${toRows(ingresos, 'Ingreso', i => [formatFecha(i.fecha), i.descripcion || i.origen || '', i.categoria || 'Ingreso', formatMonto(i.monto), 'Recibido'])}
        ${toRows(gastos, 'Gasto Variable', g => [formatFecha(g.fecha), g.descripcion || '', g.categoria || 'General', formatMonto(g.monto), 'Pagado'])}
        ${toRows(gastosFijos, 'Gasto Fijo', gf => ['', gf.nombre || '', 'Fijo', formatMonto(gf.monto), gf.auto_pago ? 'Auto-Pago' : 'Manual'])}
        ${toRows(suscripciones, 'Suscripción', s => [formatFecha(s.fecha_cobro), s.nombre || '', 'Suscripción', formatMonto(s.monto), s.activa ? 'Activa' : 'Inactiva'])}
        ${toRows(deudas, 'Deuda', d => [formatFecha(d.vence), d.cuenta || '', 'Deuda', formatMonto(d.saldo), d.estado || 'Activa'])}
      </tbody>
    </table>
    </body></html>`

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  triggerDownload(blob, getNombreArchivo('xls'))
  return { success: true }
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

export const generatePDFReport = ({ ingresos = [], gastos = [], gastosFijos = [], suscripciones = [], deudas = [] }) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const totalIngresos = ingresos.reduce((s, i) => s + Number(i.monto || 0), 0)
  const totalGastos = gastos.reduce((s, g) => s + Number(g.monto || 0), 0)
  const totalFijos = gastosFijos.reduce((s, gf) => s + Number(gf.monto || 0), 0)
  const totalSubs = suscripciones.reduce((s, sub) => s + Number(sub.monto || 0), 0)
  const totalDeudas = deudas.reduce((s, d) => s + Number(d.saldo || 0), 0)
  const balance = totalIngresos - totalGastos - totalFijos - totalSubs
  const fecha = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // Header
  doc.setFillColor(30, 58, 138)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('FinGuide', 15, 14)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Reporte Financiero Personal', 15, 22)
  doc.text(fecha, 150, 22)

  // Summary cards
  doc.setTextColor(30, 30, 30)
  let y = 40

  const drawCard = (label, value, color, x, w = 42) => {
    doc.setFillColor(...color)
    doc.roundedRect(x, y, w, 20, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(label, x + 3, y + 7)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, x + 3, y + 15)
  }

  drawCard('INGRESOS', totalIngresos, [22, 163, 74], 15)
  drawCard('GASTOS VAR.', totalGastos, [239, 68, 68], 60)
  drawCard('GASTOS FIJOS', totalFijos, [234, 88, 12], 105)
  drawCard('BALANCE', balance, balance >= 0 ? [59, 130, 246] : [220, 38, 38], 150)

  y += 30
  doc.setTextColor(30, 30, 30)

  // Section helper
  const drawSection = (title, rows, headers) => {
    if (rows.length === 0) return
    y += 5
    doc.setFillColor(241, 245, 249)
    doc.rect(15, y, 180, 8, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 58, 138)
    doc.text(title.toUpperCase(), 17, y + 5.5)
    y += 11

    // Headers
    doc.setFontSize(7.5)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    headers.forEach((h, i) => doc.text(h.label, 15 + h.x, y))
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    rows.slice(0, 20).forEach((row, idx) => {
      if (y > 270) { doc.addPage(); y = 20 }
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(15, y - 3, 180, 6, 'F')
      }
      doc.setFontSize(7.5)
      row.forEach((cell, i) => doc.text(String(cell).substring(0, 35), 15 + headers[i].x, y))
      y += 6
    })
    if (rows.length > 20) {
      doc.setFontSize(7)
      doc.setTextColor(130, 130, 130)
      doc.text(`... y ${rows.length - 20} registros más`, 17, y)
      y += 5
    }
  }

  const ingHeaders = [{ label: 'Fecha', x: 0 }, { label: 'Origen / Descripción', x: 25 }, { label: 'Categoría', x: 100 }, { label: 'Amount (USD)', x: 150 }]
  drawSection(`Ingresos (${ingresos.length})`, ingresos.map(i => [formatFecha(i.fecha), (i.descripcion || i.origen || '').substring(0, 40), i.categoria || 'Ingreso', `$${formatMonto(i.monto)}`]), ingHeaders)

  const gstHeaders = [{ label: 'Fecha', x: 0 }, { label: 'Descripción', x: 25 }, { label: 'Categoría', x: 100 }, { label: 'Amount (USD)', x: 150 }]
  drawSection(`Gastos Variables (${gastos.length})`, gastos.map(g => [formatFecha(g.fecha), (g.descripcion || '').substring(0, 40), g.categoria || 'General', `$${formatMonto(g.monto)}`]), gstHeaders)

  const gfHeaders = [{ label: 'Nombre', x: 0 }, { label: 'Amount (USD)', x: 80 }, { label: 'Día Vcto.', x: 130 }, { label: 'Auto-Pago', x: 160 }]
  drawSection(`Gastos Fijos (${gastosFijos.length})`, gastosFijos.map(gf => [gf.nombre || '', `$${formatMonto(gf.monto)}`, gf.dia_venc || '', gf.auto_pago ? 'Sí' : 'No']), gfHeaders)

  const subHeaders = [{ label: 'Nombre', x: 0 }, { label: 'Amount (USD)', x: 80 }, { label: 'Próximo Cobro', x: 130 }, { label: 'Estado', x: 165 }]
  drawSection(`Suscripciones (${suscripciones.length})`, suscripciones.map(s => [s.nombre || '', `$${formatMonto(s.monto)}`, formatFecha(s.fecha_cobro), s.activa ? 'Activa' : 'Inactiva']), subHeaders)

  const dHeaders = [{ label: 'Cuenta / Deuda', x: 0 }, { label: 'Balance (USD)', x: 70 }, { label: 'Interés %', x: 120 }, { label: 'Vence', x: 150 }, { label: 'Estado', x: 170 }]
  drawSection(`Deudas (${deudas.length})`, deudas.map(d => [d.cuenta || '', `$${formatMonto(d.saldo)}`, d.interes ? `${d.interes}%` : '—', formatFecha(d.vence), d.estado || 'Activa']), dHeaders)

  // Summary totals
  if (y < 260) {
    y += 8
    doc.setFillColor(30, 58, 138)
    doc.rect(15, y, 180, 0.5, 'F')
    y += 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 58, 138)
    doc.text('RESUMEN TOTAL', 15, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 40, 40)
    doc.setFontSize(8)
    doc.text(`Ingresos: $${totalIngresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}   |   Gastos Variables: $${totalGastos.toLocaleString('en-US', { minimumFractionDigits: 2 })}   |   Gastos Fijos: $${totalFijos.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 15, y)
    y += 5
    doc.text(`Suscripciones: $${totalSubs.toLocaleString('en-US', { minimumFractionDigits: 2 })}   |   Total Deudas: $${totalDeudas.toLocaleString('en-US', { minimumFractionDigits: 2 })}   |   Balance Neto: $${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 15, y)
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.setFont('helvetica', 'normal')
    doc.text(`FinGuide — Reporte Financiero — ${fecha} — Página ${i} de ${pageCount}`, 15, 290)
  }

  doc.save(getNombreArchivo('pdf'))
  return { success: true }
}

// ─── JSON ────────────────────────────────────────────────────────────────────

export const exportToJSON = ({ ingresos = [], gastos = [], gastosFijos = [], suscripciones = [], deudas = [], cuentas = [] }) => {
  const payload = {
    exportado_en: new Date().toISOString(),
    app: 'FinGuide',
    version: '1.0',
    resumen: {
      total_ingresos: ingresos.reduce((s, i) => s + Number(i.monto || 0), 0),
      total_gastos_variables: gastos.reduce((s, g) => s + Number(g.monto || 0), 0),
      total_gastos_fijos: gastosFijos.reduce((s, gf) => s + Number(gf.monto || 0), 0),
      total_suscripciones: suscripciones.reduce((s, sub) => s + Number(sub.monto || 0), 0),
      total_deudas: deudas.reduce((s, d) => s + Number(d.saldo || 0), 0),
    },
    datos: { ingresos, gastos, gastos_fijos: gastosFijos, suscripciones, deudas, cuentas }
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  triggerDownload(blob, getNombreArchivo('json'))
  return { success: true }
}
