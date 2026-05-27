<script>
  import { onMount } from 'svelte';
  import { siteAPI, deviceAPI } from '$lib/api';
  import { MapPin, Wrench, AlertTriangle, CheckCircle } from 'lucide-svelte';

  let sites = [];
  let devices = [];
  let loading = true;
  let selectedSite = null;
  let siteDevices = [];

  async function loadData() {
    loading = true;
    try {
      const [sitesRes, devicesRes] = await Promise.all([
        siteAPI.list(),
        deviceAPI.list({}),
      ]);
      sites = sitesRes;
      devices = devicesRes;
    } finally {
      loading = false;
    }
  }

  async function loadSiteDevices(site) {
    selectedSite = site;
    siteDevices = devices.filter((d) => d.site_id === site.id);
  }

  function getStatusBadge(status) {
    const badges = {
      normal: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      fault: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }

  function getStatusLabel(status) {
    const labels = { normal: '正常', warning: '预警', fault: '故障' };
    return labels[status] || status;
  }

  function getTypeLabel(type) {
    const labels = { high_pressure: '高压水枪', foam: '泡沫机', vacuum: '吸尘器', dryer: '吹干机' };
    return labels[type] || type;
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="space-y-6">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {#each sites as site}
      <div
        on:click={() => loadSiteDevices(site)}
        class="card p-6 cursor-pointer hover:shadow-md transition-all {selectedSite?.id === site.id ? 'ring-2 ring-primary-500' : ''}"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MapPin class="w-5 h-5 text-blue-600" />
          </div>
          <span class="badge {site.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
            {site.status === 'active' ? '营业中' : '维护中'}
          </span>
        </div>
        <h3 class="font-semibold text-gray-900">{site.name}</h3>
        <p class="text-sm text-gray-500 mt-1">{site.address}</p>
        <div class="flex items-center gap-4 mt-4 text-sm">
          <span class="flex items-center gap-1 text-gray-500">
            <Wrench class="w-4 h-4" />
            {site.device_count} 台设备
          </span>
          <span class="text-gray-500">{site.city}</span>
        </div>
      </div>
    {/each}
  </div>

  {#if selectedSite}
    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">{selectedSite.name} - 设备列表</h2>
        <div class="flex items-center gap-4 text-sm">
          <span class="flex items-center gap-1 text-green-600">
            <CheckCircle class="w-4 h-4" />
            {siteDevices.filter((d) => d.status === 'normal').length} 正常
          </span>
          <span class="flex items-center gap-1 text-yellow-600">
            <AlertTriangle class="w-4 h-4" />
            {siteDevices.filter((d) => d.status === 'warning').length} 预警
          </span>
          <span class="flex items-center gap-1 text-red-600">
            <Wrench class="w-4 h-4" />
            {siteDevices.filter((d) => d.status === 'fault').length} 故障
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {#each siteDevices as device}
          <div class="p-4 border border-gray-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="font-mono text-sm">{device.device_no}</span>
              <span class="badge {getStatusBadge(device.status)}">{getStatusLabel(device.status)}</span>
            </div>
            <p class="font-medium">{device.name}</p>
            <p class="text-sm text-gray-500 mt-1">{getTypeLabel(device.type)}</p>
            <p class="text-xs text-gray-400 mt-2">位置：{device.location}</p>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
