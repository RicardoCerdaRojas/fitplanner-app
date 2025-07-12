
"use client"

import * as React from "react"
import { User, ChevronsUpDown } from "lucide-react"
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
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, members]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-medium">Member</label>
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted">
                    {selectedMember ? (
                        <div className="flex items-center gap-2 truncate">
                            <Avatar className="h-6 w-6"><AvatarFallback>{selectedMember.name.charAt(0)}</AvatarFallback></Avatar>
                            <span className="font-semibold truncate">{selectedMember.name}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">Select member...</span>
                    )}
                </div>
            </div>
            <div className="self-end">
                <DialogTrigger asChild>
                    <Button variant="outline">Select</Button>
                </DialogTrigger>
            </div>
        </div>

        <DialogContent className="p-0 gap-0">
            <DialogHeader className="p-4 pb-2 border-b">
                <DialogTitle>Select a Member</DialogTitle>
            </DialogHeader>
            <div className="p-4">
                <Input 
                    placeholder="Search member name or email..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="border-t">
                <ScrollArea className="h-72">
                    <div className="p-2 space-y-1">
                        {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                            <Button
                                key={member.uid}
                                variant="ghost"
                                className="w-full justify-start h-auto py-2"
                                onClick={() => handleSelect(member.uid)}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{member.name ? member.name.charAt(0).toUpperCase() : <User />}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-left">{member.name}</p>
                                        <p className="text-xs text-muted-foreground text-left">{member.email}</p>
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
