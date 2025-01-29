/* eslint-disable @typescript-eslint/no-unused-vars */

import { formatUnits } from '@ethersproject/units'
import { useWeb3React } from '@web3-react/core'
import AddressInputPanel from 'components/AddressInputPanel'
import { ButtonError, ButtonPrimary } from 'components/Button'
import { BlueCard } from 'components/Card'
import Column, { AutoColumn } from 'components/Column'
import DatePickerPanel from 'components/DatePickerPanel'
import Modal from 'components/Modal'
import NumericalInputPanel from 'components/NumericalInputPanel'
import Row, { AutoRow } from 'components/Row'
import TextInputPanel from 'components/TextInputPanel'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { MouseoverTooltip } from 'components/Tooltip'
import { hashMessage } from 'ethers/lib/utils'
import { useToken } from 'hooks/Tokens'
import { useUbestarterFactory } from 'hooks/useContract'
import { Trans } from 'i18n'
import { useAtom } from 'jotai'
import { NEVER_RELOAD, useSingleCallResult } from 'lib/hooks/multicall'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Info } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import Loader from '../../components-old/Loader'
import AppBody from '../AppBody'
import { Action, ActionSelector } from './ActionSelector'
import AddTeamMemberModal from './AddTeamMemberModal'
import AddTokenomicsModal from './AddTokenomicsModal'
import SimpleTable from './SimpleTable'
import TextareaPanel from './TextareaPanel'
import TokenDistributionModal, { TokenDistributionParams } from './TokenDistributionModal'
import { getFactoryAddress, isTestMode } from './launchpad-constants'
import {
  LaunchpadValidationResult,
  TeamTableValues,
  TokenomicsTableValues,
  getCreatorSignatureAtom,
  launchpadParams,
  launchpadValidationResult,
  validateOptions,
} from './launchpad-state'

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 48px 8px 0px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`

const TableWrapper = styled.div`
  overflow-x: auto;
  width: 100%;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
`

const BackArrow = styled(ArrowLeft)`
  cursor: pointer;
  color: ${({ theme }) => theme.neutral1};
`
const Nav = styled(Link)`
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  margin: 1em 0 0 1em;
  text-decoration: none;
`

const HeaderText = styled(ThemedText.H1Small)`
  margin: auto !important;
`

export const SmallButtonPrimary = styled(ButtonPrimary)`
  width: auto;
  font-size: 14px;
  padding: 2px 8px;
  border-radius: 4px;
`

const OptionsWrapper = styled.div`
  padding: 20px;
  display: flex;
  flex-flow: column wrap;
`

const Divider = styled.div`
  border-bottom: ${({ theme }) => `1px solid ${theme.surface3}`};
  width: 100%;
  margin: 20px 0;
`

const disclaimerMsg = `Ubestarter provides a platform for decentralized application (DApp) developers to launch new projects and for users to participate in these projects by purchasing tokens. The information provided on Ubestarter's website and through its services is for general informational purposes only and should not be considered financial, legal, or investment advice.
Ubestarter does not guarantee the success of any project or the performance of any token issued through its platform. The success of blockchain projects and the utility of their tokens can be affected by a multitude of factors beyond our control.
Projects are responsible for ensuring that their participation in token sales and their use of Ubestarter's services comply with laws and regulations in their jurisdiction, including but not limited to securities laws, anti-money laundering (AML) and know your customer (KYC) requirements.
Ubestarter, its affiliates, and its service providers will not be liable for any loss or damage arising from your use of the platform, including, but not limited to, any losses, damages, or claims arising from: (a) user error, such as forgotten passwords or incorrectly construed smart contracts; (b) server failure or data loss; (c) unauthorized access or activities by third parties, including the use of viruses, phishing, brute-forcing, or other means of attack against the platform or cryptocurrency wallets.
This disclaimer is subject to change at any time without notice. It is the project's responsibility to review it regularly to stay informed of any changes.
By using the Ubestarter, you acknowledge that you have read this disclaimer, understand it, and agree to be bound by its terms.`

export default function OptionsStep({ onNext }: { onNext: () => void }) {
  const { account, provider } = useWeb3React()

  const theme = useTheme()
  const { formatNumber } = useFormatter()

  const [attempting, setAttempting] = useState(false)

  const [signature, setSignature] = useAtom(getCreatorSignatureAtom(account))
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false)

  const showDisclaimer = useMemo(() => !(signature && signature.length > 5), [signature])
  const handleCheckbox = () => {
    setIsDisclaimerAccepted(!isDisclaimerAccepted)
  }
  const signDisclaimer = async () => {
    const signature = await provider?.getSigner().signMessage('I accept the following disclaimer:\n' + disclaimerMsg)
    if (signature && signature.length > 5) {
      setSignature(signature)
    }
  }

  const [options, setOptions] = useAtom(launchpadParams)
  const setOptionsProp = useCallback(
    (propName: string, value: string) => {
      const path = propName.split('.')
      setOptions((oldVal) => {
        const newVal: any = { ...oldVal }
        newVal[path[0]] = {
          ...newVal[path[0]],
          [path[1]]: value,
        }
        return newVal
      })
    },
    [setOptions]
  )
  useEffect(() => {
    if (account) {
      setOptionsProp('tokenSale.owner', account)
    }
  }, [account, setOptionsProp])

  const token = useToken(options.tokenInfo.tokenAddress)
  const quoteToken = useToken(options.tokenSale.quoteToken)

  const factoryContract = useUbestarterFactory(getFactoryAddress())
  const { result: softCapInfo } = useSingleCallResult(
    factoryContract,
    'quoteTokens',
    [options.tokenSale.quoteToken],
    NEVER_RELOAD
  ) as {
    result?: Awaited<ReturnType<NonNullable<typeof factoryContract>['quoteTokens']>>
  }
  const minSoftCapBn = softCapInfo?.[0]
  const maxSoftCapBn = softCapInfo?.[1]
  const minSoftCap = quoteToken && minSoftCapBn ? parseFloat(formatUnits(minSoftCapBn, quoteToken.decimals)) : undefined
  const maxSoftCap = quoteToken && maxSoftCapBn ? parseFloat(formatUnits(maxSoftCapBn, quoteToken.decimals)) : undefined

  const [showErrors, setShowErrors] = useState(true)
  const validationError = validateOptions(options, token?.symbol, minSoftCap, maxSoftCap)
  const isError = (field: string) => validationError?.field == field && showErrors

  // ----- tokenomics -----
  const [tokenomicsModalOpened, setTokenomicsModalOpened] = useState(false)
  const tokenomicsHeaders = ['#', 'Allocation', 'Amount', 'Unlocked at TGE', 'Cliff', 'Vesting']
  const tokenomicsData = options.tokenInfo.tokenomics.map((info) => [
    info.index.toString(),
    info.name,
    formatNumber({
      input: info.amount,
      type: NumberType.TokenNonTx,
    }),
    formatNumber({
      input: info.unlockedAmount,
      type: NumberType.TokenNonTx,
    }),
    info.cliffInDays === 0 ? '-' : info.cliffInDays / 30 + ' months',
    info.vestingInDays / 30 + ' months',
  ])
  const addTokenomics = (tokenomicsInfo: TokenomicsTableValues) => {
    setOptions((oldVal) => {
      const newArray = [...oldVal.tokenInfo.tokenomics, tokenomicsInfo]
      newArray.forEach((item, i) => {
        item.index = i + 1
      })
      return {
        ...oldVal,
        tokenInfo: {
          ...oldVal.tokenInfo,
          tokenomics: newArray,
        },
      }
    })
    setTokenomicsModalOpened(false)
  }
  const removeTokenomics = (index: number) => {
    setOptions((oldVal) => {
      const newArray = oldVal.tokenInfo.tokenomics.filter((_, i) => i != index)
      newArray.forEach((item, i) => {
        item.index = i + 1
      })
      return {
        ...oldVal,
        tokenInfo: {
          ...oldVal.tokenInfo,
          tokenomics: newArray,
        },
      }
    })
  }
  const initialCirculatinSupply = options.tokenInfo.tokenomics.reduce((acc, tokenomicsItem) => {
    return acc + tokenomicsItem.unlockedAmount
  }, 0)

  const totalSupply = options.tokenInfo.tokenomics.reduce((acc, tokenomicsItem) => {
    return acc + tokenomicsItem.amount
  }, 0)

  const sellPrice = parseFloat(options.tokenSale.sellPrice) || 0
  const hardCapAsQuote = parseFloat(options.tokenSale.hardCapAsQuote) || 0
  const tokensOffered = sellPrice == 0 ? 0 : Math.floor(hardCapAsQuote / sellPrice)
  // ------

  // ------ Team -------
  const teamColumnHeaders = ['#', 'Image', 'Name', 'Position']
  //const teamMembersData = teamMembers.map((t) => [t.index.toString(), t.name, t.position])
  const teamMembersData = options.tokenInfo.teamMembers.map((teamMember) => [
    teamMember.index.toString(),
    <img key={`teamimg-${teamMember.index}`} src={teamMember.imgUrl} style={{ maxWidth: '50px', maxHeight: '30px' }} />,
    teamMember.name,
    teamMember.position,
  ])
  const [teamModalOpened, setTeamModalOpened] = useState(false)
  const addTeamMember = (tokenomicsInfo: TeamTableValues) => {
    setOptions((oldVal) => {
      const newArray = [...oldVal.tokenInfo.teamMembers, tokenomicsInfo]
      newArray.forEach((item, i) => {
        item.index = i + 1
      })
      return {
        ...oldVal,
        tokenInfo: {
          ...oldVal.tokenInfo,
          teamMembers: newArray,
        },
      }
    })
    setTeamModalOpened(false)
  }
  const removeTeamMember = (index: number) => {
    setOptions((oldVal) => {
      const newArray = oldVal.tokenInfo.teamMembers.filter((_, i) => i != index)
      newArray.forEach((item, i) => {
        item.index = i + 1
      })
      return {
        ...oldVal,
        tokenInfo: {
          ...oldVal.tokenInfo,
          teamMembers: newArray,
        },
      }
    })
  }
  // ------

  // ----- Token Distribution -----
  const [tokenDistModalOpened, setTokenDistModalOpened] = useState(false)
  const tokenDistHeaders = ['Unlocked at TGE', 'Cliff', 'Unlocked at Cliff', 'Vesting']
  const tokenDistData = [
    [
      options.tokenSale.initialReleaseRate + '%',
      options.tokenSale.cliffDurationDays + ' days',
      options.tokenSale.cliffReleaseRate + '%',
      options.tokenSale.releaseDurationDays + ' days',
    ],
  ]
  const setTokenDistribution = (data: TokenDistributionParams) => {
    options.tokenSale.initialReleaseRate = data.initialReleaseRate
    options.tokenSale.releaseDurationDays = data.releaseDurationDays
    options.tokenSale.releaseIntervalDays = data.releaseIntervalDays
    options.tokenSale.cliffDurationDays = data.cliffDurationDays
    options.tokenSale.cliffReleaseRate = data.cliffReleaseRate
    setTokenDistModalOpened(false)
  }
  const initialTokenDistParams = useMemo(() => {
    return {
      initialReleaseRate: options.tokenSale.initialReleaseRate,
      releaseDurationDays: options.tokenSale.releaseDurationDays,
      releaseIntervalDays: options.tokenSale.releaseIntervalDays,
      cliffDurationDays: options.tokenSale.cliffDurationDays,
      cliffReleaseRate: options.tokenSale.cliffReleaseRate,
    }
  }, [options])
  // ------

  // CELO / UBE / USDT / USDC / cUSD / GLOUSD
  const quoteTokens: Action[] = [
    {
      id: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      name: 'CELO',
    },
    {
      id: '0x71e26d0E519D14591b9dE9a0fE9513A398101490',
      name: 'UBE',
    },
    {
      id: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
      name: 'USDT',
    },
    {
      id: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
      name: 'USDC',
    },
    {
      id: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
      name: 'cUSD',
    },
    {
      id: '0x4F604735c1cF31399C6E711D5962b2B3E0225AD3',
      name: 'GLOUSD',
    },
  ]

  const liqActions: Action[] = [
    {
      id: 'BURN',
      name: 'Burned (sent to dead address)',
    },
    {
      id: 'LOCK',
      name: 'Locked',
    },
  ]

  const liqFees: Action[] = [
    {
      id: '100',
      name: '0.01%',
    },
    {
      id: '500',
      name: '0.05%',
    },
    {
      id: '3000',
      name: '0.3%',
    },
    {
      id: '10000',
      name: '1%',
    },
  ]

  const liqRanges: Action[] = [
    {
      id: 'NARROW',
      name: 'Narrow Range (66% ↓ \u00A0-\u00A0 3X ↑)',
    },
    {
      id: 'MEDIUM',
      name: 'Medium Range (90% ↓ \u00A0-\u00A0 10X ↑)',
    },
    {
      id: 'WIDE',
      name: 'Wide Range (99% ↓ \u00A0-\u00A0 100X ↑)',
    },
    {
      id: 'FULL',
      name: 'Full Range',
    },
  ]
  const range = options.liquidity.liquidityRange
  const listingPrice = (options.liquidity.listingPrice && parseFloat(options.liquidity.listingPrice)) || 0
  const minRangePrice =
    range == 'NARROW' ? listingPrice / 3 : range == 'MEDIUM' ? listingPrice / 10 : listingPrice / 100
  const maxRangePrice =
    range == 'NARROW' ? listingPrice * 3 : range == 'MEDIUM' ? listingPrice * 10 : listingPrice * 100

  const [_validationResult, seValidationResult] = useAtom(launchpadValidationResult)
  const validateAndNext = async () => {
    setAttempting(true)

    const disclaimer = 'I accept the following disclaimer:\n' + disclaimerMsg

    const request = await fetch(
      'https://interface-gateway.ubeswap.org/v1/ubestarter/validateAndSign' + (isTestMode ? '?test_mode=true' : ''),
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          options,
          disclaimer,
          disclaimerHash: hashMessage(disclaimer),
          disclaimerSignature: signature,
        }),
      }
    )

    if (request.ok) {
      let result: LaunchpadValidationResult | null = null
      try {
        result = (await request.json()) as LaunchpadValidationResult
      } catch (e) {
        console.log('validation parse error', e)
      }
      seValidationResult(result)
      onNext()
    } else {
      let message = 'Validation failed'
      try {
        message = (await request.json()).message
      } catch (e) {
        console.log('validation response error', e)
      }
      alert(message)
    }
    setAttempting(false)
  }

  return (
    <PageWrapper>
      <Modal isOpen={showDisclaimer} $scrollOverlay={true} maxHeight={90}>
        <div style={{ padding: '16px' }}>
          <div>
            {disclaimerMsg.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <Checkbox checked={isDisclaimerAccepted} hovered={true} onChange={handleCheckbox}>
            <div style={{ marginRight: '10px' }}>I accept this disclaimer</div>
          </Checkbox>
          <AutoColumn justify="center">
            <ButtonPrimary
              disabled={!isDisclaimerAccepted}
              style={{ marginTop: '16px', width: 'fit-content', padding: '8px 20px' }}
              onClick={signDisclaimer}
            >
              Sign With Wallet
            </ButtonPrimary>
          </AutoColumn>
        </div>
      </Modal>
      <AppBody $maxWidth="800px">
        <Nav to="/ubestarter">
          <BackArrow />
          <HeaderText>Launch Information</HeaderText>
        </Nav>
        <OptionsWrapper>
          <BlueCard>
            <AutoColumn gap="10px">
              <ThemedText.DeprecatedLink fontWeight={485} color="accent1">
                <Trans>
                  <strong>Tip:</strong> Creating a launch costs 10.000 UBE tokens which is automatically burned. You
                  will need to provide project tokens for the presale and the automated liquidity. If the sale fails,
                  these tokens will be returned to you.,{' '}
                  <ExternalLink href="https://docs.uniswap.org/">read the docs</ExternalLink>.
                </Trans>
              </ThemedText.DeprecatedLink>
            </AutoColumn>
          </BlueCard>

          <div style={{ marginTop: '16px' }}></div>

          <AddressInputPanel
            label="Token Address"
            placeholder="Token Contact Address"
            value={options.tokenInfo.tokenAddress}
            onChange={(val) => setOptionsProp('tokenInfo.tokenAddress', val)}
            isError={isError('tokenInfo.tokenAddress')}
            errorMessage={validationError?.message}
          />

          {token && (
            <ThemedText.SubHeaderSmall style={{ padding: '2px 0 12px 16px' }}>
              Name: {token.name} {'\u00A0\u00A0\u00A0\u00A0'} Symbol: {token.symbol}
            </ThemedText.SubHeaderSmall>
          )}

          <Row gap="10px" marginBottom="12px">
            <Column flex="1">
              <TextInputPanel
                label="Token Logo"
                placeholder="Token logo url must be 200x200 png image link."
                value={options.tokenInfo.logoUrl}
                onChange={(val) => setOptionsProp('tokenInfo.logoUrl', val)}
                isError={isError('tokenInfo.logoUrl')}
                errorMessage={validationError?.message}
              />
            </Column>
            {options.tokenInfo.logoUrl && (
              <div style={{ width: '85px', height: '85px' }}>
                <img src={options.tokenInfo.logoUrl} alt="logo" style={{ width: '100%', height: '100%' }} />
              </div>
            )}
          </Row>

          <Row marginBottom="12px">
            <TextareaPanel
              label="Description"
              value={options.tokenInfo.description}
              onChange={(val) => setOptionsProp('tokenInfo.description', val)}
              placeholder="Project info"
              fontSize="1rem"
              minHeight="100px"
              isError={isError('tokenInfo.description')}
              errorMessage={validationError?.message}
            />
          </Row>

          <Row marginBottom="12px">
            <TextInputPanel
              label="Project Website"
              placeholder="Website link"
              value={options.tokenInfo.website}
              onChange={(val) => setOptionsProp('tokenInfo.website', val)}
              isError={isError('tokenInfo.website')}
              errorMessage={validationError?.message}
            />
          </Row>
          <Row marginBottom="12px">
            <TextareaPanel
              label="Audit Links"
              value={options.tokenInfo.auditLinks}
              onChange={(val) => setOptionsProp('tokenInfo.auditLinks', val)}
              placeholder="Audit links line by line"
              fontSize="1rem"
              minHeight="50px"
            />
          </Row>

          <Row gap="10px" marginBottom="12px" align="flex-start">
            <Column flex="1">
              <TextInputPanel
                label="Whitepaper"
                placeholder="Whitepaper link"
                value={options.tokenInfo.whitepaperLink}
                onChange={(val) => setOptionsProp('tokenInfo.whitepaperLink', val)}
                isError={isError('tokenInfo.whitepaperLink')}
                errorMessage={validationError?.message}
              />
            </Column>
            <Column flex="1">
              <TextInputPanel
                label="Pitch Deck / Presentation"
                placeholder="Pitch Deck / Presentation link"
                value={options.tokenInfo.presentationLink}
                onChange={(val) => setOptionsProp('tokenInfo.presentationLink', val)}
                isError={isError('tokenInfo.presentationLink')}
                errorMessage={validationError?.message}
              />
            </Column>
          </Row>

          <Row gap="10px" marginBottom="12px" align="flex-start">
            <Column flex="1">
              <TextInputPanel
                label="Github"
                placeholder="Github page link"
                value={options.tokenInfo.github}
                onChange={(val) => setOptionsProp('tokenInfo.github', val)}
                isError={isError('tokenInfo.github')}
                errorMessage={validationError?.message}
              />
            </Column>
            <Column flex="1">
              <TextInputPanel
                label="Twitter/X"
                placeholder="Twitter page link"
                value={options.tokenInfo.twitter}
                onChange={(val) => setOptionsProp('tokenInfo.twitter', val)}
                isError={isError('tokenInfo.twitter')}
                errorMessage={validationError?.message}
              />
            </Column>
          </Row>
          <Row gap="10px" marginBottom="12px" align="flex-start">
            <Column flex="1">
              <TextInputPanel
                label="Telegram"
                placeholder="Telegram group link"
                value={options.tokenInfo.telegram}
                onChange={(val) => setOptionsProp('tokenInfo.telegram', val)}
                isError={isError('tokenInfo.telegram')}
                errorMessage={validationError?.message}
              />
            </Column>
            <Column flex="1">
              <TextInputPanel
                label="Discord"
                placeholder="Discord link"
                value={options.tokenInfo.discord}
                onChange={(val) => setOptionsProp('tokenInfo.discord', val)}
                isError={isError('tokenInfo.discord')}
                errorMessage={validationError?.message}
              />
            </Column>
          </Row>
          <Row gap="10px" marginBottom="12px" align="flex-start">
            <Column flex="1">
              <TextInputPanel
                label="Farcaster"
                placeholder="Farcaster link"
                value={options.tokenInfo.farcaster}
                onChange={(val) => setOptionsProp('tokenInfo.farcaster', val)}
                isError={isError('tokenInfo.farcaster')}
                errorMessage={validationError?.message}
              />
            </Column>
            <Column flex="1">
              <TextInputPanel
                label="Medium"
                placeholder="Medium link"
                value={options.tokenInfo.medium}
                onChange={(val) => setOptionsProp('tokenInfo.medium', val)}
                isError={isError('tokenInfo.medium')}
                errorMessage={validationError?.message}
              />
            </Column>
          </Row>
          <Row gap="10px" marginBottom="12px" align="flex-start">
            <Column flex="1">
              <TextInputPanel
                label="Youtube"
                placeholder="Youtube link"
                value={options.tokenInfo.youtube}
                onChange={(val) => setOptionsProp('tokenInfo.youtube', val)}
                isError={isError('tokenInfo.youtube')}
                errorMessage={validationError?.message}
              />
            </Column>
            <Column flex="1">
              <TextInputPanel
                label="Reddit"
                placeholder="Reddit page link"
                value={options.tokenInfo.reddit}
                onChange={(val) => setOptionsProp('tokenInfo.reddit', val)}
                isError={isError('tokenInfo.reddit')}
                errorMessage={validationError?.message}
              />
            </Column>
          </Row>

          <Row marginBottom="8px" marginTop="12px" marginLeft="4px">
            <Column flex="1">
              <ThemedText.BodyPrimary>Team</ThemedText.BodyPrimary>
            </Column>
            <Column>
              <SmallButtonPrimary
                data-testid="add-team-button"
                disabled={false}
                width="fit-content"
                style={{ borderRadius: '12px' }}
                padding="1px 4px"
                onClick={() => setTeamModalOpened(true)}
              >
                <ThemedText.DeprecatedMain color={theme.white}>
                  <Trans>Add Team member</Trans>
                </ThemedText.DeprecatedMain>
              </SmallButtonPrimary>
            </Column>
          </Row>
          <TableWrapper data-testid="team-table">
            <SimpleTable
              headers={teamColumnHeaders}
              data={teamMembersData}
              showRemoveButton
              onRemove={removeTeamMember}
            />
          </TableWrapper>
          {teamModalOpened && (
            <AddTeamMemberModal isOpen={true} onDismiss={() => setTeamModalOpened(false)} onSubmit={addTeamMember} />
          )}

          <Row marginBottom="8px" marginTop="12px" marginLeft="4px">
            <Column flex="1">
              <Row>
                <ThemedText.BodyPrimary>Tokenomics</ThemedText.BodyPrimary>
                <MouseoverTooltip
                  text="Be sure to enter the complete tokenomics as the circulating and total supply will be calculated from the information provided."
                  placement="top"
                >
                  <Info
                    size={14}
                    style={{
                      marginLeft: '4px',
                      marginBottom: '3px',
                      verticalAlign: 'middle',
                      cursor: 'pointer',
                    }}
                  />
                </MouseoverTooltip>
              </Row>
            </Column>
            <Column>
              <SmallButtonPrimary
                data-testid="add-tokenomics-button"
                disabled={false}
                width="fit-content"
                style={{ borderRadius: '12px' }}
                padding="1px 4px"
                onClick={() => setTokenomicsModalOpened(true)}
              >
                <ThemedText.DeprecatedMain color={theme.white}>
                  <Trans>Add Tokenomics Entry</Trans>
                </ThemedText.DeprecatedMain>
              </SmallButtonPrimary>
            </Column>
          </Row>
          <TableWrapper data-testid="tokenomics-table">
            <SimpleTable
              headers={tokenomicsHeaders}
              data={tokenomicsData}
              showRemoveButton
              onRemove={removeTokenomics}
            />
          </TableWrapper>
          <Row width="fit-content" gap="20px" marginTop="10px">
            <Row width="fit-content" gap="8px" align="center">
              <ThemedText.BodySecondary>Total Supply</ThemedText.BodySecondary>
              <ThemedText.BodyPrimary>
                {formatNumber({
                  input: totalSupply,
                  type: NumberType.TokenNonTx,
                })}{' '}
                {token?.symbol}
              </ThemedText.BodyPrimary>
            </Row>
            <Row width="fit-content" gap="8px" align="center">
              <ThemedText.BodySecondary>Unlocked at launch</ThemedText.BodySecondary>
              <ThemedText.BodyPrimary>
                {formatNumber({
                  input: initialCirculatinSupply,
                  type: NumberType.TokenNonTx,
                })}{' '}
                {token?.symbol}
              </ThemedText.BodyPrimary>
            </Row>
          </Row>
          {tokenomicsModalOpened && (
            <AddTokenomicsModal
              isOpen={true}
              onDismiss={() => setTokenomicsModalOpened(false)}
              onSubmit={addTokenomics}
            />
          )}

          <Divider />

          <ThemedText.MediumHeader marginBottom="12px">Launch Settings</ThemedText.MediumHeader>

          <Row marginBottom="12px">
            <ActionSelector
              title="Select Funding Currency"
              items={quoteTokens}
              selectedAction={options.tokenSale.quoteToken}
              onActionSelect={(val) => setOptionsProp('tokenSale.quoteToken', val)}
            />
          </Row>
          <Row gap="10px" marginBottom="12px" align="flex-start">
            <Column flex="1">
              <NumericalInputPanel
                label="Target Raise Amount (Hard Cap)"
                placeholder=""
                value={options.tokenSale.hardCapAsQuote}
                onChange={(val) => setOptionsProp('tokenSale.hardCapAsQuote', val)}
                isError={isError('tokenSale.hardCapAsQuote')}
                errorMessage={validationError?.message}
                postfix={quoteToken?.symbol}
              />
            </Column>
            <Column flex="1">
              <NumericalInputPanel
                label="Min Raise Amount (Soft Cap)"
                placeholder=""
                value={options.tokenSale.softCapAsQuote}
                onChange={(val) => setOptionsProp('tokenSale.softCapAsQuote', val)}
                isError={isError('tokenSale.softCapAsQuote')}
                errorMessage={validationError?.message}
                postfix={quoteToken?.symbol}
              />
            </Column>
          </Row>
          <Row gap="10px" marginBottom="12px" align="flex-start">
            <Column flex="1">
              <NumericalInputPanel
                label="Sell Price"
                placeholder="Sell Price"
                value={options.tokenSale.sellPrice}
                onChange={(val) => setOptionsProp('tokenSale.sellPrice', val)}
                isError={isError('tokenSale.sellPrice')}
                errorMessage={validationError?.message}
                postfix={quoteToken?.symbol}
                infoTooltip="This is the token sale price"
              />
              <Row width="fit-content" gap="8px" align="center" marginTop="8px" marginLeft="12px">
                <ThemedText.BodySecondary>Tokens Offered</ThemedText.BodySecondary>
                <ThemedText.BodyPrimary>
                  {formatNumber({
                    input: tokensOffered,
                    type: NumberType.TokenNonTx,
                  })}{' '}
                  {token?.symbol}
                </ThemedText.BodyPrimary>
              </Row>
            </Column>
            <Column flex="1">
              <NumericalInputPanel
                label="Listing Price"
                placeholder="Listing Price"
                value={options.liquidity.listingPrice}
                onChange={(val) => setOptionsProp('liquidity.listingPrice', val)}
                isError={isError('liquidity.listingPrice')}
                errorMessage={validationError?.message}
                postfix={quoteToken?.symbol}
                infoTooltip="This is the price the liquidity will be created at"
              />
            </Column>
          </Row>
          <Row gap="10px" marginBottom="12px">
            <Column flex="1">
              {/*<TextInputPanel
                label="Start Date"
                placeholder="e.g. 2025-01-01 15:00:00"
                value={options.tokenSale.startDate}
                onChange={(val) => setOptionsProp('tokenSale.startDate', val)}
                isError={isError('tokenSale.startDate')}
                errorMessage={validationError?.message}
              />*/}
              <DatePickerPanel
                label="Start Date"
                placeholder="Select start date and time"
                selected={options.tokenSale.startDate ? new Date(options.tokenSale.startDate) : null}
                onChange={(val) => setOptionsProp('tokenSale.startDate', val?.toJSON() || '')}
                minDate={new Date()}
                isError={false}
                errorMessage="Please select a date"
              />
            </Column>
            <Column flex="1">
              <NumericalInputPanel
                label="Duration"
                placeholder="Duration in days"
                value={options.tokenSale.durationDays}
                onChange={(val) => setOptionsProp('tokenSale.durationDays', val)}
                isError={isError('tokenSale.durationDays')}
                errorMessage={validationError?.message}
                postfix="days"
              />
            </Column>
          </Row>
          <Row marginBottom="8px" marginTop="12px" marginLeft="4px">
            <Column flex="1">
              <ThemedText.BodyPrimary>Token Distribution</ThemedText.BodyPrimary>
            </Column>
            <Column>
              <SmallButtonPrimary
                data-testid="add-team-button"
                disabled={false}
                width="fit-content"
                style={{ borderRadius: '12px' }}
                padding="1px 4px"
                onClick={() => setTokenDistModalOpened(true)}
              >
                <ThemedText.DeprecatedMain color={theme.white}>
                  <Trans>Set Distribution Params</Trans>
                </ThemedText.DeprecatedMain>
              </SmallButtonPrimary>
            </Column>
          </Row>
          <TableWrapper data-testid="team-table">
            <SimpleTable headers={tokenDistHeaders} data={tokenDistData} />
          </TableWrapper>
          {tokenDistModalOpened && (
            <TokenDistributionModal
              isOpen={true}
              initialParams={initialTokenDistParams}
              onDismiss={() => setTokenDistModalOpened(false)}
              onSubmit={setTokenDistribution}
            />
          )}

          <Divider />

          <ThemedText.MediumHeader marginBottom="12px">Automoted Liquidity</ThemedText.MediumHeader>

          <Row gap="10px" marginBottom="12px" align="flex-start">
            <Column flex="1">
              <NumericalInputPanel
                label="Liquidity Percentage"
                placeholder="How much amount of the raised tokend will be used as liquidity"
                value={options.liquidity.liquidityRate}
                onChange={(val) => setOptionsProp('liquidity.liquidityRate', val)}
                isError={isError('liquidity.liquidityRate')}
                errorMessage={validationError?.message}
                infoTooltip="% of raised amount which will be used to automatically create the liquidity  at the listing price"
                postfix="%"
              />
            </Column>
            <Column flex="1">
              <ActionSelector
                title="Liquidity pool fee tier"
                items={liqFees}
                selectedAction={options.liquidity.liquidityFee}
                onActionSelect={(val) => setOptionsProp('liquidity.liquidityFee', val)}
              />
            </Column>
          </Row>

          <Row marginBottom="10px">
            <ActionSelector
              title="Price Range for the liquidity"
              items={liqRanges}
              selectedAction={options.liquidity.liquidityRange}
              onActionSelect={(val) => setOptionsProp('liquidity.liquidityRange', val)}
            />
          </Row>
          <Row width="fit-content" gap="20px" marginBottom="10px" marginLeft="12px">
            <Row width="fit-content" gap="8px" align="center">
              <ThemedText.BodySecondary>Min Price</ThemedText.BodySecondary>
              <ThemedText.BodyPrimary>
                {range == 'FULL' ? '-∞' : minRangePrice} {quoteToken?.symbol}
              </ThemedText.BodyPrimary>
            </Row>
            <Row width="fit-content" gap="8px" align="center">
              <ThemedText.BodySecondary>Max Price</ThemedText.BodySecondary>
              <ThemedText.BodyPrimary>
                {range == 'FULL' ? '+∞' : maxRangePrice} {quoteToken?.symbol}
              </ThemedText.BodyPrimary>
            </Row>
          </Row>

          <Row marginBottom="12px">
            <ActionSelector
              title="Liquidity Preference"
              items={liqActions}
              selectedAction={options.liquidity.liquidityAction}
              onActionSelect={(val) => setOptionsProp('liquidity.liquidityAction', val)}
            />
          </Row>
          {options.liquidity.liquidityAction == 'LOCK' && (
            <Row marginBottom="12px">
              <NumericalInputPanel
                label="Locking Period"
                placeholder="Locking period in days"
                value={options.liquidity.lockDurationDays}
                onChange={(val) => setOptionsProp('liquidity.lockDurationDays', val)}
                isError={isError('liquidity.lockDurationDays')}
                errorMessage={validationError?.message}
                postfix="days"
              />
            </Row>
          )}

          <ButtonError
            style={{ marginTop: '18px' }}
            error={!!validationError}
            disabled={!!validationError || attempting}
            onClick={validateAndNext}
          >
            {attempting ? (
              <AutoRow gap="6px" justify="center">
                Validating <Loader stroke="white" />
              </AutoRow>
            ) : (
              <Trans>See Preview</Trans>
            )}
          </ButtonError>
        </OptionsWrapper>
      </AppBody>
    </PageWrapper>
  )
}
