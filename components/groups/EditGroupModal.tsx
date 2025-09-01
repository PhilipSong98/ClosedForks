'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { Group } from '@/types';
import { Loader2 } from 'lucide-react';

interface EditGroupModalProps {
  group: Group;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description?: string) => Promise<void>;
  isLoading?: boolean;
}

export function EditGroupModal({ 
  group, 
  isOpen, 
  onOpenChange, 
  onSave,
  isLoading = false
}: EditGroupModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [nameError, setNameError] = useState('');

  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError('Group name is required');
      return false;
    }
    if (value.length > 100) {
      setNameError('Group name must be 100 characters or less');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateName(name)) {
      return;
    }

    try {
      await onSave(name.trim(), description.trim() || undefined);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setName(group.name);
    setDescription(group.description || '');
    setNameError('');
    onOpenChange(false);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError && value.trim()) {
      validateName(value);
    }
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="group-name">Group Name *</Label>
        <Input
          id="group-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Enter group name"
          maxLength={100}
          disabled={isLoading}
          className={nameError ? 'border-red-500' : ''}
        />
        {nameError && (
          <p className="text-sm text-red-600">{nameError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {name.length}/100 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="group-description">Description</Label>
        <Textarea
          id="group-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter group description (optional)"
          rows={3}
          maxLength={500}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          {description.length}/500 characters
        </p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 sm:space-y-0 space-y-reverse">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !!nameError || !name.trim()}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh]">
          <SheetHeader>
            <SheetTitle>Edit Group</SheetTitle>
            <SheetDescription>
              Update your group name and description. Only owners and admins can edit group details.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <FormContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>
            Update your group name and description. Only owners and admins can edit group details.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <FormContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}