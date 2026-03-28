import { useState, useRef, useCallback, useEffect } from 'react'

/* ─── Ambient Floating Particles (Canvas) ─── */

function FloatingParticles({ count = 500, colors = ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)', 'rgba(130,160,255,0.12)', 'rgba(200,180,255,0.1)'], boostTrigger = 0 }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef(null)
  const rafRef = useRef(null)
  const boostRef = useRef(false)
  const boostEndRef = useRef(0)
  const baseCountRef = useRef(count)

  // Handle boost trigger
  useEffect(() => {
    if (boostTrigger === 0) return
    boostRef.current = true
    boostEndRef.current = performance.now() + 1500
    // Spawn extra burst particles
    if (particlesRef.current) {
      const canvas = canvasRef.current
      if (!canvas) return
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const extras = Array.from({ length: 400 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.3 + Math.random() * 1.0,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.15 - Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        isExtra: true,
      }))
      particlesRef.current = [...particlesRef.current, ...extras]
    }
  }, [boostTrigger])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
    }
    resize()

    // Init particles
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.3 + Math.random() * 1.0,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.15 - Math.random() * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02,
    }))

    const animate = (time) => {
      const cw = canvas.offsetWidth
      const ch = canvas.offsetHeight
      ctx.clearRect(0, 0, cw, ch)

      // Check if boost is active
      const isBoosted = boostRef.current && time < boostEndRef.current
      if (boostRef.current && time >= boostEndRef.current) {
        boostRef.current = false
        // Remove extra particles gradually by marking them for fade
        for (const p of particlesRef.current) {
          if (p.isExtra) p.dying = true
        }
      }
      const speedMult = isBoosted ? 8.0 : 1.0
      const opacityMult = isBoosted ? 2.5 : 1.0
      const sizeMult = isBoosted ? 1.6 : 1.0

      const alive = []
      for (const p of particlesRef.current) {
        p.x += p.vx * speedMult
        p.y += p.vy * speedMult
        p.pulse += p.pulseSpeed * (isBoosted ? 2.5 : 1)
        const alpha = (0.5 + 0.5 * Math.sin(p.pulse)) * opacityMult

        // Dying extras fade out
        if (p.dying) {
          p.fadeOut = (p.fadeOut || 1) - 0.02
          if (p.fadeOut <= 0) continue
        }
        alive.push(p)

        const fadeOut = p.fadeOut || 1

        // Wrap around
        if (p.y < -10) { p.y = ch + 10; p.x = Math.random() * cw }
        if (p.x < -10) p.x = cw + 10
        if (p.x > cw + 10) p.x = -10

        const r = p.r * sizeMult
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * (0.8 + 0.2 * Math.min(alpha, 1)), 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.min(alpha, 1) * fadeOut
        ctx.fill()
        // Glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.min(alpha, 1) * 0.15 * fadeOut
        ctx.fill()
      }
      particlesRef.current = alive
      ctx.globalAlpha = 1
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', zIndex: 1 }}
    />
  )
}

/* ─── Rising Star Particles (Canvas) — triggered on 3+ star rating ─── */

function RisingStarParticles({ active }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const rafRef = useRef(null)
  const spawnActiveRef = useRef(false)
  const lastSpawnRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    // Draw a 5-point star path
    const drawStar = (cx, cy, outerR, innerR, rotation) => {
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR
        const angle = (Math.PI / 5) * i - Math.PI / 2 + rotation
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
    }

    const animate = (time) => {
      const cw = canvas.offsetWidth
      const ch = canvas.offsetHeight
      ctx.clearRect(0, 0, cw, ch)

      // Spawn stars from the star rating area (roughly 40-55% from top)
      if (spawnActiveRef.current && time - lastSpawnRef.current > 30) {
        const batchSize = 2 + Math.floor(Math.random() * 2)
        for (let i = 0; i < batchSize; i++) {
          // Spawn centered around star rating position, spread horizontally
          const x = cw * 0.1 + Math.random() * cw * 0.8
          const spawnY = ch * 0.45 + Math.random() * ch * 0.15 // near star rating area, shifted down 60px
          particlesRef.current.push({
            x,
            y: spawnY,
            size: 2 + Math.random() * 4.5,
            vy: -(4.0 + Math.random() * 4.0),  // rise upward fast
            vx: (Math.random() - 0.5) * 1.5,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.1,
            opacity: 0.75 + Math.random() * 0.25,
            fadeSpeed: 0.002 + Math.random() * 0.003,
            color: ['#FFB800', '#FFD666', '#FFCA28', '#FFA726', '#FF9500', '#FFE082'][Math.floor(Math.random() * 6)],
          })
        }
        lastSpawnRef.current = time
      }

      // Update & draw
      const alive = []
      for (const p of particlesRef.current) {
        p.y += p.vy
        p.x += p.vx
        p.rotation += p.rotSpeed
        p.opacity -= p.fadeSpeed

        if (p.opacity <= 0 || p.y < -20) continue
        alive.push(p)

        const outerR = p.size
        const innerR = p.size * 0.45

        // Glow
        ctx.globalAlpha = p.opacity * 0.15
        ctx.fillStyle = p.color
        drawStar(p.x, p.y, outerR * 1.4, innerR * 1.4, p.rotation)
        ctx.fill()

        // Star
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        drawStar(p.x, p.y, outerR, innerR, p.rotation)
        ctx.fill()
      }
      particlesRef.current = alive
      ctx.globalAlpha = 1

      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Control spawning: start on trigger change, stop after 3s
  const prevTrigger = useRef(active)
  useEffect(() => {
    if (active === prevTrigger.current) return
    prevTrigger.current = active
    if (active === 0) {
      spawnActiveRef.current = false
      return
    }
    spawnActiveRef.current = true
    const timer = setTimeout(() => {
      spawnActiveRef.current = false
    }, 1500)
    return () => clearTimeout(timer)
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', zIndex: 8 }}
    />
  )
}

// Audio-based haptic tick for iOS (plays a 1.5ms low-freq sine burst)
let audioCtx = null
function hapticTick() {
  // Native vibrate for Android
  if (navigator.vibrate) {
    navigator.vibrate(12)
    return
  }
  // Audio tick fallback for iOS
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    oscillator.connect(gain)
    gain.connect(audioCtx.destination)
    oscillator.frequency.value = 150
    oscillator.type = 'sine'
    gain.gain.value = 0.15
    const now = audioCtx.currentTime
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015)
    oscillator.start(now)
    oscillator.stop(now + 0.015)
  } catch (e) {
    // silently fail
  }
}

// Shared assets
const SHARED = {
  mavenLogo: 'https://www.figma.com/api/mcp/asset/0546b409-9d38-4715-b128-36b9dfeaa81e',
  starFilled: 'https://www.figma.com/api/mcp/asset/86ac1d46-8dda-4e90-bacc-c72c0fe2c944',
  starEmpty: 'https://www.figma.com/api/mcp/asset/13e0b400-1e0e-4a83-ad3b-65d893a62f2a',
  razorpayLogo: 'https://www.figma.com/api/mcp/asset/97d91449-053e-418a-8717-67e4205e11f2',
  sampleThumb: 'https://www.figma.com/api/mcp/asset/32cf4f1f-907f-4798-9a8f-11862ad1cbd4',
}

// Product carousel data
const PRODUCTS = [
  {
    name: 'Foxtale Glow Sunscreen SPF 50 PA',
    bgImage: 'https://www.figma.com/api/mcp/asset/fc169834-8358-4179-a247-345986b120ed',
    productImage: 'https://www.figma.com/api/mcp/asset/fc169834-8358-4179-a247-345986b120ed',
    cardImage: 'https://www.figma.com/api/mcp/asset/374dc106-682a-4aef-87ba-78fcb35c10d7',
    cardHeight: 200,
  },
  {
    name: 'Golly Glow Cream SPF 40 PA',
    bgImage: 'https://www.figma.com/api/mcp/asset/11e7029e-58e3-452d-b057-d1cbc5ec43ac',
    productImage: 'https://www.figma.com/api/mcp/asset/11e7029e-58e3-452d-b057-d1cbc5ec43ac',
    cardImage: 'https://www.figma.com/api/mcp/asset/11e7029e-58e3-452d-b057-d1cbc5ec43ac',
    cardHeight: 252,
  },
  {
    name: 'Marvenshop Focus PineLine SPF 50 PA',
    bgImage: 'https://www.figma.com/api/mcp/asset/3644aeba-35bc-4554-8e24-d718d07d661f',
    productImage: 'https://www.figma.com/api/mcp/asset/3644aeba-35bc-4554-8e24-d718d07d661f',
    cardImage: 'https://www.figma.com/api/mcp/asset/cd87756b-9667-478f-a900-b338ad76f56f',
    cardHeight: 252,
  },
]

// Arrow right icon for product cards
const ARROW_RIGHT_ICON = 'https://www.figma.com/api/mcp/asset/ae6ed61d-fa64-48c4-beba-64ced8f2eb5c'

// Intro splash card images
const INTRO_CARDS = {
  front: 'https://www.figma.com/api/mcp/asset/696a2a57-b5fd-47f4-9f23-eacf0c7cc496',
  back: 'https://www.figma.com/api/mcp/asset/41b5310c-388c-4c69-bc7f-1c003881c846',
}

// Splash fan layout card assets (from Figma 601:11224)
const SPLASH_CARDS = {
  center: 'https://www.figma.com/api/mcp/asset/c4174416-587a-4104-8fd3-0dd118bcbff9',  // Foxtale green
  right: 'https://www.figma.com/api/mcp/asset/f020b0e1-e015-4bb7-b781-55877d1361f7',   // Focus+ purple
  left: 'https://www.figma.com/api/mcp/asset/dc07a52a-134a-455a-981c-e95ed2f532d6',    // Golly beige
}

// Simple spinner component
function Spinner({ size = 24, color = 'rgba(255,255,255,0.7)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"
        strokeDasharray="50 20" />
    </svg>
  )
}

// Hook to preload images and track loading state
function useImagePreloader(urls) {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let cancelled = false
    const promises = urls.map(url => new Promise((resolve) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = resolve
      img.src = url
    }))
    Promise.all(promises).then(() => {
      if (!cancelled) setLoaded(true)
    })
    return () => { cancelled = true }
  }, [urls.join(',')])
  return loaded
}

/* ─── Reusable Components ─── */

// Mini star SVG for particles
function MiniStar({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
    </svg>
  )
}

// Particle burst — each particle flies outward from center using Web Animations API
function StarParticleItem({ tx, ty, pSize, duration, delay, color }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.animate([
      { transform: 'translate(0, 0)', offset: 0 },
      { transform: `translate(${tx}px, ${ty}px)`, offset: 1 },
    ], { duration: duration * 1000, delay: delay * 1000, easing: 'ease-out', fill: 'forwards' })
  }, [tx, ty, duration, delay])

  return (
    <div
      ref={ref}
      className="absolute"
      style={{ left: '50%', top: '50%' }}
    >
      <div style={{
        marginLeft: -pSize / 2,
        marginTop: -pSize / 2,
        animation: `starParticleBurst ${duration}s ease-out ${delay}s both`,
      }}>
        <MiniStar size={pSize} color={color} />
      </div>
    </div>
  )
}

function StarParticles({ active, size }) {
  const [particleSet, setParticleSet] = useState(null)

  useEffect(() => {
    if (!active) return
    const particles = Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * 360 + (Math.random() * 36 - 18)
      const distance = size * 0.55 + Math.random() * size * 0.55
      const rad = (angle * Math.PI) / 180
      const pSize = 3 + Math.random() * 7
      const duration = 0.4 + Math.random() * 0.2
      const delay = Math.random() * 0.06
      const colors = ['#FFB800', '#FF9500', '#FFD666', '#FFA726', '#FFCA28', '#FFE082']
      return {
        id: i,
        tx: Math.cos(rad) * distance,
        ty: Math.sin(rad) * distance,
        pSize, duration, delay,
        color: colors[i % colors.length],
      }
    })
    setParticleSet(particles)
    const t = setTimeout(() => setParticleSet(null), 800)
    return () => clearTimeout(t)
  }, [active, size])

  if (!particleSet) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 20 }}>
      {particleSet.map((p) => (
        <StarParticleItem key={p.id} {...p} />
      ))}
    </div>
  )
}

function StarRating({ rating, onRate, size = 48, bounceKey }) {
  const [animating, setAnimating] = useState(null)
  const [pressed, setPressed] = useState(null)
  const [bouncing, setBouncing] = useState(false)
  const [particles, setParticles] = useState(null) // which star is bursting

  useEffect(() => {
    if (bounceKey == null) return
    setBouncing(true)
    const t = setTimeout(() => setBouncing(false), 1000)
    return () => clearTimeout(t)
  }, [bounceKey])

  const handleRate = (star) => {
    setAnimating(star)
    setParticles(star)
    onRate(star)
    hapticTick()
    setTimeout(() => setAnimating(null), 500)
    setTimeout(() => setParticles(null), 700)
  }

  return (
    <div className="flex items-center" style={{ gap: size === 48 ? 12 : 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <div key={star} className="relative">
          <button
            onClick={() => handleRate(star)}
            onTouchStart={() => setPressed(star)}
            onTouchEnd={() => setPressed(null)}
            onTouchCancel={() => setPressed(null)}
            className="p-0 border-0 bg-transparent cursor-pointer relative"
            style={{
              transition: pressed === star ? 'transform 0.06s ease-in' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: pressed === star ? 'scale(0.8)' : 'scale(1)',
              animation:
                animating !== null && star <= animating
                  ? `starBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${(star - 1) * 60}ms both`
                  : bouncing && rating === 0
                  ? `starAttention 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${(star - 1) * 70}ms both`
                  : 'none',
            }}
          >
            <img
              src={star <= rating ? SHARED.starFilled : SHARED.starEmpty}
              alt={`${star} star`}
              style={{ width: size, height: size }}
              className="block"
              draggable={false}
            />
          </button>
          <StarParticles active={particles !== null && star <= particles} size={size} />
        </div>
      ))}
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="14" height="20" viewBox="0 0 16 24" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M8 0C5.79086 0 4 1.79086 4 4V12C4 14.2091 5.79086 16 8 16C10.2091 16 12 14.2091 12 12V4C12 1.79086 10.2091 0 8 0ZM6 4C6 2.89543 6.89543 2 8 2C9.10457 2 10 2.89543 10 4V12C10 13.1046 9.10457 14 8 14C6.89543 14 6 13.1046 6 12V4Z" fill="#050505" />
      <path d="M2 10C2 9.44771 1.55228 9 1 9C0.447715 9 0 9.44771 0 10V12C0 16.0796 3.05369 19.446 7 19.9381V22H4C3.44772 22 3 22.4477 3 23C3 23.5523 3.44772 24 4 24H12C12.5523 24 13 23.5523 13 23C13 22.4477 12.5523 22 12 22H9V19.9381C12.9463 19.446 16 16.0796 16 12V10C16 9.44771 15.5523 9 15 9C14.4477 9 14 9.44771 14 10V12C14 15.3137 11.3137 18 8 18C4.68629 18 2 15.3137 2 12V10Z" fill="#050505" />
    </svg>
  )
}

// Asset URLs from Figma
const UPLOAD_ASSETS = {
  illustrationLarge: 'https://www.figma.com/api/mcp/asset/5afb4270-a6ee-4b78-ac35-aed45d3d114c',
  illustrationSmall: 'https://www.figma.com/api/mcp/asset/bd342b3c-7c7d-4e5f-a5ef-ccf157e626a3',
  plusIcon: 'https://www.figma.com/api/mcp/asset/d3a5011a-3b0c-44fa-a1fe-12457084c4b7',
}

function UploadIllustration({ small = false }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: small ? 8 : 16 }}>
      <img
        src={small ? UPLOAD_ASSETS.illustrationSmall : UPLOAD_ASSETS.illustrationLarge}
        alt=""
        style={{
          width: small ? 90 : 160,
          height: small ? 66 : 118,
        }}
        className="block"
        draggable={false}
      />
      <div className="flex items-center gap-1 text-sm font-medium text-black">
        <img src={UPLOAD_ASSETS.plusIcon} alt="" className="w-[11px] h-[11px]" />
        <span>Add photos &amp; videos</span>
      </div>
    </div>
  )
}

function PhotoThumbnail({ onRemove, index }) {
  return (
    <div className="relative shrink-0 w-[87px] h-[87px] rounded-xl overflow-hidden border border-black/[0.12] bg-[#f8f8f8]">
      <img src={SHARED.sampleThumb} alt="" className="w-full h-[148px] object-cover -mt-5" />
      {index === 2 && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="w-0 h-0 border-l-[14px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1" />
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#eef0f1] flex items-center justify-center p-0 border-0 cursor-pointer"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1L9 9M9 1L1 9" stroke="#434B51" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

function SuccessCheckmark() {
  const confetti = [
    { x: -30, y: -40, color: '#7EE86B', delay: 0.4, size: 6 },
    { x: 40, y: -35, color: '#2AB573', delay: 0.5, size: 5 },
    { x: -45, y: 10, color: '#A3F594', delay: 0.55, size: 7 },
    { x: 50, y: 5, color: '#7EE86B', delay: 0.45, size: 5 },
    { x: -20, y: -50, color: '#FFD666', delay: 0.5, size: 4 },
    { x: 30, y: -50, color: '#FFD666', delay: 0.6, size: 5 },
    { x: -50, y: -20, color: '#2AB573', delay: 0.65, size: 6 },
    { x: 55, y: -15, color: '#A3F594', delay: 0.5, size: 4 },
  ]

  return (
    <div className="relative" style={{ width: 160, height: 160 }}>
      {confetti.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size, height: p.size, backgroundColor: p.color,
            left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)`,
            animation: `confettiFall 1s ease-in ${p.delay}s both`,
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'ringPulse 0.8s ease-out 0.3s both' }}>
        <div className="w-[126px] h-[126px] rounded-full border-[3px] border-[#7EE86B]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'circleBounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both' }}>
        <svg width="126" height="126" viewBox="0 0 126 126" fill="none">
          <circle cx="63" cy="63" r="63" fill="#7EE86B" />
          <rect x="70" y="-10" width="14" height="150" rx="7" fill="#A3F594" opacity="0.5" style={{ animation: 'stripeShimmer 1.2s ease-out 0.6s both', transformOrigin: '77px 65px' }} />
          <rect x="88" y="-10" width="10" height="150" rx="5" fill="#A3F594" opacity="0.35" style={{ animation: 'stripeShimmer 1.2s ease-out 0.75s both', transformOrigin: '93px 65px' }} />
          <circle cx="63" cy="63" r="46" fill="#2AB573" />
          <circle cx="63" cy="63" r="42" fill="#25A86A" />
          <path d="M42 63L56 77L84 49" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="60" strokeDashoffset="60" style={{ animation: 'checkDraw 0.45s ease-out 0.5s forwards' }} />
        </svg>
      </div>
    </div>
  )
}

function Confetti() {
  // Regular confetti pieces — circles, rectangles, strips
  const pieces = Array.from({ length: 80 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2.5, size: 5 + Math.random() * 10,
    color: ['#FFD666', '#FF6B6B', '#7EE86B', '#6BB5FF', '#FF8ED4', '#A3F594', '#FFB347', '#fff', '#FFCA28', '#FF9500', '#B388FF', '#82B1FF'][i % 12],
    shape: i % 4,
  }))

  // Star particles scattered across
  const stars = Array.from({ length: 18 }, (_, i) => ({
    id: i + 100, left: 5 + Math.random() * 90, delay: Math.random() * 1.2,
    duration: 2.5 + Math.random() * 2, size: 8 + Math.random() * 14,
    color: ['#FFB800', '#FFD666', '#FFCA28', '#FFA726', '#FF9500', '#FFE082'][i % 6],
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((p) => (
        <div key={p.id} className="absolute" style={{
          left: `${p.left}%`, top: 0,
          width: p.shape === 3 ? p.size * 0.4 : p.shape === 2 ? p.size * 0.5 : p.size,
          height: p.shape === 3 ? p.size * 2 : p.shape === 2 ? p.size * 1.5 : p.size,
          backgroundColor: p.color,
          borderRadius: p.shape === 0 ? '50%' : '2px',
          animation: `confettiPieceFall ${p.duration}s ease-in ${p.delay}s both`,
        }} />
      ))}
      {stars.map((s) => (
        <div key={s.id} className="absolute" style={{
          left: `${s.left}%`, top: 0,
          animation: `confettiPieceFall ${s.duration}s ease-in ${s.delay}s both`,
        }}>
          <MiniStar size={s.size} color={s.color} />
        </div>
      ))}
    </div>
  )
}

function PoweredBy() {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      <span className="text-xs text-white/60 tracking-tight">Powered by</span>
      <div className="w-[66px] h-[14px] opacity-80">
        <img src={SHARED.razorpayLogo} alt="Razorpay" className="w-full h-full object-contain" />
      </div>
    </div>
  )
}

/* ─── Product Selection Grid ─── */

// Stacked transforms for each card index — fan layout centered in the grid area
// These move each card from its grid position to a centered stacked fan
const STACK_TRANSFORMS = [
  // Index 0 (left col, top — Foxtale, 200px): move right & up to center, slight rotate
  { tx: '55%', ty: '65%', rotate: -8, scale: 0.75, z: 3 },
  // Index 1 (right col, top — Golly, 252px): move left & down to center, rotate right
  { tx: '-55%', ty: '-15%', rotate: 12, scale: 0.7, z: 1 },
  // Index 2 (left col, bottom — Focus+, 252px): move right & up to center, rotate left
  { tx: '55%', ty: '-45%', rotate: -14, scale: 0.7, z: 2 },
]

function ProductCard({ product, index, onSelect, visible, ratingGiven, phase }) {
  const [loaded, setLoaded] = useState(false)

  const stack = STACK_TRANSFORMS[index] || STACK_TRANSFORMS[0]
  const isStacked = phase === 'stacked'
  const isSpreading = phase === 'spreading'
  const delay = 0.05 + index * 0.08

  // In stacked phase: cards are in fan formation
  // In spreading phase: cards animate to their grid positions
  // In visible phase: cards are in place
  const transform = isStacked
    ? `translate(${stack.tx}, ${stack.ty}) rotate(${stack.rotate}deg) scale(${stack.scale})`
    : 'translate(0, 0) rotate(0deg) scale(1)'

  const springy = 'cubic-bezier(0.34, 1.4, 0.64, 1)'
  const expoOut = 'cubic-bezier(0.16, 1, 0.3, 1)'

  return (
    <button
      onClick={() => onSelect(index)}
      className="relative overflow-hidden border border-white/20 bg-transparent p-0 cursor-pointer block"
      style={{
        borderRadius: isStacked ? 16 : 12,
        height: product.cardHeight,
        width: '100%',
        opacity: isStacked ? 1 : (isSpreading || visible) ? 1 : 0,
        transform,
        zIndex: isStacked ? stack.z : 'auto',
        boxShadow: isStacked
          ? 'inset 0 0 0 2px rgba(255,255,255,0.2), 0 0 40px rgba(0,0,0,0.7)'
          : 'none',
        transition: isStacked
          ? 'none'
          : `transform 0.65s ${springy} ${delay}s, opacity 0.3s ease ${delay}s, border-radius 0.4s ease ${delay}s, box-shadow 0.4s ease ${delay}s, z-index 0s linear ${delay}s`,
      }}
    >
      {/* Card image */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#111]" style={{ borderRadius: 12 }}>
          <Spinner size={20} />
        </div>
      )}
      <img
        src={product.cardImage}
        alt={product.name}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ borderRadius: 12, opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
        onLoad={() => setLoaded(true)}
      />

      {/* Bottom gradient — hidden in stacked phase */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: -9,
          width: 199,
          height: 99,
          background: 'linear-gradient(179deg, rgba(0,0,0,0) 1%, rgb(5,5,5) 72%)',
          filter: 'blur(5.5px)',
          pointerEvents: 'none',
          opacity: isStacked ? 0 : 1,
          transition: isStacked ? 'none' : 'opacity 0.3s ease 0.2s',
        }}
      />

      {/* Rated badge — top right */}
      {ratingGiven > 0 && (
        <div
          className="absolute flex items-center gap-[3px]"
          style={{
            top: 8, right: 10,
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1)' : 'scale(0.5)',
            transition: 'opacity 0.3s ease 0.4s, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s',
          }}
        >
          <span
            className="text-white/[0.88] font-medium"
            style={{ fontSize: 14, lineHeight: '20px', letterSpacing: '-0.18px', fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            {ratingGiven}
          </span>
          <img src={SHARED.starFilled} alt="" style={{ width: 14, height: 14 }} />
        </div>
      )}

      {/* Product name + arrow — hidden in stacked phase */}
      <div
        className="absolute left-[10px] right-[10px] flex items-center justify-between"
        style={{
          bottom: 11,
          opacity: isStacked ? 0 : 1,
          transform: isStacked ? 'translateY(6px)' : 'translateY(0)',
          transition: isStacked ? 'none' : 'opacity 0.4s ease 0.3s, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
        }}
      >
        <p
          className="text-[14px] font-medium text-white/[0.88] overflow-hidden text-ellipsis whitespace-nowrap"
          style={{
            lineHeight: '20px',
            letterSpacing: '-0.18px',
            maxWidth: 'calc(100% - 26px)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {product.name}
        </p>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M6 3L11 8L6 13" stroke="rgba(255,255,255,0.88)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  )
}

function ProductGrid({ products, onSelectProduct, visible, currentProductIndex, ratings, phase }) {
  const isSpreading = phase === 'spreading' || phase === 'visible'

  return (
    <div
      className="flex flex-col items-center w-full px-4"
      style={{
        opacity: phase === 'hidden' ? 0 : 1,
        transition: 'opacity 0.3s ease',
        pointerEvents: isSpreading ? 'auto' : 'none',
      }}
    >
      {/* Logo + title — fade in when spreading */}
      <div className="flex flex-col items-center" style={{ gap: 8 }}>
        <img
          src={SHARED.mavenLogo}
          alt="mavenshop"
          style={{
            height: 24,
            opacity: isSpreading ? 1 : 0,
            transform: isSpreading ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.4s ease 0.15s, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
          }}
        />
        <p
          className="text-center text-white/[0.88] whitespace-nowrap"
          style={{
            fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
            fontSize: 20,
            fontWeight: 400,
            lineHeight: '26px',
            opacity: isSpreading ? 1 : 0,
            transform: isSpreading ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.4s ease 0.22s, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.22s',
          }}
        >
          Select a product to give review
        </p>
      </div>

      {/* Masonry grid - 2 columns */}
      <div
        className="w-full mt-6"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          alignItems: 'start',
        }}
      >
        {/* Left column */}
        <div className="flex flex-col" style={{ gap: 14 }}>
          {products.filter((_, i) => i % 2 === 0).map((p) => {
            const originalIndex = products.indexOf(p)
            return (
              <ProductCard
                key={originalIndex}
                product={p}
                index={originalIndex}
                onSelect={onSelectProduct}
                visible={visible}
                ratingGiven={ratings[originalIndex] || 0}
                phase={phase}
              />
            )
          })}
        </div>
        {/* Right column — offset down to create masonry feel */}
        <div className="flex flex-col" style={{ gap: 14, marginTop: 82 }}>
          {products.filter((_, i) => i % 2 === 1).map((p) => {
            const originalIndex = products.indexOf(p)
            return (
              <ProductCard
                key={originalIndex}
                product={p}
                index={originalIndex}
                onSelect={onSelectProduct}
                visible={visible}
                ratingGiven={ratings[originalIndex] || 0}
                phase={phase}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Product Image with loader ─── */

function ProductImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false)
  const prevSrc = useRef(src)

  useEffect(() => {
    if (src !== prevSrc.current) {
      setLoaded(false)
      prevSrc.current = src
    }
  }, [src])

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#010101]">
          <Spinner size={28} />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
        onLoad={() => setLoaded(true)}
      />
    </>
  )
}

/* ─── Intro Splash Animation ─── */

function IntroSplash({ onComplete }) {
  const [stage, setStage] = useState(0)
  // Stage 0: Cards at scale(0) — invisible
  // Stage 1: Fan layout — cards scale up with spring
  // Stage 2: Center expands to full, sides exit, rating card appears

  // Preload splash card images + first product bg
  const imagesLoaded = useImagePreloader([
    SPLASH_CARDS.center,
    SPLASH_CARDS.left,
    SPLASH_CARDS.right,
    PRODUCTS[0].bgImage,
  ])

  useEffect(() => {
    if (!imagesLoaded) return
    // Kick off scale-in immediately after load
    const t0 = setTimeout(() => setStage(1), 50)
    // Hold the fan, then expand
    const t1 = setTimeout(() => setStage(2), 1400)
    const t2 = setTimeout(() => onComplete(), 2300)
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2) }
  }, [onComplete, imagesLoaded])

  // Motion curves
  const expoOut = 'cubic-bezier(0.16, 1, 0.3, 1)'
  const easeInQuart = 'cubic-bezier(0.5, 0, 0.75, 0)'
  const springy = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  const softOut = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'

  // ── Card 1 (center — Foxtale) ──
  const card1Style = {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 3,
    width: stage <= 1 ? 183 : '100%',
    height: stage <= 1 ? 258 : '57%',
    left: stage <= 1 ? 'calc(50% - 91px)' : 0,
    top: stage <= 1 ? '29%' : 0,
    borderRadius: stage <= 1 ? 20 : 0,
    boxShadow: stage === 0
      ? 'inset 0 0 0 2px rgba(255,255,255,0), 0 0 0px rgba(0,0,0,0)'
      : stage === 1
      ? 'inset 0 0 0 2px rgba(255,255,255,0.2), 0 0 60px rgba(0,0,0,0.85)'
      : 'inset 0 0 0 0px rgba(255,255,255,0), 0 0 60px rgba(0,0,0,0)',
    transform: stage === 0 ? 'scale(0)' : 'scale(1)',
    opacity: stage === 0 ? 0 : 1,
    transition: stage <= 1
      ? `transform 0.7s ${springy}, opacity 0.3s ease, box-shadow 0.4s ease 0.3s`
      : `width 0.7s ${expoOut}, height 0.7s ${expoOut}, left 0.7s ${expoOut}, top 0.7s ${expoOut}, border-radius 0.5s ${expoOut}, box-shadow 0.4s ease, transform 0.1s ease`,
  }

  // ── Card 2 (back-right — Focus+) ──
  const card2Style = {
    position: 'absolute',
    overflow: 'hidden',
    width: 153, height: 216,
    borderRadius: 20,
    boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.2), 0 0 60px rgba(0,0,0,0.85)',
    zIndex: 1,
    top: '28%',
    ...(stage === 0 ? {
      left: 'calc(50% + 20px)',
      transform: 'rotate(15.4deg) scale(0)',
      opacity: 0,
      transition: `transform 0.7s ${springy} 0.08s, opacity 0.3s ease 0.08s`,
    } : stage === 1 ? {
      left: 'calc(50% + 20px)',
      transform: 'rotate(15.4deg) scale(1)',
      opacity: 1,
      transition: `transform 0.7s ${springy} 0.08s, opacity 0.3s ease 0.08s`,
    } : {
      left: '120%',
      transform: 'rotate(25deg) scale(1)',
      opacity: 0,
      transition: `left 0.35s ${easeInQuart}, opacity 0.3s ${easeInQuart}, transform 0.35s ${easeInQuart}`,
    }),
  }

  // ── Card 3 (back-left — Golly) ──
  const card3Style = {
    position: 'absolute',
    overflow: 'hidden',
    width: 153, height: 216,
    borderRadius: 20,
    boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.2), 0 0 60px rgba(0,0,0,0.85)',
    zIndex: 2,
    top: '28.5%',
    ...(stage === 0 ? {
      left: 'calc(50% - 173px)',
      transform: 'rotate(-15deg) scale(0)',
      opacity: 0,
      transition: `transform 0.7s ${springy} 0.12s, opacity 0.3s ease 0.12s`,
    } : stage === 1 ? {
      left: 'calc(50% - 173px)',
      transform: 'rotate(-15deg) scale(1)',
      opacity: 1,
      transition: `transform 0.7s ${springy} 0.12s, opacity 0.3s ease 0.12s`,
    } : {
      left: '-60%',
      transform: 'rotate(-25deg) scale(1)',
      opacity: 0,
      transition: `left 0.35s ${easeInQuart}, opacity 0.3s ${easeInQuart}, transform 0.35s ${easeInQuart}`,
    }),
  }

  // Gradient — only on stage 2
  const gradientStyle = {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '60%',
    background: 'linear-gradient(180deg, rgba(1,1,1,0) 0%, rgba(1,1,1,0.6) 50%, rgba(1,1,1,1) 100%)',
    pointerEvents: 'none',
    zIndex: 3,
    opacity: stage >= 2 ? 1 : 0,
    transition: `opacity 0.5s ${softOut}`,
    transitionDelay: stage >= 2 ? '0.15s' : '0s',
  }

  // Product name — only on stage 2
  const nameStyle = {
    position: 'absolute',
    left: 0, right: 0,
    textAlign: 'center',
    fontSize: 18,
    color: 'rgba(255,255,255,0.88)',
    fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
    zIndex: 4,
    padding: '0 16px',
    whiteSpace: 'nowrap',
    transition: `top 0.7s ${expoOut}, opacity 0.4s ${softOut}`,
    transitionDelay: stage >= 2 ? '0.1s' : '0s',
    ...(stage < 2 ? {
      top: 'calc(29% + 258px + 10px)',
      opacity: 0,
    } : {
      top: 'calc(57% - 34px)',
      opacity: 1,
    }),
  }

  // Rating card — only on stage 2
  const cardStyle = {
    position: 'absolute',
    left: 16, right: 16,
    bottom: 39,
    backgroundColor: 'white',
    borderRadius: 16,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    zIndex: 10,
    overflow: 'hidden',
    transition: `top 0.45s ${expoOut}, opacity 0.3s ${softOut}`,
    transitionDelay: stage >= 2 ? '0.1s' : '0s',
    ...(stage < 2 ? {
      top: '110%',
      opacity: 0,
    } : {
      top: '57%',
      opacity: 1,
    }),
  }

  // Show spinner until images are loaded
  if (!imagesLoaded) {
    return (
      <div className="absolute inset-0 bg-[#010101] z-50 flex items-center justify-center">
        <FloatingParticles />
        <Spinner size={32} color="rgba(255,255,255,0.9)" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-[#010101] z-50 overflow-hidden">
      <FloatingParticles />

      {/* Card 3 (back-left — Golly) */}
      <div style={card3Style}>
        <img src={SPLASH_CARDS.left} alt="" className="w-full h-full object-cover" style={{ borderRadius: 20 }} />
      </div>

      {/* Card 2 (back-right — Focus+) */}
      <div style={card2Style}>
        <img src={SPLASH_CARDS.right} alt="" className="w-full h-full object-cover" style={{ borderRadius: 20 }} />
      </div>

      {/* Card 1 (center front — Foxtale) */}
      <div style={card1Style}>
        <img
          src={stage <= 1 ? SPLASH_CARDS.center : PRODUCTS[0].bgImage}
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Gradient inside card 1 */}
        <div style={gradientStyle} />
      </div>

      {/* Product name — positioned absolutely in the splash container */}
      <p style={nameStyle}>{PRODUCTS[0].name}</p>

      {/* Rating card */}
      <div style={cardStyle}>
        {/* Logo — always visible */}
        <div style={{ padding: '20px 0 0', flexShrink: 0 }}>
          <img src={SHARED.mavenLogo} alt="mavenshop" className="h-6" />
        </div>

        {/* Rating content */}
        <div
          className="flex flex-col items-center"
          style={{ gap: 12, marginTop: 72, flexShrink: 0 }}
        >
          <p style={{
            fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
            fontSize: 18, fontWeight: 600, lineHeight: '24px',
            color: 'black', textAlign: 'center',
          }}>
            How would you rate this product?
          </p>
          <div className="flex items-center" style={{ gap: 12 }}>
            {[1,2,3,4,5].map((s, i) => (
              <img
                key={s}
                src={SHARED.starEmpty}
                alt=""
                style={{
                  width: 48, height: 48,
                  animation: stage >= 2 ? `starAttention 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.55 + i * 0.07}s both` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Skip */}
        <div style={{ marginTop: 72, paddingBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(0,0,0,0.9)' }}>Ask me later</span>
        </div>
      </div>

      {/* Powered by */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center" style={{ padding: '12px 10px' }}>
        <PoweredBy />
      </div>
    </div>
  )
}

/* ─── Main App ─── */

export default function App() {
  const [step, setStep] = useState(0)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [photos, setPhotos] = useState([])
  const [productIndex, setProductIndex] = useState(0)
  const [slideDir, setSlideDir] = useState(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [finalStage, setFinalStage] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [productRatings, setProductRatings] = useState({}) // { productIndex: rating }
  // Product grid (skip flow) states
  const [showProductGrid, setShowProductGrid] = useState(false)
  const [gridPhase, setGridPhase] = useState('hidden') // 'hidden' | 'stacked' | 'spreading' | 'visible'
  const [gridZooming, setGridZooming] = useState(null) // index of zooming card
  const [gridZoomStage, setGridZoomStage] = useState(0) // 0=none, 1=expanding, 2=done
  const [risingStarsKey, setRisingStarsKey] = useState(0) // increment to re-trigger rising stars
  const inputRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const inputRowRef = useRef(null)

  const product = PRODUCTS[productIndex]
  const isExpanded = step >= 2 && step !== 'submitted'
  const isSubmitted = step === 'submitted'

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false)
  }, [])

  const handleInputFocus = () => {
    setIsTyping(true)
    setTimeout(() => {
      if (inputRowRef.current) {
        inputRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 150)
  }

  const handleInputBlur = () => {
    setIsTyping(false)
  }

  const handleRate = (star) => {
    setRating(star)
    setProductRatings(prev => ({ ...prev, [productIndex]: star }))
    // Trigger rising star particles on 3+ stars
    if (star >= 3) {
      setRisingStarsKey(k => k + 1)
    }
    if (step === 0) {
      setStep(1)
      setTimeout(() => setStep(2), 600)
    }
  }

  const handleSkip = () => {
    // Show product grid — start with stacked fan formation
    setShowProductGrid(true)
    setGridPhase('stacked')
    // After asset area shrinks, start spreading cards to grid positions
    setTimeout(() => setGridPhase('spreading'), 500)
    // Mark as fully visible
    setTimeout(() => setGridPhase('visible'), 1200)
  }

  const handleSelectFromGrid = (index) => {
    setGridZooming(index)
    setGridZoomStage(1)
    // After zoom animation, switch to that product's rating flow
    setTimeout(() => {
      setGridZoomStage(2)
      setProductIndex(index)
      setStep(0)
      setRating(0)
      setReview('')
      setPhotos([])
      setShowProductGrid(false)
      setGridPhase('hidden')
      setGridZooming(null)
      setGridZoomStage(0)
    }, 700)
  }

  const handleAddPhotos = () => {
    setPhotos([1, 2, 3])
    setStep(3)
  }

  const handleRemovePhoto = (index) => {
    const next = photos.filter((_, i) => i !== index)
    setPhotos(next)
    if (next.length === 0) setStep(2)
  }

  const goToNextProduct = () => {
    setSlideDir('out')
    setTimeout(() => {
      setProductIndex((i) => (i + 1) % PRODUCTS.length)
      setStep(0)
      setRating(0)
      setReview('')
      setPhotos([])
      setSlideDir('in')
      setTimeout(() => setSlideDir(null), 500)
    }, 400)
  }

  const handleSubmit = () => {
    setStep('submitted')
    const newCount = reviewCount + 1
    setReviewCount(newCount)

    if (newCount >= PRODUCTS.length) {
      setTimeout(() => {
        setFinalStage('expanding')
        // Flip checkmark to logo after 2s
        setTimeout(() => setFlipped(true), 2000)
      }, 800)
    } else {
      setTimeout(() => goToNextProduct(), 2000)
    }
  }

  return (
    <div className="relative w-full h-[100dvh] max-w-[520px] mx-auto bg-[#010101] overflow-hidden flex flex-col">

      {/* ── Ambient particles — always behind everything, boost on 3+ rating ── */}
      <FloatingParticles count={700} boostTrigger={risingStarsKey} />

      {/* ── Intro Splash ── */}
      {showIntro && <IntroSplash onComplete={handleIntroComplete} />}

      {/* ── Asset area — flex:1, fills remaining space ── */}
      <div
        className="overflow-hidden relative"
        style={{
          flex: finalStage ? '0 0 0px' : showProductGrid ? '0 0 90px' : '1 1 0%',
          minHeight: finalStage ? 0 : showProductGrid ? 90 : (isTyping ? 120 : 0),
          transition: 'flex 0.65s cubic-bezier(0.16, 1, 0.3, 1), min-height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Background + product image (carousel animated) */}
        <div
          className="absolute inset-0"
          style={{
            animation: slideDir === 'out'
              ? 'slideOutLeft 0.4s ease-in forwards'
              : slideDir === 'in'
              ? 'slideInRight 0.45s ease-out forwards'
              : 'none',
          }}
        >
          <ProductImage src={product.bgImage} alt={product.name} />
        </div>

        {/* Gradient at bottom of image */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '60%',
            background: 'linear-gradient(180deg, rgba(1,1,1,0) 0%, rgba(1,1,1,0.6) 50%, rgba(1,1,1,1) 100%)',
          }}
        />

        {/* Product name */}
        <p
          className="absolute bottom-[12px] left-0 right-0 text-center text-lg text-white/[0.88] whitespace-nowrap px-4 z-10"
          style={{
            fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
            opacity: (slideDir === 'out' || finalStage || showProductGrid) ? 0 : 1,
            transition: 'opacity 0.3s',
            animation: slideDir === 'in' ? 'textFadeIn 0.4s ease-out 0.1s both' : 'none',
          }}
        >
          {product.name}
        </p>
      </div>

      {/* ── Product Grid (skip flow) ── */}
      {showProductGrid && (
        <div
          className="flex-1 overflow-y-auto relative z-10"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="py-4">
            <ProductGrid
              products={PRODUCTS}
              onSelectProduct={handleSelectFromGrid}
              visible={gridPhase === 'visible' || gridPhase === 'spreading'}
              currentProductIndex={productIndex}
              ratings={productRatings}
              phase={gridPhase}
            />
          </div>
        </div>
      )}

      {/* ── Card — shrink-0, hugs content ── */}
      <div
        className="shrink-0 self-stretch overflow-hidden flex flex-col items-center justify-center z-10"
        style={{
          margin: finalStage ? 0 : '0 16px',
          backgroundColor: finalStage ? '#009e5c' : 'white',
          borderRadius: finalStage ? 0 : '16px',
          flex: finalStage ? '1 1 0%' : '0 0 auto',
          // Slide down when product grid is showing
          transform: showProductGrid ? 'translateY(120%)' : 'translateY(0)',
          maxHeight: showProductGrid ? 0 : 'none',
          opacity: showProductGrid ? 0 : 1,
          transition: 'margin 0.6s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.7s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.6s cubic-bezier(0.16, 1, 0.3, 1), flex 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.5, 0, 0.75, 0), max-height 0.45s ease, opacity 0.3s ease',
        }}
      >
        {isSubmitted ? (
          /* ── Success content ── */
          <div className="flex flex-col items-center justify-center relative" style={{ padding: '48px 16px' }}>
            {/* 3D Flip container */}
            <div style={{
              perspective: 600,
              width: 160, height: 160,
            }}>
              <div style={{
                width: '100%', height: '100%',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}>
                {/* Front — checkmark */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  filter: finalStage ? 'drop-shadow(0 4px 20px rgba(0,0,0,0.15))' : undefined,
                }}>
                  <SuccessCheckmark />
                </div>
                {/* Back — white circle with mavenshop logo */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {/* Outer green ring */}
                  <div style={{
                    width: 158, height: 158, borderRadius: '50%',
                    backgroundColor: '#009e5c',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                  }}>
                    {/* Inner white circle */}
                    <div style={{
                      width: 134, height: 134, borderRadius: '50%',
                      backgroundColor: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img src="https://www.figma.com/api/mcp/asset/c7d43eda-c678-496d-b289-fa1df63bc085" alt="mavenshop" style={{ width: 112, height: 20 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text — changes after flip */}
            <div className="flex flex-col items-center" style={{ minHeight: 100, gap: 12, marginTop: 16 }}>
              {/* Pre-flip text — slides up slightly and fades when flipped */}
              <p
                className="text-center"
                style={{
                  fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
                  fontSize: 20,
                  lineHeight: '26px',
                  fontWeight: 400,
                  color: finalStage ? 'white' : '#006c3f',
                  opacity: (!finalStage && !flipped) ? 0 : 1,
                  transform: flipped ? 'translateY(-4px) scale(0.97)' : 'translateY(0) scale(1)',
                  transition: 'color 0.5s, opacity 0.4s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  animation: !finalStage ? 'textFadeIn 0.4s ease-out 0.7s both'
                    : finalStage && !flipped ? 'textPushIn 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) 0.3s both'
                    : 'none',
                }}
              >
                Review Submitted!
              </p>

              {/* Post-flip thank you text — pushes up with spring */}
              <p
                className="text-white text-center"
                style={{
                  fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
                  fontSize: 24,
                  fontWeight: 500,
                  lineHeight: '32px',
                  maxWidth: 260,
                  opacity: flipped ? 1 : 0,
                  transform: flipped ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                  transition: 'opacity 0.5s ease 0.35s, transform 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) 0.35s',
                }}
              >
                Once again thank you for shopping from us
              </p>
            </div>
          </div>
        ) : (
          /* ── Review flow ── */
          <>
            {/* mavenshop logo */}
            <div className="flex justify-center shrink-0 self-stretch" style={{
              padding: isExpanded ? '16px 0 0' : '20px 0 0',
              transition: 'padding 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <img src={SHARED.mavenLogo} alt="mavenshop" className="h-6" />
            </div>

            {/* Rating */}
            <div
              className="flex flex-col items-center self-stretch"
              style={{
                gap: '12px',
                marginTop: isExpanded ? '24px' : '72px',
                transition: 'margin-top 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <p
                className="text-black text-center whitespace-nowrap"
                style={{
                  fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
                  fontSize: isExpanded ? '14px' : '18px',
                  fontWeight: isExpanded ? 400 : 600,
                  lineHeight: '24px',
                  transition: 'font-size 0.5s cubic-bezier(0.16, 1, 0.3, 1), font-weight 0.3s ease',
                }}
              >
                How would you rate this product?
              </p>
              <StarRating rating={rating} onRate={handleRate} size={isExpanded ? 32 : 48} bounceKey={productIndex} />
            </div>

            {/* Expandable content area */}
            <div
              className="self-stretch"
              style={{
                display: 'grid',
                gridTemplateRows: isExpanded ? '1fr' : '0fr',
                opacity: isExpanded ? 1 : 0,
                transition: 'grid-template-rows 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.08s',
              }}
            >
              <div className="overflow-hidden">
                <div
                  ref={scrollContainerRef}
                  className="flex flex-col gap-4 px-4 mt-5 overflow-y-auto"
                  style={{ maxHeight: isExpanded ? 'calc(100dvh - 330px)' : 'none', scrollbarWidth: 'none' }}
                >
                  {/* Asset area */}
                  <div className="flex flex-col gap-4 w-full" style={{ maxHeight: 264 }}>
                    {photos.length === 0 ? (
                      <button
                        onClick={handleAddPhotos}
                        className="w-full bg-[#f8f8f8] border border-dashed border-black/[0.12] rounded-xl flex items-center justify-center cursor-pointer"
                        style={{ height: 264, padding: '36px 0' }}
                      >
                        <UploadIllustration />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setPhotos([...photos, photos.length + 1])}
                          className="w-full flex-1 min-h-0 bg-[#f8f8f8] border border-dashed border-black/[0.12] rounded-xl flex items-center justify-center cursor-pointer"
                          style={{ padding: '24px 0' }}
                        >
                          <UploadIllustration small />
                        </button>
                        <div className="flex gap-4 shrink-0 overflow-x-auto -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
                          {photos.map((_, i) => (
                            <PhotoThumbnail key={i} index={i} onRemove={() => handleRemovePhoto(i)} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Input row */}
                  <div ref={inputRowRef} className="flex gap-2 items-end shrink-0">
                    <textarea
                      ref={inputRef}
                      placeholder="Write your review"
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      rows={1}
                      className="flex-1 bg-white border border-[#dee1e3] rounded-lg px-3 py-2 text-[16px] text-[#050505] placeholder:text-black/[0.32] outline-none focus:border-black focus:border-[1.5px] resize-none"
                      style={{ height: isTyping ? 86 : 44, maxHeight: 100, transition: 'height 0.2s ease' }}
                    />
                    <button
                      className="shrink-0 bg-white border border-[#dee1e3] rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50"
                      style={{ width: 44, height: 44 }}
                    >
                      <MicIcon />
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div style={{
                  padding: '16px 16px 16px',
                  opacity: isExpanded ? 1 : 0,
                  transform: isExpanded ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
                }}>
                  <button
                    onClick={handleSubmit}
                    className="w-full h-12 shrink-0 bg-[#050505] text-white rounded-xl font-semibold text-base cursor-pointer border-0 active:bg-[#333] transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>

            {/* Skip link */}
            <div
              className="self-stretch"
              style={{
                display: 'grid',
                gridTemplateRows: isExpanded ? '0fr' : '1fr',
                opacity: isExpanded ? 0 : 1,
                transition: 'grid-template-rows 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
              }}
            >
              <div className="overflow-hidden">
                <div className="flex justify-center" style={{ marginTop: '72px', paddingBottom: '20px' }}>
                  <button
                    onClick={handleSkip}
                    className="font-medium text-black/90 bg-transparent border-0 cursor-pointer hover:text-black"
                    style={{ fontSize: 12 }}
                  >
                    Ask me later
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Powered by Razorpay ── */}
      <div
        className="shrink-0 overflow-hidden flex items-center justify-center"
        style={{
          opacity: (finalStage || showProductGrid) ? 0 : 1,
          maxHeight: (finalStage || showProductGrid) ? '0px' : '39px',
          padding: (finalStage || showProductGrid) ? 0 : '12px 10px',
          transition: 'opacity 0.3s, max-height 0.4s ease-in-out, padding 0.4s ease-in-out',
        }}
      >
        <PoweredBy />
      </div>

      {/* Powered by for product grid */}
      {showProductGrid && (
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            padding: '12px 10px',
            opacity: (gridPhase === 'spreading' || gridPhase === 'visible') ? 1 : 0,
            transition: 'opacity 0.4s ease 0.4s',
          }}
        >
          <PoweredBy />
        </div>
      )}

      {/* Full-screen confetti overlay */}
      {finalStage && <Confetti />}

      {finalStage && (
        <div className="absolute bottom-7 left-0 right-0 z-50 flex justify-center" style={{ animation: 'textFadeIn 0.4s ease-out 0.3s both' }}>
          <PoweredBy />
        </div>
      )}

      {/* Zoom overlay when selecting product from grid */}
      {gridZoomStage >= 1 && gridZooming !== null && (
        <div
          className="absolute inset-0 z-50 overflow-hidden"
          style={{
            backgroundColor: '#010101',
            animation: 'fullScreenFadeIn 0.5s ease-out both',
          }}
        >
          {/* Expanding product image */}
          <div
            className="absolute inset-0"
            style={{
              opacity: gridZoomStage >= 1 ? 1 : 0,
              transform: gridZoomStage >= 1 ? 'scale(1)' : 'scale(0.3)',
              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
            }}
          >
            <img
              src={PRODUCTS[gridZooming].bgImage}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          {/* Gradient */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: '60%',
              background: 'linear-gradient(180deg, rgba(1,1,1,0) 0%, rgba(1,1,1,0.6) 50%, rgba(1,1,1,1) 100%)',
              opacity: gridZoomStage >= 1 ? 1 : 0,
              transition: 'opacity 0.4s ease 0.2s',
            }}
          />

          {/* Product name */}
          <p
            className="absolute bottom-[12px] left-0 right-0 text-center text-lg text-white/[0.88] whitespace-nowrap px-4 z-10"
            style={{
              fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
              opacity: gridZoomStage >= 1 ? 1 : 0,
              transform: gridZoomStage >= 1 ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.3s ease 0.25s, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.25s',
            }}
          >
            {PRODUCTS[gridZooming].name}
          </p>
        </div>
      )}

    </div>
  )
}
