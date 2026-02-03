/**
 * Elio Store
 * ==========
 * Manages Elio leads state with filtering and pagination.
 */

import { writable, derived } from 'svelte/store';
import { elioApi, type ElioLead, type ListLeadsParams } from '../api/elio';

export interface ElioFilters {
    subreddit: string;
    status: string;
    minUrgency: number | null;
    searchQuery: string;
}

export interface ElioState {
    leads: ElioLead[];
    isLoading: boolean;
    error: string | null;
    total: number;
    offset: number;
    limit: number;
    filters: ElioFilters;
}

const initialFilters: ElioFilters = {
    subreddit: '',
    status: '',
    minUrgency: null,
    searchQuery: ''
};

const initialState: ElioState = {
    leads: [],
    isLoading: false,
    error: null,
    total: 0,
    offset: 0,
    limit: 50,
    filters: initialFilters
};

function createElioStore() {
    const { subscribe, set, update } = writable<ElioState>(initialState);

    return {
        subscribe,
        setLoading: (loading: boolean) => update(s => ({ ...s, isLoading: loading, error: loading ? null : s.error })),
        setError: (error: string | null) => update(s => ({ ...s, isLoading: false, error })),
        setLeads: (leads: ElioLead[], total: number) => update(s => ({ ...s, leads, total, isLoading: false })),
        appendLeads: (leads: ElioLead[], total: number, offset: number) => update(s => ({
            ...s,
            leads: [...s.leads, ...leads],
            total,
            offset,
            isLoading: false
        })),
        updateFilters: (filters: Partial<ElioFilters>) => update(s => ({
            ...s,
            filters: { ...s.filters, ...filters },
            offset: 0  // Reset pagination when filters change
        })),
        updateLeadInList: (updatedLead: ElioLead) => update(s => ({
            ...s,
            leads: s.leads.map(l => l.id === updatedLead.id ? updatedLead : l)
        })),
        reset: () => set(initialState)
    };
}

export const elioStore = createElioStore();

// Derived store for client-side search filtering
export const filteredLeads = derived(elioStore, $s => {
    if (!$s.filters.searchQuery) return $s.leads;

    const q = $s.filters.searchQuery.toLowerCase();
    return $s.leads.filter(lead =>
        (lead.title && lead.title.toLowerCase().includes(q)) ||
        (lead.content_preview && lead.content_preview.toLowerCase().includes(q)) ||
        (lead.author && lead.author.toLowerCase().includes(q)) ||
        (lead.location && lead.location.toLowerCase().includes(q))
    );
});

/**
 * Load leads from API with current filters.
 */
export async function loadLeads(append = false) {
    let currentState: ElioState;
    elioStore.subscribe(s => currentState = s)();

    const params: ListLeadsParams = {
        limit: currentState!.limit,
        offset: append ? currentState!.offset + currentState!.limit : 0
    };

    if (currentState!.filters.subreddit) params.subreddit = currentState!.filters.subreddit;
    if (currentState!.filters.status) params.status = currentState!.filters.status;
    if (currentState!.filters.minUrgency) params.min_urgency = currentState!.filters.minUrgency;

    elioStore.setLoading(true);
    try {
        const response = await elioApi.listLeads(params);
        if (append) {
            elioStore.appendLeads(response.leads, response.total, response.offset);
        } else {
            elioStore.setLeads(response.leads, response.total);
        }
    } catch (error) {
        console.error('Failed to load leads:', error);
        elioStore.setError(error instanceof Error ? error.message : 'Failed to load leads');
    }
}

/**
 * Update a lead's status via API and refresh local state.
 */
export async function updateLeadStatus(leadId: string, status: string) {
    try {
        const updatedLead = await elioApi.updateLeadStatus(leadId, status);
        elioStore.updateLeadInList(updatedLead);
        return updatedLead;
    } catch (error) {
        console.error('Failed to update lead status:', error);
        throw error;
    }
}
