'use client';

import { useState } from 'react';
import { Copy, Plus, Users, Calendar, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { INVITE_STATUS } from '@/constants';

export default function InvitePage() {
  const [invites] = useState([]); // Will be populated with real data later
  const [email, setEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // TODO: Implement invite creation API call
      console.log('Creating invite for:', email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEmail('');
    } catch (error) {
      console.error('Failed to create invite:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const copyInviteLink = (code: string) => {
    const url = `${window.location.origin}/join?code=${code}`;
    navigator.clipboard.writeText(url);
    // TODO: Show toast notification
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Invites</h1>
        <p className="mt-2 text-sm text-gray-600">
          Invite friends and family to join your restaurant review network
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create New Invite */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Invite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="friend@example.com"
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty to create a general invite link
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Invite'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Existing Invites */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Invites
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invites.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No invites created yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first invite to start building your network
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invites.map((invite: any) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {invite.email || 'General invite'}
                          </span>
                          <Badge 
                            variant={invite.status === 'accepted' ? 'default' : 
                                    invite.status === 'expired' ? 'destructive' : 'secondary'}
                          >
                            {INVITE_STATUS[invite.status as keyof typeof INVITE_STATUS]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Expires {new Date(invite.expires_at).toLocaleDateString()}</span>
                          </div>
                          <span>Code: {invite.code}</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInviteLink(invite.code)}
                        disabled={invite.status !== 'pending'}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}