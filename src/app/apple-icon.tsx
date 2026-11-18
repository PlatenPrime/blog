import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

/** Apple touch icon — same mark as favicon, larger canvas. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: '#19517b',
        color: '#eef6fd',
        display: 'flex',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 96,
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
