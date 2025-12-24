/**
 * Users API Module
 * ================
 * API functions for user management (admin only).
 */

import { api } from './base';
import type { User } from '../types/auth.types';

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get all users.
 */
export async function getUsers(): Promise<User[]> {
    return api.get<User[]>('/users');
}

/**
 * Promote a user to admin.
 */
export async function promoteUser(userId: string): Promise<User> {
    return api.put<User>(`/users/${userId}/promote`, {});
}

/**
 * Depromote an admin to regular user.
 */
export async function depromoteUser(userId: string): Promise<User> {
    return api.put<User>(`/users/${userId}/depromote`, {});
}

/**
 * Delete a user.
 */
export async function deleteUser(userId: string): Promise<void> {
    return api.delete(`/users/${userId}`);
}

/**
 * Reset a user's password.
 */
export async function resetPassword(userId: string, password: string): Promise<void> {
    return api.put(`/users/${userId}/password`, { password });
}

/**
 * Users API object for convenient access.
 */
export const usersApi = {
    getUsers,
    promoteUser,
    depromoteUser,
    deleteUser,
    resetPassword,
};
