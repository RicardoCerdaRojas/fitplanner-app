
'use client';

import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ThemeSelector } from './theme-selector';
import { Palette } from 'lucide-react';

export const GymInfoStep = () => {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="gymName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-300">Gym Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., 'Power Gym', 'Zen Pilates Studio'" {...field} className="bg-gray-800/50 border-white/10 text-white placeholder:text-gray-500 focus:ring-emerald-400" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="theme"
        render={({ field }) => (
            <FormItem className="space-y-3">
                <FormLabel className="flex items-center gap-2 text-gray-300"><Palette/> Select a Theme</FormLabel>
                <FormControl>
                  <ThemeSelector field={field} />
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
      />
    </div>
  );
};
