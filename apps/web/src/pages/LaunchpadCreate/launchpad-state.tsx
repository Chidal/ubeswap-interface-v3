import { BigNumberish } from '@ethersproject/bignumber'
import { PrimitiveAtom, atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { getDaySeconds, isTestMode } from './launchpad-constants'

export default function require(
  condition: any,
  // Not providing an inline default argument for message as the result is smaller
  message?: string | (() => string)
): asserts condition {
  if (condition) {
    return
  }
  const provided: string | undefined = typeof message === 'function' ? message() : message
  const prefix = 'require failed'
  const value: string = provided ? `${prefix}: ${provided}` : prefix
  throw new Error(value)
}

export interface TokenomicsTableValues {
  index: number
  name: string
  amount: number
  unlockedAmount: number
  cliffInDays: number
  vestingInDays: number
}
export interface TeamTableValues {
  index: number
  name: string
  position: string
  imgUrl: string
  linkedin: string
  twitter: string
}

export interface ProjectTokenInfo {
  tokenAddress: string
  logoUrl: string
  description: string
  auditLinks: string
  website: string
  whitepaperLink: string
  presentationLink: string

  github: string
  twitter: string
  telegram: string
  discord: string
  medium: string
  farcaster: string
  youtube: string
  reddit: string

  tokenomics: TokenomicsTableValues[]
  teamMembers: TeamTableValues[]
}

export interface LaunchpadOptions {
  tokenInfo: ProjectTokenInfo

  tokenSale: {
    quoteToken: string
    owner: string
    startDate: string
    durationDays: string
    sellPrice: string
    releaseIntervalDays: string
    releaseDurationDays: string
    cliffDurationDays: string
    initialReleaseRate: string
    cliffReleaseRate: string
    hardCapAsQuote: string
    softCapAsQuote: string
  }

  liquidity: {
    liquidityRate: string
    listingPrice: string
    liquidityFee: '100' | '500' | '3000' | '10000'
    liquidityRange: 'NARROW' | 'MEDIUM' | 'WIDE' | 'FULL'
    liquidityAction: 'BURN' | 'LOCK'
    lockDurationDays: string
  }
}

export type LaunchpadParamsStruct = {
  token: string
  quoteToken: string
  owner: string
  startDate: BigNumberish
  endDate: BigNumberish
  exchangeRate: BigNumberish
  releaseDuration: BigNumberish
  releaseInterval: BigNumberish
  cliffDuration: BigNumberish
  initialReleaseRate: BigNumberish
  cliffReleaseRate: BigNumberish
  hardCapAsQuote: BigNumberish
  softCapAsQuote: BigNumberish
  liquidityRate: BigNumberish
  liquidityFee: BigNumberish
  priceTick: BigNumberish
  tickLower: BigNumberish
  tickUpper: BigNumberish
  lockDuration: BigNumberish
}

export interface LaunchpadValidationResult {
  implementation: string
  params: LaunchpadParamsStruct
  infoCID: string
  creatorDisclaimerHash: string
  creatorDisclaimerSignature: string
  verifierSignature: string
  feeAmountWei: string
  tokensForSaleWei: string
  tokensForLiquidityWei: string
}

const defaultState: LaunchpadOptions = {
  tokenInfo: {
    tokenAddress: '',
    logoUrl: '',
    description: '',
    auditLinks: '',
    website: '',
    whitepaperLink: '',
    presentationLink: '',
    github: '',
    twitter: '',
    telegram: '',
    discord: '',
    medium: '',
    youtube: '',
    farcaster: '',
    reddit: '',
    tokenomics: [],
    teamMembers: [],
  },
  tokenSale: {
    quoteToken: '0x71e26d0E519D14591b9dE9a0fE9513A398101490',
    owner: '',
    startDate: '',
    durationDays: '',
    sellPrice: '',
    releaseIntervalDays: '1',
    releaseDurationDays: '0',
    cliffDurationDays: '0',
    initialReleaseRate: '100',
    cliffReleaseRate: '0',
    hardCapAsQuote: '',
    softCapAsQuote: '',
  },
  liquidity: {
    liquidityRate: '50',
    listingPrice: '',
    liquidityFee: '3000',
    liquidityRange: 'MEDIUM',
    liquidityAction: 'BURN',
    lockDurationDays: '',
  },
}
export const launchpadParams = atomWithStorage<LaunchpadOptions>('ubestarter_options', defaultState)

export const launchpadValidationResult = atom<LaunchpadValidationResult | null>(null)

const signatureAtoms: Record<string, PrimitiveAtom<string>> = {
  '-': atomWithStorage<string>('ubestarter_creator_signature', ''),
}
export function getCreatorSignatureAtom(account?: string) {
  if (account) {
    account = account.toLowerCase()
    if (!signatureAtoms[account]) {
      signatureAtoms[account] = atomWithStorage<string>('ubestarter_creator_signature_' + account, '')
    }
    return signatureAtoms[account]
  }
  return signatureAtoms['-']
}

const userSignatureAtoms: Record<string, PrimitiveAtom<string>> = {
  '-': atomWithStorage<string>('ubestarter_creator_signature', ''),
}
export function getUserSignatureAtom(account?: string) {
  if (account) {
    account = account.toLowerCase()
    if (!userSignatureAtoms[account]) {
      userSignatureAtoms[account] = atomWithStorage<string>('ubestarter_user_signature_' + account, '')
    }
    return userSignatureAtoms[account]
  }
  return userSignatureAtoms['-']
}

const isValidUrl = (urlString: string) => {
  try {
    return Boolean(new URL(urlString))
  } catch (e) {
    return false
  }
}

const hourSeconds = 60 * 60
const hourMs = hourSeconds * 1000
const daySeconds = getDaySeconds()
const dayMs = daySeconds * 1000

const MIN_START_DELAY_DAY = isTestMode ? 1 : 3
const MAX_START_DELAY_DAY = 30
const MIN_LAUNCHPAD_DURATION_DAY = 1
const MAX_LAUNCHPAD_DURATION_DAY = 7
const MIN_LOCK_DURATION_DAY = isTestMode ? 2 : 30
const MAX_LOCK_DURATION_DAY = 1000
const MAX_VESTING_DAY = 365
const MIN_INITIAL_RELEASE_RATE = 10
const MIN_LIQUIDITY_RATE = 20
//const INFO_CHANGE_DEADLINE_DAY = 1

interface ValidationError {
  field: string
  message: string
}
function _checkOptions(
  options: LaunchpadOptions,
  tokenSymbol: string | undefined,
  minSoftCap: number | undefined,
  maxSoftCap: number | undefined
) {
  const info = options.tokenInfo
  require(info.tokenAddress.length == 42 &&
    info.tokenAddress.startsWith('0x'), 'tokenInfo.tokenAddress | Invalid token address')
  require(tokenSymbol && tokenSymbol.length > 0, 'tokenInfo.tokenAddress | Invalid token address')
  require(info.logoUrl.length > 0, 'tokenInfo.logoUrl | Enter logo url')
  require(isValidUrl(info.logoUrl), 'tokenInfo.logoUrl | Invalid logo url')
  require(info.description.length > 0, 'tokenInfo.description | Enter description')

  require(info.website.length == 0 || isValidUrl(info.website), 'tokenInfo.website | Invalid website url')
  require(info.whitepaperLink.length == 0 || isValidUrl(info.whitepaperLink), 'tokenInfo.whitepaperLink | Invalid url')
  require(info.presentationLink.length == 0 ||
    isValidUrl(info.presentationLink), 'tokenInfo.presentationLink | Invalid url')
  require(info.github.length == 0 || isValidUrl(info.github), 'tokenInfo.github | Invalid url')
  require(info.twitter.length == 0 || isValidUrl(info.twitter), 'tokenInfo.twitter | Invalid Twitter url')
  require(info.telegram.length == 0 || isValidUrl(info.telegram), 'tokenInfo.telegram | Invalid Telegram url')
  require(info.discord.length == 0 || isValidUrl(info.discord), 'tokenInfo.discord | Invalid Discord url')
  require(info.farcaster.length == 0 || isValidUrl(info.farcaster), 'tokenInfo.farcaster | Invalid Farcaster url')
  require(info.medium.length == 0 || isValidUrl(info.medium), 'tokenInfo.medium | Invalid Medium url')
  require(info.youtube.length == 0 || isValidUrl(info.youtube), 'tokenInfo.youtube | Invalid Youtube url')
  require(info.reddit.length == 0 || isValidUrl(info.reddit), 'tokenInfo.reddit | Invalid url')

  require(info.tokenomics.length > 0, 'tokenInfo.tokenomics | You should add at least 1 tokenomics item')

  const sale = options.tokenSale

  const hardCapAsQuote = parseFloat(sale.hardCapAsQuote)
  require(hardCapAsQuote > 0, 'tokenSale.hardCapAsQuote | Invalid value')

  const softCapAsQuote = parseFloat(sale.softCapAsQuote)
  require(softCapAsQuote > 0, 'tokenSale.softCapAsQuote | Invalid value')
  if (minSoftCap) {
    require(softCapAsQuote >= minSoftCap, 'tokenSale.softCapAsQuote | Soft cap must be bigger than ' + minSoftCap)
  }
  if (maxSoftCap) {
    require(softCapAsQuote <= maxSoftCap, 'tokenSale.softCapAsQuote | Soft cap must be smaller than ' + maxSoftCap)
  }

  require(hardCapAsQuote > softCapAsQuote, 'tokenSale.hardCapAsQuote | Hard cap must be bigger than soft cap')

  const sellPrice = parseFloat(sale.sellPrice)
  require(isNaN(sellPrice) == false && sellPrice > 0, 'tokenSale.sellPrice | Invalid price')
  const exchangeRate = Math.floor((1 / sellPrice) * 100_000)
  require(exchangeRate > 0 && exchangeRate < 4_000_000_000, 'tokenSale.sellPrice | Price range error')

  const listingPrice = parseFloat(options.liquidity.listingPrice)
  require(listingPrice > 0, 'liquidity.listingPrice | Invalid listing price')
  require(listingPrice > sellPrice, 'liquidity.listingPrice | Listing price must be bigger than sell price')

  const now = Date.now() + hourMs
  const startDate = new Date(sale.startDate)

  require(startDate.valueOf() >=
    now + MIN_START_DELAY_DAY * dayMs, 'tokenSale.startDate | Start date cannot be earlier than 3 days later')
  require(startDate.valueOf() <=
    now + MAX_START_DELAY_DAY * dayMs, 'tokenSale.startDate | Start date cannot be later than 30 days later')

  const durationDays = Math.floor(parseFloat(sale.durationDays))
  require(durationDays.toString() === sale.durationDays, 'tokenSale.durationDays | Value must be integer')
  require(durationDays >=
    MIN_LAUNCHPAD_DURATION_DAY, 'tokenSale.durationDays | Launchpad duration must be at least 1 day')
  require(durationDays <=
    MAX_LAUNCHPAD_DURATION_DAY, 'tokenSale.durationDays | Launchpad duration must be at most 7 day')

  const initialReleaseRate = parseFloat(sale.initialReleaseRate)
  require(initialReleaseRate >= MIN_INITIAL_RELEASE_RATE &&
    initialReleaseRate <= 100, 'tokenSale.initialReleaseRate | Value must be between 10 and 100')

  const releaseDurationDays = Math.floor(parseFloat(sale.releaseDurationDays))
  require(releaseDurationDays.toString() ===
    sale.releaseDurationDays, 'tokenSale.releaseDurationDays | Value must be integer')
  require(releaseDurationDays >= 0 &&
    releaseDurationDays <= MAX_VESTING_DAY, 'tokenSale.releaseDurationDays | Value must be between 0 and 365')

  const liquidityRate = parseFloat(options.liquidity.liquidityRate)
  require(liquidityRate >= MIN_LIQUIDITY_RATE &&
    liquidityRate <= 100, 'liquidity.liquidityRate | Value must be between 20 and 100')

  if (options.liquidity.liquidityAction == 'LOCK') {
    const lockDurationDays = Math.floor(parseFloat(options.liquidity.lockDurationDays))
    require(lockDurationDays.toString() ===
      options.liquidity.lockDurationDays, 'liquidity.lockDurationDays | Value must be integer')
    require(lockDurationDays >= MIN_LOCK_DURATION_DAY &&
      lockDurationDays <= MAX_LOCK_DURATION_DAY, 'liquidity.lockDurationDays | Value must be between 30 and 1000')
  }
}

export function validateOptions(
  options: LaunchpadOptions,
  tokenSymbol: string | undefined,
  minSoftCap: number | undefined,
  maxSoftCap: number | undefined
): ValidationError | undefined {
  try {
    _checkOptions(options, tokenSymbol, minSoftCap, maxSoftCap)
  } catch (e: any) {
    const err = e.message.split(':')[1]
    if (!err) {
      console.log(e)
      return {
        field: '',
        message: 'unknown error',
      }
    }
    return {
      field: err.split('|')[0].trim(),
      message: err.split('|')[1].trim(),
    }
  }
  return
}
