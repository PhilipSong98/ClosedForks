import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const setPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = setPasswordSchema.parse(body)

    const supabase = await createClient()
    
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error in set-password:', authError)
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Update user's password in Supabase Auth
    const { error: passwordError } = await supabase.auth.updateUser({
      password: password
    })

    if (passwordError) {
      console.error('Password update error:', passwordError)
      return NextResponse.json(
        { error: 'Failed to set password' },
        { status: 500 }
      )
    }

    // Update user profile to mark password as set
    const { error: profileError } = await supabase
      .from('users')
      .update({ 
        password_set: true,
        first_login_completed: true 
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Don't fail the request if profile update fails - password was set successfully
      console.warn('Password was set but profile update failed')
    }

    // If user is admin email, set admin status
    if (user.email === 'philip.song1998@gmail.com') {
      const { error: adminError } = await supabase
        .from('users')
        .update({ is_admin_user: true })
        .eq('id', user.id)
      
      if (adminError) {
        console.error('Admin status update error:', adminError)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Password set successfully' 
    })

  } catch (error) {
    console.error('Set password error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}