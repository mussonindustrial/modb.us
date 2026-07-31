import { createClient } from 'redis'
import {
  ModbusTcpServer,
  TcpFrameFactory,
  logger,
  ModbusUdpServer,
  RtuFrameFactory,
} from '@modb.us/core'
import { RedisVirtualDeviceManager } from '@modb.us/state-backend'
import { env } from '@/config'

async function bootstrap() {
  const redisClient = createClient({ url: env.REDIS_URL })
  await redisClient.connect()

  const virtualDeviceManager = new RedisVirtualDeviceManager(redisClient)

  switch (env.SERVER_PROTOCOL) {
    case 'tcp': {
      new ModbusTcpServer({
        port: env.SERVER_PORT,
        virtualDeviceManager,
        frameFactory: TcpFrameFactory,
      }).start()
      logger.info(`Modbus/TCP Server running on port ${env.SERVER_PORT}`)
      break
    }
    case 'udp': {
      new ModbusUdpServer({
        port: env.SERVER_PORT,
        virtualDeviceManager,
        frameFactory: TcpFrameFactory,
      }).start()
      logger.info(`Modbus/UDP Server running on port ${env.SERVER_PORT}`)
      break
    }
    case 'rtu-tcp': {
      new ModbusTcpServer({
        port: env.SERVER_PORT,
        virtualDeviceManager,
        frameFactory: RtuFrameFactory,
      }).start()
      logger.info(
        `Modbus/RTU over TCP Server running on port ${env.SERVER_PORT}`
      )
      break
    }
    case 'rtu-udp': {
      new ModbusUdpServer({
        port: env.SERVER_PORT,
        virtualDeviceManager,
        frameFactory: RtuFrameFactory,
      }).start()
      logger.info(
        `Modbus/RTU over UDP Server running on port ${env.SERVER_PORT}`
      )
      break
    }
  }
}

await bootstrap()
