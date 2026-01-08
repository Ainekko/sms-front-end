/**
 * Campaigns Store
 * ================
 * Manages campaign state and operations.
 */

import { writable, derived } from 'svelte/store';
import { campaignsApi, type CampaignResponse, type CreateCampaignRequest, type CampaignInsightsResponse } from '../api/campaigns';

// =============================================================================
// Types
// =============================================================================

export interface CampaignsState {
    campaigns: CampaignResponse[];
    currentCampaign: CampaignResponse | null;
    currentInsights: CampaignInsightsResponse | null;
    campaignConversations: any[];
    isLoading: boolean;
    isLoadingInsights: boolean;
    error: string | null;
}

const initialState: CampaignsState = {
    campaigns: [],
    currentCampaign: null,
    currentInsights: null,
    campaignConversations: [],
    isLoading: false,
    isLoadingInsights: false,
    error: null
};

// =============================================================================
// Store Creation
// =============================================================================

function createCampaignsStore() {
    const { subscribe, set, update } = writable<CampaignsState>(initialState);

    return {
        subscribe,
        setLoading: (loading: boolean) => update(s => ({ ...s, isLoading: loading, error: loading ? null : s.error })),
        setLoadingInsights: (loading: boolean) => update((s: CampaignsState) => ({ ...s, isLoadingInsights: loading })),
        setError: (error: string | null) => update(s => ({ ...s, isLoading: false, error })),
        setCampaigns: (campaigns: CampaignResponse[]) => update(s => ({ ...s, campaigns, isLoading: false })),
        setCurrentCampaign: (campaign: CampaignResponse | null) => update(s => ({ ...s, currentCampaign: campaign, currentInsights: null, campaignConversations: [], isLoading: false })),
        setCurrentInsights: (insights: CampaignInsightsResponse | null) => update((s: CampaignsState) => ({ ...s, currentInsights: insights, isLoadingInsights: false })),
        addCampaign: (campaign: CampaignResponse) => update(s => ({ ...s, campaigns: [campaign, ...s.campaigns], isLoading: false })),
        updateCampaignInList: (campaign: CampaignResponse) => update(s => ({
            ...s,
            campaigns: s.campaigns.map(c => c.id === campaign.id ? campaign : c),
            currentCampaign: s.currentCampaign?.id === campaign.id ? campaign : s.currentCampaign,
            isLoading: false
        })),
        setCampaignConversations: (conversations: any[]) => update(s => ({ ...s, campaignConversations: conversations, isLoading: false })),
        reset: () => set(initialState)
    };
}

export const campaignsStore = createCampaignsStore();

// =============================================================================
// Derived Stores
// =============================================================================

export const isLoading = derived(campaignsStore, $s => $s.isLoading);
export const isLoadingInsights = derived(campaignsStore, ($s: CampaignsState) => $s.isLoadingInsights);
export const campaignError = derived(campaignsStore, ($s: CampaignsState) => $s.error);
export const allCampaigns = derived(campaignsStore, $s => $s.campaigns);
export const currentCampaign = derived(campaignsStore, $s => $s.currentCampaign);
export const currentInsights = derived(campaignsStore, $s => $s.currentInsights);
export const campaignConversations = derived(campaignsStore, $s => $s.campaignConversations);

// =============================================================================
// Actions
// =============================================================================

/**
 * Load all campaigns.
 */
export async function loadCampaigns() {
    campaignsStore.setLoading(true);
    try {
        const campaigns = await campaignsApi.getCampaigns();
        campaignsStore.setCampaigns(campaigns);
    } catch (error) {
        console.error('Failed to load campaigns:', error);
        campaignsStore.setError(error instanceof Error ? error.message : 'Failed to load campaigns');
    }
}

/**
 * Load a specific campaign.
 */
export async function loadCampaign(id: string) {
    campaignsStore.setLoading(true);
    try {
        const campaign = await campaignsApi.getCampaign(id);
        campaignsStore.setCurrentCampaign(campaign);
    } catch (error) {
        console.error('Failed to load campaign:', error);
        campaignsStore.setError(error instanceof Error ? error.message : 'Failed to load campaign');
    }
}

/**
 * Create a new campaign.
 */
export async function createCampaign(data: CreateCampaignRequest) {
    campaignsStore.setLoading(true);
    try {
        const campaign = await campaignsApi.createCampaign(data);
        campaignsStore.addCampaign(campaign);
        return campaign;
    } catch (error) {
        console.error('Failed to create campaign:', error);
        campaignsStore.setError(error instanceof Error ? error.message : 'Failed to create campaign');
        throw error;
    }
}

/**
 * Execute a campaign.
 */
export async function executeCampaign(id: string) {
    campaignsStore.setLoading(true);
    try {
        await campaignsApi.executeCampaign(id);
        // Refresh the campaign to get updated status
        await loadCampaign(id);
    } catch (error) {
        console.error('Failed to execute campaign:', error);
    }
}

/**
 * Cancel a pending campaign.
 */
export async function cancelCampaign(id: string) {
    campaignsStore.setLoading(true);
    try {
        const campaign = await campaignsApi.cancelCampaign(id);
        campaignsStore.updateCampaignInList(campaign);
        return campaign;
    } catch (error) {
        console.error('Failed to cancel campaign:', error);
        campaignsStore.setError(error instanceof Error ? error.message : 'Failed to cancel campaign');
        throw error;
    }
}

/**
 * Delete a campaign (only pending or cancelled).
 */
export async function deleteCampaign(id: string) {
    campaignsStore.setLoading(true);
    try {
        await campaignsApi.deleteCampaign(id);
        // Remove from campaigns list
        campaignsStore.setCampaigns(
            (await campaignsApi.getCampaigns())
        );
    } catch (error) {
        console.error('Failed to delete campaign:', error);
        campaignsStore.setError(error instanceof Error ? error.message : 'Failed to delete campaign');
        throw error;
    }
}

/**
 * Load conversations for a campaign.
 */
export async function loadCampaignConversations(id: string) {
    campaignsStore.setLoading(true);
    try {
        const conversations = await campaignsApi.getCampaignConversations(id);
        campaignsStore.setCampaignConversations(conversations);
    } catch (error) {
        console.error('Failed to load campaign conversations:', error);
        campaignsStore.setError(error instanceof Error ? error.message : 'Failed to load campaign conversations');
    }
}

/**
 * Load insights for a campaign.
 */
export async function loadCampaignInsights(id: string) {
    campaignsStore.setLoadingInsights(true);
    try {
        const insights = await campaignsApi.getCampaignInsights(id);
        campaignsStore.setCurrentInsights(insights);
    } catch (error) {
        console.error('Failed to load campaign insights:', error);
        campaignsStore.setCurrentInsights(null);
    }
}

// =============================================================================
// Polling Logic
// =============================================================================

let pollingInterval: any = null;

/**
 * Start polling a campaign for status updates.
 */
export function startPolling(id: string, intervalMs: number = 3000) {
    stopPolling();
    pollingInterval = setInterval(async () => {
        try {
            const campaign = await campaignsApi.getCampaign(id);
            campaignsStore.updateCampaignInList(campaign);

            // Stop polling if completed or failed
            if (['completed', 'failed', 'cancelled'].includes(campaign.status)) {
                stopPolling();
            }
        } catch (error) {
            console.error('Polling error:', error);
            // Don't stop polling on transient errors, but maybe log it
        }
    }, intervalMs);
}

/**
 * Stop polling.
 */
export function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}
