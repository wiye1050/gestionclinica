import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import type { CanonicalEvent } from '../../lib/events/handlers';
import { createEventProcessor } from '../../lib/events/processEvent';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
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
  if (!slackWebhookUrl) return;
  try {
    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      logger.warn('[Slack] Error enviando webhook', await response.text());
    }
  } catch (error) {
    logger.warn('[Slack] No se pudo enviar el mensaje', error);
  }
}

async function notifyEmail(subject: string, text: string) {
  if (!mailer || !notifyEmailTo) return;
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: notifyEmailTo,
      subject,
      text,
    });
  } catch (error) {
    logger.warn('[Email] No se pudo enviar el correo', error);
  }
}

const processEvent = createEventProcessor({
  db,
  notifySlack,
  notifyEmail,
});

export const automateEvents = onDocumentCreated(
  {
    document: 'events/{eventId}',
    region: 'europe-west1',
    timeoutSeconds: 60,
    memory: '256MiB',
    concurrency: 10,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn('[EventBus] Trigger sin snapshot', event.params);
      return;
    }
    const payload = snapshot.data() as Omit<CanonicalEvent, 'id'>;
    logger.info('[EventBus] Procesando evento', { id: event.params.eventId, type: payload.type });
    await processEvent({
      id: event.params.eventId,
      ...payload,
    });
  }
);
