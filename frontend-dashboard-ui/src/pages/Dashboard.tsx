import { Droplets, Battery, Activity, RefreshCw } from 'lucide-react';
import { useTelemetry } from '../hooks/useTelemetry';
import { StatusCard } from '../components/StatusCard';
import { SoilMoistureChart } from '../components/SoilMoistureChart';
import { AlertsLog } from '../components/AlertsLog';
import type { IrrigationStatus } from '../types/telemetry';

/**
 * Página principal do Dashboard com visualização em tempo real dos dados de irrigação.
 */
export const Dashboard = () => {
  const { data, loading, error, refresh } = useTelemetry(5000);

  // Calcula os valores para os cards de status
  const getLatestData = () => {
    if (data.length === 0) {
      return {
        soilMoisture: 0,
        batteryLevel: 0,
        deviceId: 'N/A',
      };
    }

    const latest = data[0];
    return {
      soilMoisture: latest.soilMoisture,
      batteryLevel: latest.batteryLevel,
      deviceId: latest.deviceId,
    };
  };

  // Determina o status do sistema baseado na umidade
  const getSystemStatus = (): { status: IrrigationStatus; label: string } => {
    if (data.length === 0) {
      return { status: 'monitoring', label: 'Sem dados' };
    }

    const latest = data[0];
    
    if (latest.soilMoisture < 30) {
      return { status: 'irrigating', label: 'Irrigando' };
    } else if (latest.soilMoisture < 50) {
      return { status: 'warning', label: 'Atenção' };
    } else {
      return { status: 'monitoring', label: 'Monitorando' };
    }
  };

  const latest = getLatestData();
  const systemStatus = getSystemStatus();

  // Cor do status
  const getStatusColor = () => {
    switch (systemStatus.status) {
      case 'irrigating':
        return { icon: 'text-blue-600', bg: 'bg-blue-50' };
      case 'warning':
        return { icon: 'text-orange-600', bg: 'bg-orange-50' };
      case 'error':
        return { icon: 'text-red-600', bg: 'bg-red-50' };
      default:
        return { icon: 'text-green-600', bg: 'bg-green-50' };
    }
  };

  const statusColors = getStatusColor();

  if (error) {
    return (
      <div className="ml-64 p-8">
        <div className="card bg-red-50 border-red-200">
          <h2 className="text-xl font-bold text-red-800 mb-2">Erro ao carregar dados</h2>
          <p className="text-red-600">{error.message}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitoramento em tempo real do sistema de irrigação
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Cards de Status (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatusCard
          title="Última Umidade Lida"
          value={loading ? '...' : latest.soilMoisture.toFixed(1)}
          unit="%"
          icon={Droplets}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatusCard
          title="Nível de Bateria"
          value={loading ? '...' : latest.batteryLevel.toFixed(1)}
          unit="V"
          icon={Battery}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatusCard
          title="Status do Sistema"
          value={systemStatus.label}
          icon={Activity}
          iconColor={statusColors.icon}
          bgColor={statusColors.bg}
        />
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Histórico - Ocupa 2 colunas */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="card">
              <div className="flex items-center justify-center h-96">
                <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
                <span className="ml-3 text-gray-600">Carregando dados...</span>
              </div>
            </div>
          ) : (
            <SoilMoistureChart data={data} />
          )}
        </div>

        {/* Log de Alertas - Ocupa 1 coluna */}
        <div className="lg:col-span-1">
          {loading ? (
            <div className="card">
              <div className="flex items-center justify-center h-96">
                <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            </div>
          ) : (
            <AlertsLog data={data} />
          )}
        </div>
      </div>

      {/* Informações adicionais */}
      {!loading && data.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Última atualização: {new Date(data[0].timestamp).toLocaleString('pt-BR')} • 
            Total de leituras: {data.length} • 
            Dispositivo ativo: {latest.deviceId}
          </p>
        </div>
      )}
    </div>
  );
};

