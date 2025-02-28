import { useQuery } from '@tanstack/react-query'

export interface DashboardData {
  ubePrice: number
  ubeCirculatingSupply: number
  ubeMarketCap: number
  ubeTotalSupply: number
  ubeFdv: number
  totalTvl: number
  volume24h: number
  totalVolume: number
  uniqueWallets: number
  txCount: number
  poolCount: number
  tokenCount: number
  activeLaunchpads: {
    launchpadAddress: string
    tokenAddress: string
    name?: string
    apr?: number
    url: string
    tokenName: string
  }[]
  topGainers: {
    tokenAddress: string
    price: number
    change24h: number
  }[]
  topEarnPools: (
    | {
        type: 'stake'
        contractAddress: string
        stakingToken: string
        rewardTokens?: string[]
        apr: number
        url: string
      }
    | {
        type: 'farm'
        contractAddress: string
        apr: number
        url: string
        protocolVersion: number
        token0: string
        token1: string
        poolAddress: string
      }
  )[]
}

async function loadDashboardData(): Promise<DashboardData | undefined> {
  try {
    const res = await fetch('https://interface-gateway.ubeswap.org/v1/graphql', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operationName: 'DashboardData',
        variables: {},
        query: '',
      }),
    })
    const data = await res.json()
    return data
  } catch (e) {
    console.log(e)
  }
  return
}

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => loadDashboardData(),
    staleTime: 100_000,
  })
}
