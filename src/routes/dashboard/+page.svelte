<script lang="ts">
  import { currentRole, filteredRelays, exceptionStats } from '$lib/stores/app';
  import { ROLES, STATUS_LABELS } from '$lib/data/seed';
  import FilterPanel from '$lib/components/FilterPanel.svelte';
  import RelayList from '$lib/components/RelayList.svelte';
  import ExceptionBanner from '$lib/components/ExceptionBanner.svelte';
  import { goto } from '$app/navigation';

  const roleInfo = ROLES.find((r) => r.id === $currentRole);

  $: directorView = $currentRole === 'director';
  $: dispatcherView = $currentRole === 'dispatcher';
  $: operatorView = $currentRole === 'operator';
</script>

<div class="dashboard">
  <div class="welcome-bar">
    <div class="welcome-left">
      <span class="welcome-avatar">{roleInfo?.avatar}</span>
      <div>
        <div class="welcome-title">{roleInfo?.name}工作台</div>
        <div class="welcome-sub">{roleInfo?.description}</div>
      </div>
    </div>
    <div class="welcome-right">
      <button class="logout-btn" on:click={() => goto('/')}>退出</button>
    </div>
  </div>

  {#if directorView}
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-num">{$exceptionStats.total}</div>
        <div class="stat-label">总任务数</div>
      </div>
      <div class="stat-card stat-late">
        <div class="stat-num">{$exceptionStats.late}</div>
        <div class="stat-label">进度报晚</div>
      </div>
      <div class="stat-card stat-inc">
        <div class="stat-num">{$exceptionStats.incomplete}</div>
        <div class="stat-label">补贴不齐</div>
      </div>
      <div class="stat-card stat-disc">
        <div class="stat-num">{$exceptionStats.disconnected}</div>
        <div class="stat-label">链路脱节</div>
      </div>
    </div>
  {/if}

  <ExceptionBanner />

  <div class="section-title">
    <span>任务接力列表</span>
    <span class="count-badge">{$filteredRelays.length} 条</span>
  </div>

  <FilterPanel />

  {#if operatorView}
    <div class="role-hint">
      机手操作提示：油料待领的任务可以直接点「领取油料」；作业中可点「报工/报晚」或提交维修申请。
    </div>
  {/if}
  {#if dispatcherView}
    <div class="role-hint">
      调度员操作提示：待调度的任务可「审批油料」；维修待处理的任务可「处理维修」；补贴待归档的可「收齐补贴材料」；异常任务需回访衔接。
    </div>
  {/if}
  {#if directorView}
    <div class="role-hint">
      理事视图：关注异常统计和全流程合规，可按异常类型筛选查看具体任务和时间线。
    </div>
  {/if}

  <RelayList />

  <details class="tradeoff-panel">
    <summary>当前实现的取舍与后续可扩展点</summary>
    <div class="tradeoff-content">
      <h4>取舍点</h4>
      <ul>
        <li><b>状态驱动而非流程驱动</b>：用 <code>RelayStatus</code> 枚举 + <code>STATUS_FLOW</code> 状态机描述业务流转，比硬编码的步骤条更灵活，但异常场景需要额外的 <code>exceptionType</code> 字段辅助呈现。</li>
        <li><b>单表接力 vs 多业务分离</b>：油料、维修、补贴、作业进度合并在一张 <code>RelayItem</code> 上而非分散到各表，是为了保证"接力感"——一眼能看到这条链路哪里断了。代价是单条记录字段较多，后续可拆出关联表。</li>
        <li><b>时间线即说明</b>：所有操作通过 <code>timeline</code> 字段留下记录，替代了截图和语音，每个环节的说明直接内嵌在时间线里，避免了大家到处找"为什么这样"。</li>
        <li><b>角色内联权限</b>：没有做独立的权限系统，通过 <code>currentRole</code> + 卡片上的 <code>actionLabel</code> 控制可操作按钮。真实环境需要接入认证和 RBAC。</li>
        <li><b>前端状态即数据库</b>：当前用 Svelte writable store 存所有数据，刷新即重置。真实环境需要对接 API 和持久化。</li>
      </ul>
      <h4>后续可扩展点</h4>
      <ul>
        <li><b>油料库存管理</b>：当前只记录领用，未扣减库存。可接入油库库存表、出入库流水、预警阈值。</li>
        <li><b>维修配件库</b>：维修登记里的零件只是字符串，后续可接入配件库存、采购、供应商。</li>
        <li><b>补贴自动校验</b>：补贴材料目前手工勾选，可加材料清单模板、上传附件、OCR 识别、与农机管理系统对接自动比对。</li>
        <li><b>地图可视化</b>：地块数据已有经纬度基础，可叠加地图展示作业范围、进度热力图。</li>
        <li><b>通知推送</b>：状态变更时通过短信/微信通知相关角色，目前只在界面上有按钮，没有推送通道。</li>
        <li><b>统计报表</b>：理事视图的统计较粗，可按月/季出油耗分析、维修频次、补贴合规率等报表。</li>
        <li><b>多合作社</b>：当前是单社演示，可加入合作社表、数据隔离。</li>
      </ul>
    </div>
  </details>
</div>
