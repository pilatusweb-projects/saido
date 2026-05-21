"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-slate-200 shadow-lg font-sans text-sm",
          title: "font-medium",
          description: "text-slate-600",
        },
      }}
    />
  );
}
