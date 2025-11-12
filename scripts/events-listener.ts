import 'dotenv/config';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import { CanonicalEvent } from '@/lib/events/handlers';
import { createEventProcessor } from '@/lib/events/processEvent';

function bootstrapFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error('Define FIREBASE_SERVICE_ACCOUNT_KEY con las credenciales del servicio.');
  }

  const parsed = JSON.parse(raw);
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key.replace(/\\n/g, '\n'),
    }),
  });
}

const app = bootstrapFirebase();
const db = app.firestore();
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const notifyEmailTo = process.env.NOTIFY_EMAIL_TO;

let mailer: nodemailer.Transporter | null = null;
if (process.env.SMTP_HOST) {
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
}

async function notifySlack(text: string) {
  if (!slackWebhookUrl) {
    return;
  }
  try {
    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      console.warn('[Slack] Error enviando webhook', await response.text());
    }
  } catch (error) {
    console.warn('[Slack] No se pudo enviar el mensaje', error);
  }
}

async function notifyEmail(subject: string, text: string) {
  if (!mailer || !notifyEmailTo) {
    return;
  }
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: notifyEmailTo,
      subject,
      text,
    });
  } catch (error) {
    console.warn('[Email] No se pudo enviar el correo', error);
  }
}
const processEvent = createEventProcessor({
  db,
  notifySlack,
  notifyEmail,
});

async function main() {
  const since = Date.now() - 5 * 60 * 1000;

  console.log('[EventBus] Escuchando eventos nuevos...');

  db.collection('events')
    .where('timestamp', '>=', since)
    .orderBy('timestamp', 'asc')
    .onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type !== 'added') return;
          const data = change.doc.data() as Omit<CanonicalEvent, 'id'>;
          void processEvent({ id: change.doc.id, ...data });
        });
      },
      (error) => {
        console.error('[EventBus] Listener error', error);
        process.exitCode = 1;
      }
    );
}

void main().catch((error) => {
  console.error('[EventBus] Fatal error', error);
  process.exitCode = 1;
});
