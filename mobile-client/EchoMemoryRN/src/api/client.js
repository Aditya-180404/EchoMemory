import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * EchoMemory API Client for React Native
 */

const API_BASE = "http://10.0.2.2/echomemory/backend-server/api"; // Android Emulator to Host IP

export const ApiClient = {

    _getHeaders: async () => {
        const token = await AsyncStorage.getItem('em_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },

    getMemories: async () => {
        const response = await fetch(`${API_BASE}/memories.php`, {
            headers: await ApiClient._getHeaders()
        });
        const result = await response.json();
        return result.data || [];
    },

    syncBatch: async (batch) => {
        const deviceId = "android_device_id"; // In production, use device info
        const response = await fetch(`${API_BASE}/sync.php`, {
            method: 'POST',
            headers: await ApiClient._getHeaders(),
            body: JSON.stringify({ batch, device_id: deviceId })
        });
        return await response.json();
    },

    uploadMedia: async (fileUri, type) => {
        const token = await AsyncStorage.getItem('em_token');
        const formData = new FormData();
        formData.append('media', {
            uri: fileUri,
            name: 'reflection.wav',
            type: 'audio/wav'
        });
        formData.append('type', type);

        const response = await fetch(`${API_BASE}/upload.php`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: formData
        });

        return await response.json();
    }
};
