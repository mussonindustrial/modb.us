import { VirtualDeviceModbusTcpServer } from './server'

const server = new VirtualDeviceModbusTcpServer({
  port: Number(process.env.PORT) || 502,
})

server.start()
