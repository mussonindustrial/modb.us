import 'dotenv/config'

import { startModbUs } from './server'

const config = {
  dnsPort: Number(process.env.DNS_PORT) || 5353,
  modbusPort: Number(process.env.MODBUS_PORT) || 5020,
  httpPort: Number(process.env.HTTP_PORT) || 3001,
  ipv6Prefix: process.env.IPV6_PREFIX || '2001:db8:aaaa:bbbb',
  timeoutMs: Number(process.env.TIMEOUT_MS) || 30000,
}

async function bootstrap() {
  try {
    console.log('[Process] Booting Modb.us Environment...')
    const environment = await startModbUs(config)

    const shutdown = async () => {
      console.log(
        '\n[Process] Received termination signal. Shutting down gracefully...'
      )
      await environment.close()
      process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch (error) {
    console.error('[Process] Failed to start Modb.us:', error)
    process.exit(1)
  }
}

// Execute the bootstrap
void bootstrap()
