export const BANK_DEUDA_MESSAGES = {
  SIN_SALDO: {
    title: 'Deuda saldada',
    message: 'Esta deuda no tiene balance pendiente. No se requieren más pagos.',
    tone: 'success',
    canPay: false,
  },
  PAGADA_MES: {
    title: 'Pago registrado este mes',
    message:
      'Ya se registró un pago durante el mes actual. Puedes volver a pagar cuando inicie el próximo ciclo.',
    tone: 'info',
    canPay: false,
  },
  PENDIENTE: {
    title: 'Pago pendiente',
    message:
      'Esta deuda tiene un balance activo. Registra el pago cuando estés listo.',
    tone: 'warning',
    canPay: true,
  },
  VENCIDA: {
    title: 'Pago vencido',
    message:
      'El pago está fuera de la fecha establecida. Registrar el pago ahora puede ayudarte a evitar cargos adicionales.',
    tone: 'danger',
    canPay: true,
  },
}
