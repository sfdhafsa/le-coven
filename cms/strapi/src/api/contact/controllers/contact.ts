const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

const requestsByIp = new Map<string, number[]>();

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const recent = (requestsByIp.get(ip) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestsByIp.set(ip, recent);
    return true;
  }

  recent.push(now);
  requestsByIp.set(ip, recent);
  return false;
};

export default {
  async send(ctx: any) {
    const body = ctx.request.body ?? {};
    const name = text(body.name);
    const email = text(body.email).toLowerCase();
    const message = text(body.message);
    const website = text(body.website);

    // Honeypot: bots often fill every field. Return success without sending.
    if (website) {
      ctx.body = { ok: true };
      return;
    }

    if (isRateLimited(ctx.request.ip || ctx.ip || 'unknown')) {
      ctx.status = 429;
      ctx.body = { error: 'Trop de messages envoyés. Merci de réessayer dans quelques minutes.' };
      return;
    }

    if (!name || name.length > 100 || !EMAIL_PATTERN.test(email) || email.length > 254) {
      ctx.status = 400;
      ctx.body = { error: 'Le nom ou l’adresse e-mail est invalide.' };
      return;
    }

    if (message.length < 10 || message.length > 5000) {
      ctx.status = 400;
      ctx.body = { error: 'Le message doit contenir entre 10 et 5 000 caractères.' };
      return;
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.CONTACT_FROM_EMAIL;
    const senderName = process.env.CONTACT_FROM_NAME || 'Site Le Coven';
    const recipientEmail = process.env.CONTACT_TO_EMAIL || 'lecoven@etik.com';

    if (!apiKey || !senderEmail) {
      strapi.log.error('Contact form: BREVO_API_KEY or CONTACT_FROM_EMAIL is missing.');
      ctx.status = 503;
      ctx.body = { error: 'Le formulaire est momentanément indisponible.' };
      return;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ name: 'Le Coven', email: recipientEmail }],
          replyTo: { name, email },
          subject: `[Site Le Coven] Message de ${name}`,
          textContent: `Nom : ${name}\nE-mail : ${email}\n\n${message}`,
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        strapi.log.error(`Contact form: Brevo returned ${response.status}: ${details}`);
        ctx.status = 502;
        ctx.body = { error: 'Le message n’a pas pu être envoyé. Merci de réessayer.' };
        return;
      }

      ctx.body = { ok: true };
    } catch (error) {
      strapi.log.error('Contact form: unable to reach Brevo.', error);
      ctx.status = 502;
      ctx.body = { error: 'Le message n’a pas pu être envoyé. Merci de réessayer.' };
    }
  },
};
