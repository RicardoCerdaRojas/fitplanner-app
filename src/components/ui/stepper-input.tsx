
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

type StepperInputProps = {
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
};

export function StepperInput({ 
  value, 
  onIncrement, 
  onDecrement,
}: StepperInputProps) {

  return (
    <div className="flex items-center gap-1 w-full">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={onDecrement}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        value={value}
        readOnly
        className="text-center font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={onIncrement}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
