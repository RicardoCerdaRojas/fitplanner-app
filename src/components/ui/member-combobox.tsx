
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Member } from "@/app/coach/page"
import { ScrollArea } from "./scroll-area"

type MemberComboboxProps = {
    members: Member[];
    value: string;
    onChange: (value: string) => void;
}

export function MemberCombobox({ members, value, onChange }: MemberComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (selectedUid: string) => {
    onChange(selectedUid);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? members.find((member) => member.uid === value)?.name
            : "Select member..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0">
        <DialogHeader className="p-4 pb-0">
            <DialogTitle>Select a Member</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Search member..." />
          <CommandList>
            <CommandEmpty>No member found.</CommandEmpty>
            <CommandGroup>
                <ScrollArea className="h-48">
                    {members.map((member) => (
                    <CommandItem
                        key={member.uid}
                        value={member.name}
                        onSelect={() => handleSelect(member.uid)}
                    >
                        <Check
                        className={cn(
                            "mr-2 h-4 w-4",
                            value === member.uid ? "opacity-100" : "opacity-0"
                        )}
                        />
                        {member.name}
                    </CommandItem>
                    ))}
                </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
