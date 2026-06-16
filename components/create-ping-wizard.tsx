"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Loader2, Mail, MessageSquare, User2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createPingSchema } from "@/lib/validators";

type WizardValues = {
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  taskDescription: string;
  dueDate: string;
  notificationChannels: "email" | "sms" | "both";
};

const steps = [
  "Who is this for?",
  "What needs to happen?",
  "How should Ping notify them?",
  "Confirm the details"
] as const;

const initialValues: WizardValues = {
  recipientName: "",
  recipientEmail: "",
  recipientPhone: "",
  taskDescription: "",
  dueDate: "",
  notificationChannels: "both"
};

export function CreatePingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<WizardValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stepProgress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  function setValue<K extends keyof WizardValues>(key: K, value: WizardValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function validateCurrentStep() {
    const parsed = createPingSchema.safeParse(values);

    if (step === 0) {
      const nextErrors: Record<string, string> = {};

      if (!values.recipientName.trim()) {
        nextErrors.recipientName = "Add the recipient's name.";
      }
      if (
        (values.notificationChannels === "email" || values.notificationChannels === "both") &&
        !values.recipientEmail.trim()
      ) {
        nextErrors.recipientEmail = "Add an email or switch the channel.";
      }
      if (
        (values.notificationChannels === "sms" || values.notificationChannels === "both") &&
        !values.recipientPhone.trim()
      ) {
        nextErrors.recipientPhone = "Add a phone number or switch the channel.";
      }

      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        return false;
      }
    }

    if (step === 1) {
      const nextErrors: Record<string, string> = {};

      if (!values.taskDescription.trim()) {
        nextErrors.taskDescription = "Describe the task clearly.";
      }
      if (!values.dueDate) {
        nextErrors.dueDate = "Choose a deadline.";
      }

      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        return false;
      }
    }

    if (step === 2 && !values.notificationChannels) {
      setErrors({ notificationChannels: "Choose at least one notification channel." });
      return false;
    }

    if (!parsed.success && step === steps.length - 1) {
      const nextErrors = Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).flatMap(([key, value]) =>
          value && value[0] ? [[key, value[0]]] : []
        )
      );
      setErrors(nextErrors);
      return false;
    }

    return true;
  }

  function nextStep() {
    if (!validateCurrentStep()) {
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 0));
  }

  function submitPing() {
    const parsed = createPingSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors = Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).flatMap(([key, value]) =>
          value && value[0] ? [[key, value[0]]] : []
        )
      );
      setErrors(nextErrors);
      return;
    }

    setSubmitError(null);
    startTransition(async () => {
      const response = await fetch("/api/pings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsed.data)
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setSubmitError(data?.error ?? "We couldn't create the Ping. Please try again.");
        return;
      }

      const data = (await response.json()) as { id: string };
      router.push(`/pings/${data.id}?created=1`);
    });
  }

  return (
    <div className="glass-panel rounded-[32px] p-6 sm:p-8">
      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-electricSoft">Create a Ping</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">
              {steps[step]}
            </h1>
          </div>
          <p className="text-sm text-muted">
            Step {step + 1} of {steps.length}
          </p>
        </div>

        <div className="h-2 rounded-full bg-white/8">
          <div
            className="h-2 rounded-full bg-electric transition-all duration-300"
            style={{ width: `${stepProgress}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="space-y-5"
          exit={{ opacity: 0, x: -12 }}
          initial={{ opacity: 0, x: 12 }}
          key={step}
          transition={{ duration: 0.2 }}
        >
          {step === 0 ? (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-text">Recipient name</span>
                <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.03] px-4">
                  <User2 className="h-4 w-4 text-muted" />
                  <input
                    className="w-full bg-transparent px-3 py-4 outline-none placeholder:text-muted"
                    onChange={(event) => setValue("recipientName", event.target.value)}
                    placeholder="Ada Lovelace"
                    value={values.recipientName}
                  />
                </div>
                {errors.recipientName ? (
                  <p className="text-sm text-danger">{errors.recipientName}</p>
                ) : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-text">Email address</span>
                <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.03] px-4">
                  <Mail className="h-4 w-4 text-muted" />
                  <input
                    className="w-full bg-transparent px-3 py-4 outline-none placeholder:text-muted"
                    onChange={(event) => setValue("recipientEmail", event.target.value)}
                    placeholder="ada@example.com"
                    type="email"
                    value={values.recipientEmail}
                  />
                </div>
                {errors.recipientEmail ? (
                  <p className="text-sm text-danger">{errors.recipientEmail}</p>
                ) : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-text">Phone number</span>
                <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.03] px-4">
                  <MessageSquare className="h-4 w-4 text-muted" />
                  <input
                    className="w-full bg-transparent px-3 py-4 outline-none placeholder:text-muted"
                    onChange={(event) => setValue("recipientPhone", event.target.value)}
                    placeholder="+2348012345678"
                    value={values.recipientPhone}
                  />
                </div>
                {errors.recipientPhone ? (
                  <p className="text-sm text-danger">{errors.recipientPhone}</p>
                ) : null}
              </label>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-text">Task description</span>
                <textarea
                  className="min-h-[180px] w-full rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4 outline-none placeholder:text-muted"
                  onChange={(event) => setValue("taskDescription", event.target.value)}
                  placeholder="Send over the signed contract, updated budget, and rollout timeline."
                  value={values.taskDescription}
                />
                {errors.taskDescription ? (
                  <p className="text-sm text-danger">{errors.taskDescription}</p>
                ) : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-text">Deadline</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 outline-none"
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(event) => setValue("dueDate", event.target.value)}
                  type="datetime-local"
                  value={values.dueDate}
                />
                {errors.dueDate ? <p className="text-sm text-danger">{errors.dueDate}</p> : null}
              </label>
            </>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  value: "email",
                  title: "Email",
                  body: "Professional message with a secure task link.",
                  icon: Mail
                },
                {
                  value: "sms",
                  title: "SMS",
                  body: "Short, clear, and fast to notice.",
                  icon: MessageSquare
                },
                {
                  value: "both",
                  title: "Both",
                  body: "Best coverage when timing matters.",
                  icon: Check
                }
              ].map((option) => {
                const Icon = option.icon;
                const active = values.notificationChannels === option.value;

                return (
                  <button
                    className={`rounded-[28px] border p-5 text-left transition ${
                      active
                        ? "border-electric/50 bg-electric/10 shadow-glow"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                    key={option.value}
                    onClick={() =>
                      setValue("notificationChannels", option.value as WizardValues["notificationChannels"])
                    }
                    type="button"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/6 text-electricSoft">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-lg font-semibold text-text">{option.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{option.body}</p>
                  </button>
                );
              })}
              {errors.notificationChannels ? (
                <p className="text-sm text-danger">{errors.notificationChannels}</p>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-electricSoft">Recipient</p>
                <h2 className="mt-2 text-2xl font-semibold text-text">{values.recipientName}</h2>
                <div className="mt-4 space-y-2 text-sm text-muted">
                  <p>{values.recipientEmail || "No email added"}</p>
                  <p>{values.recipientPhone || "No phone number added"}</p>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-electricSoft">Deadline</p>
                <p className="mt-2 text-2xl font-semibold text-text">
                  {values.dueDate
                    ? new Date(values.dueDate).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })
                    : "Not set"}
                </p>
                <p className="mt-4 text-sm text-muted">Channel: {values.notificationChannels}</p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
                <p className="text-sm uppercase tracking-[0.25em] text-electricSoft">Task</p>
                <p className="mt-3 text-base leading-8 text-slate-100">{values.taskDescription}</p>
              </div>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {submitError ? (
        <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-rose-200">
          {submitError}
        </div>
      ) : null}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          className={step === 0 ? "invisible" : ""}
          onClick={previousStep}
          variant="ghost"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {step < steps.length - 1 ? (
          <Button onClick={nextStep}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button disabled={isPending} onClick={submitPing}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Launching Ping
              </>
            ) : (
              "Create Ping"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
