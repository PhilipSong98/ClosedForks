import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { headers } from 'next/headers'

const magicLinkRequestSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = magicLinkRequestSchema.parse(body)

    const supabase = await createClient()
    const headersList = headers()
    
    // Get client info for tracking
    const userAgent = headersList.get('user-agent')
    const forwarded = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ipAddress = forwarded?.split(',')[0] || realIp || request.ip || 'unknown'

    // Check if user already exists and has a password
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, password_set, is_admin_user')
      .eq('email', email)
      .single()

    // If user exists and has password, suggest they login instead
    if (existingUser && existingUser.password_set) {
      return NextResponse.json({
        error: 'User already exists with password. Please use the login form instead.',
        hasPassword: true
      }, { status: 400 })
    }

    // Check if this is the admin email - allow direct access
    if (email === 'philip.song1998@gmail.com') {
      // Send magic link directly for admin
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
        }
      })

      if (magicLinkError) {
        console.error('Admin magic link error:', magicLinkError)
        return NextResponse.json(
          { error: 'Failed to send magic link' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Magic link sent to admin email',
        isAdmin: true
      })
    }

    // For non-admin users, log the request for admin approval
    const { data: request_record, error: insertError } = await supabase
      .from('magic_link_requests')
      .insert({
        email,
        requested_by_ip: ipAddress,
        requested_by_user_agent: userAgent
      })
      .select()
      .single()

    if (insertError) {
      console.error('Magic link request insert error:', insertError)
      
      // Check if it's a duplicate request (constraint violation)
      if (insertError.code === '23505') {
        return NextResponse.json({
          error: 'You have already requested access today. Please wait for admin approval.',
          duplicate: true
        }, { status: 400 })
      }

      return NextResponse.json(
        { error: 'Failed to process request' },
        { status: 500 }
      )
    }

    // TODO: Send email notification to admin about the new request
    // This can be implemented using your preferred email service (Resend, etc.)
    
    console.log(`New magic link request from ${email} (ID: ${request_record.id})`)

    return NextResponse.json({
      success: true,
      message: 'Your request has been submitted and is pending admin approval. You will receive a magic link once approved.',
      requestId: request_record.id
    })

  } catch (error) {
    console.error('Magic link request error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for admin to view pending requests
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin_user')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin_user) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch pending magic link requests
    const { data: requests, error: fetchError } = await supabase
      .from('magic_link_requests')
      .select(`
        id,
        email,
        requested_by_ip,
        requested_by_user_agent,
        status,
        admin_notes,
        processed_by,
        processed_at,
        created_at,
        processor:processed_by(name, email)
      `)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Fetch magic link requests error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      requests: requests || []
    })

  } catch (error) {
    console.error('GET magic link requests error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}