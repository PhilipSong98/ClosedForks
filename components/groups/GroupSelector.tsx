'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { Group } from '@/types';
import { cn } from '@/lib/utils';

interface GroupSelectorProps {
  groups: Group[];
  selectedGroupId?: string | null;
  onGroupSelect: (groupId: string | null) => void;
  showAllOption?: boolean;
  className?: string;
}

export function GroupSelector({
  groups,
  selectedGroupId,
  onGroupSelect,
  showAllOption = true,
  className
}: GroupSelectorProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  
  const handleSelect = (groupId: string | null) => {
    onGroupSelect(groupId);
    setOpen(false);
  };

  const GroupList = () => (
    <Command>
      <CommandEmpty>No groups found.</CommandEmpty>
      <CommandGroup>
        {showAllOption && (
          <CommandItem
            value="all"
            onSelect={() => handleSelect(null)}
            className="cursor-pointer"
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                !selectedGroupId ? "opacity-100" : "opacity-0"
              )}
            />
            <Users className="mr-2 h-4 w-4" />
            All Groups
          </CommandItem>
        )}
        {groups.map((group) => (
          <CommandItem
            key={group.id}
            value={group.id}
            onSelect={() => handleSelect(group.id)}
            className="cursor-pointer"
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                selectedGroupId === group.id ? "opacity-100" : "opacity-0"
              )}
            />
            <Users className="mr-2 h-4 w-4" />
            <div className="flex items-center gap-2 flex-1">
              <span>{group.name}</span>
              {group.member_count && (
                <Badge variant="secondary" className="text-xs">
                  {group.member_count}
                </Badge>
              )}
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between", className)}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="truncate">
                {selectedGroup?.name || (showAllOption ? "All Groups" : "Select group")}
              </span>
              {selectedGroup?.member_count && (
                <Badge variant="secondary" className="text-xs">
                  {selectedGroup.member_count}
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Select Group</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <GroupList />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between min-w-[200px]", className)}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="truncate">
              {selectedGroup?.name || (showAllOption ? "All Groups" : "Select group")}
            </span>
            {selectedGroup?.member_count && (
              <Badge variant="secondary" className="text-xs">
                {selectedGroup.member_count}
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <GroupList />
      </PopoverContent>
    </Popover>
  );
}