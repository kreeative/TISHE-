import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete: string
  minLength?: number
}

// Brand-styled password field with a show/hide toggle.
export default function PasswordInput({ id, value, onChange, placeholder, autoComplete, minLength = 5 }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <label className="sr-only" htmlFor={id}>{placeholder}</label>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border border-[#5A3224]/30 pl-4 pr-12 py-3.5 text-sm text-[#1B1113] placeholder:text-[#1B1113]/40 focus:outline-none focus:border-[#5A3224]"
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1B1113]/45 hover:text-[#5A3224] transition-colors"
      >
        {visible ? <EyeOff size={17} strokeWidth={1.75} /> : <Eye size={17} strokeWidth={1.75} />}
      </button>
    </div>
  )
}
