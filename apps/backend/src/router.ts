import net from 'net'
import { db } from './db'
import { ensureModbusServer } from './modbus'

export function createRouter() {
  return net.createServer(async (clientSocket) => {
    clientSocket.pause()

    const requestedIp = clientSocket.localAddress
    if (!requestedIp) {
      clientSocket.destroy()
      return
    }

    try {
      const serverName = await db.getServerNameByIpv6(requestedIp)

      if (!serverName) {
        console.warn(
          `[Router] Dropped connection: Unrecognized IP ${requestedIp}`
        )
        clientSocket.destroy()
        return
      }

      const instance = await ensureModbusServer(serverName, requestedIp)
      const backendSocket = net.connect({
        host: '127.0.0.1',
        port: instance.port,
      })

      backendSocket.on('connect', () => {
        clientSocket.pipe(backendSocket)
        backendSocket.pipe(clientSocket)
        clientSocket.resume()
      })

      backendSocket.on('error', () => clientSocket.destroy())
      clientSocket.on('error', () => backendSocket.destroy())
      clientSocket.on('close', () => backendSocket.destroy())
    } catch (error) {
      console.error(
        `[Router] Failed to route connection for ${requestedIp}:`,
        error
      )
      clientSocket.destroy()
    }
  })
}
