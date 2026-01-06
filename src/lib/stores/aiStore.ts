/**
 * AI Store
 * =========
 * Svelte store for managing AI-related state.
 * 
 * Features:
 * - DNC contacts list
 * - Hot leads list
 * - AI summary statistics
 * - Loading and error states
 * 
 * Usage:
 *   import { dncContacts, loadDNCList, aiSummary } from '$lib/stores/aiStore';
 *   await loadDNCList(brandId);
 */

import { writable, derived } from 'svelte/store';
import { aiApi, type DNCContact, type HotLead, type ContactListSummary, type ContactWithAI } from '../api/ai';

// =============================================================================
// Types
// =============================================================================

export interface AIState {
    /** Do-not-contact contacts */
    dncContacts: DNCContact[];

    /** Hot leads (priority 3) */
    hotLeads: HotLead[];

    /** AI summary statistics */
    summary: ContactListSummary | null;

    /** Contacts filtered by AI */
    filteredContacts: ContactWithAI[];

    /** Current priority filter */
    currentPriorityFilter: number | null;

    /** Loading states */
    isLoadingDNC: boolean;
    isLoadingHotLeads: boolean;
    isLoadingSummary: boolean;
    isLoadingContacts: boolean;

    /** Error messages */
    dncError: string | null;
    hotLeadsError: string | null;
    summaryError: string | null;
    contactsError: string | null;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: AIState = {
    dncContacts: [],
    hotLeads: [],
    summary: null,
    filteredContacts: [],
    currentPriorityFilter: null,
    isLoadingDNC: false,
    isLoadingHotLeads: false,
    isLoadingSummary: false,
    isLoadingContacts: false,
    dncError: null,
    hotLeadsError: null,
    summaryError: null,
    contactsError: null,
};

// =============================================================================
// Store Creation
// =============================================================================

function createAIStore() {
    const { subscribe, set, update } = writable<AIState>(initialState);

    return {
        subscribe,

        /**
         * Reset the store to initial state.
         */
        reset: () => set(initialState),

        /**
         * Set DNC loading state.
         */
        setDNCLoading: (loading: boolean) => {
            update(state => ({ ...state, isLoadingDNC: loading, dncError: null }));
        },

        /**
         * Set DNC contacts.
         */
        setDNCContacts: (contacts: DNCContact[]) => {
            update(state => ({ ...state, dncContacts: contacts, isLoadingDNC: false }));
        },

        /**
         * Set DNC error.
         */
        setDNCError: (error: string) => {
            update(state => ({ ...state, dncError: error, isLoadingDNC: false }));
        },

        /**
         * Set hot leads loading state.
         */
        setHotLeadsLoading: (loading: boolean) => {
            update(state => ({ ...state, isLoadingHotLeads: loading, hotLeadsError: null }));
        },

        /**
         * Set hot leads.
         */
        setHotLeads: (leads: HotLead[]) => {
            update(state => ({ ...state, hotLeads: leads, isLoadingHotLeads: false }));
        },

        /**
         * Set hot leads error.
         */
        setHotLeadsError: (error: string) => {
            update(state => ({ ...state, hotLeadsError: error, isLoadingHotLeads: false }));
        },

        /**
         * Set summary loading state.
         */
        setSummaryLoading: (loading: boolean) => {
            update(state => ({ ...state, isLoadingSummary: loading, summaryError: null }));
        },

        /**
         * Set AI summary.
         */
        setSummary: (summary: ContactListSummary) => {
            update(state => ({ ...state, summary, isLoadingSummary: false }));
        },

        /**
         * Set summary error.
         */
        setSummaryError: (error: string) => {
            update(state => ({ ...state, summaryError: error, isLoadingSummary: false }));
        },

        /**
         * Set filtered contacts loading state.
         */
        setContactsLoading: (loading: boolean) => {
            update(state => ({ ...state, isLoadingContacts: loading, contactsError: null }));
        },

        /**
         * Set filtered contacts.
         */
        setFilteredContacts: (contacts: ContactWithAI[], priority: number | null) => {
            update(state => ({
                ...state,
                filteredContacts: contacts,
                currentPriorityFilter: priority,
                isLoadingContacts: false
            }));
        },

        /**
         * Set contacts error.
         */
        setContactsError: (error: string) => {
            update(state => ({ ...state, contactsError: error, isLoadingContacts: false }));
        },
    };
}

// =============================================================================
// Exported Store Instance
// =============================================================================

export const aiStore = createAIStore();

// =============================================================================
// Derived Stores
// =============================================================================

/**
 * Just the DNC contacts list.
 */
export const dncContacts = derived(aiStore, $store => $store.dncContacts);

/**
 * Just the hot leads list.
 */
export const hotLeads = derived(aiStore, $store => $store.hotLeads);

/**
 * Just the AI summary.
 */
export const aiSummary = derived(aiStore, $store => $store.summary);

/**
 * Is any AI data loading?
 */
export const isLoadingAI = derived(aiStore, $store =>
    $store.isLoadingDNC ||
    $store.isLoadingHotLeads ||
    $store.isLoadingSummary ||
    $store.isLoadingContacts
);

/**
 * DNC count from summary or contacts.
 */
export const dncCount = derived(aiStore, $store =>
    $store.summary?.do_not_contact_count ?? $store.dncContacts.length
);

/**
 * Hot leads count.
 */
export const hotLeadsCount = derived(aiStore, $store =>
    $store.summary?.priority_3_count ?? $store.hotLeads.length
);

// =============================================================================
// Actions
// =============================================================================

/**
 * Load do-not-contact list.
 * 
 * @param brandId - Optional brand ID filter
 */
export async function loadDNCList(brandId?: string): Promise<void> {
    aiStore.setDNCLoading(true);

    try {
        const contacts = await aiApi.getDNCList(brandId);
        aiStore.setDNCContacts(contacts);
    } catch (error) {
        console.error('[AIStore] Failed to load DNC list:', error);
        aiStore.setDNCError(error instanceof Error ? error.message : 'Failed to load DNC list');
    }
}

/**
 * Load hot leads.
 * 
 * @param brandId - Optional brand ID filter
 * @param limit - Max leads to return
 */
export async function loadHotLeads(brandId?: string, limit = 50): Promise<void> {
    aiStore.setHotLeadsLoading(true);

    try {
        const leads = await aiApi.getHotLeads(brandId, limit);
        aiStore.setHotLeads(leads);
    } catch (error) {
        console.error('[AIStore] Failed to load hot leads:', error);
        aiStore.setHotLeadsError(error instanceof Error ? error.message : 'Failed to load hot leads');
    }
}

/**
 * Load AI summary statistics.
 * 
 * @param brandId - Optional brand ID filter
 */
export async function loadAISummary(brandId?: string): Promise<void> {
    aiStore.setSummaryLoading(true);

    try {
        const summary = await aiApi.getContactsAISummary(brandId);
        aiStore.setSummary(summary);
    } catch (error) {
        console.error('[AIStore] Failed to load AI summary:', error);
        aiStore.setSummaryError(error instanceof Error ? error.message : 'Failed to load AI summary');
    }
}

/**
 * Load contacts filtered by AI priority.
 * 
 * @param priority - Priority level (0-3) or null for all
 * @param brandId - Optional brand ID filter
 */
export async function loadContactsByPriority(priority: number | null, brandId?: string): Promise<void> {
    aiStore.setContactsLoading(true);

    try {
        const filters = {
            brand_id: brandId,
            priority: priority ?? undefined,
            include_dnc: false, // Exclude DNC from regular lists
            analyzed_only: true,
        };

        const contacts = await aiApi.getContactsWithAI(filters);
        aiStore.setFilteredContacts(contacts, priority);
    } catch (error) {
        console.error('[AIStore] Failed to load contacts by priority:', error);
        aiStore.setContactsError(error instanceof Error ? error.message : 'Failed to load contacts');
    }
}

/**
 * Load all AI data for a brand.
 * 
 * @param brandId - Optional brand ID filter
 */
export async function loadAllAIData(brandId?: string): Promise<void> {
    await Promise.all([
        loadAISummary(brandId),
        loadHotLeads(brandId),
        loadDNCList(brandId),
    ]);
}
