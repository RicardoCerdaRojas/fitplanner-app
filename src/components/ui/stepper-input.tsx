
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { ControllerRenderProps } from 'react-hook-form';

type StepperInputProps = {
  field: ControllerRenderProps<any, string>;
  step?: number;
  allowText?: string;
};

export function StepperInput({ field, step = 1, allowText }: StepperInputProps) {
  const currentValue = field.value || '0';
  const isNumeric = !isNaN(parseFloat(currentValue)) && isFinite(Number(currentValue));

  const handleStep = (direction: 'increment' | 'decrement') => {
    let numValue = isNumeric ? parseFloat(currentValue) : 0;
    if (direction === 'increment') {
      numValue += step;
    } else {
      numValue -= step;
    }
    field.onChange(String(Math.max(0, numValue)));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    field.onChange(e.target.value);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={() => handleStep('decrement')}
        disabled={!isNumeric}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        {...field}
        onChange={handleChange}
        className="text-center font-bold"
        placeholder={allowText}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={() => handleStep('increment')}
        disabled={!isNumeric}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
