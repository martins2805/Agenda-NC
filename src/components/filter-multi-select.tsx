"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterMultiSelectProps {
  placeholder: string;
  options: FilterOption[];
  value: string[];
  onChange: (values: string[]) => void;
}

// Multi-seleção genérica para barras de filtro (sem criar/editar itens),
// usada onde o filtro precisa aceitar mais de uma opção por campo.
export function FilterMultiSelect({
  placeholder,
  options,
  value,
  onChange,
}: FilterMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((o) => value.includes(o.value));

  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            className="h-auto min-h-9 w-full justify-between font-normal"
          />
        }
      >
        <span className="flex flex-1 flex-wrap gap-1 overflow-hidden text-left">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : selected.length <= 2 ? (
            selected.map((o) => (
              <Badge key={o.value} variant="secondary" className="max-w-full truncate">
                {o.label}
              </Badge>
            ))
          ) : (
            <Badge variant="secondary">{selected.length} selecionados</Badge>
          )}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-2" align="start">
        <div className="no-scrollbar max-h-56 overflow-y-auto">
          {options.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              Nenhuma opção.
            </p>
          )}
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => toggle(o.value)}
            >
              <Check
                className={cn(
                  "size-4 shrink-0",
                  value.includes(o.value) ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="truncate">{o.label}</span>
            </button>
          ))}
        </div>
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 w-full gap-1.5 text-muted-foreground"
            onClick={() => onChange([])}
          >
            <X className="size-3.5" />
            Limpar seleção
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
