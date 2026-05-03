/**
 * Settings API Module
 * ====================
 * API functions for user settings management (Twilio credentials, webhooks, etc).
 */

import { api } from './base';

// =============================================================================
// Types
// =============================================================================

export interface WebhookUrls {
    webhook_token: string | null;
    incoming_url: string | null;
    status_url: string | null;
    instructions: string;
}

export interface UserSettings {
    id: string;
    email: string;
    role: string;
    plan: string;
    is_active: boolean;
    has_twilio: boolean;
    twilio_account_sid_masked: string | null;
    twilio_auth_token_masked: string | null;
    webhook_urls: WebhookUrls | null;
    created_at: string;
}

export interface TwilioSettingsRequest {
    twilio_account_sid: string;
    twilio_auth_token: string;
}

// =============================================================================
// API Functions
// =============================================================================

export async function getSettings(): Promise<UserSettings> {
    return api.get<UserSettings>('/auth/me/settings');
}

export async function saveTwilioSettings(data: TwilioSettingsRequest): Promise<UserSettings> {
    return api.put<UserSettings>('/auth/me/settings/twilio', data);
}

export async function removeTwilioSettings(): Promise<{ message: string }> {
    return api.delete<{ message: string }>('/auth/me/settings/twilio');
}

export async function getWebhookUrls(): Promise<WebhookUrls> {
    return api.get<WebhookUrls>('/auth/me/settings/webhook');
}

export async function regenerateWebhookToken(): Promise<WebhookUrls> {
    return api.post<WebhookUrls>('/auth/me/settings/webhook/regenerate', {});
}

export const settingsApi = {
    getSettings,
    saveTwilioSettings,
    removeTwilioSettings,
    getWebhookUrls,
    regenerateWebhookToken,
};
