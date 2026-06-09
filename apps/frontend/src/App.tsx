import React, { useEffect, useState } from 'react'
import { DataTable } from './components/DataTable'

interface ModbusState {
  holdingRegisters: number[]
  inputRegisters: number[]
  coils: boolean[]
  discreteInputs: boolean[]
}

function App() {
  const [state, setState] = useState<ModbusState | null>(null)

  useEffect(() => {
    fetch('http://localhost:3001/api/state')
      .then((r) => r.json())
      .then(setState)
      .catch(console.error) // Good practice to catch fetch errors
  }, [])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001')

    ws.onmessage = (event) => {
      try {
        setState(JSON.parse(event.data))
      } catch (e) {
        console.error('Failed to parse websocket data', e)
      }
    }

    return () => ws.close()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-6 gap-4">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tighter">
              <span className="text-zinc-100">modb</span>
              <span className="text-zinc-500">.</span>
              <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                us
              </span>
            </h1>
            <p className="text-zinc-500 mt-2 font-mono text-sm">
              Global shared address space
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-sm flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <div>
              <span className="text-zinc-500">Client Endpoint: </span>
              <span className="text-cyan-400 font-semibold">
                localhost:5020
              </span>
            </div>
          </div>
        </header>

        {/* Data Grid Section */}
        {state ? (
          <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <DataTable
              title="Holding Registers"
              values={state.holdingRegisters}
              type="register"
            />
            <DataTable
              title="Input Registers"
              values={state.inputRegisters}
              type="register"
            />
            <DataTable title="Coils" values={state.coils} type="coil" />
            <DataTable
              title="Discrete Inputs"
              values={state.discreteInputs}
              type="coil"
            />
          </main>
        ) : (
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-zinc-800 rounded-xl">
            <p className="text-zinc-500 font-mono animate-pulse">
              Awaiting connection...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
