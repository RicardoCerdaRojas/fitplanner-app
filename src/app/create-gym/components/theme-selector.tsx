
'use client';

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { themes } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { ControllerRenderProps } from "react-hook-form";
import { FormItem, FormLabel, FormControl } from "@/components/ui/form";

interface ThemeSelectorProps {
  field: ControllerRenderProps<any, 'theme'>;
}

export function ThemeSelector({ field }: ThemeSelectorProps) {
    // Use a single-column grid for all screen sizes to ensure all items are visible.
    return (
        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 gap-3">
            {themes.map(theme => (
                <ThemeRadioItem key={theme.id} theme={theme} field={field} />
            ))}
        </RadioGroup>
    );
}

const ThemeRadioItem = ({ theme, field }: { theme: typeof themes[0], field: ControllerRenderProps<any, 'theme'> }) => (
    <FormItem>
        <FormControl>
            <RadioGroupItem value={theme.id} id={theme.id} className="sr-only" />
        </FormControl>
        <FormLabel 
            htmlFor={theme.id} 
            className={cn(
                "flex items-center justify-between w-full p-4 rounded-lg border-2 cursor-pointer transition-all bg-gray-800/20",
                field.value === theme.id ? "border-emerald-400 shadow-md" : "border-white/10"
            )}
        >
            <div className="font-bold text-white">{theme.name}</div>
            <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full" style={{ backgroundColor: `hsl(${theme.colors.primary})` }} />
                <div className="h-5 w-5 rounded-full" style={{ backgroundColor: `hsl(${theme.colors.accent})` }} />
            </div>
        </FormLabel>
    </FormItem>
)
