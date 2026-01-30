/**
 * Chloe Store
 * ===========
 * Manages Chloe calls state.
 */

import { writable, derived } from 'svelte/store';
import { chloeApi, type ChloeCall } from '../api/chloe';

export interface ChloeState {
    calls: ChloeCall[];
    isLoading: boolean;
    error: string | null;
}

const initialState: ChloeState = {
    calls: [],
    isLoading: false,
    error: null
};

function createChloeStore() {
    const { subscribe, set, update } = writable<ChloeState>(initialState);

    return {
        subscribe,
        setLoading: (loading: boolean) => update(s => ({ ...s, isLoading: loading, error: loading ? null : s.error })),
        setError: (error: string | null) => update(s => ({ ...s, isLoading: false, error })),
        setCalls: (calls: ChloeCall[]) => update(s => ({ ...s, calls, isLoading: false })),
        reset: () => set(initialState)
    };
}

export const chloeStore = createChloeStore();

export const allCalls = derived(chloeStore, $s => $s.calls);

export async function loadCalls(limit = 50, offset = 0) {
    chloeStore.setLoading(true);
    try {
        const calls = await chloeApi.listCalls(limit, offset);
        chloeStore.setCalls(calls);
    } catch (error) {
        console.error('Failed to load calls:', error);
        chloeStore.setError(error instanceof Error ? error.message : 'Failed to load calls');
    }
}
