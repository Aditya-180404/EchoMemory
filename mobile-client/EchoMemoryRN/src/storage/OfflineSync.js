import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiClient } from '../api/client';
import NetInfo from '@react-native-community/netinfo';

/**
 * EchoMemory Offline Sync Manager
 * Manages the local queue and background synchronization
 */

export const OfflineSync = {
    QUEUE_KEY: 'em_sync_queue',

    init: () => {
        // Monitor network state
        NetInfo.addEventListener(state => {
            if (state.isConnected && state.isInternetReachable) {
                OfflineSync.processQueue();
            }
        });
    },

    /**
     * Add a task to the offline queue
     */
    addToQueue: async (type, data) => {
        const queueRaw = await AsyncStorage.getItem(OfflineSync.QUEUE_KEY);
        const queue = queueRaw ? JSON.parse(queueRaw) : [];

        queue.push({
            id: Date.now().toString(),
            type,
            data,
            timestamp: new Date().toISOString(),
            retries: 0
        });

        await AsyncStorage.setItem(OfflineSync.QUEUE_KEY, JSON.stringify(queue));

        // Attempt immediate sync
        OfflineSync.processQueue();
    },

    /**
     * Process all pending tasks in the queue
     */
    processQueue: async () => {
        const queueRaw = await AsyncStorage.getItem(OfflineSync.QUEUE_KEY);
        if (!queueRaw) return;

        let queue = JSON.parse(queueRaw);
        if (queue.length === 0) return;

        const netState = await NetInfo.fetch();
        if (!netState.isConnected) return;

        console.log(`Syncing ${queue.length} items...`);

        // Batch Sync approach (using /api/sync.php)
        try {
            const result = await ApiClient.syncBatch(queue);
            if (result.status === 'success') {
                // Clear successfully synced items
                // In production, we'd filter based on result.details.failed_ids
                await AsyncStorage.setItem(OfflineSync.QUEUE_KEY, JSON.stringify([]));
                console.log("Sync complete");
            }
        } catch (e) {
            console.error("Batch sync failed", e);
        }
    }
};
