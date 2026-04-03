"use client"

import { COUNTRY_CODES } from "@/lib/constants"
import { Input } from "@/components/ui/input"

interface PhoneInputProps {
  countryCode: string
  onCountryCodeChange: (code: string) => void
  phoneNumber: string
  onPhoneNumberChange: (number: string) => void
  disabled?: boolean
  id?: string
  lockedCountryCode?: boolean
  placeholder?: string
}

export function PhoneInput({
  countryCode,
  onCountryCodeChange,
  phoneNumber,
  onPhoneNumberChange,
  disabled,
  id = "phone",
  lockedCountryCode = false,
  placeholder,
}: PhoneInputProps) {
  return (
    <div className="flex h-12 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-xs transition-colors focus-within:border-white focus-within:ring-[1.5px] focus-within:ring-white/80">
      {lockedCountryCode ? (
        <div className="flex h-12 items-center border-0 bg-muted/50 px-4 text-sm font-medium text-foreground">
          🇦🇷 {countryCode}
        </div>
      ) : (
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          className="flex h-12 items-center border-0 bg-muted/50 px-4 text-sm font-medium text-foreground outline-none [&>option]:bg-card"
          aria-label="Código de país"
        >
          {COUNTRY_CODES.map(({ code, label, flag }) => (
            <option key={code} value={code}>
              {flag} {code} {label}
            </option>
          ))}
        </select>
      )}
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        value={phoneNumber}
        onChange={(e) => onPhoneNumberChange(e.target.value.replace(/\D/g, "").slice(0, 15))}
        autoComplete="tel"
        disabled={disabled}
        placeholder={placeholder}
        className="h-12 min-w-0 flex-1 rounded-none border-0 border-l bg-transparent px-4 text-base focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
      />
    </div>
  )
}
