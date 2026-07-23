"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PaginationProps extends React.ComponentProps<"div"> {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ page, totalPages, onPageChange, className, ...props }: PaginationProps) {
  return (
    <div
      data-slot="pagination"
      className={cn("flex items-center justify-between gap-3", className)}
      {...props}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        Página {page} de {Math.max(totalPages, 1)}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}

export { Pagination }
