import { AlertTriangle, Battery, AlertCircle } from 'lucide-react';
import type { SensorData } from '../types/telemetry';
import { format, parseISO } from 'date-fns';

interface AlertsLogProps {
  data: SensorData[];
}

/**
 * Componente para exibir log de alertas do sistema (solo seco, bateria baixa, etc).
 */
export const AlertsLog = ({ data }: AlertsLogProps) => {
  // Processa os dados para extrair alertas
  const getAlerts = () => {
    const alerts: Array<{
      id: string;
      type: 'drought' | 'battery';
      message: string;
      deviceId: string;
      timestamp: string;
    }> = [];

    // Pega os últimos 50 registros para análise
    const recentData = data.slice(0, 50);

    recentData.forEach(item => {
      // Alerta de solo seco (umidade < 30%)
      if (item.soilMoisture < 30) {
        alerts.push({
          id: `drought-${item.id}`,
          type: 'drought',
          message: `Solo seco detectado (${item.soilMoisture.toFixed(1)}%)`,
          deviceId: item.deviceId,
          timestamp: item.timestamp,
        });
      }

      // Alerta de bateria baixa (< 3.2V)
      if (item.batteryLevel < 3.2) {
        alerts.push({
          id: `battery-${item.id}`,
          type: 'battery',
          message: `Bateria baixa (${item.batteryLevel.toFixed(1)}V)`,
          deviceId: item.deviceId,
          timestamp: item.timestamp,
        });
      }
    });

    // Ordena por timestamp (mais recente primeiro) e pega os últimos 10
    return alerts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  };

  const alerts = getAlerts();

  const getAlertIcon = (type: 'drought' | 'battery') => {
    switch (type) {
      case 'drought':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'battery':
        return <Battery className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type: 'drought' | 'battery') => {
    switch (type) {
      case 'drought':
        return 'bg-orange-50 border-orange-200';
      case 'battery':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="card">
      <h3 className="card-title flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        Log de Alertas
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhum alerta no momento</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className={`border rounded-lg p-3 ${getAlertColor(alert.type)} transition-colors hover:shadow-sm`}
            >
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-600">{alert.deviceId}</span>
                    <span className="text-xs text-gray-400">
                      {format(parseISO(alert.timestamp), "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

