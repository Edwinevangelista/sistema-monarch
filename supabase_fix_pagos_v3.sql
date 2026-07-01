begin;

-- Fix: hacer "monto" nullable (la columna vieja) porque el nuevo flujo usa monto_total
alter table public.pagos_tarjetas
  alter column monto drop not null;

-- Actualizar RPC para insertar tanto monto (compatibilidad) como monto_total
create or replace function public.pagar_tarjeta(
  p_user_id uuid,
  p_tarjeta_id uuid,
  p_cuenta_id uuid,
  p_monto numeric,
  p_idem_key text,
  p_fecha date default current_date,
  p_metodo text default 'Débito',
  p_notas text default null,
  p_pago_minimo numeric default null,
  p_vence date default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saldo_cuenta numeric;
  v_deuda_actual numeric;
  v_nueva_deuda numeric;
  v_nuevo_balance numeric;
  v_cuenta_nombre text;
  v_tarjeta_nombre text;
  v_pago_id text;
  v_movimiento_id text;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Usuario no autorizado';
  end if;

  if p_idem_key is null or length(trim(p_idem_key)) = 0 then
    raise exception 'Llave de idempotencia requerida';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_idem_key, 0));

  if exists (
    select 1 from public.movimientos_bancarios
    where user_id = p_user_id and idempotency_key = p_idem_key
  ) then
    return json_build_object('status', 'duplicate', 'message', 'Pago ya procesado');
  end if;

  if p_monto is null or round(p_monto, 2) <= 0 then
    raise exception 'Monto inválido';
  end if;

  p_monto := round(p_monto, 2);

  select balance, nombre into v_saldo_cuenta, v_cuenta_nombre
  from public.cuentas_bancarias
  where id = p_cuenta_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Cuenta no encontrada o no pertenece al usuario';
  end if;

  if round(coalesce(v_saldo_cuenta, 0), 2) < p_monto then
    raise exception 'Fondos insuficientes';
  end if;

  select saldo, cuenta into v_deuda_actual, v_tarjeta_nombre
  from public.deudas
  where id = p_tarjeta_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Tarjeta no encontrada o no pertenece al usuario';
  end if;

  if round(coalesce(v_deuda_actual, 0), 2) < p_monto then
    raise exception 'El pago excede la deuda actual';
  end if;

  v_nueva_deuda   := round(v_deuda_actual - p_monto, 2);
  v_nuevo_balance := round(v_saldo_cuenta - p_monto, 2);

  update public.deudas
  set saldo       = v_nueva_deuda,
      pago_minimo = coalesce(round(p_pago_minimo, 2), pago_minimo),
      ultimo_pago = p_fecha,
      vence       = coalesce(p_vence, vence)
  where id = p_tarjeta_id and user_id = p_user_id;

  update public.cuentas_bancarias
  set balance = v_nuevo_balance
  where id = p_cuenta_id and user_id = p_user_id;

  -- Insertar con TODAS las columnas (monto para compatibilidad + monto_total para el nuevo flujo)
  insert into public.pagos_tarjetas (
    user_id, deuda_id, tarjeta, cuenta_id,
    monto, monto_total, a_principal, intereses,
    metodo, fecha, notas
  ) values (
    p_user_id, p_tarjeta_id, coalesce(v_tarjeta_nombre, 'Crédito'), p_cuenta_id,
    p_monto, p_monto, p_monto, 0,
    p_metodo, p_fecha, p_notas
  )
  returning id::text into v_pago_id;

  insert into public.movimientos_bancarios (
    user_id, tipo, monto, descripcion,
    cuenta_id, cuenta_nombre, idempotency_key, created_at
  ) values (
    p_user_id, 'pago_tarjeta', p_monto,
    'Pago tarjeta: ' || coalesce(v_tarjeta_nombre, 'Crédito'),
    p_cuenta_id, v_cuenta_nombre, p_idem_key, now()
  )
  returning id::text into v_movimiento_id;

  return json_build_object(
    'status', 'ok',
    'pago_id', v_pago_id,
    'movimiento_id', v_movimiento_id,
    'nueva_deuda', v_nueva_deuda,
    'nuevo_balance', v_nuevo_balance
  );
end;
$$;

revoke all on function public.pagar_tarjeta(uuid,uuid,uuid,numeric,text,date,text,text,numeric,date) from public;
grant execute on function public.pagar_tarjeta(uuid,uuid,uuid,numeric,text,date,text,text,numeric,date) to authenticated;

commit;
