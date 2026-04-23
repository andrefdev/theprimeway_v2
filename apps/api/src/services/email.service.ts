/**
 * Email Service — SMTP sender via nodemailer
 *
 * Templates:
 * - otp-verify  (registration email verification)
 * - otp-reset   (password reset)
 * - welcome     (post-verification greeting)
 */
import nodemailer, { type Transporter } from 'nodemailer'

const BRAND = 'The Prime Way'
const APP_URL = process.env.APP_URL || 'https://theprimeway.app'

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('SMTP not configured: SMTP_HOST/SMTP_USER/SMTP_PASS missing')
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  return transporter
}

function baseLayout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0b0b0f;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#e7e7ea;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#15151b;border:1px solid #26262f;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 16px 32px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
            <div style="width:40px;height:40px;border-radius:10px;background:#6366f1;color:#fff;font-weight:700;font-size:20px;line-height:40px;text-align:center;">P</div>
            <div style="font-weight:600;font-size:18px;color:#fff;">${BRAND}</div>
          </div>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 32px 32px 32px;border-top:1px solid #26262f;color:#8a8a95;font-size:12px;">
          Enviado por ${BRAND} — <a href="${APP_URL}" style="color:#a5a5b0;">${APP_URL}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function otpBlock(code: string): string {
  return `<div style="margin:24px 0;padding:24px;background:#0b0b0f;border:1px dashed #3a3a45;border-radius:12px;text-align:center;">
    <div style="font-size:12px;letter-spacing:2px;color:#8a8a95;text-transform:uppercase;margin-bottom:8px;">Tu código</div>
    <div style="font-size:36px;font-weight:700;letter-spacing:10px;color:#fff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${code}</div>
  </div>`
}

function otpVerifyTemplate(code: string) {
  const html = baseLayout(
    'Verifica tu correo',
    `<h1 style="font-size:22px;color:#fff;margin:0 0 8px 0;">Verifica tu correo</h1>
     <p style="color:#b0b0b8;line-height:1.5;margin:0 0 8px 0;">Usa el siguiente código para terminar tu registro en ${BRAND}. Expira en 10 minutos.</p>
     ${otpBlock(code)}
     <p style="color:#8a8a95;font-size:13px;">Si no creaste esta cuenta, ignora este mensaje.</p>`,
  )
  return {
    subject: `Tu código de verificación: ${code}`,
    html,
    text: `Tu código de verificación para ${BRAND} es: ${code}. Expira en 10 minutos.`,
  }
}

function otpResetTemplate(code: string) {
  const html = baseLayout(
    'Restablecer contraseña',
    `<h1 style="font-size:22px;color:#fff;margin:0 0 8px 0;">Restablecer contraseña</h1>
     <p style="color:#b0b0b8;line-height:1.5;margin:0 0 8px 0;">Usa este código para restablecer tu contraseña. Expira en 10 minutos.</p>
     ${otpBlock(code)}
     <p style="color:#8a8a95;font-size:13px;">Si no solicitaste este cambio, ignora este mensaje y tu contraseña seguirá siendo la misma.</p>`,
  )
  return {
    subject: `Código para restablecer tu contraseña: ${code}`,
    html,
    text: `Tu código para restablecer la contraseña en ${BRAND} es: ${code}. Expira en 10 minutos.`,
  }
}

function welcomeTemplate(name: string | null) {
  const greet = name ? `¡Hola, ${name}!` : '¡Bienvenido!'
  const html = baseLayout(
    `Bienvenido a ${BRAND}`,
    `<h1 style="font-size:22px;color:#fff;margin:0 0 8px 0;">${greet}</h1>
     <p style="color:#b0b0b8;line-height:1.5;margin:0 0 16px 0;">Tu cuenta en ${BRAND} ya está lista. Empieza a construir tu mejor versión — hábitos, metas, finanzas, todo en un solo lugar.</p>
     <a href="${APP_URL}" style="display:inline-block;padding:12px 20px;background:#6366f1;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Abrir la app</a>
     <p style="color:#8a8a95;font-size:13px;margin-top:24px;">Gracias por unirte.</p>`,
  )
  return {
    subject: `Bienvenido a ${BRAND}`,
    html,
    text: `${greet} Tu cuenta en ${BRAND} ya está lista. Entra en ${APP_URL}`,
  }
}

async function send(to: string, subject: string, html: string, text: string) {
  const from = process.env.SMTP_FROM || `${BRAND} <noreply@theprimeway.app>`
  const t = getTransporter()
  await t.sendMail({ from, to, subject, html, text })
}

export const emailService = {
  async sendRegisterOtp(to: string, code: string) {
    const tpl = otpVerifyTemplate(code)
    await send(to, tpl.subject, tpl.html, tpl.text)
  },

  async sendResetOtp(to: string, code: string) {
    const tpl = otpResetTemplate(code)
    await send(to, tpl.subject, tpl.html, tpl.text)
  },

  async sendWelcome(to: string, name: string | null) {
    const tpl = welcomeTemplate(name)
    await send(to, tpl.subject, tpl.html, tpl.text)
  },
}
