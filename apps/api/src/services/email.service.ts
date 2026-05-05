/**
 * Email Service — SMTP sender via nodemailer
 *
 * Templates:
 * - otp-verify  (registration email verification)
 * - otp-reset   (password reset)
 * - welcome     (post-verification greeting)
 */
import nodemailer, { type Transporter } from 'nodemailer'
import { LOGO_PNG } from '../assets/logo'

const BRAND = 'The Prime Way'
const APP_URL = process.env.APP_URL || 'https://theprimeway.app'
const LOGO_CID = 'theprimeway-logo'

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
<body style="margin:0;padding:0;background:#f5f6f8;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 16px 32px;">
          <div style="margin-bottom:24px;">
            <a href="${APP_URL}" style="text-decoration:none;">
              <img src="cid:${LOGO_CID}" alt="${BRAND}" height="40" style="display:block;height:40px;width:auto;border:0;outline:none;text-decoration:none;" />
            </a>
          </div>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 32px 32px 32px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
          Enviado por ${BRAND} — <a href="${APP_URL}" style="color:#4f46e5;">${APP_URL}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function otpBlock(code: string): string {
  return `<div style="margin:24px 0;padding:24px;background:#f5f6f8;border:1px dashed #c4c4cf;border-radius:12px;text-align:center;">
    <div style="font-size:12px;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:8px;">Tu código</div>
    <div style="font-size:36px;font-weight:700;letter-spacing:10px;color:#1a1a1f;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${code}</div>
  </div>`
}

function otpVerifyTemplate(code: string) {
  const html = baseLayout(
    'Verifica tu correo',
    `<h1 style="font-size:22px;color:#1a1a1f;margin:0 0 8px 0;">Verifica tu correo</h1>
     <p style="color:#374151;line-height:1.5;margin:0 0 8px 0;">Usa el siguiente código para terminar tu registro en ${BRAND}. Expira en 10 minutos.</p>
     ${otpBlock(code)}
     <p style="color:#6b7280;font-size:13px;">Si no creaste esta cuenta, ignora este mensaje.</p>`,
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
    `<h1 style="font-size:22px;color:#1a1a1f;margin:0 0 8px 0;">Restablecer contraseña</h1>
     <p style="color:#374151;line-height:1.5;margin:0 0 8px 0;">Usa este código para restablecer tu contraseña. Expira en 10 minutos.</p>
     ${otpBlock(code)}
     <p style="color:#6b7280;font-size:13px;">Si no solicitaste este cambio, ignora este mensaje y tu contraseña seguirá siendo la misma.</p>`,
  )
  return {
    subject: `Código para restablecer tu contraseña: ${code}`,
    html,
    text: `Tu código para restablecer la contraseña en ${BRAND} es: ${code}. Expira en 10 minutos.`,
  }
}

function otpDeleteAccountTemplate(code: string) {
  const html = baseLayout(
    'Confirma la eliminación de tu cuenta',
    `<h1 style="font-size:22px;color:#b91c1c;margin:0 0 8px 0;">Confirma la eliminación de tu cuenta</h1>
     <p style="color:#374151;line-height:1.5;margin:0 0 8px 0;">Recibimos una solicitud para eliminar permanentemente tu cuenta en ${BRAND}. Esta acción es <strong>irreversible</strong>: perderás todos tus datos, hábitos, tareas, calendarios e historial.</p>
     <p style="color:#374151;line-height:1.5;margin:0 0 8px 0;">Si fuiste tú, ingresa este código en la app para confirmar. Expira en 10 minutos.</p>
     ${otpBlock(code)}
     <div style="margin:16px 0;padding:16px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:8px;">
       <div style="color:#7f1d1d;line-height:1.5;font-size:13px;"><strong>¿No fuiste tú?</strong> Ignora este correo y considera cambiar tu contraseña. Tu cuenta y datos siguen intactos hasta que se confirme con este código.</div>
     </div>
     <p style="color:#6b7280;font-size:13px;">Si tienes dudas o quieres pausar tu cuenta en lugar de borrarla, responde a este correo y te ayudamos.</p>`,
  )
  return {
    subject: `Confirma la eliminación de tu cuenta de ${BRAND}`,
    html,
    text: `Recibimos una solicitud para eliminar tu cuenta en ${BRAND}. Tu código es: ${code}. Expira en 10 minutos. Si no fuiste tú, ignora este mensaje.`,
  }
}

function welcomeTemplate(name: string | null) {
  const greet = name ? `¡Hola, ${name}!` : '¡Bienvenido!'
  const html = baseLayout(
    `Bienvenido a ${BRAND}`,
    `<h1 style="font-size:22px;color:#1a1a1f;margin:0 0 8px 0;">${greet}</h1>
     <p style="color:#374151;line-height:1.5;margin:0 0 16px 0;">Tu cuenta en ${BRAND} ya está lista. Empieza a construir tu mejor versión — hábitos, metas, finanzas, todo en un solo lugar.</p>
     <a href="${APP_URL}" style="display:inline-block;padding:12px 20px;background:#6366f1;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Abrir la app</a>
     <p style="color:#6b7280;font-size:13px;margin-top:24px;">Gracias por unirte.</p>`,
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
  await t.sendMail({
    from,
    to,
    subject,
    html,
    text,
    attachments: [
      {
        filename: 'logo.png',
        content: LOGO_PNG,
        cid: LOGO_CID,
        contentType: 'image/png',
      },
    ],
  })
}

function ambassadorApprovedTemplate(name: string | null, code: string, tierName: string, commissionPct: number) {
  const greet = name ? `¡Felicitaciones, ${name}!` : '¡Felicitaciones!'
  const link = `${APP_URL}/?ref=${code}`
  const html = baseLayout(
    `Bienvenido al Programa de Embajadores de ${BRAND}`,
    `<h1 style="font-size:22px;color:#1a1a1f;margin:0 0 8px 0;">${greet}</h1>
     <p style="color:#374151;line-height:1.5;margin:0 0 16px 0;">Tu solicitud para ser embajador de <strong>${BRAND}</strong> ha sido <strong>aprobada</strong>. Ahora eres parte de un grupo selecto de creadores que comparten nuestra misión.</p>
     <div style="margin:24px 0;padding:24px;background:#f5f6f8;border:1px solid #e5e7eb;border-radius:12px;text-align:center;">
       <div style="font-size:12px;letter-spacing:2px;color:#6b7280;text-transform:uppercase;margin-bottom:8px;">Tu código de referido</div>
       <div style="font-size:32px;font-weight:700;letter-spacing:4px;color:#4f46e5;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${code}</div>
       <div style="margin-top:12px;font-size:13px;color:#6b7280;">Link: <a href="${link}" style="color:#4f46e5;">${link}</a></div>
     </div>
     <h2 style="font-size:16px;color:#1a1a1f;margin:24px 0 8px 0;">Tu tier inicial: ${tierName}</h2>
     <ul style="color:#374151;line-height:1.7;padding-left:20px;margin:0 0 16px 0;">
       <li><strong>${commissionPct}% de comisión recurrente</strong> sobre cada usuario referido que pague suscripción</li>
       <li>Mientras más referidos pagos atraigas, subes de tier y aumenta tu %</li>
       <li>Pagos mensuales según tu método preferido (lo configuras en tu dashboard)</li>
     </ul>
     <a href="${APP_URL}/ambassador" style="display:inline-block;padding:12px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;margin-top:8px;">Abrir tu dashboard</a>
     <p style="color:#6b7280;font-size:13px;margin-top:24px;">Si tienes preguntas, responde a este correo. Estamos para apoyarte.</p>`,
  )
  return {
    subject: `🎉 Eres embajador oficial de ${BRAND}`,
    html,
    text: `${greet} Tu solicitud fue aprobada. Tu código: ${code}. Link: ${link}. Comisión: ${commissionPct}% recurrente. Dashboard: ${APP_URL}/ambassador`,
  }
}

function ambassadorRejectedTemplate(name: string | null, reason: string) {
  const greet = name ? `Hola, ${name}` : 'Hola'
  const html = baseLayout(
    `Sobre tu solicitud de embajador`,
    `<h1 style="font-size:22px;color:#1a1a1f;margin:0 0 8px 0;">${greet}</h1>
     <p style="color:#374151;line-height:1.5;margin:0 0 16px 0;">Gracias por tu interés en el programa de embajadores de ${BRAND}. Después de revisar tu solicitud, no podremos avanzar contigo en este momento.</p>
     <div style="margin:16px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;">
       <div style="font-size:13px;color:#78350f;font-weight:600;margin-bottom:4px;">Motivo:</div>
       <div style="color:#78350f;line-height:1.5;">${reason}</div>
     </div>
     <p style="color:#374151;line-height:1.5;margin:16px 0;">Esto no es definitivo. Podrás reaplicar en 30 días si tu situación cambia.</p>
     <p style="color:#6b7280;font-size:13px;margin-top:24px;">Gracias por usar ${BRAND}.</p>`,
  )
  return {
    subject: `Sobre tu solicitud de embajador`,
    html,
    text: `${greet}, tu solicitud no fue aprobada. Motivo: ${reason}. Podrás reaplicar en 30 días.`,
  }
}

function ambassadorTierUpTemplate(name: string | null, tierName: string, commissionPct: number, perks: string[]) {
  const greet = name ? `¡${name}!` : '¡Felicitaciones!'
  const perksList = perks.map((p) => `<li>${p}</li>`).join('')
  const html = baseLayout(
    `¡Subiste a ${tierName}!`,
    `<h1 style="font-size:24px;color:#1a1a1f;margin:0 0 8px 0;">${greet} 🚀</h1>
     <p style="color:#374151;line-height:1.5;margin:0 0 16px 0;">Has alcanzado el tier <strong>${tierName}</strong> en el programa de embajadores. Tu comisión recurrente sube a <strong>${commissionPct}%</strong>.</p>
     <h2 style="font-size:16px;margin:16px 0 8px 0;">Lo que desbloqueas:</h2>
     <ul style="color:#374151;line-height:1.7;padding-left:20px;">${perksList}</ul>
     <a href="${APP_URL}/ambassador" style="display:inline-block;padding:12px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;margin-top:16px;">Ver dashboard</a>`,
  )
  return {
    subject: `🚀 Subiste a ${tierName} — comisión ${commissionPct}%`,
    html,
    text: `${greet} Subiste a ${tierName}. Comisión ${commissionPct}%. Dashboard: ${APP_URL}/ambassador`,
  }
}

function ambassadorPayoutTemplate(name: string | null, amountCents: number, method: string, ref: string | null) {
  const amount = (amountCents / 100).toFixed(2)
  const greet = name ? `¡Hola, ${name}!` : '¡Hola!'
  const html = baseLayout(
    `Pago enviado`,
    `<h1 style="font-size:22px;color:#1a1a1f;margin:0 0 8px 0;">${greet}</h1>
     <p style="color:#374151;line-height:1.5;margin:0 0 16px 0;">Acabamos de enviarte un pago por tus comisiones de embajador.</p>
     <div style="margin:24px 0;padding:24px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;">
       <div style="font-size:12px;color:#065f46;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Monto</div>
       <div style="font-size:36px;font-weight:700;color:#047857;">$${amount} USD</div>
       <div style="margin-top:12px;font-size:14px;color:#065f46;">Método: <strong>${method}</strong></div>
       ${ref ? `<div style="font-size:13px;color:#065f46;">Referencia: ${ref}</div>` : ''}
     </div>
     <p style="color:#6b7280;font-size:13px;">Gracias por ayudarnos a crecer.</p>`,
  )
  return {
    subject: `💰 Pago enviado: $${amount} USD`,
    html,
    text: `${greet} Te enviamos $${amount} USD vía ${method}.${ref ? ` Ref: ${ref}` : ''}`,
  }
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

  async sendDeleteAccountOtp(to: string, code: string) {
    const tpl = otpDeleteAccountTemplate(code)
    await send(to, tpl.subject, tpl.html, tpl.text)
  },

  async sendWelcome(to: string, name: string | null) {
    const tpl = welcomeTemplate(name)
    await send(to, tpl.subject, tpl.html, tpl.text)
  },

  async sendAmbassadorApproved(to: string, name: string | null, code: string, tierName: string, commissionPct: number) {
    const tpl = ambassadorApprovedTemplate(name, code, tierName, commissionPct)
    await send(to, tpl.subject, tpl.html, tpl.text)
  },

  async sendAmbassadorRejected(to: string, name: string | null, reason: string) {
    const tpl = ambassadorRejectedTemplate(name, reason)
    await send(to, tpl.subject, tpl.html, tpl.text)
  },

  async sendAmbassadorTierUp(to: string, name: string | null, tierName: string, commissionPct: number, perks: string[]) {
    const tpl = ambassadorTierUpTemplate(name, tierName, commissionPct, perks)
    await send(to, tpl.subject, tpl.html, tpl.text)
  },

  async sendAmbassadorPayout(to: string, name: string | null, amountCents: number, method: string, ref: string | null) {
    const tpl = ambassadorPayoutTemplate(name, amountCents, method, ref)
    await send(to, tpl.subject, tpl.html, tpl.text)
  },
}
