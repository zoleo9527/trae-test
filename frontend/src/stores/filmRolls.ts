import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api';
import type { FilmRoll } from '@/env';

export const useFilmRollsStore = defineStore('filmRolls', () => {
  const filmRolls = ref<FilmRoll[]>([]);
  const loading = ref(false);

  async function fetchFilmRolls(query?: any) {
    loading.value = true;
    try {
      const response = await api.get('/film-rolls', { params: query });
      filmRolls.value = response.data;
      return response.data;
    } finally {
      loading.value = false;
    }
  }

  return {
    filmRolls,
    loading,
    fetchFilmRolls,
  };
});
