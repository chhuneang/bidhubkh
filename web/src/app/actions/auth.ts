'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard'

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const companyName = formData.get('companyName') as string

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        company_name: companyName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Create initial company record if user created
  if (data.user && companyName) {
    try {
      const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + data.user.id.slice(0, 8)
      await supabase.from('companies').insert({
        user_id: data.user.id,
        name: companyName,
        slug: slug,
        industry: 'General Contractor / Supplier',
        location: 'Phnom Penh, Cambodia',
      })
    } catch {
      // Ignored if handled by trigger or already exists
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
