// src/utils/exportUtils.js
// Utilidades para exportar datos financieros a diferentes formatos

/**
 * Exporta datos a CSV
 */
export const exportToCSV = async (datos, opciones = {}) => {
  const { nombreArchivo = 'finguide-export', tipo = 'completo' } = opciones
  
  try {
    let csvContent = ''
    const timestamp = new Date().toLocaleString()
    
    // Header del archivo
    csvContent += `FinGuide - Exportación de Datos\n`
    csvContent += `Fecha de exportación: ${timestamp}\n`
    csvContent += `Período: ${datos.periodo}\n\n`
    
    if (tipo === 'completo' || tipo === 'ingresos_gastos') {
      // Sección de Ingresos
      if (datos.datos.ingresos?.length > 0) {
        csvContent += `INGRESOS\n`
        csvContent += `Fecha,Fuente,Monto,Categoría,Descripción,Método,Frecuencia\n`
        
        datos.datos.ingresos.forEach(ing => {
          csvContent += `${ing.fecha || ''},"${ing.fuente || ''}",${ing.monto || 0},"${ing.categoria || ''}","${ing.descripcion || ''}","${ing.metodo || ''}","${ing.frecuencia || ''}"\n`
        })
        csvContent += `\n`
      }
      
      // Sección de Gastos Variables
      if (datos.datos.gastos?.length > 0) {
        csvContent += `GASTOS VARIABLES\n`
        csvContent += `Fecha,Descripción,Monto,Categoría,Método\n`
        
        datos.datos.gastos.forEach(gasto => {
          csvContent += `${gasto.fecha || ''},"${gasto.descripcion || ''}",${gasto.monto || 0},"${gasto.categoria || ''}","${gasto.metodo || ''}"\n`
        })
        csvContent += `\n`
      }
      
      // Sección de Gastos Fijos
      if (datos.datos.gastosFijos?.length > 0) {
        csvContent += `GASTOS FIJOS\n`
        csvContent += `Nombre,Monto,Día Vencimiento,Categoría,Estado\n`
        
        datos.datos.gastosFijos.forEach(gf => {
          csvContent += `"${gf.nombre || ''}",${gf.monto || 0},${gf.dia_venc || ''},"${gf.categoria || ''}","${gf.estado || ''}"\n`
        })
        csvContent += `\n`
      }
      
      // Sección de Suscripciones
      if (datos.datos.suscripciones?.length > 0) {
        csvContent += `SUSCRIPCIONES\n`
        csvContent += `Servicio,Costo,Ciclo,Próximo Pago,Estado,Autopago\n`
        
        datos.datos.suscripciones.forEach(sub => {
          csvContent += `"${sub.servicio || ''}",${sub.costo || 0},"${sub.ciclo || ''}",${sub.proximo_pago || ''},"${sub.estado || ''}",${sub.autopago ? 'Sí' : 'No'}\n`
        })
        csvContent += `\n`
      }
    }
    
    if (tipo === 'completo' || tipo === 'deudas') {
      // Sección de Deudas
      if (datos.datos.deudas?.length > 0) {
        csvContent += `DEUDAS\n`
        csvContent += `Tarjeta/Cuenta,Saldo,Límite,Interés Anual,Pago Mínimo,Vencimiento\n`
        
        datos.datos.deudas.forEach(deuda => {
          csvContent += `"${deuda.cuenta || ''}",${deuda.saldo || 0},${deuda.limite || 0},${deuda.interes || 0},${deuda.pago_minimo || 0},${deuda.vence || ''}\n`
        })
        csvContent += `\n`
      }
    }
    
    if (datos.metricas && (tipo === 'completo' || tipo === 'metricas')) {
      // Sección de Métricas
      csvContent += `MÉTRICAS DEL PERÍODO\n`
      csvContent += `Concepto,Valor\n`
      csvContent += `Total Ingresos,${datos.metricas.totalIngresos}\n`
      csvContent += `Total Gastos,${datos.metricas.totalGastos}\n`
      csvContent += `Balance,${datos.metricas.balance}\n`
      csvContent += `Tasa de Ahorro,${datos.metricas.tasaAhorro.toFixed(2)}%\n`
      csvContent += `Deuda Total,${datos.metricas.deudaTotal}\n`
      csvContent += `\n`
      
      // Gastos por Categoría
      if (Object.keys(datos.metricas.gastosPorCategoria).length > 0) {
        csvContent += `GASTOS POR CATEGORÍA\n`
        csvContent += `Categoría,Monto,Porcentaje\n`
        
        const totalGastos = datos.metricas.totalGastos
        Object.entries(datos.metricas.gastosPorCategoria).forEach(([categoria, monto]) => {
          const porcentaje = totalGastos > 0 ? ((monto / totalGastos) * 100).toFixed(1) : 0
          csvContent += `"${categoria}",${monto},${porcentaje}%\n`
        })
      }
    }
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${nombreArchivo}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return { success: true, nombreArchivo: `${nombreArchivo}.csv` }
    
  } catch (error) {
    console.error('Error exportando CSV:', error)
    throw new Error('Error al generar archivo CSV: ' + error.message)
  }
}

/**
 * Exporta datos a Excel (usando SheetJS)
 */
export const exportToExcel = async (datos, opciones = {}) => {
  const { nombreArchivo = 'finguide-export', incluirMetricas = true, tipo = 'completo' } = opciones
  
  try {
    // Verificar si XLSX está disponible
    if (typeof window.XLSX === 'undefined') {
      // Cargar SheetJS dinámicamente
      await loadSheetJS()
    }
    
    const XLSX = window.XLSX
    const wb = XLSX.utils.book_new()
    
    // Hoja de Resumen
    if (incluirMetricas && datos.metricas) {
      const resumenData = [
        ['FinGuide - Resumen Financiero'],
        ['Período', datos.periodo],
        ['Fecha Exportación', new Date().toLocaleString()],
        [''],
        ['MÉTRICAS PRINCIPALES'],
        ['Total Ingresos', datos.metricas.totalIngresos],
        ['Total Gastos', datos.metricas.totalGastos],
        ['Balance', datos.metricas.balance],
        ['Tasa de Ahorro', `${datos.metricas.tasaAhorro.toFixed(2)}%`],
        ['Deuda Total', datos.metricas.deudaTotal],
        [''],
        ['CONTADORES'],
        ['Ingresos Registrados', datos.metricas.contadores.ingresos],
        ['Gastos Registrados', datos.metricas.contadores.gastos],
        ['Gastos Fijos', datos.metricas.contadores.gastosFijos],
        ['Suscripciones', datos.metricas.contadores.suscripciones],
        ['Deudas Activas', datos.metricas.contadores.deudas]
      ]
      
      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')
    }
    
    if (tipo === 'completo' || tipo === 'ingresos_gastos') {
      // Hoja de Ingresos
      if (datos.datos.ingresos?.length > 0) {
        const ingresosData = [
          ['Fecha', 'Fuente', 'Monto', 'Categoría', 'Descripción', 'Método', 'Frecuencia'],
          ...datos.datos.ingresos.map(ing => [
            ing.fecha || '',
            ing.fuente || '',
            ing.monto || 0,
            ing.categoria || '',
            ing.descripcion || '',
            ing.metodo || '',
            ing.frecuencia || ''
          ])
        ]
        
        const wsIngresos = XLSX.utils.aoa_to_sheet(ingresosData)
        XLSX.utils.book_append_sheet(wb, wsIngresos, 'Ingresos')
      }
      
      // Hoja de Gastos Variables
      if (datos.datos.gastos?.length > 0) {
        const gastosData = [
          ['Fecha', 'Descripción', 'Monto', 'Categoría', 'Método'],
          ...datos.datos.gastos.map(gasto => [
            gasto.fecha || '',
            gasto.descripcion || '',
            gasto.monto || 0,
            gasto.categoria || '',
            gasto.metodo || ''
          ])
        ]
        
        const wsGastos = XLSX.utils.aoa_to_sheet(gastosData)
        XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos Variables')
      }
      
      // Hoja de Gastos Fijos
      if (datos.datos.gastosFijos?.length > 0) {
        const gastosFijosData = [
          ['Nombre', 'Monto', 'Día Vencimiento', 'Categoría', 'Estado'],
          ...datos.datos.gastosFijos.map(gf => [
            gf.nombre || '',
            gf.monto || 0,
            gf.dia_venc || '',
            gf.categoria || '',
            gf.estado || ''
          ])
        ]
        
        const wsGastosFijos = XLSX.utils.aoa_to_sheet(gastosFijosData)
        XLSX.utils.book_append_sheet(wb, wsGastosFijos, 'Gastos Fijos')
      }
      
      // Hoja de Suscripciones
      if (datos.datos.suscripciones?.length > 0) {
        const suscripcionesData = [
          ['Servicio', 'Costo', 'Ciclo', 'Próximo Pago', 'Estado', 'Autopago'],
          ...datos.datos.suscripciones.map(sub => [
            sub.servicio || '',
            sub.costo || 0,
            sub.ciclo || '',
            sub.proximo_pago || '',
            sub.estado || '',
            sub.autopago ? 'Sí' : 'No'
          ])
        ]
        
        const wsSuscripciones = XLSX.utils.aoa_to_sheet(suscripcionesData)
        XLSX.utils.book_append_sheet(wb, wsSuscripciones, 'Suscripciones')
      }
    }
    
    if (tipo === 'completo' || tipo === 'deudas') {
      // Hoja de Deudas
      if (datos.datos.deudas?.length > 0) {
        const deudasData = [
          ['Tarjeta/Cuenta', 'Saldo', 'Límite', 'Interés Anual (%)', 'Pago Mínimo', 'Vencimiento'],
          ...datos.datos.deudas.map(deuda => [
            deuda.cuenta || '',
            deuda.saldo || 0,
            deuda.limite || 0,
            deuda.interes || 0,
            deuda.pago_minimo || 0,
            deuda.vence || ''
          ])
        ]
        
        const wsDeudas = XLSX.utils.aoa_to_sheet(deudasData)
        XLSX.utils.book_append_sheet(wb, wsDeudas, 'Deudas')
      }
    }
    
    // Hoja de Gastos por Categoría (si incluye métricas)
    if (incluirMetricas && datos.metricas?.gastosPorCategoria) {
      const categoriasData = [
        ['Categoría', 'Monto', 'Porcentaje'],
        ...Object.entries(datos.metricas.gastosPorCategoria).map(([categoria, monto]) => {
          const porcentaje = datos.metricas.totalGastos > 0 ? 
            ((monto / datos.metricas.totalGastos) * 100).toFixed(1) : 0
          return [categoria, monto, `${porcentaje}%`]
        })
      ]
      
      const wsCategorias = XLSX.utils.aoa_to_sheet(categoriasData)
      XLSX.utils.book_append_sheet(wb, wsCategorias, 'Gastos por Categoría')
    }
    
    // Generar y descargar archivo
    XLSX.writeFile(wb, `${nombreArchivo}.xlsx`)
    
    return { success: true, nombreArchivo: `${nombreArchivo}.xlsx` }
    
  } catch (error) {
    console.error('Error exportando Excel:', error)
    throw new Error('Error al generar archivo Excel: ' + error.message)
  }
}

/**
 * Genera reporte PDF
 */
export const generatePDFReport = async (datos, opciones = {}) => {
  const { nombreArchivo = 'finguide-export', incluirMetricas = true, tipo = 'completo' } = opciones
  
  try {
    // Verificar si jsPDF está disponible
    if (typeof window.jsPDF === 'undefined') {
      await loadJsPDF()
    }
    
    const { jsPDF } = window.jsPDF
    const doc = new jsPDF()
    
    let yPosition = 20
    const pageHeight = doc.internal.pageSize.height
    const margin = 20
    
    // Función para agregar nueva página si es necesario
    const checkPageBreak = (neededSpace = 20) => {
      if (yPosition + neededSpace > pageHeight - margin) {
        doc.addPage()
        yPosition = 20
      }
    }
    
    // Header del documento
    doc.setFontSize(20)
    doc.setTextColor(51, 51, 51)
    doc.text('FinGuide - Reporte Financiero', 20, yPosition)
    yPosition += 15
    
    doc.setFontSize(12)
    doc.setTextColor(102, 102, 102)
    doc.text(`Período: ${datos.periodo}`, 20, yPosition)
    yPosition += 8
    doc.text(`Generado: ${new Date().toLocaleString()}`, 20, yPosition)
    yPosition += 20
    
    if (incluirMetricas && datos.metricas) {
      // Sección de Métricas
      checkPageBreak(60)
      doc.setFontSize(16)
      doc.setTextColor(51, 51, 51)
      doc.text('Resumen Ejecutivo', 20, yPosition)
      yPosition += 15
      
      doc.setFontSize(12)
      doc.setTextColor(102, 102, 102)
      
      const metricas = [
        [`Total Ingresos: $${datos.metricas.totalIngresos.toLocaleString()}`],
        [`Total Gastos: $${datos.metricas.totalGastos.toLocaleString()}`],
        [`Balance: $${datos.metricas.balance.toLocaleString()}`],
        [`Tasa de Ahorro: ${datos.metricas.tasaAhorro.toFixed(2)}%`],
        [`Deuda Total: $${datos.metricas.deudaTotal.toLocaleString()}`]
      ]
      
      metricas.forEach(metrica => {
        doc.text(metrica[0], 20, yPosition)
        yPosition += 8
      })
      
      yPosition += 10
    }
    
    if (tipo === 'completo' || tipo === 'ingresos_gastos') {
      // Resumen de movimientos
      checkPageBreak(40)
      doc.setFontSize(14)
      doc.setTextColor(51, 51, 51)
      doc.text('Resumen de Movimientos', 20, yPosition)
      yPosition += 15
      
      doc.setFontSize(10)
      doc.text(`• Ingresos registrados: ${datos.metricas?.contadores.ingresos || 0}`, 25, yPosition)
      yPosition += 6
      doc.text(`• Gastos variables: ${datos.metricas?.contadores.gastos || 0}`, 25, yPosition)
      yPosition += 6
      doc.text(`• Gastos fijos: ${datos.metricas?.contadores.gastosFijos || 0}`, 25, yPosition)
      yPosition += 6
      doc.text(`• Suscripciones activas: ${datos.metricas?.contadores.suscripciones || 0}`, 25, yPosition)
      yPosition += 15
    }
    
    if (tipo === 'completo' || tipo === 'deudas') {
      // Sección de Deudas
      if (datos.datos.deudas?.length > 0) {
        checkPageBreak(40)
        doc.setFontSize(14)
        doc.setTextColor(51, 51, 51)
        doc.text('Estado de Deudas', 20, yPosition)
        yPosition += 15
        
        doc.setFontSize(10)
        datos.datos.deudas.slice(0, 5).forEach(deuda => { // Limitar a 5 para no llenar el PDF
          doc.text(`• ${deuda.cuenta}: $${(deuda.saldo || 0).toLocaleString()} (${deuda.interes || 0}%)`, 25, yPosition)
          yPosition += 6
        })
        
        if (datos.datos.deudas.length > 5) {
          doc.text(`... y ${datos.datos.deudas.length - 5} más (ver exportación completa)`, 25, yPosition)
        }
        yPosition += 15
      }
    }
    
    if (incluirMetricas && datos.metricas?.gastosPorCategoria) {
      // Top 5 categorías de gastos
      checkPageBreak(50)
      doc.setFontSize(14)
      doc.setTextColor(51, 51, 51)
      doc.text('Top Categorías de Gastos', 20, yPosition)
      yPosition += 15
      
      doc.setFontSize(10)
      const topCategorias = Object.entries(datos.metricas.gastosPorCategoria)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
      
      topCategorias.forEach(([categoria, monto]) => {
        const porcentaje = datos.metricas.totalGastos > 0 ? 
          ((monto / datos.metricas.totalGastos) * 100).toFixed(1) : 0
        doc.text(`• ${categoria}: $${monto.toLocaleString()} (${porcentaje}%)`, 25, yPosition)
        yPosition += 6
      })
    }
    
    // Footer
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(`Página ${i} de ${totalPages} - FinGuide`, 20, pageHeight - 10)
      doc.text(`Generado el ${new Date().toLocaleString()}`, pageHeight - 100, pageHeight - 10)
    }
    
    // Descargar PDF
    doc.save(`${nombreArchivo}.pdf`)
    
    return { success: true, nombreArchivo: `${nombreArchivo}.pdf` }
    
  } catch (error) {
    console.error('Error generando PDF:', error)
    throw new Error('Error al generar archivo PDF: ' + error.message)
  }
}

/**
 * Exporta datos a JSON
 */
export const exportToJSON = async (datos, opciones = {}) => {
  const { nombreArchivo = 'finguide-export' } = opciones
  
  try {
    // Crear estructura JSON completa
    const jsonData = {
      metadata: {
        aplicacion: 'FinGuide',
        version: '1.0',
        fechaExportacion: new Date().toISOString(),
        periodo: datos.periodo,
        configuracion: datos.configuracion
      },
      datos: datos.datos,
      metricas: datos.metricas,
      timestamp: Date.now()
    }
    
    // Convertir a JSON con formato bonito
    const jsonString = JSON.stringify(jsonData, null, 2)
    
    // Crear y descargar archivo
    const blob = new Blob([jsonString], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${nombreArchivo}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return { success: true, nombreArchivo: `${nombreArchivo}.json` }
    
  } catch (error) {
    console.error('Error exportando JSON:', error)
    throw new Error('Error al generar archivo JSON: ' + error.message)
  }
}

/**
 * Carga SheetJS dinámicamente
 */
const loadSheetJS = () => {
  return new Promise((resolve, reject) => {
    if (typeof window.XLSX !== 'undefined') {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('Error cargando SheetJS'))
    document.head.appendChild(script)
  })
}

/**
 * Carga jsPDF dinámicamente
 */
const loadJsPDF = () => {
  return new Promise((resolve, reject) => {
    if (typeof window.jsPDF !== 'undefined') {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('Error cargando jsPDF'))
    document.head.appendChild(script)
  })
}

/**
 * Captura una gráfica como imagen (usando html2canvas)
 */
export const captureChartAsImage = async (elementRef, options = {}) => {
  const { format = 'png', quality = 0.9, nombre = 'grafica' } = options
  
  try {
    // Cargar html2canvas si no está disponible
    if (typeof window.html2canvas === 'undefined') {
      await loadHtml2Canvas()
    }
    
    const canvas = await window.html2canvas(elementRef.current, {
      backgroundColor: '#1a1a1a',
      scale: 2,
      useCORS: true
    })
    
    // Convertir a blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${nombre}.${format}`
        link.click()
        URL.revokeObjectURL(url)
        resolve({ success: true, url })
      }, `image/${format}`, quality)
    })
    
  } catch (error) {
    console.error('Error capturando gráfica:', error)
    throw new Error('Error al capturar gráfica: ' + error.message)
  }
}

/**
 * Carga html2canvas dinámicamente
 */
const loadHtml2Canvas = () => {
  return new Promise((resolve, reject) => {
    if (typeof window.html2canvas !== 'undefined') {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('Error cargando html2canvas'))
    document.head.appendChild(script)
  })
}

export default {
  exportToCSV,
  exportToExcel,
  generatePDFReport,
  exportToJSON,
  captureChartAsImage
}