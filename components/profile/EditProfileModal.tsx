'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useUpdateProfile } from '@/lib/mutations/profile';
import { User } from '@/types';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
  open, 
  onOpenChange, 
  user 
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { toast } = useToast();
  
  const [name, setName] = useState(user.name);

  const updateProfileMutation = useUpdateProfile();

  const handleSave = async () => {
    try {
      // Update profile if name changed
      if (name !== user.name) {
        await updateProfileMutation.mutateAsync({ name });
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const isLoading = updateProfileMutation.isPending;
  const hasChanges = name !== user.name;

  const content = (
    <div className="space-y-6">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">Display Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your display name"
          disabled={isLoading}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader className="mb-6">
            <SheetTitle>Edit Profile</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;