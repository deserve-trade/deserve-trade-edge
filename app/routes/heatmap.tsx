import { dbContext } from "~/lib/context";
import type { Route } from "./+types/heatmap";
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, BarChart, Bar, Rectangle, type BarShapeProps, LineChart, Legend } from 'recharts';
import { useState, useMemo } from 'react';
import { redirect, useRevalidator } from "react-router";
import { Button } from "~/components/ui/button";
import { keyRequired } from "~/lib/middleware/key-required";
import { useHeatmap } from "~/lib/hooks/useHeatmap";



// export async function clientLoader({ params }: Route.LoaderArgs) {

//   const db = context.get(dbContext);

//   const pricesLimit = 160
//   const chunkLimit = 40

//   const { data: prices, error: pricesError } = await db.from('prices').select('*').eq('base_coin', 'ETH').order('timestamp', { ascending: false }).limit(pricesLimit);
//   if (pricesError) {
//     console.log(pricesError)
//     throw new Error('Error fetching prices');
//   }

//   let aggregatedHeatMaps: LiquidationHeatmapEntry[] = [];
//   const heatMapChunks = []
//   for (let i = 0; i < prices.length; i += chunkLimit) {
//     heatMapChunks.push(db.from('liquidation_heatmap_entries').select('*').eq('coin', 'ETH').in('timestamp', prices.slice(i, i + chunkLimit).map((price: Price) => price.timestamp)).order('timestamp', { ascending: true }))
//     // const { data: heatmap, error: heatmapError } = await ;
//     // if (heatmapError) {
//     //   console.log(heatmapError)
//     //   throw new Error(`Error fetching heatmap: ${i} - ${i + chunkLimit}`);
//     // }
//     // aggregatedHeatMaps.push(...heatmap)
//   }

//   const loadedHeatMaps = await Promise.all(heatMapChunks)
//   const heatMapError = loadedHeatMaps.find(hm => hm.error)
//   if (heatMapError) {
//     console.log(heatMapError)
//     throw new Error('Error fetching heatmaps')
//   }

//   aggregatedHeatMaps = loadedHeatMaps.map(hm => hm.data).flat()

//   // const { data: heatmap, error: heatmapError } = await db.from('liquidation_heatmap_entries').select('*').eq('coin', 'ETH').in('timestamp', prices.map((price: Price) => price.timestamp)).order('timestamp', { ascending: true });


//   // console.log(prices.find(p => p.timestamp === 1769584340096))
//   // console.log(aggregatedHeatMaps.filter(hm => hm.timestamp === 1769584340096))

//   return { prices: prices.reverse(), heatmap: aggregatedHeatMaps };
// }


export const middleware: Route.MiddlewareFunction[] = [
  keyRequired,
];

export type SeriesData = { timestamp: number; value: number }

export type Series = {
  name: string;
  data: SeriesData[];
  color: string;
  price_bin_start: number;
  price_bin_end: number;
  liquidation_value: number;
}

export type SeriesMap = {
  [level: string]: Series[];
}

const getColor = (volume: number, maxVolume: number) => {
  const intensity = volume / maxVolume;
  let r, g, b;
  if (intensity < 0.5) {
    // From green to yellow
    r = Math.floor(255 * (intensity * 2));
    g = 165;
    b = 0;
  } else {
    // From yellow to red
    r = 255;
    g = Math.floor(255 * (1 - (intensity - 0.5) * 2));
    b = 0;
  }
  return `rgba(${r}, ${g}, ${b}, 0.8)`;
};

function calcLevelSeries(prices: Price[], heatmap: LiquidationHeatmapEntry[], boundOffset: number = 0.5) {
  const lastPrice = prices[prices.length - 1];
  const lowerBound = lastPrice.price * (1 - boundOffset);
  const upperBound = lastPrice.price * (1 + boundOffset);
  const filteredHeatmap = heatmap.filter(entry => entry.price_bin_end > lowerBound && entry.price_bin_start < upperBound);
  const maxVolume = Math.max(...filteredHeatmap.map(entry => entry.liquidation_value), 1);


  const levels: SeriesMap = {};
  let previousTimestamp: number = 0
  prices.forEach(price => {

    const priceHeatMaps = filteredHeatmap.filter(hm => hm.timestamp === price.timestamp);
    if (priceHeatMaps.length === 0) return;

    priceHeatMaps.forEach(hm => {
      const level = hm.price_bin_start;
      const levelSeries = levels[level] = levels[level] || [];
      const currentLevelSeries = levelSeries.find(s => previousTimestamp && s.data[s.data.length - 1].timestamp === previousTimestamp);
      const seriesData = { timestamp: price.timestamp, value: level }
      if (currentLevelSeries) {
        currentLevelSeries.data.push(seriesData)
        return
      }
      levels[level].push({
        name: `${hm.price_bin_start} - ${hm.price_bin_end} | ${price.timestamp}`,
        data: [seriesData],
        color: getColor(hm.liquidation_value, maxVolume),
        price_bin_start: hm.price_bin_start,
        price_bin_end: hm.price_bin_end,
        liquidation_value: hm.liquidation_value
      });

    })

    previousTimestamp = price.timestamp

  });

  const levelSeries = Object.values(levels).flat();

  return {
    levelSeries,
    maxVolume,
    lowerBound,
    upperBound
  };
}

export default function Heatmap({ loaderData }: Route.ComponentProps) {
  const [activeSeries, setActiveSeries] = useState<string | null>(null);
  const { list, setFrom, from, setTo, to, boundOffset, setBoundOffset } = useHeatmap('ETH');
  // const { prices, heatmap } = list.data;
  const { revalidate } = useRevalidator();
  const handleRefresh = () => {
    revalidate();
  };
  // console.log(prices)

  const levelSeries = useMemo(() => {

    if (!list.data) return { levelSeries: [], maxVolume: 0, lowerBound: 0, upperBound: 0 }

    const { prices, heatmap } = list.data;

    return calcLevelSeries(prices, heatmap, boundOffset);

  }, [list.data, boundOffset]);

  // console.log(levelSeries)

  const series = useMemo(() => {
    return [
      {
        data: list.data?.prices.map((price: Price) => ({
          timestamp: price.timestamp,
          value: price.price
        })),
        name: 'Price',
        color: '#8884d8'
      },
      ...levelSeries.levelSeries
    ];
  }, [levelSeries.levelSeries, list.data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const priceData = payload.find((p: any) => p.name === 'Price');
      if (!priceData) return null;

      const currentPriceValue = priceData.value;
      const levelData = payload.filter((p: any) => p.name !== 'Price');

      // Sort levels above price descending
      const aboveLevels = levelData.filter((p: any) => p.value > currentPriceValue).sort((a: { value: number; }, b: { value: number; }) => b.value - a.value);
      // Sort levels below price ascending
      const belowLevels = levelData.filter((p: any) => p.value < currentPriceValue).sort((a: { value: number; }, b: { value: number; }) => b.value - a.value);

      const sortedPayload = [...aboveLevels, priceData, ...belowLevels];

      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-semibold">{`Time: ${new Date(label).toLocaleString()}`}</p>
          {sortedPayload.map((seriesData: any) => {
            const levelMeta = levelSeries.levelSeries.find(s => s.name === seriesData.name);
            // console.log(priceData)
            return (
              <div key={seriesData.name} style={{ marginBottom: '4px' }}>
                <p className="text-sm" style={{ color: seriesData.color, fontWeight: 'bold' }}>{`${levelMeta?.price_bin_start.toLocaleString() || new Date(priceData.payload.timestamp).toLocaleString()} - ${levelMeta?.price_bin_end.toLocaleString() || seriesData.value.toLocaleString()}`}</p>
                {seriesData.name !== 'Price' && levelMeta && (
                  <div style={{ fontSize: '12px', color: '#666' }}>

                    <p>Liq. Value: {Math.floor(levelMeta.liquidation_value).toLocaleString()}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const goback = () => {
    const limit = (to - from) / 2
    setFrom(from + limit)
    setTo(to + limit)
  };

  const goforward = () => {
    const limit = (to - from) / 2
    setFrom(from - limit)
    setTo(to - limit)
  }

  const zoomOut = () => {
    setBoundOffset(boundOffset + 0.1)
  }

  const zoomIn = () => {
    setBoundOffset(boundOffset - 0.1)
  }

  return (
    <div className="w-full h-screen p-4">
      {/* <h1 className="text-2xl mb-4">Liquidation Levels Heatmap</h1> */}
      <ComposedChart width={800} height={800} style={{ width: '100%', maxWidth: '100vw', maxHeight: '100vh', aspectRatio: 1.6 }} responsive>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(value) => new Date(value).toLocaleString()} />
        <YAxis dataKey="value" width="auto" domain={[levelSeries.lowerBound.toFixed(2), levelSeries.upperBound.toFixed(2)]} />
        <Tooltip offset={50} content={CustomTooltip} />
        {/* <Legend /> */}
        {series.map(s => (
          <Line dataKey="value" data={s.data} name={s.name} key={s.name} stroke={s.color} strokeWidth={s.name === 'Price' ? 3 : 2} onMouseEnter={() => setActiveSeries(s.name)} onMouseLeave={() => setActiveSeries(null)} />
        ))}
        {/* <RechartsDevtools /> */}
      </ComposedChart>
      <div className="flex flex-row justify-center p-8 gap-4">
        <Button className="cursor-pointer" onClick={goback}>Back</Button>
        <Button className="cursor-pointer" onClick={goforward} disabled={from === 0}>Forward</Button>
        <Button className="cursor-pointer" onClick={handleRefresh}>Refresh</Button>
        <Button className="cursor-pointer" onClick={zoomOut} disabled={boundOffset === 1}>Zoom Out</Button>
        <Button className="cursor-pointer" onClick={zoomIn} disabled={boundOffset === 0}>Zoom In</Button>
      </div>
    </div>
  );
}