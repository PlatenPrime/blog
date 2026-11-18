import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

/** Favicon: primary ink on light brand sample (same sRGB as OG). */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: '#19517b',
        color: '#eef6fd',
        display: 'flex',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 18,
        fontWeight: 700,
        height: '100%',
        justifyContent: 'center',
        letterSpacing: '-0.04em',
        width: '100%',
      }}
    >
      P
    </div>,
    { ...size },
  )
}
