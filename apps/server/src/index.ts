import { ApiServer } from '@/api'
import { ModbusTcpServer, ModbusUdpServer } from '@/server'
import { VirtualDeviceManager } from '@/virtualDevice'

const virtualDeviceManager = new VirtualDeviceManager()

const tcpServer = new ModbusTcpServer({
  port: Number(process.env.PORT) || 502,
  virtualDeviceManager,
})

const udpServer = new ModbusUdpServer({
  port: Number(process.env.PORT) || 502,
  virtualDeviceManager,
})

const api = new ApiServer({
  port: 3000,
  deviceManager: virtualDeviceManager,
})

tcpServer.start()
udpServer.start()
api.start()
