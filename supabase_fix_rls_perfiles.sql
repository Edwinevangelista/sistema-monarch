-- ============================================================
-- FIX: RLS policies para tabla "perfiles"
-- Error: 403 Forbidden / row-level security policy violation
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- 1. Habilitar RLS en la tabla perfiles (si no está habilitado)
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes que puedan estar mal configuradas
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON perfiles;
DROP POLICY IF EXISTS "Usuarios pueden insertar su perfil" ON perfiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su perfil" ON perfiles;
DROP POLICY IF EXISTS "perfiles_select_policy" ON perfiles;
DROP POLICY IF EXISTS "perfiles_insert_policy" ON perfiles;
DROP POLICY IF EXISTS "perfiles_update_policy" ON perfiles;
DROP POLICY IF EXISTS "perfiles_delete_policy" ON perfiles;

-- 3. Política SELECT: cada usuario ve solo su perfil
CREATE POLICY "perfiles_select_policy"
  ON perfiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR auth.uid()::text = (id)::text
  );

-- 4. Política INSERT: usuario autenticado puede crear su propio perfil
--    Cubre tanto email/password como Google OAuth (auth.uid() siempre existe)
CREATE POLICY "perfiles_insert_policy"
  ON perfiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR auth.uid()::text = (id)::text
  );

-- 5. Política UPDATE: usuario puede actualizar solo su perfil
CREATE POLICY "perfiles_update_policy"
  ON perfiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR auth.uid()::text = (id)::text
  )
  WITH CHECK (
    auth.uid() = id
    OR auth.uid()::text = (id)::text
  );

-- 6. Política DELETE: usuario puede borrar su perfil (opcional)
CREATE POLICY "perfiles_delete_policy"
  ON perfiles
  FOR DELETE
  USING (
    auth.uid() = id
    OR auth.uid()::text = (id)::text
  );

-- ============================================================
-- VERIFICAR: Asegúrate de que la columna ID coincide con auth.uid()
-- Si la columna PK se llama "user_id" en vez de "id", cambia arriba.
-- Puedes verificar con:
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'perfiles';
-- ============================================================

-- 7. Opcional: Si usas user_id como FK en vez de id como PK, usar esto:
-- CREATE POLICY "perfiles_insert_policy_userid"
--   ON perfiles FOR INSERT
--   WITH CHECK (auth.uid() = user_id);
