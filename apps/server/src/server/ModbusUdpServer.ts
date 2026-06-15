import 'dotenv/config'

import * as dgram from 'node:dgram'
import { ModbusClient } from '@/client'
import { ModbusFrameFactory, ModbusMessage } from '@/message'
import { ModbusMessageHandlerSet } from '@/handlers'
import { logger, Logger } from '@/utils'
import { VirtualDeviceManager } from '@/virtual-device'

export type ModbusUdpServerConfig = {
  port: number
  virtualDeviceManager: VirtualDeviceManager
  frameFactory: ModbusFrameFactory
}

export class ModbusUdpServer {
  port: number
  server: dgram.Socket
  virtualDeviceManager: VirtualDeviceManager
  frameFactory: ModbusFrameFactory
  logger: Logger

  clients: Map<string, ModbusClient> = new Map()

  constructor(config: ModbusUdpServerConfig) {
    this.port = config.port
    this.virtualDeviceManager = config.virtualDeviceManager
    this.frameFactory = config.frameFactory
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

        const frame = this.frameFactory.fromBuffer(new Uint8Array(msg))
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
        `Modbus/UDP Server listening on ${this.port}`
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
    return await ModbusMessageHandlerSet(frame, client)
  }
}
