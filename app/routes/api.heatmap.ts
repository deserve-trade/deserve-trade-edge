import { dbContext } from "~/lib/context";
import type { Route } from "./+types/api.heatmap";



export async function loader({ request, context }: Route.LoaderArgs): Promise<HeatmapLoaderData> {

  const urlParams = new URL(request.url).searchParams;
  const from = urlParams.get('from') || '0';
  const to = urlParams.get('to') || '160';
  const coin = urlParams.get('coin') || 'ETH';

  const db = context.get(dbContext);

  const pricesLimit = +to - +from
  const chunkLimit = 40

  const { data: prices, error: pricesError } = await db.from('prices').select('*').eq('base_coin', coin).order('timestamp', { ascending: false }).range(+from, +to);
  if (pricesError) {
    console.log(pricesError)
    throw new Error('Error fetching prices');
  }

  let aggregatedHeatMaps: LiquidationHeatmapEntry[] = [];
  const heatMapChunks = []
  for (let i = 0; i < prices.length; i += chunkLimit) {
    heatMapChunks.push(db.from('liquidation_heatmap_entries').select('*').eq('coin', coin).in('timestamp', prices.slice(i, i + chunkLimit).map((price: Price) => price.timestamp)).order('timestamp', { ascending: true }))
    // const { data: heatmap, error: heatmapError } = await ;
    // if (heatmapError) {
    //   console.log(heatmapError)
    //   throw new Error(`Error fetching heatmap: ${i} - ${i + chunkLimit}`);
    // }
    // aggregatedHeatMaps.push(...heatmap)
  }

  const loadedHeatMaps = await Promise.all(heatMapChunks)
  const heatMapError = loadedHeatMaps.find(hm => hm.error)
  if (heatMapError) {
    console.log(heatMapError)
    throw new Error('Error fetching heatmaps')
  }

  aggregatedHeatMaps = loadedHeatMaps.map(hm => hm.data).flat()

  return { prices: prices.reverse(), heatmap: aggregatedHeatMaps };
}