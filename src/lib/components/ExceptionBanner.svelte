<script lang="ts">
  import { exceptionStats, filters } from '$lib/stores/app';
  import { EXCEPTION_LABELS } from '$lib/data/seed';

  function filterException(type) {
    filters.update((f) => ({ ...f, exceptionType: type }));
  }
</script>

{#if $exceptionStats.late > 0 || $exceptionStats.incomplete > 0 || $exceptionStats.disconnected > 0 || $exceptionStats.repair > 0}
  <div class="exception-banner">
    <div class="banner-title">异常反馈（点击可筛选）</div>
    <div class="banner-items">
      {#if $exceptionStats.late > 0}
        <button class="banner-item exc-late_report" on:click={() => filterException('late_report')} type="button">
          <span class="count">{$exceptionStats.late}</span>
          <span class="label">{EXCEPTION_LABELS.late_report}</span>
        </button>
      {/if}
      {#if $exceptionStats.incomplete > 0}
        <button class="banner-item exc-incomplete_subsidy" on:click={() => filterException('incomplete_subsidy')} type="button">
          <span class="count">{$exceptionStats.incomplete}</span>
          <span class="label">{EXCEPTION_LABELS.incomplete_subsidy}</span>
        </button>
      {/if}
      {#if $exceptionStats.disconnected > 0}
        <button class="banner-item exc-disconnected" on:click={() => filterException('disconnected')} type="button">
          <span class="count">{$exceptionStats.disconnected}</span>
          <span class="label">{EXCEPTION_LABELS.disconnected}</span>
        </button>
      {/if}
      {#if $exceptionStats.repair > 0}
        <button class="banner-item exc-repair_delay" on:click={() => filterException('repair_delay')} type="button">
          <span class="count">{$exceptionStats.repair}</span>
          <span class="label">{EXCEPTION_LABELS.repair_delay}</span>
        </button>
      {/if}
    </div>
  </div>
{/if}
