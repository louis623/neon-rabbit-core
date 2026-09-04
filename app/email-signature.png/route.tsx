import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

const size = {
  width: 160,
  height: 52,
}

/** A compact, filename-stable PNG lockup for email clients. */
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#402924',
          display: 'flex',
          height: '100%',
          padding: '0 10px',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            background: '#fff9fc',
            borderRadius: '999px',
            display: 'flex',
            height: 28,
            justifyContent: 'center',
            width: 28,
          }}
        >
          <span
            style={{
              color: '#ee2c9b',
              display: 'flex',
              fontFamily: 'Georgia, serif',
              fontSize: 20,
              fontStyle: 'italic',
              fontWeight: 600,
              lineHeight: 1,
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
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.2,
            marginLeft: 9,
          }}
        >
          SPARKLE SUITE
        </span>
      </div>
    ),
    size,
  )
}
