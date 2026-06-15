import 'dotenv/config'

import { ModbusClient } from '@/client'
import { ModbusMessage } from '@/message'
import { ModbusTCPMessageHandler } from '@/tcp'
import { logger, Logger } from '@/utils'
import { VirtualDeviceManager } from '@/virtualDevice'
import * as dgram from 'node:dgram'

export type ModbusUdpServerConfig = {
  port: number
  virtualDeviceManager: VirtualDeviceManager
}

export class ModbusUdpServer {
  port: number
  server: dgram.Socket
  virtualDeviceManager: VirtualDeviceManager
  logger: Logger

  clients: Map<string, ModbusClient> = new Map()

  constructor(config: ModbusUdpServerConfig) {
    this.port = config.port
    this.virtualDeviceManager = config.virtualDeviceManager
    this.server = dgram.createSocket('udp4')
    this.logger = logger.child({ port: this.port })
    this.server.on('error', () => {
      this.server.close()
    })

    this.server.on('message', async (msg, rinfo) => {
      const key = `${rinfo.address}:${rinfo.port}`
      let client = this.clients.get(key)
      if (!client) {
        const newClient = await this.virtualDeviceManager.createClient()
        this.clients.set(key, newClient)
        client = newClient
      }

      try {
        client?.activeVirtualDevice?.touch()

        const frame = ModbusMessage.from(msg)
        client.logger.trace(
          {
            functionCode: frame.functionCode,
            id: client.activeVirtualDevice?.id,
          },
          'Received frame'
        )

        const result = await this.handleRequest(frame, client)
        if (result?.response) {
          this.server.send(result.response, rinfo.port, rinfo.address)
        }
      } catch (err) {
        client.logger.error({ err }, 'Error processing Modbus frame')
      }
    })

    this.server.on('listening', () => {
      logger.info(
        { port: this.port },
        `Modbus/TCP Server listening on ${this.port}`
      )
    })
  }

  start() {
    this.server.bind(this.port)
  }

  stop() {
    this.server.close()
  }

  async handleRequest(frame: ModbusMessage, client: ModbusClient) {
    return await ModbusTCPMessageHandler(frame, client)
  }
}
