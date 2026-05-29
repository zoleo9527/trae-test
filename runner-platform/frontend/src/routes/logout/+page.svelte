<script lang="ts">
	import { goto } from '$app/navigation';
	import { clearAuth } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	onMount(() => {
		clearAuth();
		goto('/login');
	});
</script>

<div class="flex items-center justify-center min-h-screen">
	<p>正在退出...</p>
</div>
