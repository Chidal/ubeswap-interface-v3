import { MouseoverTooltip } from 'components/Tooltip'
import { Trans } from 'i18n'
import { ReactNode, SyntheticEvent, forwardRef } from 'react'
import DatePicker from 'react-datepicker'
import { Info } from 'react-feather'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import 'react-datepicker/dist/react-datepicker.css'
import styled, { createGlobalStyle, useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'

// DatePicker için tema stilleri
const DatePickerStyles = createGlobalStyle`
  .react-datepicker {
    font-family: inherit;
    background-color: ${({ theme }) => theme.surface1} !important;
    border: 1px solid ${({ theme }) => theme.surface3};
    border-radius: 0.5rem;
    color: ${({ theme }) => theme.neutral1};
    padding-right: 1px;
  }

  .react-datepicker__triangle {
    display: none;
  }

  .react-datepicker__header {
    background-color: ${({ theme }) => theme.surface1} !important;
    border-bottom: 1px solid ${({ theme }) => theme.surface3};
    padding: 12px;
  }

  .react-datepicker__navigation-icon::before {
    border-color: ${({ theme }) => theme.neutral2}; // Ok işaretlerinin rengi
  }

  .react-datepicker__current-month,
  .react-datepicker-time__header,
  .react-datepicker__day-name,
  .react-datepicker__time-name {
    color: ${({ theme }) => theme.neutral1} !important;
    font-weight: 500;
  }

  .react-datepicker__day {
    color: ${({ theme }) => theme.neutral1} !important;
    background-color: transparent;

    &:hover {
      background-color: ${({ theme }) => theme.surface3} !important;
      color: ${({ theme }) => theme.neutral1} !important;
    }
  }

  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected {
    background-color: ${({ theme }) => theme.accent1} !important;
    color: ${({ theme }) => theme.white} !important;

    &:hover {
      background-color: ${({ theme }) => theme.accent2} !important;
    }
  }

  .react-datepicker__day--disabled {
    color: ${({ theme }) => theme.neutral3} !important;
    &:hover {
      background-color: transparent !important;
    }
  }

  .react-datepicker__time-container,
  .react-datepicker__time-box {
    background-color: ${({ theme }) => theme.surface1} !important;
    //border-left-color: ${({ theme }) => theme.surface3} !important;
  }

  .react-datepicker__time-list {
    background-color: ${({ theme }) => theme.surface1} !important;
    color: ${({ theme }) => theme.neutral1} !important;
  }

  .react-datepicker__time-list-item {
    background-color: ${({ theme }) => theme.surface1} !important;
    color: ${({ theme }) => theme.neutral1} !important;

    &:hover {
      background-color: ${({ theme }) => theme.surface3} !important;
    }
  }

  .react-datepicker__time-list-item--selected {
    background-color: ${({ theme }) => theme.accent1} !important;
    color: ${({ theme }) => theme.white} !important;

    &:hover {
      background-color: ${({ theme }) => theme.accent1} !important;
    }
  }

  .react-datepicker__time-list-item--disabled {
    color: ${({ theme }) => theme.neutral3} !important;
  }

  .react-datepicker-popper {
    z-index: 999999;
  }

  /* Kaydırma çubuğu stilleri */
  .react-datepicker__time-list::-webkit-scrollbar {
    width: 8px;
  }

  .react-datepicker__time-list::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.surface2};

  }

  .react-datepicker__time-list::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.surface3};
    border-radius: 4px;
  }
`

const InputPanel = styled.div`
  ${flexColumnNoWrap};
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.surface1};
  z-index: 99999999999;
  width: 100%;
`

const ContainerRow = styled.div<{ error: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 1.25rem;
  border: 1px solid ${({ error, theme }) => (error ? theme.critical : theme.surface3)};
  transition: border-color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')},
    color 500ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  background-color: ${({ theme }) => theme.surface1};
`

const InputContainer = styled.div`
  flex: 1;
  padding: 1rem;
`

const InputRow = styled.div`
  ${flexRowNoWrap};
  align-items: center;

  // DatePicker'ın ana container'ı için stil
  .react-datepicker-wrapper,
  .react-datepicker__input-container {
    display: flex;
    width: 100%;
    height: 1.25rem; // Input yüksekliği ile eşleştirildi
  }
`

const CustomInput = styled.input<{ error?: boolean }>`
  font-size: 1.25rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  background-color: ${({ theme }) => theme.surface1};
  transition: color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  color: ${({ error, theme }) => (error ? theme.critical : theme.neutral1)};
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 535;
  width: 100%;
  height: 1.25rem;
  line-height: 1.25rem;
  cursor: pointer;
  ::placeholder {
    color: ${({ theme }) => theme.neutral3};
  }
  padding: 0px;

  &:placeholder-shown {
    color: ${({ theme }) => theme.neutral3};
  }

  &::placeholder {
    color: ${({ theme }) => theme.neutral3};
    opacity: 1; // Placeholder opacity'sini artıralım
  }
`

const ErrorMessage = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.critical};
  margin-top: 8px;
  margin-left: 4px;
`

interface CustomInputProps {
  value?: string
  onClick?: () => void
  onChange?: () => void
  placeholder?: string
  error?: boolean
  className?: string
}

const CustomDateInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ value, onClick, placeholder, error, className }, ref) => (
    <CustomInput
      value={value || ''}
      onClick={onClick}
      readOnly
      ref={ref}
      placeholder={placeholder}
      error={error}
      className={className}
    />
  )
)
CustomDateInput.displayName = 'CustomDateInput'

// Yarım saatlik aralıklar için helper fonksiyon
const getTimeClassName = (time: Date) => {
  if (time.getMinutes() !== 0 && time.getMinutes() !== 30) return 'hidden'
  return ''
}

export default function DatePickerPanel({
  id,
  className = '',
  label,
  placeholder,
  selected,
  onChange,
  isError = false,
  errorMessage,
  minDate,
  maxDate,
  showTimeSelect = true,
  showInfo = false,
  infoTooltip = '',
}: {
  id?: string
  className?: string
  label?: ReactNode
  placeholder?: string
  selected: Date | null
  onChange: (date: Date | null, event?: SyntheticEvent<any, Event> | undefined) => void
  isError?: boolean
  errorMessage?: string
  minDate?: Date
  maxDate?: Date
  showTimeSelect?: boolean
  showInfo?: boolean
  infoTooltip?: string
}) {
  const theme = useTheme()

  return (
    <InputPanel id={id}>
      <DatePickerStyles />
      <ContainerRow error={isError}>
        <InputContainer>
          <AutoColumn gap="md">
            <RowBetween>
              <ThemedText.DeprecatedBlack color={theme.neutral2} fontWeight={535} fontSize={14}>
                {label ?? <Trans>Select Date</Trans>}
                {showInfo && infoTooltip && (
                  <MouseoverTooltip text={infoTooltip} placement="top">
                    <Info
                      size={15}
                      style={{
                        marginLeft: '4px',
                        verticalAlign: 'middle',
                        cursor: 'pointer',
                      }}
                    />
                  </MouseoverTooltip>
                )}
              </ThemedText.DeprecatedBlack>
            </RowBetween>
            <InputRow>
              <DatePicker
                selected={selected}
                onChange={onChange}
                customInput={<CustomDateInput className={className} placeholder={placeholder} error={isError} />}
                showTimeSelect={showTimeSelect}
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="Time"
                dateFormat="MM/dd/yyyy HH:mm"
                minDate={minDate}
                maxDate={maxDate}
                timeClassName={getTimeClassName}
                isClearable={false}
                placeholderText={placeholder}
              />
            </InputRow>
          </AutoColumn>
        </InputContainer>
      </ContainerRow>
      {isError && errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
    </InputPanel>
  )
}
