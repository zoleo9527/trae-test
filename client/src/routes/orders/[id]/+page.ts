import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { getUserSync } from '$lib/user';
import { getOrder } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  if (!browser) {
    return { order: null };
  }
  
  const user = getUserSync();
  if (!user) throw redirect(302, '/login');
  
  const order = await getOrder(params.id);
  
  if (user.role !== 'manager') {
    const isEditor = user.role === 'editor' && order.editorId === user.id;
    const isService = user.role === 'service' && order.serviceId === user.id;
    if (!isEditor && !isService) {
      throw redirect(302, '/orders');
    }
  }
  
  return { order };
};
