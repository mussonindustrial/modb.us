import { ApiServer } from '@/api'
import { ModbusTcpServer, ModbusUdpServer } from '@/server'
import { VirtualDeviceManager } from '@/virtual-device'
import { RtuFrameFactory, TcpFrameFactory } from '@/message'

const virtualDeviceManager = new VirtualDeviceManager()

const tcpServer = new ModbusTcpServer({
  port: 502,
  virtualDeviceManager,
  frameFactory: TcpFrameFactory,
})

const udpServer = new ModbusUdpServer({
  port: 502,
  virtualDeviceManager,
  frameFactory: TcpFrameFactory,
})

const rtuTcpServer = new ModbusTcpServer({
  port: 503,
  virtualDeviceManager,
  frameFactory: RtuFrameFactory,
})

const rtuUdpServer = new ModbusUdpServer({
  port: 503,
  virtualDeviceManager,
  frameFactory: RtuFrameFactory,
})

const api = new ApiServer({
  port: 3000,
  deviceManager: virtualDeviceManager,
})

tcpServer.start()
udpServer.start()

rtuTcpServer.start()
rtuUdpServer.start()

api.start()
