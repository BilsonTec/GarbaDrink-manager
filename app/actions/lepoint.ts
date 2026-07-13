// app/actions/lepoint.ts
'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function solderPoint() {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ventes')
    .update({
      statut_recupere: true,
      solde_le: new Date().toISOString(),
    })
    .eq('encaisse_par', 'garbashaw')
    .eq('statut_recupere', false)
    .eq('annulee', false);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/le-point');
  revalidatePath('/historique');
  return { success: true };
}