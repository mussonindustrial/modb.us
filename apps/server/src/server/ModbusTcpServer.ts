import 'dotenv/config'

import net from 'net'
import { ModbusClient } from '@/client'
import { ModbusFrameFactory, ModbusMessage } from '@/message'
import { ModbusMessageHandlerSet } from '@/handlers'
import { logger } from '@/utils'
import { VirtualDeviceManager } from '@/virtual-device'

export type ModbusTcpServerConfig = {
  port: number
  virtualDeviceManager: VirtualDeviceManager
  frameFactory: ModbusFrameFactory
}

export class ModbusTcpServer {
  port: number
  server: net.Server
  virtualDeviceManager: VirtualDeviceManager
  frameFactory: ModbusFrameFactory

  constructor(config: ModbusTcpServerConfig) {
    this.port = config.port
    this.virtualDeviceManager = config.virtualDeviceManager
    this.frameFactory = config.frameFactory
    this.server = net.createServer((socket) => this.handleConnection(socket))
  }

  start() {
    this.server.listen(this.port, () => {
      logger.info(
        { port: this.port },
        `Modbus/TCP Server listening on ${this.port}`
      )
    })
  }

  stop() {
    this.server.close()
  }

  async handleRequest(frame: ModbusMessage, client: ModbusClient) {
    return await ModbusMessageHandlerSet(frame, client)
  }

  async handleConnection(socket: net.Socket) {
    const client = await this.virtualDeviceManager.createClient()

    socket.on('data', async (data: Buffer) => {
      try {
        client.activeVirtualDevice?.touch()

        const frame = this.frameFactory.fromBuffer(new Uint8Array(data))
        client.logger.trace(
          {
            functionCode: frame.functionCode,
            id: client.activeVirtualDevice?.id,
          },
          'Received frame'
        )

        const result = await this.handleRequest(frame, client)
        if (result?.response) {
          socket.write(result.response)
        }
      } catch (err) {
        client.logger.error({ err }, 'Error processing Modbus frame')
      }
    })

    socket.on('error', (err) => {
      client.logger.warn({ err }, 'Client socket error occurred')
      socket.destroy()
    })

    socket.on('close', () => {
      client.logger.info('Client disconnected')
      client.close()
    })
  }
}
