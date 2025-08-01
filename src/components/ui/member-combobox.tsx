
"use client"

import * as React from "react"
import { User, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Member } from "@/app/coach/page"
import { ScrollArea } from "./scroll-area"
import { Input } from "./input"
import { Avatar, AvatarFallback } from "./avatar"
import { cn } from "@/lib/utils"

type MemberComboboxProps = {
    members: Member[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function MemberCombobox({ members = [], value, onChange, placeholder = "Select member..." }: MemberComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const handleSelect = (selectedUid: string) => {
    onChange(selectedUid);
    setOpen(false);
  }
  
  const selectedMember = members.find((member) => member.uid === value);

  const filteredMembers = React.useMemo(() => {
    if (!search) return members;
    return members.filter(member => 
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, members]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedMember
            ? <div className="flex items-center gap-2 truncate"><Avatar className="h-6 w-6"><AvatarFallback>{selectedMember.name.charAt(0)}</AvatarFallback></Avatar> {selectedMember.name}</div>
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="p-0 flex flex-col h-[60vh]">
          <SheetHeader className="p-4 pb-2 border-b">
              <SheetTitle>Select a Member</SheetTitle>
          </SheetHeader>
          <div className="p-4">
              <Input 
                  placeholder="Search member name or email..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
              />
          </div>
          <div className="border-t flex-1">
              <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                      {filteredMembers.length > 0 ? (
                        <div
                            className="w-full text-left h-auto p-2 rounded-md transition-colors hover:bg-muted cursor-pointer"
                            onClick={() => handleSelect('')}
                        >
                          All Members
                        </div>
                      ) : null}

                      {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                           <div
                              key={member.uid}
                              className={cn(
                                "w-full text-left h-auto p-2 rounded-md transition-colors hover:bg-muted cursor-pointer",
                                value === member.uid && "bg-muted font-semibold"
                              )}
                              onClick={() => handleSelect(member.uid)}
                          >
                              <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                      <AvatarFallback>{member.name ? member.name.charAt(0).toUpperCase() : <User />}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <p className="font-semibold">{member.name}</p>
                                      <p className="text-xs text-muted-foreground">{member.email}</p>
                                  </div>
                              </div>
                          </div>
                      )) : (
                          <p className="text-center text-sm text-muted-foreground py-4">No members found.</p>
                      )}
                  </div>
              </ScrollArea>
          </div>
    </SheetContent>
    </Sheet>
  )
}
