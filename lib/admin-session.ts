import 'server-only';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getAdminUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user ?? null;
}

export async function requireAdminUser() {
  const user = await getAdminUser();

  if (!user) {
    redirect('/admin/login');
  }

  return user;
}
