<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { token } from '$lib/stores/auth';

	onMount(() => {
		if ($token) {
			goto('/orders');
		} else {
			goto('/login');
		}
	});
</script>

<div class="flex items-center justify-center min-h-screen">
	<p>加载中...</p>
</div>
