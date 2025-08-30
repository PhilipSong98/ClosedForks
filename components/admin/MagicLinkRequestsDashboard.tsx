'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { MagicLinkRequest } from '@/types/auth';
import { useAuth } from '@/lib/hooks/useAuth';

export function MagicLinkRequestsDashboard() {
  const [requests, setRequests] = useState<MagicLinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  const fetchRequests = async () => {
    try {
      setError(null);
      const response = await fetch('/api/auth/request-magic-link');
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch magic link requests:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const processRequest = async (requestId: string, action: 'approve' | 'deny') => {
    setProcessing(requestId);
    try {
      // For now, we'll just send the magic link directly for approved requests
      // In a more complete implementation, you'd have an admin-specific API
      
      if (action === 'approve') {
        const request = requests.find(r => r.id === requestId);
        if (!request) return;

        // Send magic link via Supabase auth
        const { supabase } = await import('@/lib/supabase/client');
        const { error } = await supabase.auth.signInWithOtp({
          email: request.email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) {
          throw new Error('Failed to send magic link');
        }

        // Update request status (you'd implement this API endpoint)
        console.log(`Approved and sent magic link to ${request.email}`);
        
        // Update local state
        setRequests(prev => prev.map(r => 
          r.id === requestId 
            ? { ...r, status: 'approved' as const, processed_at: new Date().toISOString() }
            : r
        ));
      } else {
        // Deny request (you'd implement this API endpoint)
        console.log(`Denied request from ${requests.find(r => r.id === requestId)?.email}`);
        
        setRequests(prev => prev.map(r => 
          r.id === requestId 
            ? { ...r, status: 'denied' as const, processed_at: new Date().toISOString() }
            : r
        ));
      }
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
      setError(`Failed to ${action} request`);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="text-yellow-600" />;
      case 'approved':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'denied':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      denied: 'bg-red-50 text-red-700 border-red-200'
    };

    return (
      <Badge 
        variant="outline" 
        className={variants[status as keyof typeof variants] || 'bg-gray-50 text-gray-700 border-gray-200'}
      >
        <div className="flex items-center space-x-1">
          {getStatusIcon(status)}
          <span className="capitalize">{status}</span>
        </div>
      </Badge>
    );
  };

  if (!isAdmin) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="text-red-600" />
            <span>Access Denied</span>
          </CardTitle>
          <CardDescription>
            You need admin privileges to view this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Magic Link Requests</h1>
          <p className="text-gray-600">Manage access requests to the platform</p>
        </div>
        <Button onClick={fetchRequests} disabled={loading} size="sm">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <RefreshCw size={20} className="animate-spin mr-2" />
              Loading requests...
            </div>
          </CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <Clock size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No magic link requests</p>
              <p>New access requests will appear here</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{request.email}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Requested: {new Date(request.created_at).toLocaleString()}</p>
                      {request.requested_by_ip && (
                        <p>IP: {request.requested_by_ip}</p>
                      )}
                      {request.processed_at && (
                        <p>Processed: {new Date(request.processed_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  
                  {request.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => processRequest(request.id, 'deny')}
                        disabled={processing === request.id}
                        variant="outline"
                      >
                        Deny
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => processRequest(request.id, 'approve')}
                        disabled={processing === request.id}
                      >
                        {processing === request.id ? 'Sending...' : 'Approve & Send Link'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}