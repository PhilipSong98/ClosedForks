'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Clock, 
  Users, 
  Trash2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatTimeAgo } from '@/lib/utils';
import { Group } from '@/types';

interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  createdAt: string;
  usesRemaining: number;
  isActive: boolean;
}

interface GroupInvitesSectionProps {
  group: Group;
  inviteCodes: InviteCode[];
  isLoading?: boolean;
  onRevokeCode: (codeId: string) => Promise<void>;
  onGenerateCode: (groupId: string) => void;
}

export function GroupInvitesSection({ 
  group, 
  inviteCodes, 
  isLoading = false, 
  onRevokeCode,
  onGenerateCode 
}: GroupInvitesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [revokingCode, setRevokingCode] = useState<string | null>(null);
  const { toast } = useToast();

  const activeInvites = inviteCodes.filter(code => code.isActive && code.usesRemaining > 0);
  const expiredInvites = inviteCodes.filter(code => !code.isActive || code.usesRemaining <= 0);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: 'Copied!',
        description: 'Invite code copied to clipboard',
      });
      
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast({
        title: 'Copy failed',
        description: 'Failed to copy code to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeCode = async (codeId: string) => {
    setRevokingCode(codeId);
    try {
      await onRevokeCode(codeId);
      toast({
        title: 'Code revoked',
        description: 'Invite code has been deactivated',
      });
    } catch (error) {
      console.error('Failed to revoke code:', error);
      toast({
        title: 'Revoke failed',
        description: 'Failed to revoke invite code',
        variant: 'destructive',
      });
    } finally {
      setRevokingCode(null);
    }
  };

  const InviteCodeCard = ({ invite }: { invite: InviteCode }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <div className="font-mono text-lg font-semibold text-gray-900 bg-white px-3 py-2 rounded border w-fit">
          {invite.code}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{invite.usesRemaining}/{invite.maxUses} uses left</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Expires {formatTimeAgo(new Date(invite.expiresAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCopyCode(invite.code)}
          disabled={copiedCode === invite.code}
        >
          {copiedCode === invite.code ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRevokeCode(invite.id)}
          disabled={revokingCode === invite.id}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 h-auto">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">Invite Codes</span>
            {activeInvites.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {activeInvites.length} active
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-4 pb-4">
          <Separator className="mb-4" />
          
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Generate New Code Button */}
              <Button
                onClick={() => onGenerateCode(group.id)}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate New Invite Code
              </Button>

              {/* Active Invite Codes */}
              {activeInvites.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    Active Codes
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {activeInvites.length}
                    </Badge>
                  </h4>
                  {activeInvites.map((invite) => (
                    <InviteCodeCard key={invite.id} invite={invite} />
                  ))}
                </div>
              )}

              {/* Expired/Used Up Codes */}
              {expiredInvites.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-500 flex items-center gap-2">
                    Expired/Used Up
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      {expiredInvites.length}
                    </Badge>
                  </h4>
                  {expiredInvites.slice(0, 3).map((invite) => (
                    <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-gray-50 rounded-lg opacity-60">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        <div className="font-mono text-lg font-semibold text-gray-500 bg-white px-3 py-2 rounded border w-fit">
                          {invite.code}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{invite.currentUses}/{invite.maxUses} used</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>
                              {invite.usesRemaining <= 0 ? 'Fully used' : 'Expired'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {expiredInvites.length > 3 && (
                    <div className="text-center text-sm text-gray-500">
                      and {expiredInvites.length - 3} more...
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {activeInvites.length === 0 && expiredInvites.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No invite codes yet</p>
                  <p className="text-sm">Generate your first invite code to start inviting friends to {group.name}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}