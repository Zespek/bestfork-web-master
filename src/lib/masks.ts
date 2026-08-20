import type { ChangeEvent } from 'react'

/** "12345678000199" → "12.345.678/0001-99", truncando dígitos extras. */
export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)

  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

/** "11999998888" → "(11) 99999-8888". Aceita fixo (8 dígitos) e celular (9 dígitos). */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/** Aplica um formatador de máscara ao evento de `onChange` antes de repassá-lo pro handler original. */
export function maskOnChange(
  formatter: (value: string) => string,
  onChange: (event: ChangeEvent<HTMLInputElement>) => void,
) {
  return (event: ChangeEvent<HTMLInputElement>) => {
    event.target.value = formatter(event.target.value)
    onChange(event)
  }
}
