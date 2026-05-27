import { redirect } from '@sveltejs/kit';
import { requireRoles } from '$lib/user';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
  const result = requireRoles(['manager']);
  if ('redirect' in result) throw redirect(302, result.redirect);
};
