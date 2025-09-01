'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, Copy, Check, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  createdAt: string;
  usesRemaining: number;
}

interface InviteCodeModalProps {
  group: Group;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateCode: (groupId: string) => Promise<InviteCode>;
  isLoading?: boolean;
}

export function InviteCodeModal({ 
  group, 
  isOpen, 
  onOpenChange, 
  onGenerateCode,
  isLoading = false
}: InviteCodeModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState<InviteCode | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    try {
      const newCode = await onGenerateCode(group.id);
      setInviteCode(newCode);
    } catch (error) {
      console.error('Error generating invite code:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate invite code',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    
    try {
      await navigator.clipboard.writeText(inviteCode.code);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Invite code copied to clipboard',
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast({
        title: 'Copy failed',
        description: 'Failed to copy code to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setInviteCode(null);
    setCopied(false);
    onOpenChange(false);
  };

  const FormContent = () => (
    <div className="space-y-6">
      {/* Group Info */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{group.name}</h3>
          <p className="text-sm text-gray-600">
            {group.member_count || 0} member{(group.member_count || 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Generate or Show Code */}
      {!inviteCode ? (
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Generate Invite Code
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Create a 6-digit code that friends can use to join {group.name}. 
              The code will be valid for 7 days and can be used up to 10 times.
            </p>
          </div>

          <Button 
            onClick={handleGenerateCode} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Invite Code'
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Your Invite Code
            </h4>
            <p className="text-sm text-gray-600">
              Share this code with friends to invite them to {group.name}
            </p>
          </div>

          {/* Code Display */}
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <div className="flex gap-2">
              <Input
                id="invite-code"
                value={inviteCode.code}
                readOnly
                className="font-mono text-lg text-center tracking-wider"
              />
              <Button
                onClick={handleCopyCode}
                variant="outline"
                className="shrink-0"
                disabled={copied}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Code Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Uses Remaining</p>
                <p className="font-semibold text-gray-900">{inviteCode.usesRemaining} / {inviteCode.maxUses}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Expires</p>
                <p className="font-semibold text-gray-900">
                  {formatDistanceToNow(new Date(inviteCode.expiresAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">How to share:</h5>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Copy the 6-digit code above</li>
              <li>2. Share it with friends via text, email, or messaging</li>
              <li>3. They visit your restaurant review site and enter the code</li>
              <li>4. After validation, they can create their account and join {group.name}</li>
            </ol>
          </div>

          {/* Generate Another Button */}
          <Button 
            onClick={handleGenerateCode} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Another Code'
            )}
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleClose}>
          Close
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="max-h-[90vh]">
          <SheetHeader>
            <SheetTitle>Invite Friends</SheetTitle>
            <SheetDescription>
              Generate an invite code to add new members to your group.
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Friends</DialogTitle>
          <DialogDescription>
            Generate an invite code to add new members to your group.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <FormContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}