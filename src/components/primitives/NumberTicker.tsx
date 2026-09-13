import { useEffect, useRef, useState } from 'react'

interface NumberTickerProps {
  value: number
  duration?: number
  className?: string
  format?: (n: number) => string
}

export function NumberTicker({
  value,
  duration = 1000,
  className = '',
  format = (n) => new Intl.NumberFormat('en-US').format(Math.round(n)),
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState<number>(value)
  const prevValue = useRef<number>(value)
  const startTime = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const startVal = prevValue.current
    const targetVal = value
    if (startVal === targetVal) {
      setDisplayValue(targetVal)
      return
    }

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp
      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing: easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = startVal + (targetVal - startVal) * easeProgress

      setDisplayValue(current)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(targetVal)
        prevValue.current = targetVal
        startTime.current = null
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      startTime.current = null
    }
  }, [value, duration])

  return (
    <span className={`tabular-nums inline-block transition-transform duration-300 ${className}`}>
      {format(displayValue)}
    </span>
  )
}
