import { writable, derived, get } from 'svelte/store';
import type { FilterState, RelayItem, Role } from '../types';
import { SEED_RELAYS } from '../data/seed';

export const currentRole = writable<Role>('dispatcher');
export const relays = writable<RelayItem[]>(JSON.parse(JSON.stringify(SEED_RELAYS)));

export const filters = writable<FilterState>({
  roleView: 'dispatcher',
  status: 'all',
  exceptionType: 'all',
  operatorId: 'all',
  machineId: 'all',
  keyword: '',
  dateFrom: undefined,
  dateTo: undefined
});

export const filteredRelays = derived(
  [relays, filters],
  ([$relays, $f]) => {
    return $relays.filter((r) => {
      if ($f.status !== 'all' && r.status !== $f.status) return false;
      if ($f.exceptionType !== 'all' && r.exceptionType !== $f.exceptionType) return false;
      if ($f.operatorId !== 'all' && r.operatorId !== $f.operatorId) return false;
      if ($f.machineId !== 'all' && r.machineId !== $f.machineId) return false;
      if ($f.keyword) {
        const kw = $f.keyword.toLowerCase();
        if (!r.id.toLowerCase().includes(kw) && !r.taskType.toLowerCase().includes(kw)) {
          return false;
        }
      }
      return true;
    });
  }
);

export const exceptionStats = derived(relays, ($r) => {
  const stats = { total: $r.length, late: 0, incomplete: 0, disconnected: 0, repair: 0 };
  $r.forEach((r) => {
    if (r.exceptionType === 'late_report') stats.late++;
    if (r.exceptionType === 'incomplete_subsidy') stats.incomplete++;
    if (r.exceptionType === 'disconnected') stats.disconnected++;
    if (r.exceptionType === 'repair_delay') stats.repair++;
  });
  return stats;
});

export function addTimelineEntry(relayId: string, entry: { role: Role; action: string; note?: string }) {
  relays.update((list) =>
    list.map((r) => {
      if (r.id === relayId) {
        return {
          ...r,
          timeline: [...r.timeline, { at: new Date().toISOString(), ...entry }],
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    })
  );
}

export function updateRelay(relayId: string, patch: Partial<RelayItem>) {
  relays.update((list) =>
    list.map((r) => (r.id === relayId ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r))
  );
}
