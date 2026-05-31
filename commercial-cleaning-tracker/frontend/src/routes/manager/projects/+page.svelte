<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getProjects } from '$lib/stores';
	import type { Project } from '$lib/types';

	let projects: Project[] = [];
	let loading = true;

	onMount(async () => {
		try {
			projects = await getProjects();
		} finally {
			loading = false;
		}
	});

	function getStatusLabel(status: string) {
		const labels: Record<string, string> = {
			active: '进行中',
			expiring: '即将到期',
			inactive: '已结束'
		};
		return labels[status] || status;
	}

	function getStatusClass(status: string) {
		const classes: Record<string, string> = {
			active: 'status-active',
			expiring: 'status-expiring',
			inactive: 'status-inactive'
		};
		return classes[status] || '';
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('zh-CN');
	}
</script>

<Layout title="项目列表" activeMenu="projects">
	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		<div class="toolbar">
			<span class="total">共 {projects.length} 个项目</span>
		</div>

		<div class="project-grid">
			{#each projects as project}
				<div class="project-card">
					<div class="project-header">
						<h3>{project.Name}</h3>
						<span class={`status-tag ${getStatusClass(project.Status)}`}>{getStatusLabel(project.Status)}</span>
					</div>
					<div class="project-body">
						<div class="info-row">
							<span class="label">地址：</span>
							<span class="value">{project.Address}</span>
						</div>
						<div class="info-row">
							<span class="label">负责人：</span>
							<span class="value">{project.Manager?.Name || '-'}</span>
						</div>
						<div class="info-row">
							<span class="label">合同周期：</span>
							<span class="value">{formatDate(project.ContractStart)} ~ {formatDate(project.ContractEnd)}</span>
						</div>
						<div class="info-row">
							<span class="label">客户：</span>
							<span class="value">{project.CustomerName}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</Layout>

<style>
	.toolbar { margin-bottom: 20px; }
	.total { color: #718096; font-size: 14px; }
	.project-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 20px;
	}
	.project-card {
		background: white;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
		overflow: hidden;
	}
	.project-header {
		padding: 16px;
		background: #f7fafc;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.project-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: #2d3748; }
	.status-tag { padding: 4px 10px; border-radius: 4px; font-size: 12px; }
	.status-active { background: #c6f6d5; color: #276749; }
	.status-expiring { background: #fefcbf; color: #975a16; }
	.status-inactive { background: #e2e8f0; color: #718096; }
	.project-body { padding: 16px; }
	.info-row { display: flex; margin-bottom: 10px; font-size: 14px; }
	.info-row:last-child { margin-bottom: 0; }
	.label { color: #a0aec0; width: 80px; flex-shrink: 0; }
	.value { color: #4a5568; flex: 1; }
	.loading { text-align: center; padding: 40px; color: #718096; }
</style>
