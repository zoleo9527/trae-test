import { getUserSync } from '$lib/user';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ url }) => {
  const user = getUserSync();
  const isLogin = url.pathname === '/login';
  
  if (!user && !isLogin) throw redirect(302, '/login');
  if (user && isLogin) throw redirect(302, '/orders');
  
  return { user };
};
