import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .optional()
  .or(z.literal(""));

const phoneField = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, "Use a valid international phone number.")
  .optional()
  .or(z.literal(""));

export const createPingSchema = z
  .object({
    recipientName: z
      .string()
      .trim()
      .min(2, "Add the recipient's name.")
      .max(80, "Keep the name under 80 characters."),
    recipientEmail: emailField,
    recipientPhone: phoneField,
    taskDescription: z
      .string()
      .trim()
      .min(10, "Describe the task clearly.")
      .max(500, "Keep the task under 500 characters."),
    dueDate: z
      .string()
      .min(1, "Choose a deadline.")
      .refine((value) => !Number.isNaN(Date.parse(value)), "Choose a valid date and time.")
      .refine((value) => new Date(value).getTime() > Date.now(), "Deadline must be in the future."),
    notificationChannels: z.enum(["email", "sms", "both"])
  })
  .superRefine((value, ctx) => {
    if (value.notificationChannels === "email" || value.notificationChannels === "both") {
      if (!value.recipientEmail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipientEmail"],
          message: "Email is required for email notifications."
        });
      }
    }

    if (value.notificationChannels === "sms" || value.notificationChannels === "both") {
      if (!value.recipientPhone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipientPhone"],
          message: "Phone number is required for SMS notifications."
        });
      }
    }
  });
