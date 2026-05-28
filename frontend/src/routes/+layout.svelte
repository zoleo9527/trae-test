<script>
	import '../app.css';
	import { user } from '$lib/stores/user';
	import { onMount } from 'svelte';

	onMount(() => {
		user.loadFromStorage();
	});
</script>

<slot />
