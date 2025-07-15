
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

type StepperInputProps = {
  value?: string | number;
  onValueChange: (value: string) => void;
  step?: number;
  allowText?: boolean;
};

export function StepperInput({ value, onValueChange, step = 1, allowText = false }: StepperInputProps) {
  const isNumericString = (val: string | number | undefined): val is (string | number) => {
    if (val === undefined || val === null || val === '') return false;
    const num = Number(val);
    return !isNaN(num) && isFinite(num);
  };

  const handleStep = (direction: 'increment' | 'decrement') => {
    const numValue = isNumericString(value) ? parseFloat(String(value)) : 0;
    const newValue = direction === 'increment' ? numValue + step : numValue - step;
    onValueChange(String(Math.max(0, newValue)));
  };
  
  return (
    <div className="flex items-center gap-1 w-full">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={() => handleStep('decrement')}
        disabled={allowText && !isNumericString(value)}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        value={value ?? ''}
        onChange={(e) => onValueChange(e.target.value)}
        className="text-center font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        type={allowText ? 'text' : 'number'}
        min={0}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={() => handleStep('increment')}
        disabled={allowText && !isNumericString(value)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
