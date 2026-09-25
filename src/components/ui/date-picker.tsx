import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatDictadoDateDdMmYyyy,
  localDateToYmd,
  ymdToLocalDate,
} from "@/utils/courseDates";

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  id?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  onBlur,
  disabled,
  id,
  required,
  className,
  placeholder = "dd/mm/aaaa",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? ymdToLocalDate(value) : undefined;
  const display = value ? formatDictadoDateDdMmYyyy(value) : "";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur?.();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-required={required}
          className={cn(
            "w-full max-w-full min-w-0 justify-start text-left font-normal h-10 px-3",
            !display && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate">{display || placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-[calc(100vw-2rem)] p-0 overflow-hidden"
        align="start"
        sideOffset={4}
      >
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(localDateToYmd(date));
            setOpen(false);
            onBlur?.();
          }}
          defaultMonth={selected}
          className="p-2"
        />
      </PopoverContent>
    </Popover>
  );
}
