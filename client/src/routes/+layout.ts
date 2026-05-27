import { browser } from '$app/environment';
import { getUserSync } from '$lib/user';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ url }) => {
  const isLogin = url.pathname === '/login';
  
  if (!browser) {
    return { user: null };
  }
  
  const user = getUserSync();
  
  if (!user && !isLogin) throw redirect(302, '/login');
  if (user && isLogin) throw redirect(302, '/orders');
  
  return { user };
};
