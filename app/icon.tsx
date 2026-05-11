import { ImageResponse } from 'next/og'

export const size = {
  width: 192,
  height: 192,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#5a345c',
          border: '10px solid #f3cfa8',
          color: '#fff9fc',
          display: 'flex',
          fontFamily: 'Georgia, serif',
          fontSize: 116,
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
