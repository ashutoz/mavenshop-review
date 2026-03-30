import { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react'
import { WebHaptics } from 'web-haptics'

// Initialize haptics (no-ops silently on unsupported platforms)
const haptics = new WebHaptics()

/* ─── Theme System ─── */

const THEMES = {
  dark: {
    bg: '#010101',
    bodyBg: '#000',
    text: 'white',
    textHigh: 'rgba(255,255,255,0.88)',
    textMuted: 'rgba(255,255,255,0.6)',
    border: 'rgba(255,255,255,0.2)',
    borderStrong: 'rgba(255,255,255,0.5)',
    inputBg: '#202224',
    inputBorder: '#3b3d40',
    uploadBg: '#202224',
    uploadBorder: 'rgba(255,255,255,0.12)',
    submitBg: 'white',
    submitText: 'black',
    cardLoadBg: '#111',
    productLoadBg: '#010101',
    cardShadowStack: '0 0 40px rgba(0,0,0,0.7)',
    gridGradient: 'linear-gradient(179deg, rgba(0,0,0,0) 1%, rgb(5,5,5) 72%)',
    zoomOverlay: '#010101',
    zoomGradient: 'linear-gradient(180deg, rgba(1,1,1,0) 0%, rgba(1,1,1,0.6) 50%, rgba(1,1,1,1) 100%)',
    particleColors: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)', 'rgba(130,160,255,0.12)', 'rgba(200,180,255,0.1)'],
    arrowStroke: 'rgba(255,255,255,0.88)',
    spinnerColor: 'rgba(255,255,255,0.7)',
    micIconFilter: 'none',
    poweredByOpacity: 0.6,
    poweredByTextColor: 'rgba(255,255,255,0.6)',
    textareaClass: 'dark-textarea',
    emptyStarFilter: 'none',
    razorpayFilter: 'none',
  },
  light: {
    bg: '#E8E8E8',
    bodyBg: '#E8E8E8',
    text: '#1a1a1a',
    textHigh: 'rgba(0,0,0,0.88)',
    textMuted: 'rgba(0,0,0,0.5)',
    border: 'rgba(0,0,0,0.15)',
    borderStrong: 'rgba(0,0,0,0.3)',
    inputBg: '#ffffff',
    inputBorder: '#d0d0d0',
    uploadBg: '#ffffff',
    uploadBorder: 'rgba(0,0,0,0.15)',
    submitBg: '#1a1a1a',
    submitText: 'white',
    cardLoadBg: '#ddd',
    productLoadBg: '#E8E8E8',
    cardShadowStack: '0 0 40px rgba(0,0,0,0.15)',
    gridGradient: 'linear-gradient(179deg, rgba(0,0,0,0) 1%, rgba(0,0,0,0.7) 72%)',
    zoomOverlay: '#E8E8E8',
    zoomGradient: 'linear-gradient(180deg, rgba(232,232,232,0) 0%, rgba(232,232,232,0.6) 50%, rgba(232,232,232,1) 100%)',
    particleColors: ['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.04)', 'rgba(100,120,200,0.08)', 'rgba(160,140,200,0.06)'],
    arrowStroke: 'rgba(0,0,0,0.88)',
    spinnerColor: 'rgba(0,0,0,0.4)',
    micIconFilter: 'none',
    poweredByOpacity: 0.5,
    poweredByTextColor: 'rgba(0,0,0,0.5)',
    textareaClass: 'light-textarea',
    emptyStarFilter: 'brightness(0) opacity(0.35)',
    razorpayFilter: 'brightness(0) saturate(100%)',
  },
}

const ThemeContext = createContext(THEMES.dark)
function useTheme() { return useContext(ThemeContext) }

function ThemeToggle({ mode, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'absolute',
        top: 20,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`,
        background: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        color: mode === 'dark' ? 'white' : '#1a1a1a',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 0,
        transition: 'all 0.3s ease',
      }}
    >
      {mode === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

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
const CARD_TRANSITION_DURATION = 650


// Simple spinner component
function Spinner({ size = 24, color }) {
  const theme = useTheme()
  const c = color || theme.spinnerColor
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round"
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

function StarRating({ rating, onRate, size = 48, bounceKey, starRefs, introReveal }) {
  const theme = useTheme()
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
        <div key={star} className="relative" ref={el => { if (starRefs) starRefs.current[star - 1] = el }}>
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
                  : introReveal
                  ? `starsBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${(star - 1) * 70}ms both`
                  : bouncing && rating === 0
                  ? `starAttention 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${(star - 1) * 70}ms both`
                  : 'none',
            }}
          >
            <img
              src={star <= rating ? SHARED.starFilled : SHARED.starEmpty}
              alt={`${star} star`}
              style={{ width: size, height: size, filter: star <= rating ? 'none' : theme.emptyStarFilter }}
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
  illustrationSmall: 'https://www.figma.com/api/mcp/asset/961e15ae-8a57-4bd6-958e-81f229a6281f',
  plusIcon: 'https://www.figma.com/api/mcp/asset/a03e3c1f-e4b3-49e7-9d3d-4a7e76929e13',
  micIcon: 'https://www.figma.com/api/mcp/asset/8a66a90d-2b03-4315-b828-f6dd75aaff0a',
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
  const theme = useTheme()
  return (
    <div className="relative shrink-0 rounded-xl overflow-hidden" style={{ width: 87, height: 87, border: `1px solid ${theme.border}`, background: 'transparent' }}>
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
  const theme = useTheme()
  return (
    <div className="flex items-center gap-1.5 justify-center">
      <span className="text-xs tracking-tight" style={{ color: theme.poweredByTextColor }}>Powered by</span>
      <div className="w-[66px] h-[14px]" style={{ opacity: theme.poweredByOpacity }}>
        <img src={SHARED.razorpayLogo} alt="Razorpay" className="w-full h-full object-contain" style={{ filter: theme.razorpayFilter }} />
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
  const theme = useTheme()

  const stack = STACK_TRANSFORMS[index] || STACK_TRANSFORMS[0]
  const isStacked = phase === 'stacked'
  const isSpreading = phase === 'spreading'
  const delay = 0.05 + index * 0.08

  const transform = isStacked
    ? `translate(${stack.tx}, ${stack.ty}) rotate(${stack.rotate}deg) scale(${stack.scale})`
    : 'translate(0, 0) rotate(0deg) scale(1)'

  const springy = 'cubic-bezier(0.34, 1.4, 0.64, 1)'
  const expoOut = 'cubic-bezier(0.16, 1, 0.3, 1)'

  return (
    <button
      onClick={() => onSelect(index)}
      className="relative overflow-hidden bg-transparent p-0 cursor-pointer block"
      style={{
        borderRadius: isStacked ? 16 : 12,
        height: product.cardHeight,
        width: '100%',
        border: `1px solid ${theme.border}`,
        opacity: isStacked ? 1 : (isSpreading || visible) ? 1 : 0,
        transform,
        zIndex: isStacked ? stack.z : 'auto',
        boxShadow: isStacked
          ? `inset 0 0 0 2px ${theme.border}, ${theme.cardShadowStack}`
          : 'none',
        transition: isStacked
          ? 'none'
          : `transform 0.65s ${springy} ${delay}s, opacity 0.3s ease ${delay}s, border-radius 0.4s ease ${delay}s, box-shadow 0.4s ease ${delay}s, z-index 0s linear ${delay}s`,
      }}
    >
      {/* Card image */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ borderRadius: 12, backgroundColor: theme.cardLoadBg }}>
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
          background: theme.gridGradient,
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
            className="font-medium"
            style={{ fontSize: 14, lineHeight: '20px', letterSpacing: '-0.18px', fontFamily: 'Inter, system-ui, sans-serif', color: theme.textHigh }}
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
          className="text-[14px] font-medium overflow-hidden text-ellipsis whitespace-nowrap"
          style={{
            lineHeight: '20px',
            letterSpacing: '-0.18px',
            maxWidth: 'calc(100% - 26px)',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: theme.textHigh,
          }}
        >
          {product.name}
        </p>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M6 3L11 8L6 13" stroke={theme.arrowStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  )
}

function ProductGrid({ products, onSelectProduct, visible, currentProductIndex, ratings, phase }) {
  const isSpreading = phase === 'spreading' || phase === 'visible'
  const theme = useTheme()

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
          className="text-center whitespace-nowrap"
          style={{
            color: theme.textHigh,
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
  const theme = useTheme()
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
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: theme.productLoadBg }}>
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

/* ─── Holo shimmer overlay for dark card surfaces ─── */
function HoloShimmerOverlay() {
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 12,
        backgroundImage: `
          linear-gradient(125deg, transparent 10%,
            rgba(255, 30, 30, 0.06) 20%, rgba(255, 180, 0, 0.06) 30%,
            rgba(0, 255, 80, 0.06) 40%, rgba(0, 120, 255, 0.06) 50%,
            rgba(140, 50, 255, 0.06) 60%, rgba(255, 50, 180, 0.06) 70%,
            transparent 90%),
          linear-gradient(-60deg, transparent 30%,
            rgba(255, 255, 255, 0.02) 45%, rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 55%, transparent 70%)`,
        backgroundSize: '300% 300%, 250% 250%',
        backgroundBlendMode: 'color-dodge, overlay',
        mixBlendMode: 'overlay',
        opacity: 0.5,
        animation: 'holoShine 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 12,
        background: `radial-gradient(ellipse farthest-corner at 30% 70%,
          rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.015) 35%, transparent 70%)`,
        mixBlendMode: 'soft-light',
        opacity: 0.4,
        animation: 'holoGlare 6s ease-in-out infinite',
      }} />
    </>
  )
}

/* ─── Transition Card (simple flip card for carousel transition) ─── */

const CARD_BACK_LOGO = 'https://www.figma.com/api/mcp/asset/83e41df8-38a9-4c29-a285-ba5521160a6f'

function TransitionCard({ product, flipped, duration, img, showSuccess, rating }) {
  const resolve = img || ((u) => u)
  return (
    <div
      style={{
        width: 289,
        height: 412,
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: duration > 0 ? `transform ${duration}ms cubic-bezier(0.33, 0, 0.15, 1)` : 'none',
      }}
    >
      {/* FRONT FACE — product card with holo border (matches ProductCard3D layout) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          willChange: 'transform',
          background: `linear-gradient(
            var(--holo-angle, 0deg),
            hsl(300, 50%, 75%) 0%, hsl(240, 55%, 78%) 12%,
            hsl(200, 65%, 78%) 24%, hsl(160, 60%, 75%) 36%,
            hsl(120, 50%, 76%) 48%, hsl(60, 65%, 78%) 60%,
            hsl(30, 70%, 76%) 72%, hsl(350, 55%, 75%) 84%,
            hsl(300, 50%, 75%) 100%
          )`,
          animation: 'holoRotate 4s linear infinite',
          padding: 6,
          borderRadius: 16,
        }}
      >
        <div style={{
          width: 277, height: 400, borderRadius: 12, overflow: 'hidden', position: 'relative',
          backgroundColor: '#000',
        }}>
          {/* Product image — covers top 321px (matches ProductCard3D) */}
          <img
            src={resolve(product.bgImage)}
            alt={product.name}
            style={{
              position: 'absolute', left: 0, right: 0, top: 0,
              width: 277, height: 321, objectFit: 'cover',
            }}
            draggable={false}
          />
          {/* Black frame area below image */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 321, height: 80, backgroundColor: '#000' }} />
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 175, background: 'linear-gradient(to bottom, transparent 0%, black 57.866%)', pointerEvents: 'none' }} />
          {/* Product name */}
          <p style={{
            position: 'absolute', left: 16, bottom: 52,
            fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
            fontSize: 14, fontWeight: 400, textTransform: 'uppercase',
            letterSpacing: '2.8px', lineHeight: '18px',
            color: 'white', maxWidth: 175, margin: 0,
          }}>
            {product.name}
          </p>
          {/* Stars on card */}
          {rating > 0 && (
            <div style={{ position: 'absolute', left: 16, bottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <img
                  key={star}
                  src={resolve(star <= rating ? SHARED.starFilled : SHARED.starEmpty)}
                  alt=""
                  style={{ width: 32, height: 32 }}
                  draggable={false}
                />
              ))}
            </div>
          )}
          {/* Inner border */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 12, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)' }} />
          {/* Success tick overlay */}
          {showSuccess && (
            <div
              style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)',
              }}
            >
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="40" fill="#7EE86B" />
                <circle cx="40" cy="40" r="30" fill="#2AB573" />
                <circle cx="40" cy="40" r="27" fill="#25A86A" />
                <path d="M27 40L36 49L54 31" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* BACK FACE — dark card with mavenshop logo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          willChange: 'transform',
          transform: 'rotateY(180deg)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div style={{
          width: '100%', height: '100%',
          backgroundColor: '#0e0e0e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <img src={resolve(CARD_BACK_LOGO)} alt="mavenshop" style={{ width: 200, height: 'auto' }} draggable={false} />
          <HoloShimmerOverlay />
          <div style={{ position: 'absolute', inset: 0, borderRadius: 16, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }} />
        </div>
      </div>
    </div>
  )
}

/* ─── 3D Product Card with Holographic Border ─── */

function ProductCard3D({ productIndex, expanded, rating, showStarsOnCard, cardStarTargetRef, onIntroComplete, showSuccess, staticSuccess = false, flipToBack = false, skipIntro = false, introDelay = 1000, flipDuration = 800, img: imgFn }) {
  const resolve = imgFn || ((u) => u)
  const product = PRODUCTS[productIndex]
  const [imgLoaded, setImgLoaded] = useState(false)
  const [flipped, setFlipped] = useState(skipIntro) // false = back face showing, true = front face; skipIntro starts front
  const [glowSettled, setGlowSettled] = useState(false)

  const expoOut = 'cubic-bezier(0.16, 1, 0.3, 1)'
  const introPlayed = flipped
  const hasEverFlipped = useRef(false)
  if (flipped) hasEverFlipped.current = true

  // When image loads: show back for 1s, then flip to front
  const introStarted = useRef(false)
  useEffect(() => {
    if (skipIntro || !imgLoaded || introStarted.current) return
    introStarted.current = true
    const t1 = setTimeout(() => setFlipped(true), introDelay)
    const t2 = setTimeout(() => {
      if (onIntroComplete) onIntroComplete()
      setTimeout(() => setGlowSettled(true), 400)
    }, introDelay + flipDuration)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [imgLoaded])

  // Flip back to logo when requested (for exit animation)
  useEffect(() => {
    if (flipToBack) setFlipped(false)
  }, [flipToBack])

  // Card dimensions including holo border padding
  const cardW = 277 + 12 // 6px padding each side
  const cardH = 400 + 12

  // Standard card flip: single flipper rotates, backfaceVisibility hides the hidden face
  const smoothFlip = 'cubic-bezier(0.33, 0, 0.15, 1)' // start quick, settle gently

  return (
    <div
      style={{
        width: cardW,
        height: cardH,
        transform: 'rotate(0deg)',
      }}
    >
    {/* Scene — perspective applied here, affects the flipper child */}
    <div
      style={{
        width: cardW,
        height: cardH,
        perspective: 800,
        opacity: imgLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
    {/* Flipper — rotates as a single unit, preserve-3d so faces work */}
    <div
      style={{
        width: cardW,
        height: cardH,
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
        transition: (flipped || hasEverFlipped.current) ? `transform ${flipDuration}ms ${smoothFlip}` : 'none',
      }}
    >
      {/* ── FRONT FACE ── holographic border + product card */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          background: `
            linear-gradient(
              var(--holo-angle, 0deg),
              hsl(300, 50%, 75%) 0%,
              hsl(240, 55%, 78%) 12%,
              hsl(200, 65%, 78%) 24%,
              hsl(160, 60%, 75%) 36%,
              hsl(120, 50%, 76%) 48%,
              hsl(60, 65%, 78%) 60%,
              hsl(30, 70%, 76%) 72%,
              hsl(350, 55%, 75%) 84%,
              hsl(300, 50%, 75%) 100%
            )
          `,
          animation: 'holoRotate 4s linear infinite',
          padding: 6,
          borderRadius: 16,
          boxShadow: 'none',
          transition: 'box-shadow 1.8s ease-out',
        }}
      >
        <div
          style={{
            width: 277,
            height: 400,
            borderRadius: 12,
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: '#a4c869',
          }}
        >
        {/* Product image — covers top portion (321px of 400px) */}
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#111' }}>
            <Spinner size={24} />
          </div>
        )}
        <img
          src={resolve(product.bgImage)}
          alt={product.name}
          className="absolute left-0 right-0 top-0"
          style={{
            width: 277,
            height: 321,
            objectFit: 'cover',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
          onLoad={() => setImgLoaded(true)}
          draggable={false}
        />

        {/* Black frame area below the image */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: 321,
            height: 80,
            backgroundColor: '#000',
          }}
        />

        {/* Gradient overlay — from transparent to black, 175px tall, bottom-aligned */}
        <div
          className="absolute left-0 right-0 bottom-0 pointer-events-none"
          style={{
            height: 175,
            background: 'linear-gradient(to bottom, transparent 0%, black 57.866%)',
          }}
        />

        {/* Date badge top-left — hidden for now */}

        {/* Product name — LEFT aligned per Figma */}
        <p
          className="absolute pointer-events-none"
          style={{
            left: 16,
            bottom: showStarsOnCard ? 52 : 52,
            fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '2.8px',
            lineHeight: '18px',
            color: 'white',
            maxWidth: 175,
            margin: 0,
            transition: `bottom 0.65s ${expoOut}`,
          }}
        >
          {product.name}
        </p>

        {/* Stars on card — target area (always rendered for positioning, visibility controlled) */}
        <div
          ref={cardStarTargetRef}
          className="absolute flex items-center"
          style={{
            left: 16,
            bottom: 16,
            gap: 6,
            opacity: showStarsOnCard ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <img
              key={star}
              src={star <= rating ? SHARED.starFilled : SHARED.starEmpty}
              alt=""
              style={{ width: 32, height: 32 }}
              draggable={false}
            />
          ))}
        </div>

        {/* ── Shine sweep — plays once after card settles ── */}
        {introPlayed && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ borderRadius: 12 }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0.04) 48%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.04) 52%, rgba(255,255,255,0) 65%, transparent 100%)',
                animation: 'shineSweep 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) -0.4s both',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}

        {/* ── Holographic Shine Overlay (Pokemon-cards style) ── */}
        {/* Rainbow shimmer layer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 12,
            backgroundImage: `
              linear-gradient(
                125deg,
                transparent 10%,
                rgba(255, 30, 30, 0.08) 20%,
                rgba(255, 180, 0, 0.08) 30%,
                rgba(0, 255, 80, 0.08) 40%,
                rgba(0, 120, 255, 0.08) 50%,
                rgba(140, 50, 255, 0.08) 60%,
                rgba(255, 50, 180, 0.08) 70%,
                transparent 90%
              ),
              linear-gradient(
                -60deg,
                transparent 30%,
                rgba(255, 255, 255, 0.03) 45%,
                rgba(255, 255, 255, 0.06) 50%,
                rgba(255, 255, 255, 0.03) 55%,
                transparent 70%
              )
            `,
            backgroundSize: '300% 300%, 250% 250%',
            backgroundBlendMode: 'color-dodge, overlay',
            mixBlendMode: 'overlay',
            opacity: 0.35,
            animation: 'holoShine 6s ease-in-out infinite',
          }}
        />

        {/* Glare / specular highlight overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 12,
            background: `
              radial-gradient(
                ellipse farthest-corner at 70% 30%,
                rgba(255, 255, 255, 0.08) 0%,
                rgba(255, 255, 255, 0.02) 35%,
                transparent 70%
              )
            `,
            mixBlendMode: 'soft-light',
            opacity: 0.3,
            animation: 'holoGlare 6s ease-in-out infinite',
          }}
        />

        {/* Inner border — white inset */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 12,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)',
          }}
        />

        {/* ── Success tick overlay ── */}
        {showSuccess && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              borderRadius: 12,
              backgroundColor: 'rgba(0,0,0,0.55)',
              animation: staticSuccess ? 'none' : 'fullScreenFadeIn 0.3s ease-out both',
            }}
          >
            <div style={{ animation: staticSuccess ? 'none' : 'circleBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both' }}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="40" fill="#7EE86B" />
                <circle cx="40" cy="40" r="30" fill="#2AB573" />
                <circle cx="40" cy="40" r="27" fill="#25A86A" />
                <path
                  d="M27 40L36 49L54 31"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  strokeDasharray={staticSuccess ? undefined : "40"}
                  strokeDashoffset={staticSuccess ? undefined : "40"}
                  style={staticSuccess ? {} : { animation: 'checkDraw 0.35s ease-out 0.4s forwards' }}
                />
              </svg>
            </div>
          </div>
        )}

        </div>
      </div>

      {/* ── BACK FACE ── dark card with mavenshop logo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div style={{
          width: '100%', height: '100%',
          backgroundColor: '#0e0e0e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <img
            src={resolve(CARD_BACK_LOGO)}
            alt="mavenshop"
            style={{ width: 200, height: 'auto' }}
            draggable={false}
          />
          <HoloShimmerOverlay />
          <div style={{ position: 'absolute', inset: 0, borderRadius: 16,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }} />
        </div>
      </div>
    </div>
    </div>
    </div>
  )
}

/* ─── Flying Star (animates from large star position to card) ─── */

function FlyingStar({ star, rating }) {
  const ref = useRef(null)
  const isFilled = star.filled

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    // Use Web Animations API for smooth flight
    el.animate([
      {
        left: `${star.fromX}px`,
        top: `${star.fromY}px`,
        width: `${star.fromSize}px`,
        height: `${star.fromSize}px`,
        offset: 0,
      },
      {
        left: `${star.toX}px`,
        top: `${star.toY}px`,
        width: `${star.toSize}px`,
        height: `${star.toSize}px`,
        offset: 1,
      },
    ], {
      duration: 500,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards',
      delay: star.id * 30, // stagger
    })
  }, [])

  return (
    <img
      ref={ref}
      src={isFilled ? SHARED.starFilled : SHARED.starEmpty}
      alt=""
      draggable={false}
      style={{
        position: 'absolute',
        left: star.fromX,
        top: star.fromY,
        width: star.fromSize,
        height: star.fromSize,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        filter: isFilled ? 'none' : 'none',
      }}
    />
  )
}

/* ─── Splash Animation ─── */

// All splash cards use the real ProductCard3D size (289×412), scaled down via CSS transform
// This guarantees pixel-perfect match when scale(1) = the real card
const CARD_W = 289
const CARD_H = 412

// Fan layout: scale factors relative to full card size
const SPLASH_CARDS = [
  { index: 1, rotate: -15, tx: -70, ty: 10, z: 1, fanScale: 0.53 },   // Golly — left, behind
  { index: 2, rotate: 15.4, tx: 70, ty: 0, z: 2, fanScale: 0.53 },    // Focus+ — right, behind
  { index: 0, rotate: 0, tx: 0, ty: -10, z: 3, fanScale: 0.63 },      // Foxtale — center, front
]

// Exact copy of ProductCard3D front face for splash (pixel-perfect at 289×412)
function SplashCardFront({ product, img: resolve }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backfaceVisibility: 'hidden',
      background: `linear-gradient(
        var(--holo-angle, 0deg),
        hsl(300, 50%, 75%) 0%, hsl(240, 55%, 78%) 12%,
        hsl(200, 65%, 78%) 24%, hsl(160, 60%, 75%) 36%,
        hsl(120, 50%, 76%) 48%, hsl(60, 65%, 78%) 60%,
        hsl(30, 70%, 76%) 72%, hsl(350, 55%, 75%) 84%,
        hsl(300, 50%, 75%) 100%
      )`,
      animation: 'holoRotate 4s linear infinite',
      padding: 6,
      borderRadius: 16,
    }}>
      <div style={{
        width: 277, height: 400, borderRadius: 12, overflow: 'hidden',
        position: 'relative', backgroundColor: '#000',
      }}>
        <img src={resolve(product.bgImage)} alt={product.name}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, width: 277, height: 321, objectFit: 'cover' }}
          draggable={false} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 321, height: 80, backgroundColor: '#000' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 175,
          background: 'linear-gradient(to bottom, transparent 0%, black 57.866%)', pointerEvents: 'none' }} />
        <p style={{
          position: 'absolute', left: 16, bottom: 52,
          fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
          fontSize: 14, fontWeight: 400, textTransform: 'uppercase',
          letterSpacing: '2.8px', lineHeight: '18px',
          color: 'white', maxWidth: 175, margin: 0,
        }}>
          {product.name}
        </p>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 12, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)' }} />
      </div>
    </div>
  )
}

// Exact copy of ProductCard3D back face for splash
function SplashCardBack({ img: resolve }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backfaceVisibility: 'hidden',
      transform: 'rotateY(180deg)',
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      <div style={{
        width: '100%', height: '100%',
        backgroundColor: '#0e0e0e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <img src={resolve(CARD_BACK_LOGO)} alt="mavenshop"
          style={{ width: 200, height: 'auto' }} draggable={false} />
        <HoloShimmerOverlay />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }} />
      </div>
    </div>
  )
}

function SplashAnimation({ img, onComplete }) {
  const [phase, setPhase] = useState('initial') // 'initial' → 'fan' → 'hold' → 'flip' → 'done'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fan'), 100)
    const t2 = setTimeout(() => setPhase('hold'), 900)
    const t3 = setTimeout(() => setPhase('flip'), 1400)
    const t4 = setTimeout(() => {
      setPhase('done')
      onComplete()
    }, 2500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  const isFan = phase === 'fan' || phase === 'hold' || phase === 'flip' || phase === 'done'
  const isFlip = phase === 'flip' || phase === 'done'

  // The 2-degree tilt matching ProductCard3D
  const tilt = 'rotate(0deg)'

  return (
    // Container matches ProductCard3D dimensions — sits in exact card position
    <div style={{
      width: CARD_W, height: CARD_H,
      position: 'relative',
      transform: tilt,
    }}>
      {SPLASH_CARDS.map((card, i) => {
        const product = PRODUCTS[card.index]
        const isTopCard = i === 2

        const fadeOut = isFlip && !isTopCard
        const doFlip = isFlip && isTopCard

        // Fan: scaled down + rotated + offset from center
        // Side cards fly off-screen during flip phase
        const flyOffX = card.tx < 0 ? '-200%' : '200%'

        const fanTransform = `translate(${card.tx}px, ${card.ty}px) rotate(${card.rotate}deg) scale(${card.fanScale})`
        const flyOffTransform = `translate(${flyOffX}, ${card.ty}px) rotate(${card.rotate * 2}deg) scale(${card.fanScale})`
        const fullTransform = 'translate(0px, 0px) rotate(0deg) scale(1)'
        const initialTransform = 'translate(0px, 0px) rotate(0deg) scale(0.15)'

        let currentTransform
        if (!isFan) {
          currentTransform = initialTransform
        } else if (isTopCard) {
          currentTransform = doFlip ? fullTransform : fanTransform
        } else {
          currentTransform = isFlip ? flyOffTransform : fanTransform
        }

        return (
          <div
            key={card.index}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: CARD_W,
              height: CARD_H,
              zIndex: card.z,
              transform: currentTransform,
              opacity: phase === 'initial' ? 0 : (fadeOut ? 0 : 1),
              transition: doFlip
                ? 'transform 0.9s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease'
                : isFlip && !isTopCard
                  ? 'transform 0.7s cubic-bezier(0.45, 0, 0.15, 1), opacity 0.4s ease 0.15s'
                  : 'transform 0.7s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.4s ease',
              perspective: isTopCard ? 1200 : 'none',
            }}
          >
            {isTopCard ? (
              /* Top card — exact ProductCard3D with front + back, does 360° flip */
              <div style={{
                width: CARD_W, height: CARD_H,
                position: 'relative',
                transformStyle: 'preserve-3d',
                transform: doFlip ? 'rotateY(360deg)' : 'rotateY(0deg)',
                transition: doFlip ? 'transform 0.9s cubic-bezier(0.33, 0, 0.15, 1)' : 'none',
              }}>
                <SplashCardFront product={product} img={img} />
                <SplashCardBack img={img} />
              </div>
            ) : (
              /* Side cards — simplified: just product image with border, no holo/text */
              <div style={{
                width: '100%', height: '100%', position: 'relative',
                borderRadius: 16, overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 0 60px rgba(0,0,0,0.85)',
                backgroundColor: '#000',
              }}>
                <img src={img(product.bgImage)} alt={product.name}
                  style={{ width: '100%', height: '78%', objectFit: 'cover' }} draggable={false} />
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%',
                  background: 'linear-gradient(to bottom, transparent 0%, black 58%)', pointerEvents: 'none' }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Reviewed Product View ─── */

function ReviewedProductView({ review, photos, img, theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '8px 24px 16px' }}>
      {/* "Thank you for your review" text */}
      <p style={{
        fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
        fontSize: 18, fontWeight: 400, lineHeight: '24px',
        color: theme.text, textAlign: 'center',
        margin: 0,
      }}>
        Thank you for your review
      </p>

      {/* Photo thumbnails row */}
      {photos && photos.length > 0 && (
        <div style={{ display: 'flex', gap: 16, width: '100%', justifyContent: 'center' }}>
          {photos.map((_, i) => (
            <div key={i} style={{
              width: 87, height: 87, borderRadius: 12, overflow: 'hidden',
              border: `1px solid ${theme.border}`, position: 'relative',
              backgroundColor: theme.inputBg,
            }}>
              <img src={img(SHARED.sampleThumb)} alt="" style={{ width: '100%', height: 148, objectFit: 'cover', marginTop: -21 }} />
              {i >= 1 && (
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 0, height: 0,
                    borderLeft: '14px solid white',
                    borderTop: '10px solid transparent',
                    borderBottom: '10px solid transparent',
                    marginLeft: 4,
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review text */}
      {review && (
        <p style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14, fontWeight: 400, lineHeight: '20px',
          letterSpacing: '-0.18px',
          color: theme.textHigh, textAlign: 'center',
          width: '100%',
          margin: 0,
        }}>
          {review}
        </p>
      )}
    </div>
  )
}

/* ─── Main App ─── */

export default function App() {
  const [step, setStep] = useState(0) // 0=initial, 1=rated, 2=expanded, 3=photos, 'submitted', 'reviewed'
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [photos, setPhotos] = useState([])
  const [productIndex, setProductIndex] = useState(0)
  const [slideDir, setSlideDir] = useState(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [finalStage, setFinalStage] = useState(null)
  const [flipped, setFlipped] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [productRatings, setProductRatings] = useState({}) // { productIndex: rating }
  const [productReviews, setProductReviews] = useState({}) // { productIndex: { rating, review, photos } }
  // Product grid (skip flow) states
  const [showProductGrid, setShowProductGrid] = useState(false)
  const [gridPhase, setGridPhase] = useState('hidden') // 'hidden' | 'stacked' | 'spreading' | 'visible'
  const [gridZooming, setGridZooming] = useState(null) // index of zooming card
  const [gridZoomStage, setGridZoomStage] = useState(0) // 0=none, 1=expanding, 2=done
  const [risingStarsKey, setRisingStarsKey] = useState(0) // increment to re-trigger rising stars
  const [flyingStars, setFlyingStars] = useState(null) // array of {id, fromX, fromY, toX, toY} for flying animation
  const [appLoading, setAppLoading] = useState(true) // show spinner before flow starts
  const [splashPhase, setSplashPhase] = useState('loading') // 'loading' → 'splash' → 'done'
  const [cardIntroComplete, setCardIntroComplete] = useState(false) // true after flip animation ends
  const [cardSuccess, setCardSuccess] = useState(false) // true when showing tick on card after submit
  const [themeMode, setThemeMode] = useState('dark')
  const theme = THEMES[themeMode]
  const [cardTransition, setCardTransition] = useState(null) // null | { fromIndex, toIndex, phase }
  const [skipNextIntro, setSkipNextIntro] = useState(false) // true after carousel transition so ProductCard3D starts face-up
  const inputRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const inputRowRef = useRef(null)
  const largeStarRefs = useRef([]) // refs to the 5 large star elements
  const cardStarTargetRef = useRef(null) // ref to star target area on card
  const containerRef = useRef(null) // main container for positioning
  const submitBtnRef = useRef(null) // ref to submit button for auto-scroll
  const touchStartRef = useRef(null)
  const touchEndRef = useRef(null)

  const product = PRODUCTS[productIndex]
  const isExpanded = step >= 2 && step !== 'submitted' && step !== 'reviewed'
  const isSubmitted = step === 'submitted'

  // Swipe touch handlers
  const handleTouchStart = (e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    touchEndRef.current = null
  }

  const handleTouchMove = (e) => {
    touchEndRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return
    const dx = touchEndRef.current.x - touchStartRef.current.x
    const dy = touchEndRef.current.y - touchStartRef.current.y

    // Only trigger if horizontal swipe is dominant and exceeds threshold
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      // Don't swipe during animations, splash, expanded form, final stage
      if (splashPhase === 'splash' || cardTransition || !cardIntroComplete || finalStage || isSubmitted) return
      // Don't swipe while in expanded review form
      if (isExpanded) return

      const direction = dx < 0 ? 'left' : 'right' // swipe left = next, swipe right = prev
      const targetIndex = direction === 'left'
        ? (productIndex + 1) % PRODUCTS.length
        : (productIndex - 1 + PRODUCTS.length) % PRODUCTS.length

      triggerSwipeTransition(productIndex, targetIndex, direction)
    }
    touchStartRef.current = null
    touchEndRef.current = null
  }

  const triggerSwipeTransition = (fromIndex, toIndex, direction) => {
    setCardSuccess(step === 'reviewed' || cardSuccess) // keep tick if coming from reviewed state
    setCardIntroComplete(false)
    setCardTransition({ fromIndex, toIndex, phase: 'setup', direction })

    setTimeout(() => {
      setCardTransition(null)
      setCardSuccess(false)
      setSkipNextIntro(true)
      setProductIndex(toIndex)

      // Check if target product was already reviewed
      if (productReviews[toIndex]) {
        setStep('reviewed')
        setRating(productReviews[toIndex].rating)
        setReview(productReviews[toIndex].review || '')
        setPhotos(productReviews[toIndex].photos || [])
        // Reviewed cards don't need intro delay — show content immediately
        setCardIntroComplete(true)
        // Reset skipNextIntro after component mounts with skipIntro=true
        setTimeout(() => setSkipNextIntro(false), 50)
      } else {
        setStep(0)
        setRating(0)
        setReview('')
        setPhotos([])

        setTimeout(() => {
          setCardIntroComplete(true)
          setSkipNextIntro(false)
        }, 200)
      }
    }, CARD_TRANSITION_DURATION + 100)
  }

  // Preload all assets as blob URLs for instant access (Figma MCP URLs don't cache well)
  const [imageCache, setImageCache] = useState({})
  useEffect(() => {
    const urls = [
      SHARED.mavenLogo,
      SHARED.starFilled,
      SHARED.starEmpty,
      SHARED.razorpayLogo,
      SHARED.sampleThumb,
      CARD_BACK_LOGO,
      UPLOAD_ASSETS.illustrationSmall,
      UPLOAD_ASSETS.illustrationLarge,
      UPLOAD_ASSETS.plusIcon,
      UPLOAD_ASSETS.micIcon,
      ...PRODUCTS.map(p => p.bgImage),
      ...PRODUCTS.map(p => p.cardImage),
    ]
    const cache = {}
    Promise.all(urls.map(url =>
      fetch(url)
        .then(r => r.blob())
        .then(blob => { cache[url] = URL.createObjectURL(blob) })
        .catch(() => { cache[url] = url }) // fallback to original URL on CORS error
    )).then(() => {
      setImageCache(cache)
      setAppLoading(false)
      setSplashPhase('splash')
    })
  }, [])

  // Update body/root background on theme change
  useEffect(() => {
    document.body.style.background = theme.bodyBg
    document.getElementById('root').style.background = theme.bodyBg
  }, [themeMode])

  // Helper to get cached blob URL (falls back to original)
  const img = useCallback((url) => imageCache[url] || url, [imageCache])

  // Auto-scroll to make Submit CTA visible when review section expands
  useEffect(() => {
    if (step === 2 && submitBtnRef.current) {
      // Wait for the grid-template-rows transition to expand
      setTimeout(() => {
        submitBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 700)
    }
  }, [step])

  // Carousel transition: setup → go phase (ensures entering card renders off-screen before animating)
  useEffect(() => {
    if (cardTransition?.phase === 'setup') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCardTransition(prev => prev ? { ...prev, phase: 'go' } : null)
        })
      })
    }
  }, [cardTransition?.phase])

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
    haptics.trigger('nudge')
    setRating(star)
    setProductRatings(prev => ({ ...prev, [productIndex]: star }))
    // Trigger rising star particles on 3+ stars
    if (star >= 3) {
      setRisingStarsKey(k => k + 1)
    }
    if (step === 0) {
      setStep(1)

      // Calculate flying star positions after a brief bounce delay
      setTimeout(() => {
        const container = containerRef.current
        if (!container) { setStep(2); return }
        const containerRect = container.getBoundingClientRect()
        const targetEl = cardStarTargetRef.current

        // Get target positions from the actual star images inside the target container
        let targetStarPositions = []
        if (targetEl) {
          const targetImgs = targetEl.querySelectorAll('img')
          targetImgs.forEach((img, i) => {
            const r = img.getBoundingClientRect()
            targetStarPositions.push({
              x: r.left - containerRect.left + r.width / 2,
              y: r.top - containerRect.top + r.height / 2,
            })
          })
        }

        // Get source positions (large stars)
        const stars = []
        for (let i = 0; i < 5; i++) {
          const el = largeStarRefs.current[i]
          if (!el) continue
          const rect = el.getBoundingClientRect()
          const isFilled = i < star
          stars.push({
            id: i,
            filled: isFilled,
            fromX: rect.left - containerRect.left + rect.width / 2,
            fromY: rect.top - containerRect.top + rect.height / 2,
            toX: targetStarPositions[i]?.x || rect.left - containerRect.left + rect.width / 2,
            toY: targetStarPositions[i]?.y || rect.top - containerRect.top,
            fromSize: 56,
            toSize: 32,
          })
        }

        setFlyingStars(stars)

        // After stars land, expand
        setTimeout(() => {
          setStep(2)
          // Clear flying stars after card stars become visible
          setTimeout(() => setFlyingStars(null), 300)
        }, 550)
      }, 350) // wait for bounce animation to peak
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

  const handleSubmit = () => {
    haptics.trigger('success')
    // Save review data for this product
    setProductReviews(prev => ({
      ...prev,
      [productIndex]: { rating, review, photos: [...photos] }
    }))

    const newCount = reviewCount + 1
    setReviewCount(newCount)

    if (newCount >= PRODUCTS.length) {
      // Final review — full screen success
      setStep('submitted')
      setTimeout(() => {
        setFinalStage('expanding')
        setTimeout(() => setFlipped(true), 2000)
      }, 800)
    } else {
      // Individual review — tick on card, then carousel flip+slide to next
      setStep(1)
      setCardSuccess(true)
      setCardIntroComplete(false)

      // After tick shows for 1s, start carousel transition
      setTimeout(() => {
        const currentIndex = productIndex
        const nextIndex = (currentIndex + 1) % PRODUCTS.length

        // Start carousel transition (TransitionCards take over from ProductCard3D)
        // Keep cardSuccess=true so tick persists on exiting card during transition
        setCardTransition({ fromIndex: currentIndex, toIndex: nextIndex, phase: 'setup', direction: 'left' })

        // After animation: swap back to real ProductCard3D
        setTimeout(() => {
          setCardTransition(null)
          setCardSuccess(false)
          setSkipNextIntro(true)
          setProductIndex(nextIndex)
          setStep(0)
          setRating(0)
          setReview('')
          setPhotos([])

          // After ProductCard3D mounts face-up, trigger stars bounce
          setTimeout(() => {
            setCardIntroComplete(true)
            setSkipNextIntro(false)
          }, 200)
        }, CARD_TRANSITION_DURATION + 100)
      }, 1000)
    }
  }

  const expoOut = 'cubic-bezier(0.16, 1, 0.3, 1)'

  // Determine if we're in the main 3D card flow (not product grid, not submitted/final)
  const showCardFlow = !showProductGrid && !isSubmitted && !finalStage
  const isReviewed = step === 'reviewed'

  // Loading screen
  if (appLoading) {
    return (
      <ThemeContext.Provider value={theme}>
        <div className="relative w-full h-[100dvh] max-w-[520px] mx-auto flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
          <div className="flex flex-col items-center gap-6">
            <Spinner size={32} />
          </div>
        </div>
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={theme}>
    <div ref={containerRef} className="relative w-full h-[100dvh] max-w-[520px] mx-auto overflow-hidden flex flex-col" style={{ backgroundColor: theme.bg, transition: 'background-color 0.3s ease' }}>

      {/* ── Theme toggle button ── */}
      <ThemeToggle mode={themeMode} onToggle={() => setThemeMode(m => m === 'dark' ? 'light' : 'dark')} />

      {/* ── Ambient particles — always behind everything, boost on 3+ rating ── */}
      <FloatingParticles count={700} colors={theme.particleColors} boostTrigger={risingStarsKey} />

      {/* ── 3D Card Flow (states 0, 1, 2) — also renders splash ── */}
      {showCardFlow && (
        <div
          className="flex-1 flex flex-col items-center relative z-10"
          style={{
            overflow: (isExpanded && !cardSuccess && !cardTransition && splashPhase !== 'splash') ? 'auto' : 'visible',
            scrollbarWidth: 'none',
          }}
        >
          {/* mavenshop logo at top + temp nav handles */}
          <div className="shrink-0 flex justify-center items-center" style={{
            padding: '20px 0 0',
            opacity: splashPhase === 'splash' ? 0 : 1,
            transition: 'opacity 0.4s ease',
            position: 'relative',
          }}>
            {/* Temp nav handle — prev */}
            <button
              onClick={() => {
                if (splashPhase === 'splash' || cardTransition || !cardIntroComplete || finalStage || isSubmitted || isExpanded) return
                const target = (productIndex - 1 + PRODUCTS.length) % PRODUCTS.length
                triggerSwipeTransition(productIndex, target, 'right')
              }}
              style={{
                width: 24, height: 24, borderRadius: '50%', border: `1px solid ${theme.border}`,
                background: 'transparent', color: theme.textMuted, fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'absolute', left: 16, top: 20,
                opacity: (splashPhase === 'splash' || cardTransition || !cardIntroComplete || finalStage || isSubmitted || isExpanded) ? 0.3 : 0.7,
              }}
              aria-label="Previous product"
            >‹</button>

            <img src={img(SHARED.mavenLogo)} alt="mavenshop" className="h-6" />

            {/* Temp nav handle — next */}
            <button
              onClick={() => {
                if (splashPhase === 'splash' || cardTransition || !cardIntroComplete || finalStage || isSubmitted || isExpanded) return
                const target = (productIndex + 1) % PRODUCTS.length
                triggerSwipeTransition(productIndex, target, 'left')
              }}
              style={{
                width: 24, height: 24, borderRadius: '50%', border: `1px solid ${theme.border}`,
                background: 'transparent', color: theme.textMuted, fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'absolute', right: 16, top: 20,
                opacity: (splashPhase === 'splash' || cardTransition || !cardIntroComplete || finalStage || isSubmitted || isExpanded) ? 0.3 : 0.7,
              }}
              aria-label="Next product"
            >›</button>
          </div>

          {/* 3D Card — centered when state 0/1, moves to top when state 2 */}
          <div
            className="shrink-0 flex justify-center"
            style={{
              marginTop: (isExpanded && !cardSuccess && !cardTransition) ? 16 : 'auto',
              marginBottom: isExpanded ? 0 : 0,
              transition: `margin-top 0.65s ${expoOut}`,
              position: 'relative',
              overflow: splashPhase === 'splash' ? 'visible' : undefined,
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {splashPhase === 'splash' ? (
              /* ── Splash Animation — renders inside card flow for exact positioning ── */
              <SplashAnimation
                img={img}
                onComplete={() => {
                  setSplashPhase('done')
                  setSkipNextIntro(true)
                  setCardIntroComplete(true)
                  setTimeout(() => setSkipNextIntro(false), 100)
                }}
              />
            ) : cardTransition ? (
              /* ── Carousel transition: two simple flip cards ── */
              <div style={{ position: 'relative', width: 289, height: 412, transform: 'rotate(0deg)' }}>
                {/* Exiting card container — slides out based on direction */}
                <div
                  key={`exit-${cardTransition.fromIndex}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 2,
                    transform: cardTransition.phase === 'go'
                      ? (cardTransition.direction === 'right' ? 'translateX(120%)' : 'translateX(-120%)')
                      : 'translateX(0)',
                    transition: cardTransition.phase === 'go'
                      ? `transform ${CARD_TRANSITION_DURATION}ms cubic-bezier(0.45, 0, 0.15, 1)`
                      : 'none',
                    perspective: 1200,
                  }}
                >
                  <TransitionCard
                    product={PRODUCTS[cardTransition.fromIndex]}
                    flipped={cardTransition.phase === 'go'}
                    duration={CARD_TRANSITION_DURATION}
                    img={img}
                    showSuccess={cardSuccess}
                    rating={productRatings[cardTransition.fromIndex] || 0}
                  />
                </div>

                {/* Entering card container — slides in from opposite side */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: cardTransition.phase === 'go'
                      ? 'translateX(0)'
                      : (cardTransition.direction === 'right' ? 'translateX(-120%)' : 'translateX(120%)'),
                    transition: cardTransition.phase === 'go'
                      ? `transform ${CARD_TRANSITION_DURATION}ms cubic-bezier(0.45, 0, 0.15, 1)`
                      : 'none',
                    perspective: 1200,
                  }}
                >
                  <TransitionCard
                    product={PRODUCTS[cardTransition.toIndex]}
                    flipped={cardTransition.phase !== 'go'}
                    duration={cardTransition.phase === 'setup' ? 0 : CARD_TRANSITION_DURATION}
                    img={img}
                    showSuccess={!!productReviews[cardTransition.toIndex]}
                    rating={productReviews[cardTransition.toIndex]?.rating || 0}
                  />
                </div>
              </div>
            ) : (
              /* ── Normal ProductCard3D ── */
              <ProductCard3D
                key={productIndex}
                productIndex={productIndex}
                skipIntro={skipNextIntro}
                expanded={isExpanded && !cardSuccess}
                rating={rating}
                showStarsOnCard={(isExpanded && !cardSuccess) || cardSuccess || isReviewed}
                cardStarTargetRef={cardStarTargetRef}
                onIntroComplete={() => setCardIntroComplete(true)}
                showSuccess={cardSuccess || isReviewed}
                staticSuccess={isReviewed && !cardSuccess}
                img={img}
              />
            )}
          </div>

          {/* Below-card content: rating question + stars (state 0/1) OR review form (state 2) OR reviewed state */}
          <div className="shrink-0 self-stretch flex flex-col items-center" style={{
            marginTop: (isExpanded && !cardSuccess) ? 0 : 'auto',
            marginBottom: 0,
            paddingBottom: isExpanded ? 0 : 16,
            opacity: (cardSuccess || (cardTransition && !isReviewed) || splashPhase === 'splash') ? 0 : 1,
            transition: 'opacity 0.3s ease',
            pointerEvents: (cardSuccess || cardTransition || splashPhase === 'splash') ? 'none' : 'auto',
          }}>
            {/* Reviewed state — always render to prevent layout shift, control visibility with opacity */}
            {/* minHeight matches unrated block (text 20+24 + gap 12 + stars 56 + gap 12 + cta 16+18 + padding 16 ≈ 174) */}
            {isReviewed && (
              <div style={{
                opacity: cardIntroComplete ? 1 : 0,
                transition: 'opacity 0.3s ease',
                minHeight: 174,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}>
                <ReviewedProductView review={review} photos={photos} img={img} theme={theme} />
              </div>
            )}

            {/* "How would you rate" + large stars — appear after card intro, hidden in state 2 and reviewed */}
            <div
              className="flex flex-col items-center"
              style={{
                gap: 12,
                opacity: (isExpanded || isReviewed || flyingStars) ? 0 : (cardIntroComplete ? 1 : 0),
                maxHeight: (isExpanded || isReviewed) ? 0 : 200,
                overflow: 'hidden',
                transition: flyingStars ? 'opacity 0.25s ease' : `opacity 0.35s ease, max-height 0.65s ${expoOut}`,
                pointerEvents: (isExpanded || isReviewed || !cardIntroComplete) ? 'none' : 'auto',
              }}
            >
              <p
                className="text-center whitespace-nowrap"
                style={{
                  fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: '24px',
                  marginTop: 20,
                  color: theme.text,
                  animation: cardIntroComplete ? 'fadeSlideUp 0.5s ease-out both' : 'none',
                }}
              >
                How would you rate this product?
              </p>
              <StarRating rating={rating} onRate={handleRate} size={56} bounceKey={productIndex} starRefs={largeStarRefs} introReveal={cardIntroComplete && step === 0 && rating === 0} />

              {/* Ask me later link */}
              <button
                onClick={handleSkip}
                className="font-medium bg-transparent border-0 cursor-pointer"
                style={{
                  fontSize: 12, marginTop: 16,
                  color: theme.textMuted,
                  animation: cardIntroComplete ? 'fadeSlideUp 0.4s ease-out 0.3s both' : 'none',
                }}
              >
                Ask me later
              </button>
            </div>

            {/* Review section (state 2) — slides up */}
            <div
              className="self-stretch"
              style={{
                display: 'grid',
                gridTemplateRows: isExpanded ? '1fr' : '0fr',
                opacity: isExpanded ? 1 : 0,
                transition: `grid-template-rows 0.65s ${expoOut}, opacity 0.4s ${expoOut} 0.1s`,
              }}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col items-center" style={{ paddingTop: 24, paddingLeft: 24, paddingRight: 24, gap: 16 }}>
                  {/* "Give a review" text */}
                  <p
                    className="text-center w-full"
                    style={{
                      fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
                      fontSize: 18,
                      fontWeight: 400,
                      lineHeight: '24px',
                      color: theme.text,
                    }}
                  >
                    Give a review
                  </p>

                  {/* Compact upload row */}
                  <button
                    onClick={handleAddPhotos}
                    className="w-full border border-dashed flex items-center justify-center cursor-pointer"
                    style={{
                      paddingTop: 16,
                      paddingBottom: 16,
                      paddingLeft: 20,
                      paddingRight: 20,
                      backgroundColor: theme.uploadBg,
                      borderColor: theme.uploadBorder,
                      borderRadius: 8,
                      gap: 12,
                      boxSizing: 'border-box',
                    }}
                  >
                    <img
                      src={UPLOAD_ASSETS.illustrationSmall}
                      alt=""
                      style={{ width: 43, height: 33 }}
                      draggable={false}
                    />
                    <div className="flex items-center" style={{ gap: 4, color: theme.text }}>
                      <img src={UPLOAD_ASSETS.plusIcon} alt="" style={{ width: 11, height: 11 }} draggable={false} />
                      <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.18px', lineHeight: '20px', fontFamily: 'Inter, system-ui, sans-serif' }}>Add photos &amp; videos</span>
                    </div>
                  </button>

                  {/* Photo thumbnails — show when photos added */}
                  {photos.length > 0 && (
                    <div className="flex gap-4 shrink-0 overflow-x-auto w-full" style={{ scrollbarWidth: 'none' }}>
                      {photos.map((_, i) => (
                        <PhotoThumbnail key={i} index={i} onRemove={() => handleRemovePhoto(i)} />
                      ))}
                    </div>
                  )}

                  {/* TextArea with mic button inside */}
                  <div className="w-full relative" ref={inputRowRef} style={{ height: 100 }}>
                    <textarea
                      ref={inputRef}
                      placeholder="Write your review"
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className={`w-full outline-none resize-none ${theme.textareaClass}`}
                      style={{
                        height: 100,
                        padding: '8px 12px',
                        paddingRight: 48,
                        fontSize: 16,
                        lineHeight: '24px',
                        letterSpacing: '-0.53px',
                        backgroundColor: theme.inputBg,
                        color: theme.text,
                        border: `1px solid ${theme.inputBorder}`,
                        borderRadius: 8,
                        fontFamily: 'Inter, system-ui, sans-serif',
                      }}
                    />
                    {/* Mic button inside textarea — bottom right */}
                    <button
                      className="absolute flex items-center justify-center cursor-pointer"
                      style={{
                        bottom: 8,
                        right: 8,
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: `1px solid ${theme.inputBorder}`,
                        backgroundColor: 'transparent',
                        padding: 0,
                      }}
                    >
                      <img src={UPLOAD_ASSETS.micIcon} alt="mic" style={{ width: 16, height: 16 }} draggable={false} />
                    </button>
                  </div>

                  {/* Submit button — white bg, black text */}
                  <button
                    ref={submitBtnRef}
                    onClick={handleSubmit}
                    className="w-full h-12 shrink-0 font-semibold text-base cursor-pointer border-0 transition-colors"
                    style={{
                      marginBottom: 16,
                      backgroundColor: theme.submitBg,
                      color: theme.submitText,
                      borderRadius: 12,
                    }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* ── Success / Submitted card ── */}
      {(isSubmitted || finalStage) && (
        <div
          className="shrink-0 self-stretch overflow-hidden flex flex-col items-center justify-center z-10"
          style={{
            margin: finalStage ? 0 : '0 16px',
            backgroundColor: finalStage ? '#009e5c' : 'white',
            borderRadius: finalStage ? 0 : '16px',
            flex: finalStage ? '1 1 0%' : '0 0 auto',
            transition: `margin 0.6s ${expoOut}, background-color 0.7s ${expoOut}, border-radius 0.6s ${expoOut}, flex 0.6s ${expoOut}`,
          }}
        >
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
        </div>
      )}

      {/* ── Powered by Razorpay ── */}
      <div
        className="shrink-0 overflow-hidden flex items-center justify-center z-10"
        style={{
          opacity: (finalStage || showProductGrid || splashPhase === 'splash') ? 0 : 1,
          maxHeight: (finalStage || showProductGrid || splashPhase === 'splash') ? '0px' : '39px',
          padding: (finalStage || showProductGrid || splashPhase === 'splash') ? 0 : '12px 10px',
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
      {/* Flying stars overlay — stars animate from large position to card */}
      {flyingStars && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 60 }}>
          {flyingStars.map((s) => (
            <FlyingStar key={s.id} star={s} rating={rating} />
          ))}
        </div>
      )}

      {gridZoomStage >= 1 && gridZooming !== null && (
        <div
          className="absolute inset-0 z-50 overflow-hidden"
          style={{
            backgroundColor: theme.zoomOverlay,
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
              background: theme.zoomGradient,
              opacity: gridZoomStage >= 1 ? 1 : 0,
              transition: 'opacity 0.4s ease 0.2s',
            }}
          />

          {/* Product name */}
          <p
            className="absolute bottom-[12px] left-0 right-0 text-center text-lg whitespace-nowrap px-4 z-10"
            style={{
              fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
              color: theme.textHigh,
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
    </ThemeContext.Provider>
  )
}
