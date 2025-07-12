'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import type { ControllerRenderProps } from 'react-hook-form';
import { useState, useEffect } from 'react';

type StepperInputProps = {
  field: ControllerRenderProps<any, string>;
  step?: number;
  allowText?: boolean;
};

export function StepperInput({ field, step = 1, allowText = false }: StepperInputProps) {
  const [inputValue, setInputValue] = useState(field.value ?? '');

  useEffect(() => {
    setInputValue(field.value ?? '');
  }, [field.value]);
  
  const isNumeric = !isNaN(parseFloat(inputValue)) && isFinite(Number(inputValue));

  const handleStep = (direction: 'increment' | 'decrement') => {
    let numValue = isNumeric ? parseFloat(inputValue) : 0;
    if (direction === 'increment') {
      numValue += step;
    } else {
      numValue -= step;
    }
    const newValue = String(Math.max(0, numValue));
    setInputValue(newValue);
    field.onChange(newValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    field.onChange(e.target.value);
  };

  return (
    <div className="flex items-center gap-1 w-full max-w-[150px]">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={() => handleStep('decrement')}
        disabled={allowText && !isNumeric}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        {...field}
        value={inputValue}
        onChange={handleChange}
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
        disabled={allowText && !isNumeric}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
