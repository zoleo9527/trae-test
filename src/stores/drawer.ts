import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDrawerStore = defineStore('drawer', () => {
  const incidentOpen = ref(false);
  const selectedIncidentId = ref<string | null>(null);

  function openIncident(id: string) {
    selectedIncidentId.value = id;
    incidentOpen.value = true;
  }

  function closeIncident() {
    incidentOpen.value = false;
  }

  return { incidentOpen, selectedIncidentId, openIncident, closeIncident };
});
