type LiquidationHeatmapEntry = {
  coin: string,
  price_bin_start: number,
  price_bin_end: number,
  liquidation_value: number,
  positions_count: number,
  most_impacted_segment: number,
  price_bin_index: number,
  timestamp: number
}

type Price = {
  base_coin: string,
  quote_coin: string,
  price: number,
  timestamp: number
}

type HeatmapLoaderData = {
  prices: Price[];
  heatmap: LiquidationHeatmapEntry[];
}