# Account Deletion — Test Checkpoint

Implementación de eliminación de cuenta con confirmación por correo (OTP de 6 dígitos) + flujo multi-paso de retención.

## Resumen del flujo

1. Usuario va a **Settings → Danger Zone** y pulsa **Delete Account**.
2. Se abre `DeleteAccountDialog` con 4 pasos:
   - **warning** → checklist de qué se pierde + checkbox de reconocimiento.
   - **reason** → opciones de feedback (incluye un *nudge* si elige "necesito un descanso").
   - **identity** → escribir email exacto + contraseña actual.
   - **otp** → código de 6 dígitos enviado al correo.
3. Backend cascade-delete del usuario, frontend logout + redirect a `/login`.

## Endpoints nuevos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/request-account-deletion` | Bearer | Verifica email+password, emite OTP `'delete'`, envía correo |
| POST | `/auth/confirm-account-deletion` | Bearer | Verifica OTP, ejecuta `userRepository.deleteUser` (cascade) |

`DELETE /user/delete` fue **eliminado** (era inseguro: borraba sin confirmación).

## Archivos tocados

### Backend
- `apps/api/src/repositories/otp.repo.ts` — `OtpPurpose` ahora incluye `'delete'`.
- `apps/api/src/repositories/auth.repo.ts` — nuevo `findUserAuthInfo(userId)`.
- `apps/api/src/services/email.service.ts` — `otpDeleteAccountTemplate` + `emailService.sendDeleteAccountOtp`.
- `apps/api/src/services/auth.service.ts` — `requestAccountDeletion`, `confirmAccountDeletion`. Importa `userRepository`.
- `apps/api/src/services/user.service.ts` — removido `deleteUser` (ya no se usa).
- `apps/api/src/routes/auth.ts` — dos rutas nuevas con `authMiddleware`.
- `apps/api/src/routes/user.ts` — removido `DELETE /delete`.
- `packages/shared/src/validators/auth.ts` — `requestAccountDeletionSchema` (confirmEmail + password? + reason?) y `confirmAccountDeletionSchema` (code 6 dígitos).
- `packages/shared/src/validators/index.ts` — re-exports de los nuevos schemas/types.

### Frontend
- `apps/web/src/features/auth/api.ts` — `authApi.requestAccountDeletion`, `authApi.confirmAccountDeletion`.
- `apps/web/src/features/auth/queries.ts` — `useRequestAccountDeletion`, `useConfirmAccountDeletion` (esta limpia auth store + react-query cache en `onSuccess`).
- `apps/web/src/features/settings/components/DeleteAccountDialog.tsx` — diálogo nuevo (state machine con `step`).
- `apps/web/src/features/settings/components/DangerZone.tsx` — abre el diálogo en lugar del `toast.info`.
- `apps/web/src/i18n/locales/{en,es}/settings.json` — claves `deleteAccount_*`.

## Reglas de seguridad / detalles

- OTP usa el servicio existente: 10 min de expiración, 5 intentos por código, **5 emisiones/hora por (email + purpose)**.
- Email tipeado debe coincidir con el del JWT (case-insensitive).
- Si el usuario tiene `passwordHash` se requiere password; si es OAuth-only (sin password) se permite saltarlo.
- Cascade delete vía Prisma `onDelete: Cascade` en todas las relaciones de `User`.
- Después de borrar, el JWT del usuario sigue siendo criptográficamente válido pero `findUserById` devolverá null → cualquier llamada falla. El frontend hace logout duro inmediato.

## Checklist de prueba mañana

### Camino feliz (usuario con contraseña)
- [ ] Login con cuenta de email/password.
- [ ] Settings → Danger Zone → Delete Account abre el diálogo.
- [ ] Paso 1: lista de pérdidas se muestra; botón "Continue" deshabilitado hasta marcar el checkbox.
- [ ] Paso 2: elegir cualquier razón + nota libre opcional. Probar "I just need a break" → debe aparecer el aviso ámbar.
- [ ] Paso 3: tipear email mal → botón send queda deshabilitado. Tipear bien + password incorrecta → toast "Incorrect password". Tipear bien + password correcta → llega correo y avanza al paso 4.
- [ ] Verificar que llega el correo de "Confirma la eliminación de tu cuenta" con código 6 dígitos.
- [ ] Paso 4: código incorrecto → toast "Invalid or expired code". Código correcto → toast "Account deleted", redirige a `/login`.
- [ ] Intentar login con la misma cuenta → debe fallar (usuario ya no existe).
- [ ] Verificar en DB que tareas, hábitos, eventos, settings, etc. del usuario también fueron borrados (cascade).

### Camino OAuth-only (sin password)
- [ ] Login con Google.
- [ ] Llegar al paso 3 con password en blanco → debe avanzar (backend salta verificación de password).
- [ ] Confirmar con OTP → cuenta borrada.

### Resend
- [ ] En el paso 4, el botón "Resend" está deshabilitado los primeros 30s (cooldown).
- [ ] Después de 30s, hacer resend → llega un nuevo código (el anterior queda invalidado por `invalidateExisting`).
- [ ] Probar pedir resend 6+ veces seguidas → debe responder 429 ("Too many requests").

### Casos negativos
- [ ] Cancelar / cerrar el diálogo en cada paso → al reabrirlo, el state está limpio (paso 1 sin checkbox marcado).
- [ ] Pulsar "Stay" → cierra sin enviar nada.
- [ ] Código expirado (esperar >10 min) → toast inválido al confirmar.
- [ ] Más de 5 intentos con código incorrecto → toast "Too many attempts. Request a new code." y vuelve al paso 3.
- [ ] Probar i18n cambiando idioma a inglés y español: textos correctos en ambos.

### Smoke API
- [ ] `POST /auth/request-account-deletion` sin Bearer → 401.
- [ ] `POST /auth/request-account-deletion` con `confirmEmail` distinto al del token → 400 "Email does not match your account".
- [ ] `POST /auth/confirm-account-deletion` con código inválido → 400.
- [ ] Antiguo `DELETE /user/delete` → 404 (route ya no existe).

## Estado actual

- Backend: tipos OK (no introduce nuevos errores; los pre-existentes son del paquete @prisma/client y handlers de habits/goals).
- Frontend: tipos OK, compila limpio.
- Falta: probar end-to-end con SMTP real + DB real.

## Variables de entorno requeridas

`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (opcional). Sin esto, `getTransporter()` lanza y el request-deletion devuelve 400 "Failed to send confirmation email".
