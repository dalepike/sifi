"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

// Predefined color palette
const PRESET_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#84CC16", // Lime
  "#22C55E", // Green
  "#10B981", // Emerald
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#0EA5E9", // Sky
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#A855F7", // Purple
  "#D946EF", // Fuchsia
  "#EC4899", // Pink
  "#F43F5E", // Rose
  "#78716C", // Stone
  "#64748B", // Slate
  "#000000", // Black
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  name?: string;
}

export function ColorPicker({ value, onChange, name }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  const handlePresetClick = (color: string) => {
    onChange(color);
    setCustomColor(color);
    setOpen(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      onChange(color);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          role="combobox"
          aria-expanded={open}
        >
          <div
            className="h-5 w-5 rounded border"
            style={{ backgroundColor: value }}
          />
          <span className="font-mono text-sm">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border-2 transition-transform hover:scale-110",
                  value === color ? "border-primary" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
                onClick={() => handlePresetClick(color)}
              >
                {value === color && (
                  <Check
                    className={cn(
                      "h-4 w-4",
                      color === "#000000" ? "text-white" : "text-white drop-shadow"
                    )}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div
              className="h-9 w-9 shrink-0 rounded border"
              style={{ backgroundColor: customColor }}
            />
            <Input
              type="text"
              value={customColor}
              onChange={handleCustomChange}
              placeholder="#000000"
              className="font-mono text-sm"
            />
          </div>
        </div>
      </PopoverContent>
      {name && <input type="hidden" name={name} value={value} />}
    </Popover>
  );
}
