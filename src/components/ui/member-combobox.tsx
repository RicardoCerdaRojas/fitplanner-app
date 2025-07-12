'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Member } from '@/app/coach/page';

type MemberComboboxProps = {
  members: Member[];
  value: string;
  onChange: (value: string) => void;
};

export function MemberCombobox({ members, value, onChange }: MemberComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedMemberName = React.useMemo(() => {
    return members.find((member) => member.uid === value)?.name || '';
  }, [value, members]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedMemberName || 'Select member...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search member..." />
           <CommandList>
            <CommandEmpty>No member found.</CommandEmpty>
            <CommandGroup>
              {members.map((member) => (
                <CommandItem
                  key={member.uid}
                  value={member.name}
                  onSelect={() => {
                    onChange(member.uid);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === member.uid ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {member.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
