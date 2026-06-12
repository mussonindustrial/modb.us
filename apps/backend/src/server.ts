import 'dotenv/config'

import net from 'net'
import { ModbusMessage } from './message'
import { logger } from './logger'
import { VirtualDeviceManager } from './virtualDevice'
import { ModbusTCPMessageHandler } from './tcp'
import { ModbusClient } from '@/client'

export class VirtualDeviceModbusTcpServer {
  port: number
  server: net.Server
  virtualDeviceManager: VirtualDeviceManager

  constructor({ port = 502 }: { port?: number }) {
    this.port = port
    this.server = net.createServer((socket) => this.handleConnection(socket))
    this.virtualDeviceManager = new VirtualDeviceManager()
  }

  start() {
    this.server.listen(this.port, () => {
      logger.info(
        { port: this.port },
        `Modbus TCP Gateway listening on ${this.port}`
      )
    })
  }

  stop() {
    this.server.close()
  }

  async handleRequest(frame: ModbusMessage, client: ModbusClient) {
    return await ModbusTCPMessageHandler(frame, client)
  }

  async handleConnection(socket: net.Socket) {
    const client = await this.virtualDeviceManager.createClientSocket(socket)

    socket.on('data', async (data: Buffer) => {
      try {
        client.activeVirtualDevice?.touch()

        const frame = ModbusMessage.from(data)
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
