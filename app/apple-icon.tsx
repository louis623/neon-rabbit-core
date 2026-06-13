import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'transparent',
          color: '#ee2c9b',
          display: 'flex',
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: 98,
          height: '100%',
          justifyContent: 'center',
          lineHeight: 1,
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            background: '#ffffff',
            border: '3px solid #ee2c9b',
            borderRadius: '999px',
            display: 'flex',
            height: 158,
            justifyContent: 'center',
            width: 158,
          }}
        >
          <span
            style={{
              fontStyle: 'italic',
              fontWeight: 500,
              transform: 'skewX(-10deg) translateY(7px)',
            }}
          >
            S
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
