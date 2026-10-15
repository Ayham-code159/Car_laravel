import { useId, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { CalendarDays, Clock3 } from "lucide-react";
import { format, parseISO, isValid, startOfDay } from "date-fns";
import { Field } from "./Primitives";

export function DateTimeField({
  label,
  value,
  onChange,
  error,
  minDate,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  minDate?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [date = "", time = "10:00"] = value.split("T");
  const selected = date && isValid(parseISO(date)) ? parseISO(date) : undefined;
  const min =
    minDate && isValid(parseISO(minDate))
      ? startOfDay(parseISO(minDate))
      : startOfDay(new Date());
  return (
    <Field label={label} htmlFor={`${id}-date`} error={error}>
      <div className={`datetime ${error ? "invalid" : ""}`}>
        <div className="date-control">
          <input
            id={`${id}-date`}
            type="date"
            aria-label={`${label} date`}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-date-error` : undefined}
            value={date}
            min={format(min, "yyyy-MM-dd")}
            disabled={disabled}
            onChange={(e) => onChange(`${e.target.value}T${time || "10:00"}`)}
          />
          <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger
              className="calendar-trigger"
              type="button"
              aria-label={`Open ${label.toLowerCase()} calendar`}
              disabled={disabled}
            >
              <CalendarDays size={18} />
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="calendar-popover"
                sideOffset={8}
                align="start"
                collisionPadding={12}
              >
                <DayPicker
                  mode="single"
                  selected={selected}
                  defaultMonth={selected}
                  disabled={{ before: min }}
                  onSelect={(day) => {
                    if (day) {
                      onChange(
                        `${format(day, "yyyy-MM-dd")}T${time || "10:00"}`,
                      );
                      setOpen(false);
                    }
                  }}
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
        <div className="time-control">
          <Clock3 size={16} />
          <input
            type="time"
            aria-label={`${label} time`}
            value={time}
            disabled={disabled}
            onChange={(e) => onChange(`${date}T${e.target.value}`)}
          />
        </div>
      </div>
    </Field>
  );
}
