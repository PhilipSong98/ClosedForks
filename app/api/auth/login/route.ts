import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { User } from '@/types'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const supabase = await createClient()
    
    // Attempt to sign in with email and password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('Login error:', authError)
      
      // Return user-friendly error messages
      if (authError.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
      
      if (authError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Please check your email and click the confirmation link' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: 'Login failed. Please try again.' },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 401 }
      )
    }

    // Fetch user profile to check password status
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, password_set, first_login_completed, is_admin_user')
      .eq('id', authData.user.id)
      .single() as { data: User | null; error: Error | null }

    if (profileError) {
      console.error('Profile fetch error after login:', profileError)
      // User is authenticated but profile fetch failed - this is unusual
      // Return success but indicate profile issues
      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.name || email.split('@')[0]
        },
        requiresPasswordSetup: true, // Assume they need to set password
        profileError: true
      })
    }

    // Check if user needs to complete password setup
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 500 }
      )
    }

    const requiresPasswordSetup = !profile.password_set || !profile.first_login_completed

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        password_set: profile.password_set,
        first_login_completed: profile.first_login_completed,
        is_admin_user: profile.is_admin_user
      },
      requiresPasswordSetup,
      isAdmin: profile.is_admin_user
    })

  } catch (error) {
    console.error('Login route error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}