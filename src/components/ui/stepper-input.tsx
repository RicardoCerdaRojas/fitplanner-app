
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import type { ControllerRenderProps } from 'react-hook-form';

type StepperInputProps = {
  field: ControllerRenderProps<any, string>;
  step?: number;
  allowText?: boolean;
};

export function StepperInput({ field, step = 1, allowText = false }: StepperInputProps) {
  const isNumeric = (val: any) => !isNaN(parseFloat(val)) && isFinite(Number(val));

  const handleStep = (direction: 'increment' | 'decrement') => {
    let currentValue = field.value ?? '0';
    let numValue = isNumeric(currentValue) ? parseFloat(currentValue) : 0;
    
    if (direction === 'increment') {
      numValue += step;
    } else {
      numValue -= step;
    }

    const newValue = String(Math.max(0, numValue));
    field.onChange(newValue);
  };
  
  return (
    <div className="flex items-center gap-1 w-full max-w-[150px]">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={() => handleStep('decrement')}
        disabled={allowText && !isNumeric(field.value)}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        {...field}
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
        disabled={allowText && !isNumeric(field.value)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
