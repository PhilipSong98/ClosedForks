import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { detectCookieConflicts, createProfileData, authLog } from '@/lib/utils/auth';
import { AUTH_ROUTES } from '@/lib/constants/auth';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  let redirectPath = '/';
  
  if (code) {
    try {
      // Force reading of cookies to ensure code verifier is available
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      
      authLog('DEBUG', 'Auth callback received', { 
        cookieCount: allCookies.length,
        cookieNames: allCookies.map(c => c.name)
      });
      
      // Detect and log conflicting cookies
      const conflictResult = detectCookieConflicts(
        allCookies, 
        process.env.NEXT_PUBLIC_SUPABASE_URL!
      );
      
      if (conflictResult.hasConflicts) {
        authLog('WARN', 'Cookie conflicts detected', {
          conflictCount: conflictResult.conflictingCookies.length,
          conflictingCookies: conflictResult.conflictingCookies.map(c => c.name),
          currentProject: conflictResult.currentProjectId
        });
      }
      
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        authLog('ERROR', 'Code exchange failed', { 
          errorCode: error.code,
          errorMessage: error.message 
        });
        return NextResponse.redirect(`${origin}${AUTH_ROUTES.ERROR}`);
      }
      
      authLog('INFO', 'Successfully exchanged code for session', {
        userId: data?.user?.id
      });
      
      // Create user profile if it doesn't exist and determine redirect path
      
      if (data?.user) {
        try {
          const { data: existingProfile } = await supabase
            .from('users')
            .select('id, password_set, first_login_completed, is_admin_user')
            .eq('id', data.user.id)
            .single() as { data: { id: string; password_set?: boolean; first_login_completed?: boolean; is_admin_user?: boolean } | null; error: Error | null };
          
          if (!existingProfile) {
            authLog('INFO', 'Creating user profile', { userId: data.user.id });
            
            const profileData = createProfileData(data.user);
            // Set admin status for admin email
            if (data.user.email === 'philip.song1998@gmail.com') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (profileData as any).is_admin_user = true;
            }
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('users') as any).insert(profileData);
            authLog('INFO', 'User profile created successfully');
            
            // New users need to set password
            redirectPath = '/auth/set-password';
          } else {
            authLog('DEBUG', 'User profile already exists');
            
            // Check if user needs to complete password setup
            if (!existingProfile.password_set || !existingProfile.first_login_completed) {
              redirectPath = '/auth/set-password';
            }
            
            // Update admin status if needed
            if (data.user.email === 'philip.song1998@gmail.com' && !existingProfile.is_admin_user) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase.from('users') as any)
                .update({ is_admin_user: true })
                .eq('id', data.user.id);
            }
          }
        } catch (profileError) {
          authLog('WARN', 'Failed to create user profile', { 
            error: profileError instanceof Error ? profileError.message : String(profileError)
          });
          // Don't block auth flow if profile creation fails - assume they need password setup
          redirectPath = '/auth/set-password';
        }
      }
    } catch (error) {
      authLog('ERROR', 'Unexpected error in auth callback', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return NextResponse.redirect(`${origin}${AUTH_ROUTES.ERROR}`);
    }
  }
  
  // Redirect based on authentication flow
  return NextResponse.redirect(`${origin}${redirectPath}`);
}