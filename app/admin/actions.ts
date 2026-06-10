'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AdminLoginState = {
  error?: string;
} | undefined;

export async function loginAdmin(
  _state: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Zadaj email aj heslo.' };
  }

  const supabase = await createSupabaseServerClient({ mutable: true });
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Prihlásenie zlyhalo. Skontroluj údaje a skús znova.' };
  }

  redirect('/admin');
}

export async function logoutAdmin() {
  const supabase = await createSupabaseServerClient({ mutable: true });
  await supabase.auth.signOut();
  redirect('/admin/login');
}
