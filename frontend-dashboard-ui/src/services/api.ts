import axios from 'axios';
import type { SensorData } from '../types/telemetry';

/**
 * Configuração base do Axios para comunicação com o backend.
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Serviço de API para telemetria.
 */
export const telemetryService = {
  /**
   * Busca todas as leituras de telemetria do backend.
   * 
   * @returns Promise com array de SensorData
   */
  async getAllTelemetry(): Promise<SensorData[]> {
    try {
      const response = await api.get<SensorData[]>('/telemetry');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados de telemetria:', error);
      throw error;
    }
  },

  /**
   * Busca telemetria de um dispositivo específico.
   * 
   * @param deviceId Identificador do dispositivo
   * @returns Promise com array de SensorData do dispositivo
   */
  async getTelemetryByDevice(deviceId: string): Promise<SensorData[]> {
    try {
      const response = await api.get<SensorData[]>(`/telemetry/device/${deviceId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar telemetria do dispositivo ${deviceId}:`, error);
      throw error;
    }
  },
};

export default api;

