import './Hero.css'

export function Hero() {
  return (
    <main className="modbus-hero">
      <div className="modbus-hero-content">
        {/* Modern Web Typography Header */}
        <h1 className="modbus-hero-title">
          The Global <span className="modbus-accent">Modbus</span> Address Space
        </h1>
        <p className="modbus-hero-subtitle">
          A unified, accessible register space for testing, polling, and
          integration.
        </p>

        {/* Retro TuiCSS Data Block */}
        <div className="tui-window modbus-terminal-window">
          <fieldset className="tui-fieldset modbus-fieldset">
            <legend className="modbus-legend">Connection Parameters</legend>

            <div className="modbus-terminal-lines">
              <div className="modbus-line">
                <span className="modbus-label">HOST:</span>
                <span className="modbus-value highlight-green">
                  tcp.modb.us
                </span>
              </div>
              <div className="modbus-line">
                <span className="modbus-label">PORT:</span>
                <span className="modbus-value">502</span>
              </div>
              <div className="modbus-line">
                <span className="modbus-label">PROTOCOL:</span>
                <span className="modbus-value">Modbus/TCP</span>
              </div>
              <div className="modbus-line">
                <span className="modbus-label">STATUS:</span>
                <span className="modbus-value blinking-cursor modbus-accent">
                  \\ONLINE
                </span>
              </div>
            </div>
          </fieldset>
        </div>

        {/* Modern "Coming Soon" Badge */}
        <div className="modbus-coming-soon">
          <span className="tui-badge modbus-badge">V1.0</span>
          <p>More features, data casting, and live web-browser coming soon.</p>
        </div>
      </div>
    </main>
  )
}
