begin;

-- Agregar columnas faltantes en pagos_tarjetas para que el RPC pagar_tarjeta funcione
alter table public.pagos_tarjetas
  add column if not exists cuenta_id uuid references public.cuentas_bancarias(id) on delete set null,
  add column if not exists monto_total numeric,
  add column if not exists a_principal numeric,
  add column if not exists intereses numeric default 0,
  add column if not exists deuda_id uuid references public.deudas(id) on delete set null;

-- Si la columna "monto" existe pero "monto_total" no tenía datos, copiar monto → monto_total
update public.pagos_tarjetas
  set monto_total = monto
  where monto_total is null and monto is not null;

-- Si "principal" existe pero "a_principal" estaba vacío, copiar
update public.pagos_tarjetas
  set a_principal = principal
  where a_principal is null and principal is not null;

-- Si "interes" existe pero "intereses" estaba vacío, copiar
update public.pagos_tarjetas
  set intereses = interes
  where intereses is null and interes is not null;

-- Corregir saldo Salem Five a $289.40
update public.cuentas_bancarias
  set balance = 289.40
  where id = 'e0190b2a-3070-4e28-b2a9-d47977a928d2';

commit;
