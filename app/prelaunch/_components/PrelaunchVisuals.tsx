type IconProps = {
  className?: string
  title?: string
}

export function SparkleSeal({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 64 64">
      <circle
        cx="32"
        cy="32"
        fill="#ffffff"
        r="30"
        stroke="currentColor"
        strokeWidth="0.75"
      />
      <text
        fill="currentColor"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="32"
        fontStyle="italic"
        fontWeight="500"
        textAnchor="middle"
        x="32"
        y="42"
      >
        S
      </text>
    </svg>
  )
}

export function FeatureGlyph({ title }: IconProps) {
  return (
    <span aria-hidden="true" className="ss-glyph ss-glyph--solid">
      <svg
        aria-hidden="true"
        className="ss-glyph__icon"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        viewBox="0 0 24 24"
      >
        {renderGlyph(title)}
      </svg>
    </span>
  )
}

function renderGlyph(title?: string) {
  if (title === 'Live queue') {
    return (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </>
    )
  }

  if (title === 'Live event calendar') {
    return (
      <>
        <rect height="15" rx="2" width="16" x="4" y="5" />
        <path d="M4 9h16M9 4v3M15 4v3M8 13h2M13 13h3M8 16h5" />
      </>
    )
  }

  if (title === 'Email updates') {
    return (
      <>
        <path d="M3.5 7.5l8.5 6 8.5-6" />
        <rect height="13" rx="2" width="17" x="3.5" y="5.5" />
      </>
    )
  }

  if (title === 'SMS updates') {
    return (
      <>
        <path d="M5 5h14v14H5z" />
        <path d="M5 9h14M9 5v14" />
      </>
    )
  }

  if (title?.startsWith('Nic-Nac') || title === 'Nic-Nac behind the scenes') {
    return (
      <>
        <path d="M5 12c0-3.9 3.1-7 7-7s7 3.1 7 7c0 2.5-1.3 4.7-3.3 6" />
        <circle cx="12" cy="12" r="2.2" />
        <path d="M9 17l-1.5 2.5M15 17l1.5 2.5" />
      </>
    )
  }

  return (
    <>
      <rect height="13" rx="2" width="17" x="3.5" y="5.5" />
      <path d="M3.5 10h17M9 14h2M13 14h2" />
    </>
  )
}
