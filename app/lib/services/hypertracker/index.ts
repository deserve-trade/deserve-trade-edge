import { useSupabase } from "../supabase"

async function sendTelegramMessage(botToken: string, chatIds: string[], message: string) {

  console.log(message)

  try {
    const result = await Promise.allSettled(
      chatIds.map(async (chatId) => {
        const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
        });
        if (!resp.ok) {
          const body = await resp.text();
          throw new Error(`chat ${chatId}: ${body}`);
        }
        return { chatId, ok: true };
      })
    );

    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

export function useHyperTracker(supabaseurl: string, supabaseKey: string, coingeckoApiKey: string) {

  const supabase = useSupabase(supabaseurl, supabaseKey)

  async function getPriceUsd(symbol: string) {

    const coinGeckoCoins = {
      "ETH": "ethereum",
      "BTC": "bitcoin"
    }

    const coinGeckoCoin = coinGeckoCoins[symbol as keyof typeof coinGeckoCoins]

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoCoin}&vs_currencies=usd&x_cg_demo_api_key=${coingeckoApiKey}`
    console.log(url)
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36',
        "accept": "application/json",
      }
    })

    if (!response.ok) throw new Error(response.statusText)

    const data = await response.json<any>()

    const priceUsd = data[coinGeckoCoin].usd

    return priceUsd

  }

  async function getLiquidationHeatMap(symbol: string) {
    try {
      const { data: setting, error } = await supabase.from('settings').select('*').eq('key', 'hypertracker_api_url').limit(1).single()
      if (error) throw error
      console.log('HyperTracker API Url: ', setting.value)
      const resp = await fetch(`${setting.value}/aggregator/assets/${symbol}/liquidation-heatmap.json`, {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36'
        }
      })

      if (!resp.ok) throw new Error(resp.statusText)

      const data = await resp.json()
      return data
    } catch (error) {
      throw error
    }
  }

  async function parseLiquidationHeatMap(data: any) {
    try {
      const { data: setting, error } = await supabase.from('settings').select('*').eq('key', 'hypertracker_whale_threshold').limit(1).single()
      if (error) throw error
      console.log('HyperTracker Whale Threshold: ', setting.value)
      const filteredLevels = data.heatmap.filter((level: any) => level.liquidationValue >= parseFloat(setting.value))
      // console.log(filteredLevels)
      return filteredLevels
    } catch (error) {
      throw error
    }
  }

  async function saveLiquidationHeatMap(filteredLevels: any[], symbol: string, priceUsd: number) {
    try {
      const timestamp = Date.now()
      const parsedEntries = filteredLevels.map((level: any) => {
        return {
          coin: level.coin,
          price_bin_start: level.priceBinStart,
          price_bin_end: level.priceBinEnd,
          liquidation_value: level.liquidationValue,
          positions_count: level.positionsCount,
          most_impacted_segment: level.mostImpactedSegment,
          price_bin_index: level.priceBinIndex,
          timestamp: timestamp
        }
      })
      const { data: heatmap, error } = await supabase.from('liquidation_heatmap_entries').insert(parsedEntries).select('*')
      if (error) throw error
      const { data: price, error: priceError } = await supabase.from('prices').insert({ base_coin: symbol, quote_coin: 'USD', price: priceUsd, timestamp: timestamp }).select('*').single()
      if (priceError) throw priceError
      return {
        heatmap,
        price
      }
    } catch (error) {
      throw error
    }
  }

  async function liquidationHeatMapPipeline(symbol: string) {
    const priceUsd = await getPriceUsd(symbol)
    // console.log(priceUsd)
    const data = await getLiquidationHeatMap(symbol)
    const filteredLevels = await parseLiquidationHeatMap(data)
    const result = await saveLiquidationHeatMap(filteredLevels, symbol, priceUsd)
    // await liquidationHeatMapChangeEventProcess(result.price, result.heatmap)
    return result
  }

  function calcNearestHeatmaps(price: Price, heatmap: LiquidationHeatmapEntry[], count: number = 3) {
    const bids = heatmap.filter(hm => hm.price_bin_end < price.price).sort((hm1, hm2) => hm2.price_bin_end - hm1.price_bin_end).slice(0, count)
    const asks = heatmap.filter(hm => hm.price_bin_start > price.price).sort((hm1, hm2) => hm1.price_bin_start - hm2.price_bin_start).slice(0, count)
    return {
      bids,
      asks
    }
  }

  function compareHeatmaps(prevNearestHeatmaps: any, nextNearestHeatmaps: any) {
    const diff = {
      bids: new Array(prevNearestHeatmaps.bids.length).fill(0),
      asks: new Array(prevNearestHeatmaps.asks.length).fill(0)
    }

    for (let i = 0; i < prevNearestHeatmaps.bids.length; i++) {
      const prevBid = prevNearestHeatmaps.bids[i]
      const nextBid = nextNearestHeatmaps.bids[i]
      const nextAsk = nextNearestHeatmaps.asks[i]
      const prevAsk = prevNearestHeatmaps.asks[i]
      diff.bids[i] = prevBid.price_bin_start - nextBid.price_bin_start
      diff.asks[i] = nextAsk.price_bin_end - prevAsk.price_bin_end
    }
    return diff
  }

  async function liquidationHeatMapChangeEventProcess(symbol: string, telegramApiKey: string, telegramChatIds: string[]) {

    const { data: currentPrice, error: currentPriceError } = await supabase.from('prices').select('*').eq('base_coin', symbol).order('timestamp', { ascending: false }).range(0, 1).limit(1).single()

    if (currentPriceError || !currentPrice) {
      console.error(currentPriceError)
      return null
    }

    const { data: currentHeatMap, error: currentHeatMapError } = await supabase.from('liquidation_heatmap_entries').select('*').eq('coin', symbol).eq('timestamp', currentPrice.timestamp)
    if (currentHeatMapError || !currentHeatMap) {
      console.error(currentHeatMapError)
      return null
    }

    const { data: prevPrice, error: prevPriceError } = await supabase.from('prices').select('*').eq('base_coin', symbol).order('timestamp', { ascending: false }).range(1, 0).limit(1).single()
    if (prevPriceError || !prevPrice) {
      console.error(prevPriceError)
      return null
    }

    const { data: prevHeatMap, error: prevHeatMapError } = await supabase.from('liquidation_heatmap_entries').select('*').eq('coin', symbol).eq('timestamp', prevPrice.timestamp)
    if (prevHeatMapError || !prevHeatMap) {
      console.error(prevHeatMapError)
      return null
    }

    const prevNearestHeatmaps = calcNearestHeatmaps(prevPrice, prevHeatMap)
    const currentNearestHeatmaps = calcNearestHeatmaps(currentPrice, currentHeatMap)

    console.log(prevPrice, prevNearestHeatmaps)
    console.log(currentPrice, currentNearestHeatmaps)

    const diff = compareHeatmaps(prevNearestHeatmaps, currentNearestHeatmaps)

    console.log(diff)

    if (diff.bids.some((diff: number) => diff !== 0) || diff.asks.some((diff: number) => diff !== 0)) {

      const message = [
        `<b>HyperTracker Liquidation Heat Map Change for ${symbol}</b>`,
        'Bids/Asks',
        ...currentNearestHeatmaps.asks.map((hm: any, index: number) => `${hm.price_bin_start} - ${hm.price_bin_end} (${Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(hm.liquidation_value)}) Change: ${diff.asks[index].toFixed(2)}`).reverse(),
        `Price: ${currentPrice.price}`,
        ...currentNearestHeatmaps.bids.map((hm: any, index: number) => `${hm.price_bin_start} - ${hm.price_bin_end} (${Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(hm.liquidation_value)}) Change: ${diff.bids[index].toFixed(2)}`)
      ].join('\n')

      // console.log(message)

      await sendTelegramMessage(telegramApiKey, telegramChatIds, message)

    }

  }

  return {
    getLiquidationHeatMap,
    parseLiquidationHeatMap,
    saveLiquidationHeatMap,
    liquidationHeatMapPipeline,
    getPriceUsd,
    liquidationHeatMapChangeEventProcess
  }
}