/**
 * Settings API Module
 * ====================
 * API functions for user settings management (Twilio credentials, etc).
 */

import { api } from './base';

// =============================================================================
// Types
// =============================================================================

export interface UserSettings {
    id: string;
    email: string;
    role: string;
    plan: string;
    is_active: boolean;
    has_twilio: boolean;
    twilio_account_sid_masked: string | null;
    twilio_auth_token_masked: string | null;
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

export const settingsApi = {
    getSettings,
    saveTwilioSettings,
    removeTwilioSettings,
};
