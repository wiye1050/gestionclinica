import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import { config as functionsConfig } from 'firebase-functions';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import type { CanonicalEvent } from '../../lib/events/handlers';
import { createEventProcessor } from '../../lib/events/processEvent';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const runtimeConfig = functionsConfig();
const automationsConfig = runtimeConfig?.automations ?? {};

const slackWebhookUrl =
  process.env.SLACK_WEBHOOK_URL ?? automationsConfig.slack_webhook_url ?? '';
const notifyEmailTo =
  process.env.NOTIFY_EMAIL_TO ?? automationsConfig.notify_email_to ?? '';
const smtpHost = process.env.SMTP_HOST ?? automationsConfig.smtp_host;
const smtpPort = process.env.SMTP_PORT ?? automationsConfig.smtp_port;
const smtpSecure = process.env.SMTP_SECURE ?? automationsConfig.smtp_secure;
const smtpUser = process.env.SMTP_USER ?? automationsConfig.smtp_user;
const smtpPass = process.env.SMTP_PASS ?? automationsConfig.smtp_pass;
const smtpFrom =
  process.env.SMTP_FROM ?? automationsConfig.smtp_from ?? smtpUser;

let mailer: nodemailer.Transporter | null = null;
if (smtpHost) {
  mailer = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort ?? 587),
    secure:
      (typeof smtpSecure === 'string' && smtpSecure === 'true') ||
      Number(smtpPort) === 465,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
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
      from: smtpFrom ?? smtpUser,
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
