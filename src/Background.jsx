import bgImg from './assets/background.jpg'

export default function Background() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
      {/* base image, barely blurred */}
      <div style={{
        position: 'absolute',
        inset: '-4px',
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(1.5px)',
      }} />
      {/* subtle fog — thin mist, not a white wash */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse 60% 50% at 10% 15%, rgba(255,255,253,0.38) 0%, transparent 100%),
          radial-gradient(ellipse 45% 55% at 80% 65%, rgba(240,244,248,0.28) 0%, transparent 100%),
          radial-gradient(ellipse 55% 40% at 50% 90%, rgba(250,246,240,0.22) 0%, transparent 100%),
          rgba(255,255,255,0.08)
        `,
      }} />
      {/* grid lines */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.12) 1px, transparent 1px)
        `,
        backgroundSize: '28px 28px',
      }} />
    </div>
  )
}
