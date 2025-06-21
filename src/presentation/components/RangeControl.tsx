import { Input } from '@/components/ui/input'

interface RangeControlProps {
  label: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
}

export default function RangeControl({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: RangeControlProps) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span>{label}</span>
      <Input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-32"
      />
      <span className="tabular-nums w-8 text-right">{value.toFixed(2)}</span>
    </label>
  )
}
