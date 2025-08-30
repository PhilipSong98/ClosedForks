'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, Eye, EyeOff } from 'lucide-react';
import { InviteCode } from '@/types';

export default function AdminInviteCodesPage() {
  const { user, isAdmin } = useAuth();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCodes, setShowCodes] = useState(false);

  useEffect(() => {
    if (user && !isAdmin) {
      // Redirect non-admins
      window.location.href = '/';
      return;
    }

    if (user && isAdmin) {
      loadInviteCodes();
    }
  }, [user, isAdmin]);

  const loadInviteCodes = async () => {
    // This would be implemented once we can connect to the database
    setIsLoading(false);
    // For now, show placeholder data
    setCodes([
      {
        id: '1',
        code: '123456',
        description: 'Initial access code for testing and family',
        max_uses: 50,
        current_uses: 3,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    // In a real app, show a toast notification
    alert('Code copied to clipboard!');
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Invite Code Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage invite codes for your exclusive restaurant review network
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stats */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {codes.filter(c => c.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Active Codes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {codes.reduce((sum, c) => sum + c.current_uses, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Uses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {codes.reduce((sum, c) => sum + (c.max_uses - c.current_uses), 0)}
              </div>
              <div className="text-sm text-gray-600">Remaining Uses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">
                {codes.length}
              </div>
              <div className="text-sm text-gray-600">Total Codes</div>
            </CardContent>
          </Card>
        </div>

        {/* Create New Code */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Code</label>
                <Input placeholder="123456" disabled />
                <p className="text-xs text-gray-500">
                  Automatically generated 6-digit code
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input placeholder="Description..." disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Uses</label>
                <Input type="number" placeholder="10" disabled />
              </div>
              <Button className="w-full" disabled>
                Create Code
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Available after database migration
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Existing Codes */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invite Codes</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCodes(!showCodes)}
              >
                {showCodes ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Codes
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Codes
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                </div>
              ) : codes.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No codes created yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first invite code to start inviting users
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {codes.map((code) => (
                    <div
                      key={code.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg">
                            {showCodes ? code.code : '••••••'}
                          </span>
                          <Badge 
                            variant={code.is_active ? 'default' : 'secondary'}
                          >
                            {code.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {code.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          Uses: {code.current_uses} / {code.max_uses}
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(code.code)}
                        disabled={!code.is_active}
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

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How to Use Invite Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <ol>
              <li>Share the 6-digit code with friends or family members</li>
              <li>They visit your restaurant review site and enter the code</li>
              <li>After validation, they can create their account</li>
              <li>Once registered, they have full access to create and view reviews</li>
            </ol>
            <p className="text-sm text-gray-600 mt-4">
              <strong>Note:</strong> Currently showing sample data. The full functionality will be available after the database migration is applied.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}