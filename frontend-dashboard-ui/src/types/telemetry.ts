/**
 * Interface que representa os dados de telemetria do sensor.
 * Espelha a entidade SensorData do backend Java.
 */
export interface SensorData {
  id: number;
  deviceId: string;
  soilMoisture: number;
  batteryLevel: number;
  timestamp: string; // ISO 8601 string format
}

/**
 * Tipo para representar o status do sistema de irrigação.
 */
export type IrrigationStatus = 'monitoring' | 'irrigating' | 'warning' | 'error';

/**
 * Interface para dados de alerta do sistema.
 */
export interface Alert {
  id: string;
  message: string;
  deviceId: string;
  timestamp: string;
  type: 'drought' | 'battery' | 'error';
}

