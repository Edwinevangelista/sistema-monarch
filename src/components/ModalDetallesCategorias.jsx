import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function ModalDetallesCategorias({
  gastosPorCategoria,
  gastosFijos,
  gastosVariables,
  suscripciones,
  onClose,
}) {
  const data = Object.entries(gastosPorCategoria || {})
    .map(([categoria, monto]) => ({ categoria, monto }))
    .sort((a, b) => b.monto - a.monto);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gray-900 rounded-2xl w-full max-w-lg p-6 relative"
          initial={{ scale: 0.9, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 40 }}
          transition={{ type: "spring", damping: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X />
          </button>

          <h2 className="text-xl font-bold text-white mb-4">
            📊 Detalle de Gastos por Categoría
          </h2>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {data.map((item) => (
              <div
                key={item.categoria}
                className="flex justify-between items-center bg-gray-800 p-3 rounded-lg"
              >
                <span className="text-white">{item.categoria}</span>
                <span className="text-green-400 font-semibold">
                  ${Number(item.monto || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
