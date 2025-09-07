'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Crown, Shield, User, Calendar, ChevronDown, ChevronUp, Plus, Edit2, UserPlus } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePermissions, PermissionGate } from '@/lib/hooks/usePermissions';
import { useUserGroups, useGroup } from '@/lib/queries/groups';
import { useUpdateGroup, useCreateGroup } from '@/lib/mutations/groups';
import { useGenerateInviteCode } from '@/lib/mutations/inviteCode';
import { useRevokeInviteCode } from '@/lib/mutations/invites';
import { useGroupInviteCodes } from '@/lib/queries/invites';
import { EditGroupModal } from '@/components/groups/EditGroupModal';
import { InviteCodeModal } from '@/components/groups/InviteCodeModal';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { GroupInvitesSection } from '@/components/groups/GroupInvitesSection';
import { Group, CreateGroupRequest } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface GroupCardProps {
  group: Group;
  onViewDetails: (groupId: string) => void;
  isExpanded: boolean;
  onEditGroup: (group: Group) => void;
  onInviteToGroup: (group: Group) => void;
  onRevokeInviteCode: (codeId: string) => Promise<void>;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onViewDetails, isExpanded, onEditGroup, onInviteToGroup, onRevokeInviteCode }) => {
  const { data: groupDetails, isLoading } = useGroup(group.id, isExpanded);
  const { data: inviteCodes = [], isLoading: invitesLoading } = useGroupInviteCodes(group.id, isExpanded);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="h-full group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                  {group.name}
                </CardTitle>
                <div className="flex items-center gap-1">
                  {/* Invite button - only for owners */}
                  {group.user_role === 'owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInviteToGroup(group)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-opacity"
                      title="Invite friends to this group"
                    >
                      <UserPlus className="h-3 w-3" />
                    </Button>
                  )}
                  {/* Edit button - only for owners/admins */}
                  {(group.user_role === 'owner' || group.user_role === 'admin') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditGroup(group)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-opacity"
                      title="Edit group name"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Badge className={`${getRoleColor(group.user_role || 'member')} flex items-center gap-1 shrink-0`}>
            {getRoleIcon(group.user_role || 'member')}
            {group.user_role || 'member'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{group.member_count || 0} member{(group.member_count || 0) !== 1 ? 's' : ''}</span>
            </div>
            {group.created_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </div>

        <Collapsible open={isExpanded} onOpenChange={() => onViewDetails(group.id)}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-center">
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Members
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show Members
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-5 w-12" />
                  </div>
                ))}
              </div>
            ) : groupDetails?.members && groupDetails.members.length > 0 ? (
              <div className="space-y-3">
                {groupDetails.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-gray-100">
                          {(member.user.full_name || member.user.name)
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.user.full_name || member.user.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${getRoleColor(member.role)} text-xs flex items-center gap-1`}
                    >
                      {getRoleIcon(member.role)}
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">
                No members found
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Invite Codes Section - only for owners */}
        {isExpanded && group.user_role === 'owner' && (
          <GroupInvitesSection
            group={group}
            inviteCodes={inviteCodes}
            isLoading={invitesLoading}
            onRevokeCode={onRevokeInviteCode}
            onGenerateCode={(groupId) => onInviteToGroup(group)}
          />
        )}
      </CardContent>
    </Card>
  );
};

const GroupsClient: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { loading: permissionsLoading } = usePermissions();
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [invitingGroup, setInvitingGroup] = useState<Group | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: userGroups = [], isLoading: groupsLoading } = useUserGroups();
  const updateGroupMutation = useUpdateGroup();
  const createGroupMutation = useCreateGroup();
  const generateInviteCodeMutation = useGenerateInviteCode();
  const revokeInviteCodeMutation = useRevokeInviteCode();

  const handleViewDetails = (groupId: string) => {
    setExpandedGroupId(expandedGroupId === groupId ? null : groupId);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
  };

  const handleInviteToGroup = (group: Group) => {
    setInvitingGroup(group);
  };

  const handleShowCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleSaveGroup = async (name: string) => {
    if (!editingGroup) return;

    try {
      await updateGroupMutation.mutateAsync({
        groupId: editingGroup.id,
        updates: { name }
      });
    } catch (error) {
      console.error('Failed to update group:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const handleCreateGroup = async (data: CreateGroupRequest) => {
    try {
      await createGroupMutation.mutateAsync(data);
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const handleGenerateInviteCode = async (groupId: string) => {
    return await generateInviteCodeMutation.mutateAsync(groupId);
  };

  const handleRevokeInviteCode = async (codeId: string) => {
    await revokeInviteCodeMutation.mutateAsync(codeId);
  };

  if (!user) {
    return null; // AuthWrapper will handle this
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-3">
                Your Groups
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Manage your dining circles and see who you&apos;re sharing meals with.
              </p>
            </div>
            {/* Create Group Button - Only visible to Admins */}
            <PermissionGate capability="create_group">
              <Button 
                onClick={handleShowCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white ml-8"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </PermissionGate>
          </div>
        </section>

        {/* Groups Section */}
        <section>
          {(groupsLoading || permissionsLoading) ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 mb-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userGroups.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Groups Yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You&apos;re not part of any dining groups yet. Join a group using an invite code to start sharing restaurant reviews with your circle.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => router.push('/welcome')}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Join a Group
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/restaurants')}
                >
                  Explore Restaurants
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onViewDetails={handleViewDetails}
                  isExpanded={expandedGroupId === group.id}
                  onEditGroup={handleEditGroup}
                  onInviteToGroup={handleInviteToGroup}
                  onRevokeInviteCode={handleRevokeInviteCode}
                />
              ))}
            </div>
          )}
        </section>

        {/* Footer Section */}
        {userGroups.length > 0 && (
          <section className="mt-12 text-center">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Want to join another group?
              </h3>
              <p className="text-gray-600 mb-4">
                Get an invite code from a friend to join their dining circle.
              </p>
              <Button 
                variant="outline"
                onClick={() => router.push('/welcome')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Join Another Group
              </Button>
            </div>
          </section>
        )}
      </main>

      {/* Edit Group Modal */}
      {editingGroup && (
        <EditGroupModal
          group={editingGroup}
          isOpen={!!editingGroup}
          onOpenChange={(open) => !open && setEditingGroup(null)}
          onSave={handleSaveGroup}
          isLoading={updateGroupMutation.isPending}
        />
      )}

      {/* Invite Code Modal */}
      {invitingGroup && (
        <InviteCodeModal
          group={invitingGroup}
          isOpen={!!invitingGroup}
          onOpenChange={(open) => !open && setInvitingGroup(null)}
          onGenerateCode={handleGenerateInviteCode}
          isLoading={generateInviteCodeMutation.isPending}
        />
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSave={handleCreateGroup}
        isLoading={createGroupMutation.isPending}
      />
    </div>
  );
};

export default GroupsClient;