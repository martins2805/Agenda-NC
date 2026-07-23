"use client"

import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { X, CheckCircle2, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Provider + Viewport: montado uma vez no layout raiz. useToast() dispara
// toasts de qualquer componente client, sem prop-drilling.
function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastPrimitive.Provider>
      {children}
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="size-4 shrink-0 text-[var(--status-concluido)]" />,
  error: <AlertCircle className="size-4 shrink-0 text-destructive" />,
}

function ToastList() {
  const { toasts } = useToast()
  return toasts.map((toast) => (
    <ToastPrimitive.Root
      key={toast.id}
      toast={toast}
      className={cn(
        "panel-card flex items-start gap-2.5 border p-3 duration-150 data-starting-style:translate-x-full data-starting-style:opacity-0 data-ending-style:opacity-0"
      )}
    >
      {toast.type && TYPE_ICON[toast.type]}
      <div className="flex-1 text-sm">
        {toast.title && <ToastPrimitive.Title className="font-medium">{toast.title}</ToastPrimitive.Title>}
        {toast.description && (
          <ToastPrimitive.Description className="text-muted-foreground">
            {toast.description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close
        render={<Button variant="ghost" size="icon" className="-m-1 size-6 shrink-0" />}
        aria-label="Fechar"
      >
        <X className="size-3.5" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  ))
}

const useToast = ToastPrimitive.useToastManager
const toastManager = ToastPrimitive.createToastManager()

export { ToastProvider, useToast, toastManager }
