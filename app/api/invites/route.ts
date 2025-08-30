import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inviteSchema } from '@/lib/validations';

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: invites, error } = await supabase
      .from('invites')
      .select(`
        *,
        inviter:users(name, email)
      `)
      .eq('inviter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invites:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invites' },
        { status: 500 }
      );
    }

    return NextResponse.json({ invites });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const json = await request.json();
    
    // Set default expiry to 7 days if not provided
    const expiresAt = json.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const validatedData = inviteSchema.parse({
      ...json,
      expires_at: expiresAt,
    });

    // Generate unique invite code
    let code: string;
    let codeExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (codeExists && attempts < maxAttempts) {
      code = generateInviteCode();
      const { data: existing } = await supabase
        .from('invites')
        .select('id')
        .eq('code', code)
        .single();
      
      codeExists = !!existing;
      attempts++;
    }

    if (codeExists) {
      return NextResponse.json(
        { error: 'Failed to generate unique invite code' },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invite, error } = await (supabase.from('invites') as any)
      .insert({
        inviter_id: user.id,
        code: code!,
        email: validatedData.email || null,
        expires_at: validatedData.expires_at,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invite:', error);
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      );
    }

    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}