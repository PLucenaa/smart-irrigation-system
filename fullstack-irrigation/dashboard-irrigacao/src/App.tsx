import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Droplets, Thermometer, RefreshCw, Sprout } from 'lucide-react'

// Tipo de dados igual ao do Java
interface Leitura {
  id: number;
  sensorId: string;
  umidade: number;
  temperatura: number;
  status: string;
  dataHora: string;
}

export default function Dashboard() {
  const [dados, setDados] = useState<Leitura[]>([]);
  const [loading, setLoading] = useState(true);

  // Função que busca os dados da API Java
  const fetchData = async () => {
    try {const response = await fetch('/api/leituras');
      if (response.ok) {
        const json = await response.json();
        setDados(json);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Atualiza assim que abre e depois a cada 10 segundos
  useEffect(() => {
    fetchData(); 
    const interval = setInterval(fetchData, 10000); 
    return () => clearInterval(interval);
  }, []);

  // Se não tiver dados ainda, mostra zerado para não quebrar a tela
  const ultima = dados.length > 0 ? dados[0] : { umidade: 0, temperatura: 0, status: 'OFFLINE' };

  // Inverte os dados para o gráfico (para o mais antigo ficar na esquerda)
  const dadosGrafico = [...dados].reverse();

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Sprout className="text-green-600" /> Smart Irrigation
            </h1>
            <p className="text-slate-500">Monitoramento em Tempo Real - LoRa & Spring Boot</p>
          </div>
          <div className="flex gap-2">
             <Badge variant="outline" className={loading ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}>
                {loading ? "Carregando..." : "Conectado API"}
             </Badge>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Umidade do Solo</CardTitle>
              <Droplets className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ultima.umidade ? ultima.umidade.toFixed(1) : 0}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Temperatura</CardTitle>
              <Thermometer className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ultima.temperatura ? ultima.temperatura.toFixed(1) : 0}°C</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Status da Borda</CardTitle>
              <RefreshCw className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <Badge className={`text-white hover:bg-opacity-80 ${
                ultima.status === 'CRITICO' ? 'bg-red-500' : 
                ultima.status === 'ATENCAO' ? 'bg-yellow-500' : 'bg-green-500'
              }`}>
                {ultima.status || 'AGUARDANDO'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico */}
        <Card className="col-span-4 shadow-md">
          <CardHeader>
            <CardTitle>Histórico de Leituras</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="dataHora" tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                <YAxis unit="%" domain={[0, 100]} tick={{fill: '#64748b'}} />
                <Tooltip 
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="umidade" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}