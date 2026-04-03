const BackgroundOrbs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {/* Top-left blue orb */}
    <div
      className="orb"
      style={{
        width: '520px',
        height: '520px',
        top: '-160px',
        left: '-160px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
      }}
    />
    {/* Center-right green orb */}
    <div
      className="orb"
      style={{
        width: '400px',
        height: '400px',
        top: '30%',
        right: '-100px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
        animationDelay: '1.5s',
      }}
    />
    {/* Bottom-left amber orb */}
    <div
      className="orb"
      style={{
        width: '360px',
        height: '360px',
        bottom: '-80px',
        left: '20%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
        animationDelay: '3s',
      }}
    />
    {/* Subtle grid overlay */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }}
    />
  </div>
)

export default BackgroundOrbs
