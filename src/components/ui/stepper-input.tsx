
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

type StepperInputProps = {
  value?: string;
  onIncrement: () => void;
  onDecrement: () => void;
  allowText?: boolean;
};

export function StepperInput({ value, onIncrement, onDecrement, allowText = false }: StepperInputProps) {
  const isNumericString = (val: string | undefined): boolean => {
    if (val === undefined || val === null || val === '') return false;
    const num = Number(val);
    return !isNaN(num) && isFinite(num);
  };
  
  const displayValue = value ?? '';

  return (
    <div className="flex items-center gap-1 w-full">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={onDecrement}
        disabled={allowText && !isNumericString(value)}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        value={displayValue}
        readOnly // Input is display-only, logic is handled by buttons
        className="text-center font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={onIncrement}
        disabled={allowText && !isNumericString(value)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
