# ThePrimeWay — Docs

Documentación pública de usuario en Mintlify.

## Desarrollo local

```bash
cd apps/docs
npx mint dev
```

Abre http://localhost:3000.

## Validar links rotos

```bash
npx mint broken-links
```

## Estructura

- `docs.json` — config global (nav, theme, colors).
- `introduction.mdx`, `quickstart.mdx` — landing y onboarding.
- Carpetas por módulo: `objetivos/`, `tareas/`, `habitos/`, `ia/`, `gamificacion/`, `notificaciones/`, `desktop/`, `mobile/`, `suscripcion/`.

## Añadir una página

1. Crea el archivo `.mdx` en la carpeta correcta.
2. Añade el slug en `docs.json` → `navigation.tabs[].groups[].pages`.
3. Verifica con `npx mint dev`.

## Assets

Coloca logos en `logo/light.svg`, `logo/dark.svg` y `favicon.svg` en la raíz de `apps/docs/`. Capturas en `images/`.

## Deploy → docs.theprimeway.app

Arquitectura: Mintlify hosted es el origen (auto-build desde GitHub en cada push a `main`). Nuestro nginx hace reverse-proxy desde `docs.theprimeway.app` para mantener dominio + SSL propios.

### Setup inicial (una vez)

1. **Conectar Mintlify a GitHub**
   - Ve a https://dashboard.mintlify.com
   - Conecta el repo del monorepo, indica `apps/docs` como directorio de docs.
   - Mintlify expondrá el sitio en `https://theprimeway.mintlify.app` (o subdominio similar — verifica el real en el dashboard y ajusta `nginx/theprimeway.conf` si difiere).

2. **DNS**
   - A record: `docs.theprimeway.app` → IP del servidor (mismo que `app/api/admin`).

3. **Cert SSL** (en el servidor, antes del primer deploy del nginx):
   ```bash
   sudo certbot certonly --webroot -w /var/www/certbot -d docs.theprimeway.app
   ```

4. **Push a `main`** con cambios en `apps/docs/**`:
   - GitHub Actions corre `validate-docs` (broken-links).
   - Mintlify rebuilda automáticamente.
   - Si tocaste `nginx/**`, el job de deploy también recarga nginx.

### Flujo diario

Edita MDX → push → Mintlify regenera en ~1-2 min. Sin pasos manuales.

### Validación local

```bash
npx mint dev          # preview
npx mint broken-links # mismo check que CI
```
