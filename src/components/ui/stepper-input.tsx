
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import type { ControllerRenderProps } from 'react-hook-form';
import { useState, useEffect } from 'react';

type StepperInputProps = {
  field: {
    value?: string | number;
    onChange: (value: string) => void;
    name: string;
  };
  step?: number;
  allowText?: boolean;
};

export function StepperInput({ field, step = 1, allowText = false }: StepperInputProps) {
  const [internalValue, setInternalValue] = useState(field.value ?? '0');

  useEffect(() => {
    setInternalValue(field.value ?? '0');
  }, [field.value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    field.onChange(e.target.value);
  };
  
  const isNumeric = (val: any): val is number | string => val !== '' && !isNaN(parseFloat(val)) && isFinite(Number(val));

  const handleStep = (direction: 'increment' | 'decrement') => {
    const numValue = isNumeric(internalValue) ? parseFloat(String(internalValue)) : 0;
    
    let newValue;
    if (direction === 'increment') {
      newValue = numValue + step;
    } else {
      newValue = numValue - step;
    }

    const finalValue = String(Math.max(0, newValue));
    setInternalValue(finalValue);
    field.onChange(finalValue);
  };
  
  return (
    <div className="flex items-center gap-1 w-full max-w-[150px]">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={() => handleStep('decrement')}
        disabled={allowText && !isNumeric(internalValue)}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        name={field.name}
        value={internalValue}
        onChange={handleInputChange}
        onBlur={() => field.onChange(String(internalValue))}
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
        disabled={allowText && !isNumeric(internalValue)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
