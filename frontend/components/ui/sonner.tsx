"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={4000}
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <TriangleAlertIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--toast-close-button-transform": "translate(0, 0)",
          "--toast-close-button-start": "auto",
          "--toast-close-button-end": "8px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg",
          title: "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold px-4 py-2 border-b border-zinc-200 dark:border-zinc-700",
          description: "text-zinc-600 dark:text-zinc-300 px-4 py-2",
          closeButton: "!bg-zinc-100 dark:!bg-zinc-800 !border-zinc-300 dark:!border-zinc-600 !text-zinc-600 dark:!text-zinc-400 hover:!bg-red-100 dark:hover:!bg-red-900/30 hover:!text-red-600 dark:hover:!text-red-400 hover:!border-red-300 dark:hover:!border-red-700",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
