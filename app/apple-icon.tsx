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
          background: '#5a345c',
          border: '9px solid #f3cfa8',
          color: '#fff9fc',
          display: 'flex',
          fontFamily: 'Georgia, serif',
          fontSize: 108,
          height: '100%',
          justifyContent: 'center',
          lineHeight: 1,
          width: '100%',
        }}
      >
        S
      </div>
    ),
    {
      ...size,
    },
  )
}
