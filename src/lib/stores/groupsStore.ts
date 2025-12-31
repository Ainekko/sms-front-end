/**
 * Groups Store
 * =============
 * Manages contact groups state.
 */

import { writable, derived } from 'svelte/store';
import { groupsApi, type ContactGroup } from '../api/groups';

export interface GroupsState {
    groups: ContactGroup[];
    isLoading: boolean;
    error: string | null;
}

const initialState: GroupsState = {
    groups: [],
    isLoading: false,
    error: null
};

function createGroupsStore() {
    const { subscribe, set, update } = writable<GroupsState>(initialState);

    return {
        subscribe,
        setLoading: (loading: boolean) => update(s => ({ ...s, isLoading: loading, error: loading ? null : s.error })),
        setError: (error: string | null) => update(s => ({ ...s, isLoading: false, error })),
        setGroups: (groups: ContactGroup[]) => update(s => ({ ...s, groups, isLoading: false })),
        reset: () => set(initialState)
    };
}

export const groupsStore = createGroupsStore();

export const allGroups = derived(groupsStore, $s => $s.groups);

export async function loadGroups() {
    groupsStore.setLoading(true);
    try {
        const groups = await groupsApi.listGroups();
        groupsStore.setGroups(groups);
    } catch (error) {
        console.error('Failed to load groups:', error);
        groupsStore.setError(error instanceof Error ? error.message : 'Failed to load groups');
    }
}
