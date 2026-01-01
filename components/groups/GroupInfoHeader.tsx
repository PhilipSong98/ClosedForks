'use client';

import { useState } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Group, GroupMember } from '@/types';
import { formatTimeAgo } from '@/lib/utils';

interface GroupInfoHeaderProps {
  group: Group;
  members?: GroupMember[];
  showMembers?: boolean;
  userRole?: string;
}

export function GroupInfoHeader({ 
  group, 
  members, 
  showMembers = false,
  userRole 
}: GroupInfoHeaderProps) {
  const [membersExpanded, setMembersExpanded] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              {group.description && (
                <p className="text-gray-600 mt-1">{group.description}</p>
              )}
            </div>
          </div>
          {userRole && (
            <Badge className={getRoleColor(userRole)}>
              {userRole}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{group.member_count || 0} members</span>
          </div>
          {group.created_at && (
            <div>
              Created {formatTimeAgo(new Date(group.created_at), { addSuffix: true })}
            </div>
          )}
        </div>

        {showMembers && members && members.length > 0 && (
          <Collapsible open={membersExpanded} onOpenChange={setMembersExpanded}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center gap-2 h-8 -ml-3"
              >
                {membersExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {membersExpanded ? 'Hide Members' : 'Show Members'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="grid gap-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm bg-gray-100">
                          {(member.user.full_name || member.user.name)
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.user.full_name || member.user.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Joined {formatTimeAgo(new Date(member.joined_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={getRoleColor(member.role)}
                    >
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}