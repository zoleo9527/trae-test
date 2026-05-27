import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { requireRoles } from '$lib/user';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  if (!browser) return;
  const result = requireRoles(['manager']);
  if ('redirect' in result) throw redirect(302, result.redirect);
};
