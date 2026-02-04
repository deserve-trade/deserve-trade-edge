import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

export function useHeatmap(coin: string) {

  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(160)
  const [boundOffset, setBoundOffset] = useState(0.5)

  const list = useQuery<HeatmapLoaderData>({
    queryKey: ['heatmap-list', from, to, coin],
    queryFn: async () => {
      const response = await fetch('/api/heatmap?from=' + from + '&to=' + to + '&coin=' + coin)
      return response.json()
    },
    staleTime: 1000 * 60
  })

  return {
    list,
    from,
    setFrom,
    to,
    setTo,
    boundOffset,
    setBoundOffset
  }
}