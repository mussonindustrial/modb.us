import './Header.css'

export function Header() {
  return (
    <header className="modbus-header">
      <div className="modbus-header-left">
        <a href="/" className="modbus-brand">
          <img
            src="https://cdn.mussonindustrial.com/files/public/images/emblemWhite.svg"
            alt="Musson Industrial Emblem"
            className="modbus-logo"
          />
          <span className="modbus-title">
            <strong>modb</strong>
            <span className="modbus-header-accent">.us</span>
          </span>
        </a>
      </div>

      <div className="modbus-header-right">
        <a
          href="https://github.com/mussonindustrial/modb.us"
          target="_blank"
          rel="noopener noreferrer"
          className="modbus-github-link"
          title="View Source on GitHub"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg"
            alt="GitHub Repository"
            className="modbus-github-icon"
          />
        </a>

        <span className="modbus-separator">|</span>

        <a
          href="https://mussonindustrial.com"
          target="_blank"
          rel="noopener noreferrer"
          className="modbus-attribution"
        >
          Musson Industrial
        </a>
      </div>
    </header>
  )
}
