import { create } from 'zustand'

interface ModbusState {
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'
  registers: Record<string, number>
}

export const useModbusStore = create<ModbusState>(() => ({
  status: 'DISCONNECTED',
  registers: {},
}))
