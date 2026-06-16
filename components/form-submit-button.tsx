"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type FormSubmitButtonProps = {
  children: string;
  pendingText: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
};

export function FormSubmitButton({
  children,
  pendingText,
  variant = "primary",
  className
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={className}
      disabled={pending}
      type="submit"
      variant={variant}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
