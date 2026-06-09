import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@modb.us/ui/components/ui/card'
import { AnimatedValue } from './AnimatedValue'

interface DataTableProps {
  title: string
  values: (number | boolean)[]
  type: 'register' | 'coil'
}

export function DataTable({ title, values, type }: DataTableProps) {
  // Increase the slice to show way more data in the new dense layout
  const displayValues = values.slice(0, 400)

  return (
    <Card className="bg-zinc-950/80 border-zinc-800/80 shadow-2xl backdrop-blur-md overflow-hidden m-2 flex flex-col h-full">
      {/* Hacker aesthetic: Monospaced, tracked-out title,
        and an explicit display of the memory range being shown.
      */}
      <CardHeader className="p-4 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-row items-center justify-between sticky top-0 z-20">
        <CardTitle className="text-xs font-bold text-cyan-500 uppercase tracking-[0.25em] font-mono shadow-cyan-500/20 drop-shadow-sm">
          {title}
        </CardTitle>
        <div className="text-[10px] text-zinc-600 font-mono flex gap-2">
          <span>MEM_RANGE:</span>
          <span className="text-zinc-400">
            [0000 - {(displayValues.length - 1).toString().padStart(4, '0')}]
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-grow">
        <div className="h-[500px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
          {/* The High-Density Grid:
            Responsive columns pack registers tightly.
            gap-1.5 provides breathing room without sacrificing density.
          */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
            {displayValues.map((value, addr) => (
              <div
                key={addr}
                className="group relative flex flex-col items-center justify-center p-2 rounded border border-zinc-800/40 bg-zinc-900/30 hover:bg-zinc-800 hover:border-cyan-900/50 transition-all cursor-crosshair"
              >
                {/* Hover effect bracket indicators for that classic terminal feel
                 */}
                <span className="absolute inset-0 border border-cyan-500/0 group-hover:border-cyan-500/30 rounded transition-colors pointer-events-none" />

                <span className="text-[9px] text-zinc-600 font-mono mb-1 leading-none group-hover:text-zinc-400 transition-colors">
                  {addr.toString().padStart(4, '0')}
                </span>

                <div className="flex items-center justify-center min-h-[24px]">
                  <AnimatedValue value={value} type={type} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
