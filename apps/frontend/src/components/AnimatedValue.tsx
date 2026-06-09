import React, { useEffect, useState, useRef } from 'react'
import { Badge } from '@modb.us/ui/components/ui/badge'

interface AnimatedValueProps {
  value: number | boolean
  type: 'register' | 'coil'
}

export function AnimatedValue({ value, type }: AnimatedValueProps) {
  const [isFlashing, setIsFlashing] = useState(false)
  const prevValue = useRef(value)

  useEffect(() => {
    if (prevValue.current === value) {
      return
    }

    setIsFlashing(true)
    const timer = setTimeout(() => setIsFlashing(false), 700)
    prevValue.current = value
    return () => clearTimeout(timer)
  }, [value])

  // Hacker-y color scale for 16-bit integers
  const getColorClass = (val: number) => {
    if (val === 0) return 'text-zinc-600'
    if (val < 255) return 'text-cyan-400'
    if (val < 4096) return 'text-green-400'
    if (val < 32768) return 'text-amber-400'
    return 'text-fuchsia-500' // High values
  }

  const displayValue =
    type === 'coil' ? (
      value ? (
        <Badge variant="default" className="bg-cyan-600">
          ON
        </Badge>
      ) : (
        <Badge variant="outline" className="text-zinc-600 border-zinc-800">
          OFF
        </Badge>
      )
    ) : (
      value
    )

  const textColor = type === 'register' ? getColorClass(value as number) : ''

  return (
    <span
      key={isFlashing ? 'flash' : 'idle'} // Forces DOM reflow for animation
      className={`font-mono inline-block px-2 py-0.5 rounded transition-colors ${textColor} ${isFlashing ? 'animate-valueFlash' : ''}`}
    >
      {displayValue}
    </span>
  )
}
