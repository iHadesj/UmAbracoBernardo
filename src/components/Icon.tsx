const PATHS = {
  home: 'M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z',
  gift: 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-1.5-3.5-6-3.5-5.5-.8C6.8 7.6 12 7 12 7zm0 0c1.5-3.5 6-3.5 5.5-.8C17.2 7.6 12 7 12 7z',
  wand: 'M5 19 15 9M13.5 4.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7zM18.5 9.5l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5zM8.5 3.5l.4.9.9.4-.9.4-.4.9-.4-.9-.9-.4.9-.4z',
  bag: 'M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  chevron: 'M9 6l6 6-6 6',
  down: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  close: 'M6 6l12 12M18 6L6 18',
  heart: 'M12 20s-7-4.3-8.9-8.6C1.7 8.2 3.6 4.6 7 4.6c1.9 0 3.3 1 4.1 2.4.8-1.4 2.3-2.4 4.1-2.4 3.4 0 5.3 3.6 3.9 6.8C19 15.7 12 20 12 20z',
  truck: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M5.2 17.5a1.8 1.8 0 1 0 3.6 0 1.8 1.8 0 1 0-3.6 0M15.2 17.5a1.8 1.8 0 1 0 3.6 0 1.8 1.8 0 1 0-3.6 0',
  clock: 'M3.5 12a8.5 8.5 0 1 0 17 0 8.5 8.5 0 1 0-17 0M12 7.5V12l3 2',
  pin: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  whatsapp: 'M4.5 19.5l1.2-3.6A7.8 7.8 0 1 1 8.4 18.6zM9.3 8.6c-.3 2.9 2.9 6.2 6 6l.9-1.4-1.8-.9-.9.7c-.9-.4-1.7-1.2-2.1-2.1l.7-.9-.9-1.8z',
  instagram: 'M3.5 8.5a5 5 0 0 1 5-5h7a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5h-7a5 5 0 0 1-5-5zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17.2 6.8h.01',
  card: 'M3 6.5h18v11H3zM3 10h18M6.5 14.5h4',
  pix: 'M12 3.5l3.6 3.6-3.6 3.6-3.6-3.6zM12 13.3l3.6 3.6-3.6 3.6-3.6-3.6zM3.5 12l3.6-3.6 3.6 3.6-3.6 3.6zM13.3 12l3.6-3.6 3.6 3.6-3.6 3.6z',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  copy: 'M8 8h11v12H8zM5 16V4h11',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.6v.1',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3.5V7M16 3.5V7',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 20, stroke = 1.6, fill = false, className }: { name: IconName; size?: number; stroke?: number; fill?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
