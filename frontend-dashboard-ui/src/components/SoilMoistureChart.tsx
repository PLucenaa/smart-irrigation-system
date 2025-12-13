import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { SensorData } from '../types/telemetry';
import { format, parseISO, subHours } from 'date-fns';

interface SoilMoistureChartProps {
  data: SensorData[];
}

/**
 * Componente de gráfico de linha para visualizar a evolução da umidade do solo.
 */
export const SoilMoistureChart = ({ data }: SoilMoistureChartProps) => {
  // Processa os dados para o gráfico: pega as últimas 24 horas e agrupa por dispositivo
  const processChartData = () => {
    const now = new Date();
    const hoursAgo = subHours(now, 24);
    
    // Filtra dados das últimas 24 horas
    const recentData = data.filter(item => {
      const timestamp = parseISO(item.timestamp);
      return timestamp >= hoursAgo;
    });

    // Agrupa por hora e dispositivo
    const groupedByDevice: Record<string, SensorData[]> = {};
    
    recentData.forEach(item => {
      if (!groupedByDevice[item.deviceId]) {
        groupedByDevice[item.deviceId] = [];
      }
      groupedByDevice[item.deviceId].push(item);
    });

    // Prepara dados para o gráfico (pega amostras a cada hora)
    const chartData: Record<string, any>[] = [];
    const deviceIds = Object.keys(groupedByDevice);

    // Cria entradas por hora nas últimas 24 horas
    for (let i = 23; i >= 0; i--) {
      const hour = subHours(now, i);
      const hourKey = format(hour, 'HH:mm');
      
      const entry: Record<string, any> = {
        time: hourKey,
      };

      deviceIds.forEach(deviceId => {
        const deviceData = groupedByDevice[deviceId];
        // Encontra o dado mais próximo desta hora (não apenas o primeiro dentro da janela)
        const itemsWithinWindow = deviceData
          .map(item => {
            const itemTime = parseISO(item.timestamp);
            const diff = Math.abs(itemTime.getTime() - hour.getTime());
            return { item, diff };
          })
          .filter(({ diff }) => diff < 3600000); // 1 hora em ms
        
        if (itemsWithinWindow.length > 0) {
          // Seleciona o item com a menor diferença de timestamp
          const closest = itemsWithinWindow.reduce((prev, current) => 
            prev.diff < current.diff ? prev : current
          );
          
          entry[deviceId] = Math.round(closest.item.soilMoisture * 10) / 10;
        }
      });

      chartData.push(entry);
    }

    return { chartData, deviceIds };
  };

  const { chartData, deviceIds } = processChartData();

  // Cores para cada dispositivo
  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="card">
      <h3 className="card-title">Evolução da Umidade do Solo (24h)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            label={{ value: 'Umidade (%)', angle: -90, position: 'insideLeft' }}
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
          />
          <Legend />
          {deviceIds.map((deviceId, index) => (
            <Line
              key={deviceId}
              type="monotone"
              dataKey={deviceId}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
              name={deviceId}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

