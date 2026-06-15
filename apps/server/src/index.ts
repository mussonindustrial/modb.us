import { ApiServer } from './api'
import { VirtualDeviceModbusTcpServer } from './server'

const server = new VirtualDeviceModbusTcpServer({
  port: Number(process.env.PORT) || 502,
})

const api = new ApiServer({
  port: 3000,
  deviceManager: server.virtualDeviceManager,
})

server.start()
api.start()
