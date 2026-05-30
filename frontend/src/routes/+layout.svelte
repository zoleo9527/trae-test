<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import '../app.css';

	onMount(async () => {
		await auth.checkAuth();
	});
</script>

<slot />
