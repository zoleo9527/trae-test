import { redirect } from '@sveltejs/kit';
import { getUserSync } from '$lib/user';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const user = getUserSync();
  if (!user) throw redirect(302, '/login');
};
