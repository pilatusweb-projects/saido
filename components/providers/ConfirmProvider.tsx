"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function finish(result: boolean) {
    setOpen(false);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }

  const isDanger = options?.variant === "danger";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog.Root open={open} onOpenChange={(next) => !next && finish(false)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[2px]" />
          <AlertDialog.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-[101] w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2",
              "rounded-2xl border border-slate-200 bg-white p-6 shadow-xl focus:outline-none"
            )}
          >
            <AlertDialog.Title className="text-lg font-semibold text-slate-900">
              {options?.title}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-slate-600 leading-relaxed">
              {options?.description}
            </AlertDialog.Description>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button variant="secondary" type="button" onClick={() => finish(false)}>
                  {options?.cancelLabel ?? "Cancel"}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant={isDanger ? "danger" : "primary"}
                  type="button"
                  onClick={() => finish(true)}
                >
                  {options?.confirmLabel ?? "Continue"}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx.confirm;
}
