
"use client"

import * as React from "react"
import { Check, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Member } from "@/app/coach/page"
import { ScrollArea } from "./scroll-area"
import { Input } from "./input"
import { Avatar, AvatarFallback } from "./avatar"

type MemberComboboxProps = {
    members: Member[];
    value: string;
    onChange: (value: string) => void;
}

export function MemberCombobox({ members, value, onChange }: MemberComboboxProps) {
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
        member.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, members]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 h-10 px-3 py-2 border rounded-md text-sm flex items-center">
                 {selectedMember ? (
                    <div className="flex items-center gap-2 truncate">
                        <Avatar className="h-6 w-6"><AvatarFallback>{selectedMember.name.charAt(0)}</AvatarFallback></Avatar>
                        <span className="font-medium truncate">{selectedMember.name}</span>
                    </div>
                ) : (
                    <span className="text-muted-foreground">No member selected</span>
                )}
            </div>
            <DialogTrigger asChild>
                <Button variant="outline">Select</Button>
            </DialogTrigger>
        </div>

        <DialogContent className="p-0 gap-0">
            <DialogHeader className="p-4 pb-2">
                <DialogTitle>Select a Member</DialogTitle>
            </DialogHeader>
            <div className="p-4 pt-0">
                <Input 
                    placeholder="Search member..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="border-t">
                <ScrollArea className="h-64">
                    <div className="p-2 space-y-1">
                        {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                            <Button
                                key={member.uid}
                                variant="ghost"
                                className="w-full justify-start h-auto py-2"
                                onClick={() => handleSelect(member.uid)}
                            >
                                <Check className={cn("mr-2 h-4 w-4", value === member.uid ? "opacity-100" : "opacity-0")} />
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{member.name ? member.name.charAt(0).toUpperCase() : <User />}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-left">{member.name}</p>
                                        <p className="text-xs text-muted-foreground text-left">{member.uid}</p>
                                    </div>
                                </div>
                            </Button>
                        )) : (
                            <p className="text-center text-sm text-muted-foreground py-4">No members found.</p>
                        )}
                    </div>
                </ScrollArea>
            </div>
      </DialogContent>
    </Dialog>
  )
}
