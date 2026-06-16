import { format } from "date-fns";
import { Resend } from "resend";
import twilio from "twilio";

import { getAppUrl, getOptionalEnv } from "@/lib/env";
import type {
  DirectChannel,
  NotificationResult,
  NotificationVariant,
  PingRecord
} from "@/lib/types";

type RecipientNotificationPayload = {
  ping: PingRecord;
  variant: NotificationVariant;
};

type CreatorAlertPayload = {
  ping: PingRecord;
  creatorEmail?: string;
};

const recipientVariantLabels: Record<NotificationVariant, string> = {
  initial: "Initial ping",
  manual_nudge: "Manual nudge",
  reminder_24h: "24-hour reminder",
  deadline_day: "Deadline day reminder",
  overdue_recipient: "Overdue follow-up"
};

function getRecipientUrl(publicToken: string) {
  return `${getAppUrl()}/r/${publicToken}`;
}

function getRecipientSubject(payload: RecipientNotificationPayload) {
  const taskSnippet = payload.ping.task_description.slice(0, 52);
  const prefix = {
    initial: "New Ping",
    manual_nudge: "Gentle Ping Reminder",
    reminder_24h: "Ping Reminder: due in 24 hours",
    deadline_day: "Ping Reminder: due today",
    overdue_recipient: "Ping Reminder: deadline has passed"
  }[payload.variant];

  return `${prefix} · ${taskSnippet}`;
}

function getRecipientIntro(variant: NotificationVariant) {
  switch (variant) {
    case "initial":
      return "You have a new task request waiting for you.";
    case "manual_nudge":
      return "This is a personal follow-up on an open task.";
    case "reminder_24h":
      return "Just a heads-up: this deadline is about 24 hours away.";
    case "deadline_day":
      return "Quick reminder: this task is due today.";
    case "overdue_recipient":
      return "This task is now past its deadline and still needs attention.";
  }
}

function buildRecipientEmail(payload: RecipientNotificationPayload) {
  const actionUrl = getRecipientUrl(payload.ping.public_token);
  const due = format(new Date(payload.ping.due_date), "EEEE, MMMM d 'at' p");
  const intro = getRecipientIntro(payload.variant);
  const subject = getRecipientSubject(payload);
  const text = [
    intro,
    "",
    `Task: ${payload.ping.task_description}`,
    `Deadline: ${due}`,
    "",
    `Open your Ping: ${actionUrl}`
  ].join("\n");
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; background:#07111F; color:#F5F8FF; padding:32px;">
      <div style="max-width:620px; margin:0 auto; background:#0C1B31; border:1px solid rgba(160,191,255,0.14); border-radius:20px; padding:32px;">
        <div style="letter-spacing:0.08em; text-transform:uppercase; color:#6FA1FF; font-size:12px; margin-bottom:12px;">Ping</div>
        <h1 style="font-size:28px; margin:0 0 12px;">${intro}</h1>
        <p style="font-size:16px; line-height:1.65; color:#D6E1FF; margin:0 0 20px;">
          ${payload.ping.recipient_name}, here’s the task that still needs your attention.
        </p>
        <div style="background:#07111F; border:1px solid rgba(160,191,255,0.12); border-radius:18px; padding:20px; margin-bottom:24px;">
          <p style="margin:0 0 10px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#93A6C7;">Task</p>
          <p style="margin:0 0 16px; font-size:18px; line-height:1.6;">${payload.ping.task_description}</p>
          <p style="margin:0; font-size:14px; color:#93A6C7;">Deadline: ${due}</p>
        </div>
        <a href="${actionUrl}" style="display:inline-block; background:#2E6BFF; color:white; text-decoration:none; padding:14px 20px; border-radius:12px; font-weight:600;">View this Ping</a>
      </div>
    </div>
  `;

  return { subject, text, html };
}

function buildRecipientSms(payload: RecipientNotificationPayload) {
  const actionUrl = getRecipientUrl(payload.ping.public_token);
  const due = format(new Date(payload.ping.due_date), "MMM d, p");
  const label = recipientVariantLabels[payload.variant];

  return `${label}: ${payload.ping.task_description} (due ${due}). Update status here: ${actionUrl}`;
}

function buildCreatorAlert(payload: CreatorAlertPayload) {
  const due = format(new Date(payload.ping.due_date), "EEEE, MMMM d 'at' p");
  const subject = `Ping overdue · ${payload.ping.recipient_name}`;
  const text = [
    `Your Ping for ${payload.ping.recipient_name} is overdue.`,
    "",
    `Task: ${payload.ping.task_description}`,
    `Deadline: ${due}`,
    "",
    `Review it in Ping: ${getAppUrl()}/pings/${payload.ping.id}`
  ].join("\n");
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; background:#07111F; color:#F5F8FF; padding:32px;">
      <div style="max-width:620px; margin:0 auto; background:#0C1B31; border:1px solid rgba(160,191,255,0.14); border-radius:20px; padding:32px;">
        <div style="letter-spacing:0.08em; text-transform:uppercase; color:#6FA1FF; font-size:12px; margin-bottom:12px;">Ping</div>
        <h1 style="font-size:28px; margin:0 0 12px;">This Ping is now overdue.</h1>
        <p style="font-size:16px; line-height:1.65; color:#D6E1FF; margin:0 0 20px;">
          ${payload.ping.recipient_name} has not resolved the task yet.
        </p>
        <div style="background:#07111F; border:1px solid rgba(160,191,255,0.12); border-radius:18px; padding:20px; margin-bottom:24px;">
          <p style="margin:0 0 10px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#93A6C7;">Task</p>
          <p style="margin:0 0 16px; font-size:18px; line-height:1.6;">${payload.ping.task_description}</p>
          <p style="margin:0; font-size:14px; color:#93A6C7;">Deadline: ${due}</p>
        </div>
        <a href="${getAppUrl()}/pings/${payload.ping.id}" style="display:inline-block; background:#2E6BFF; color:white; text-decoration:none; padding:14px 20px; border-radius:12px; font-weight:600;">Open this Ping</a>
      </div>
    </div>
  `;

  return { subject, text, html };
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const apiKey = getOptionalEnv("RESEND_API_KEY");
  const from = getOptionalEnv("RESEND_FROM_EMAIL");

  if (!apiKey || !from) {
    return {
      ok: false,
      error: "Resend is not configured."
    } as const;
  }

  try {
    const client = new Resend(apiKey);
    const response = await client.emails.send({
      from,
      to,
      subject,
      html,
      text
    });

    return {
      ok: true,
      providerMessageId: response.data?.id
    } as const;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Email delivery failed."
    } as const;
  }
}

async function sendSms(to: string, body: string) {
  const accountSid = getOptionalEnv("TWILIO_ACCOUNT_SID");
  const authToken = getOptionalEnv("TWILIO_AUTH_TOKEN");
  const from = getOptionalEnv("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !from) {
    return {
      ok: false,
      error: "Twilio is not configured."
    } as const;
  }

  try {
    const client = twilio(accountSid, authToken);
    const response = await client.messages.create({
      from,
      to,
      body
    });

    return {
      ok: true,
      providerMessageId: response.sid
    } as const;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "SMS delivery failed."
    } as const;
  }
}

export async function sendRecipientNotifications(
  payload: RecipientNotificationPayload
): Promise<NotificationResult[]> {
  const channels: DirectChannel[] =
    payload.ping.notification_channels === "both"
      ? ["email", "sms"]
      : [payload.ping.notification_channels];
  const results: NotificationResult[] = [];
  const email = buildRecipientEmail(payload);
  const sms = buildRecipientSms(payload);

  for (const channel of channels) {
    if (channel === "email") {
      const recipient = payload.ping.recipient_email;

      if (!recipient) {
        results.push({
          ok: false,
          channel,
          message: email.text,
          error: "Recipient email is missing."
        });
        continue;
      }

      const response = await sendEmail(recipient, email.subject, email.html, email.text);
      results.push({
        ok: response.ok,
        channel,
        message: email.text,
        providerMessageId: response.ok ? response.providerMessageId : undefined,
        error: response.ok ? undefined : response.error
      });
    }

    if (channel === "sms") {
      const recipient = payload.ping.recipient_phone;

      if (!recipient) {
        results.push({
          ok: false,
          channel,
          message: sms,
          error: "Recipient phone number is missing."
        });
        continue;
      }

      const response = await sendSms(recipient, sms);
      results.push({
        ok: response.ok,
        channel,
        message: sms,
        providerMessageId: response.ok ? response.providerMessageId : undefined,
        error: response.ok ? undefined : response.error
      });
    }
  }

  return results;
}

export async function sendCreatorOverdueAlert(
  payload: CreatorAlertPayload
): Promise<NotificationResult> {
  const content = buildCreatorAlert(payload);

  if (!payload.creatorEmail) {
    return {
      ok: false,
      channel: "email",
      message: content.text,
      error: "Creator email is unavailable."
    };
  }

  const response = await sendEmail(
    payload.creatorEmail,
    content.subject,
    content.html,
    content.text
  );

  return {
    ok: response.ok,
    channel: "email",
    message: content.text,
    providerMessageId: response.ok ? response.providerMessageId : undefined,
    error: response.ok ? undefined : response.error
  };
}
