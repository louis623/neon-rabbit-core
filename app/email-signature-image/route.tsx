import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

const size = {
  width: 496,
  height: 162,
}

/** A compact, PNG email signature lockup. */
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#402924',
          display: 'flex',
          height: '100%',
          padding: '0 30px',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            background: '#fff9fc',
            borderRadius: '999px',
            display: 'flex',
            height: 88,
            justifyContent: 'center',
            width: 88,
          }}
        >
          <span
            style={{
              color: '#ee2c9b',
              display: 'flex',
              fontFamily: 'Georgia, serif',
              fontSize: 56,
              fontStyle: 'italic',
              fontWeight: 600,
              lineHeight: 1,
              transform: 'translateY(1px)',
            }}
          >
            S
          </span>
        </div>
        <span
          style={{
            color: '#fff6fa',
            display: 'flex',
            fontFamily: 'Arial, sans-serif',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 3,
            marginLeft: 24,
          }}
        >
          SPARKLE SUITE
        </span>
      </div>
    ),
    size,
  )
}
