import { HideScrollBarStyles } from 'components/Common'
import { LoadingBubble } from 'components/Tokens/loading'
import { ReactNode } from 'react'
import { XCircle } from 'react-feather'
import styled from 'styled-components'

const Table = styled.table`
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  width: 100%;
  overflow: hidden;
`

export const Thead = styled.thead`
  overflow: auto;
  width: unset;
  background: ${({ theme }) => theme.surface2};
  ${HideScrollBarStyles}
  overscroll-behavior: none;
`

const TR = styled.tr`
  border-bottom: ${({ theme }) => `1px solid ${theme.surface3}`};
  width: 100%;

  &:last-child {
    border-bottom: none;
  }
`

const TH = styled.th`
  color: ${({ theme }) => theme.neutral2};
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
  font-weight: 485;
  font-size: 16px;
  line-height: 22px;
  overflow: hidden;
  padding: 12px 8px;

  &:first-child {
    padding-left: 22px;
  }
  &:last-child {
    padding-right: 22px;
  }
`

const TD = styled.td`
  color: ${({ theme }) => theme.neutral1};
  height: 56px;
  padding: 8px 0px;
  text-align: left;
  vertical-align: middle;
  font-weight: 485;
  font-size: 16px;

  &:first-child {
    padding-left: 22px;
  }
  &:last-child {
    padding-right: 22px;
  }
`

const TDRemove = styled(TD)`
  color: ${({ theme }) => theme.critical};
  height: 56px;
  padding: 0 12px 0 0;
  width: 28px;
  text-align: right;
  vertical-align: center;
  & > * {
    cursor: pointer;
  }
`

const LoadingCell = styled(LoadingBubble)`
  height: 20px;
  width: 80px;
`

const SimpleTable = ({ children, headers }: { children: ReactNode; headers: string[] }) => {
  return (
    <Table>
      <Thead>
        <TR>
          {headers.map((header) => (
            <TH key={`h-${header}`}>{header}</TH>
          ))}
        </TR>
      </Thead>
      <tbody>{children}</tbody>
    </Table>
  )
}

const LoadingSimpleTableRow = ({ cellCount }: { cellCount: number }) => {
  return (
    <TR>
      {Array(cellCount)
        .fill(null)
        .map((_, index) => {
          return (
            <TD key={index}>
              <LoadingCell />
            </TD>
          )
        })}
    </TR>
  )
}

const SimpleTableComp = ({
  headers,
  data,
  loadingRowCount = 3,
  noDataText = 'No Data',
  showRemoveButton = false,
  onRemove,
}: {
  headers: string[]
  data?: ReactNode[][]
  loadingRowCount?: number
  noDataText?: string
  showRemoveButton?: boolean
  onRemove?: (index: number) => void
}) => {
  const headersComp = showRemoveButton ? headers.concat('') : headers
  return data ? (
    <SimpleTable headers={headersComp}>
      {data.length == 0 ? (
        <TR key="empty">
          <TD colSpan={headersComp.length} style={{ textAlign: 'center' }}>
            {noDataText}
          </TD>
        </TR>
      ) : (
        data.map((_colunms, index) => {
          const columns = showRemoveButton ? _colunms.concat('--x--') : _colunms
          return (
            <TR key={index}>
              {columns.map((col, colIndex) => {
                if (col == '--x--') {
                  return (
                    <TDRemove key={`col-${index}-${colIndex}`}>
                      <XCircle onClick={() => onRemove && onRemove(index)} />
                    </TDRemove>
                  )
                }
                return <TD key={`col-${index}-${colIndex}`}>{col}</TD>
              })}
            </TR>
          )
        })
      )}
    </SimpleTable>
  ) : (
    <SimpleTable headers={headersComp}>
      {Array(loadingRowCount)
        .fill(null)
        .map((_, index) => {
          return <LoadingSimpleTableRow key={index} cellCount={headersComp.length} />
        })}
    </SimpleTable>
  )
}

export default SimpleTableComp
