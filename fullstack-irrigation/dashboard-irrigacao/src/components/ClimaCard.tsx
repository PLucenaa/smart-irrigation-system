import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Cloud, Droplets, Thermometer } from 'lucide-react'

interface ClimaData {
    temperatura: number
    probabilidadeChuva: number
    descricao: string
    umidade: number
    temperaturaMax: number
    temperaturaMin: number
}

interface ClimaCardProps {
    latitude?: number
    longitude?: number
    onProbabilidadeChuvaChange?: (prob: number) => void
}

export const ClimaCard: React.FC<ClimaCardProps> = ({
                                                        latitude = 2.9087,
                                                        longitude = -61.3039,
                                                        onProbabilidadeChuvaChange
                                                    }) => {
    const [clima, setClima] = useState<ClimaData | null>(null)
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    const buscarClima = async (): Promise<void> => {
        try {
            setErro(null)
            // Usa o endpoint do backend (resolve CORS)
            const url = `/api/clima?lat=${latitude}&lon=${longitude}`

            const response = await fetch(url)

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`)
            }

            const data = await response.json()

            // Verifica se há erro na resposta
            if (data.erro) {
                throw new Error(data.erro)
            }

            // Verificar se a chave é válida
            if (!data.valid_key) {
                throw new Error('Chave da API inválida')
            }

            const results = data.results

            // Temperatura atual
            const tempAtual = results.temp || 0

            // Probabilidade de chuva (já vem em %)
            const probabilidadeChuva = results.forecast?.[0]?.rain_probability || 0

            // Descrição do clima
            const descricao = results.description || 'N/A'
            const umidade = results.humidity || 0
            const tempMax = results.forecast?.[0]?.max || tempAtual
            const tempMin = results.forecast?.[0]?.min || tempAtual

            setClima({
                temperatura: Math.round(tempAtual),
                probabilidadeChuva: Math.round(probabilidadeChuva),
                descricao: descricao.charAt(0).toUpperCase() + descricao.slice(1),
                umidade,
                temperaturaMax: Math.round(tempMax),
                temperaturaMin: Math.round(tempMin)
            })
        } catch (error) {
            const mensagemErro = error instanceof Error
                ? error.message
                : 'Erro ao buscar dados do clima'
            console.error('Erro ao buscar clima:', error)
            setErro(mensagemErro)
        } finally {
            setLoading(false)
        }
    }

    // Polling automático - atualiza a cada 10 minutos
    useEffect(() => {
        buscarClima()
        const intervalId = setInterval(buscarClima, 10 * 60 * 1000) // 10 minutos
        return () => clearInterval(intervalId)
    }, [latitude, longitude])

    // Passa probabilidade de chuva para o componente pai
    useEffect(() => {
        if (clima && onProbabilidadeChuvaChange) {
            onProbabilidadeChuvaChange(clima.probabilidadeChuva)
        }
    }, [clima, onProbabilidadeChuvaChange])

    return (
        <Card className="border-2 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Previsão do Tempo</CardTitle>
                <Cloud className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-4 text-slate-500">Carregando...</div>
                ) : erro ? (
                    <div className="text-center py-4 text-red-500 text-sm">{erro}</div>
                ) : clima ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-orange-500" />
                            <span className="text-2xl font-bold text-slate-900">
                {clima.temperatura}°C
              </span>
                            <span className="text-sm text-slate-500">
                {clima.temperaturaMin}° / {clima.temperaturaMax}°
              </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-slate-600">
                Chuva: {clima.probabilidadeChuva}% (hoje)
              </span>
                        </div>
                        <div className="text-xs text-slate-500">
                            {clima.descricao}
                        </div>
                        <div className="text-xs text-slate-400">
                            Umidade do ar: {clima.umidade}%
                        </div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    )
}