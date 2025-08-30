import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inviteCodeValidationSchema } from '@/lib/validations';
import { InviteCodeValidation } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Too many attempts. Please try again in 15 minutes.'
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = inviteCodeValidationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          valid: false, 
          message: validation.error.errors[0]?.message || 'Invalid invite code format'
        },
        { status: 400 }
      );
    }

    const { code } = validation.data;
    const supabase = await createClient();

    // Use the database function to validate the invite code
    const { data: result, error } = await supabase
      .rpc('validate_invite_code', { code_to_check: code });

    if (error) {
      console.error('Error validating invite code:', error);
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Error validating invite code. Please try again.' 
        },
        { status: 500 }
      );
    }

    const validationResult = result as InviteCodeValidation;

    // If valid, store in session for signup process
    if (validationResult.valid) {
      // In a real app, you'd use a more secure session mechanism
      // For now, we'll include the validation in the response
      return NextResponse.json({
        ...validationResult,
        sessionData: {
          code,
          validatedAt: new Date().toISOString(),
          codeId: validationResult.code_id
        }
      });
    }

    return NextResponse.json(validationResult);

  } catch (error) {
    console.error('Unexpected error validating invite code:', error);
    return NextResponse.json(
      { 
        valid: false, 
        message: 'An unexpected error occurred. Please try again.' 
      },
      { status: 500 }
    );
  }
}

// Rate limiting helper - in production, use Redis or similar
const ipAttempts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = ipAttempts.get(ip);
  
  if (!attempts || now > attempts.resetTime) {
    // Reset or initialize
    ipAttempts.set(ip, { count: 1, resetTime: now + (15 * 60 * 1000) }); // 15 minutes
    return true;
  }
  
  if (attempts.count >= 5) {
    return false; // Rate limited
  }
  
  attempts.count++;
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of ipAttempts.entries()) {
    if (now > attempts.resetTime) {
      ipAttempts.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes