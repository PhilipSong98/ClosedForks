'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useJoinGroup } from '@/lib/mutations/groups';
import { useToast } from '@/hooks/use-toast';
import { inviteCodeValidationSchema } from '@/lib/validations';
import { Loader2, Users, UserPlus } from 'lucide-react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinGroupModal({ 
  isOpen, 
  onOpenChange
}: JoinGroupModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  
  const joinGroupMutation = useJoinGroup();

  const handleCodeChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate code format
    const validation = inviteCodeValidationSchema.safeParse({ code });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Please enter a valid 6-digit code');
      return;
    }

    try {
      const result = await joinGroupMutation.mutateAsync({ code });
      
      toast({
        title: 'Success!',
        description: `You've joined "${result.groupName}"`,
      });
      
      // Reset form and close modal
      setCode('');
      setError('');
      onOpenChange(false);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join group';
      setError(errorMessage);
    }
  };

  const handleClose = () => {
    setCode('');
    setError('');
    onOpenChange(false);
  };

  const ModalContent = () => (
    <>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserPlus className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Join a Group
        </h3>
        <p className="text-gray-600 text-sm">
          Enter the 6-digit invite code from a friend to join their group
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-center space-x-3">
            {/* Individual digit inputs for better UX */}
            <div className="grid grid-cols-6 gap-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="relative">
                  <Input
                    type="text"
                    value={code[index] || ''}
                    onChange={(e) => {
                      const newCode = code.split('');
                      newCode[index] = e.target.value.slice(-1);
                      handleCodeChange(newCode.join(''));
                      
                      // Auto-focus next input
                      if (e.target.value && index < 5) {
                        const nextInput = e.target.parentElement?.parentElement?.children[index + 1]?.querySelector('input');
                        nextInput?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      // Auto-focus previous input on backspace
                      if (e.key === 'Backspace' && !code[index] && index > 0) {
                        const prevInput = (e.target as HTMLElement).parentElement?.parentElement?.children[index - 1]?.querySelector('input');
                        prevInput?.focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-lg font-mono border-gray-300 focus:border-blue-600 focus:ring-blue-600 bg-gray-50"
                    maxLength={1}
                    autoComplete="off"
                    disabled={joinGroupMutation.isPending}
                  />
                  {index === 2 && <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-2 h-[2px] bg-gray-300"></div>}
                </div>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center animate-in fade-in duration-300">
              {error}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Button
            type="submit"
            disabled={code.length !== 6 || joinGroupMutation.isPending}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {joinGroupMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Joining Group...
              </>
            ) : (
              <>
                <Users className="h-5 w-5 mr-2" />
                Join Group
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={joinGroupMutation.isPending}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-500 text-xs">
          Ask a friend for their group&apos;s invite code to get started
        </p>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader className="text-left mb-6">
            <SheetTitle>Join a Group</SheetTitle>
            <SheetDescription>
              Enter a 6-digit invite code to join a dining group
            </SheetDescription>
          </SheetHeader>
          <ModalContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left mb-6">
          <DialogTitle>Join a Group</DialogTitle>
          <DialogDescription>
            Enter a 6-digit invite code to join a dining group
          </DialogDescription>
        </DialogHeader>
        <ModalContent />
      </DialogContent>
    </Dialog>
  );
}