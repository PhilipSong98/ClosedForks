'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ExtensionResistantInput } from '@/components/ui/extension-resistant-input';
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
import { CreateGroupRequest } from '@/types';
import { Loader2 } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateGroupRequest) => Promise<void>;
  isLoading?: boolean;
}

interface FormContentProps {
  name: string;
  description: string;
  nameError: string;
  isLoading: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

// Extract FormContent to prevent recreation on every render
const FormContent: React.FC<FormContentProps> = ({
  name,
  description,
  nameError,
  isLoading,
  onNameChange,
  onDescriptionChange,
  onSubmit,
  onCancel
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="group-name">Group Name *</Label>
      <ExtensionResistantInput
        id="group-name"
        value={name}
        onChange={onNameChange}
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
      <Label htmlFor="group-description">Description (Optional)</Label>
      <Textarea
        id="group-description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Describe your dining group..."
        maxLength={500}
        disabled={isLoading}
        rows={3}
        autoComplete="off"
        data-lpignore="true"
        data-1p-ignore
        data-form-type="other"
      />
      <p className="text-xs text-muted-foreground">
        {description.length}/500 characters
      </p>
    </div>

    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 sm:space-y-0 space-y-reverse">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
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
            Creating...
          </>
        ) : (
          'Create Group'
        )}
      </Button>
    </div>
  </form>
);

export function CreateGroupModal({ 
  isOpen, 
  onOpenChange, 
  onSave,
  isLoading = false
}: CreateGroupModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');

  const validateName = useCallback((value: string) => {
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
  }, []);


  // Stable event handlers using useCallback
  const handleNameChange = useCallback((value: string) => {
    setName(value);
    // Clear error when user starts typing again
    if (nameError) {
      setNameError('');
    }
  }, [nameError]);

  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
  }, []);

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateName(name)) {
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined
      });
      // Reset form
      setName('');
      setDescription('');
      setNameError('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  }, [name, description, onSave, onOpenChange, validateName]);

  const handleFormCancel = useCallback(() => {
    // Reset form
    setName('');
    setDescription('');
    setNameError('');
    onOpenChange(false);
  }, [onOpenChange]);

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh]">
          <SheetHeader>
            <SheetTitle>Create New Group</SheetTitle>
            <SheetDescription>
              Create a new dining group to share restaurant reviews with friends and family.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <FormContent 
              name={name}
              description={description}
              nameError={nameError}
              isLoading={isLoading}
              onNameChange={handleNameChange}
              onDescriptionChange={handleDescriptionChange}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Create a new dining group to share restaurant reviews with friends and family.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <FormContent 
            name={name}
            description={description}
            nameError={nameError}
            isLoading={isLoading}
            onNameChange={handleNameChange}
            onDescriptionChange={handleDescriptionChange}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}