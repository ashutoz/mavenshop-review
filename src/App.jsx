import { useState, useRef, useCallback, useEffect } from 'react'

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
  },
  {
    name: 'Marvenshop Focus PineLIne SPF 50 PA',
    bgImage: 'https://www.figma.com/api/mcp/asset/3644aeba-35bc-4554-8e24-d718d07d661f',
    productImage: 'https://www.figma.com/api/mcp/asset/3644aeba-35bc-4554-8e24-d718d07d661f',
  },
]

// Intro splash card images
const INTRO_CARDS = {
  front: 'https://www.figma.com/api/mcp/asset/696a2a57-b5fd-47f4-9f23-eacf0c7cc496',
  back: 'https://www.figma.com/api/mcp/asset/41b5310c-388c-4c69-bc7f-1c003881c846',
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
  // Stage 0: Two small cards overlapping (Figma keyframe 1)
  // Stage 1: Full final layout — product fills top, full rating card (Figma keyframe 3)

  // Preload intro card images
  const imagesLoaded = useImagePreloader([
    INTRO_CARDS.front,
    INTRO_CARDS.back,
    PRODUCTS[0].bgImage,
  ])

  useEffect(() => {
    if (!imagesLoaded) return
    const t1 = setTimeout(() => setStage(1), 1000)
    const t2 = setTimeout(() => onComplete(), 1900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onComplete, imagesLoaded])

  // Motion curves
  const expoOut = 'cubic-bezier(0.16, 1, 0.3, 1)'      // fast start, gentle settle — for the hero card expanding
  const easeInQuart = 'cubic-bezier(0.5, 0, 0.75, 0)'   // accelerating exit — back card being pushed away
  const springy = 'cubic-bezier(0.34, 1.4, 0.64, 1)'    // slight overshoot — rating card popping into place
  const softOut = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // gentle fade — gradient & name

  // Card 1 (front product) — expo ease-out for cinematic zoom-in feel
  const card1Style = {
    position: 'absolute',
    overflow: 'hidden',
    transition: `width 0.7s ${expoOut}, height 0.7s ${expoOut}, left 0.7s ${expoOut}, top 0.7s ${expoOut}, border-radius 0.5s ${expoOut}, border-color 0.4s ease, box-shadow 0.4s ease`,
    zIndex: 2,
    ...(stage === 0 ? {
      width: '49%', height: '32%',
      left: '17%', top: '25%',
      border: '2px solid rgba(255,255,255,0.2)',
      borderRadius: 20,
      boxShadow: '0 0 60px rgba(0,0,0,0.85)',
    } : {
      width: '100%', height: '57%',
      left: 0, top: 0,
      border: '2px solid rgba(255,255,255,0)',
      borderRadius: 0,
      boxShadow: '0 0 60px rgba(0,0,0,0)',
    }),
  }

  // Card 2 (back product) — accelerating exit, feels like it's pushed away by the front card
  const card2Style = {
    position: 'absolute',
    overflow: 'hidden',
    transition: `left 0.3s ${easeInQuart}, opacity 0.3s ${easeInQuart}`,
    zIndex: 1,
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: 20,
    boxShadow: '0 0 60px rgba(0,0,0,0.85)',
    width: '49%', height: '32%',
    top: '29%',
    ...(stage === 0 ? {
      left: '37%',
      opacity: 1,
    } : {
      left: '110%',
      opacity: 0,
    }),
  }

  // Gradient — soft fade-in, slightly delayed to let the card expand first
  const gradientStyle = {
    position: 'absolute',
    bottom: -9, left: '50%', transform: 'translateX(-50%)',
    width: 469, height: 144,
    background: 'linear-gradient(180deg, transparent 1%, rgba(5,5,5,0.95) 72%)',
    filter: 'blur(5.5px)',
    pointerEvents: 'none',
    zIndex: 3,
    opacity: stage >= 1 ? 1 : 0,
    transition: `opacity 0.5s ${softOut}`,
    transitionDelay: stage >= 1 ? '0.15s' : '0s',
  }

  // Product name — soft ease-out, slightly delayed
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
    transitionDelay: stage >= 1 ? '0.1s' : '0s',
    ...(stage === 0 ? {
      top: 'calc(25% + 32%)',
      opacity: 0,
    } : {
      top: 'calc(57% - 34px)',
      opacity: 1,
    }),
  }

  // Rating card — springy overshoot, slightly delayed so it follows the card expansion
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
    transitionDelay: stage >= 1 ? '0.1s' : '0s',
    ...(stage === 0 ? {
      top: '110%',
      opacity: 0,
    } : {
      top: '57%',
      opacity: 1,
    }),
  }

  const contentBlur = 0

  // Show spinner until images are loaded
  if (!imagesLoaded) {
    return (
      <div className="absolute inset-0 bg-[#010101] z-50 flex items-center justify-center">
                <Spinner size={32} color="rgba(255,255,255,0.9)" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-[#010101] z-50 overflow-hidden">
            {/* Card 1 (front) */}
      <div style={card1Style}>
        <img
          src={stage === 0 ? INTRO_CARDS.front : PRODUCTS[0].bgImage}
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Gradient inside card 1 */}
        <div style={gradientStyle} />
        {/* Product name inside card 1 so it moves with it */}
      </div>

      {/* Card 2 (back) */}
      <div style={card2Style}>
        <img src={INTRO_CARDS.back} alt="" className="w-full h-full object-cover" />
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
                  animation: stage >= 1 ? `starAttention 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.55 + i * 0.07}s both` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Skip */}
        <div style={{ marginTop: 72, paddingBottom: 20 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.8)' }}>Skip</span>
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
    if (step === 0) {
      setStep(1)
      setTimeout(() => setStep(2), 600)
    }
  }

  const handleSkip = () => {
    goToNextProduct()
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

      {/* ── Intro Splash ── */}
      {showIntro && <IntroSplash onComplete={handleIntroComplete} />}

      {/* ── Asset area — flex:1, fills remaining space ── */}
      <div
        className="overflow-hidden relative"
        style={{
          flex: finalStage ? '0 0 0px' : '1 1 0%',
          minHeight: finalStage ? 0 : (isTyping ? 120 : 0),
          transition: 'flex 0.5s cubic-bezier(0.4, 0, 0.2, 1), min-height 0.3s ease',
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
          className="absolute bottom-[-9px] left-1/2 -translate-x-1/2 w-[469px] h-[144px] pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 1%, rgba(5,5,5,0.95) 72%)',
            filter: 'blur(5.5px)',
          }}
        />

        {/* Product name */}
        <p
          className="absolute bottom-[12px] left-0 right-0 text-center text-lg text-white/[0.88] whitespace-nowrap px-4 z-10"
          style={{
            fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
            opacity: (slideDir === 'out' || finalStage) ? 0 : 1,
            transition: 'opacity 0.3s',
            animation: slideDir === 'in' ? 'textFadeIn 0.4s ease-out 0.1s both' : 'none',
          }}
        >
          {product.name}
        </p>
      </div>

      {/* ── Card — shrink-0, hugs content ── */}
      <div
        className="shrink-0 self-stretch overflow-hidden flex flex-col items-center justify-center z-10"
        style={{
          margin: finalStage ? 0 : '0 16px',
          backgroundColor: finalStage ? '#009e5c' : 'white',
          borderRadius: finalStage ? 0 : '16px',
          flex: finalStage ? '1 1 0%' : '0 0 auto',
          transition: 'margin 0.5s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.6s ease-in-out, border-radius 0.5s ease-in-out, flex 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
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
            <div className="flex flex-col items-center mt-4" style={{ minHeight: 100 }}>
              {/* Pre-flip text — slides up slightly and fades when flipped */}
              <p
                className="text-[20px] text-center"
                style={{
                  fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
                  lineHeight: '26px',
                  fontWeight: flipped ? 400 : 600,
                  color: finalStage ? 'white' : '#006c3f',
                  opacity: (!finalStage && !flipped) ? 0 : 1,
                  transform: flipped ? 'translateY(-4px) scale(0.97)' : 'translateY(0) scale(1)',
                  transition: 'color 0.5s, opacity 0.4s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  animation: !finalStage ? 'textFadeIn 0.4s ease-out 0.7s both'
                    : finalStage && !flipped ? 'textPushIn 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) 0.3s both'
                    : 'none',
                }}
              >
                Review Submitted{flipped ? '!' : ''}
              </p>

              {/* Post-flip thank you text — pushes up with spring */}
              <p
                className="text-[28px] font-semibold text-white text-center mt-3"
                style={{
                  fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
                  lineHeight: '34px',
                  maxWidth: 260,
                  opacity: flipped ? 1 : 0,
                  transform: flipped ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                  transition: 'opacity 0.5s ease 0.35s, transform 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) 0.35s',
                }}
              >
                Thank you for shopping from us
              </p>
            </div>
          </div>
        ) : (
          /* ── Review flow ── */
          <>
            {/* mavenshop logo */}
            <div className="flex justify-center shrink-0 self-stretch" style={{ padding: isExpanded ? '16px 0 0' : '20px 0 0' }}>
              <img src={SHARED.mavenLogo} alt="mavenshop" className="h-6" />
            </div>

            {/* Rating */}
            <div
              className="flex flex-col items-center self-stretch transition-all duration-300"
              style={{ gap: '12px', marginTop: isExpanded ? '24px' : '72px' }}
            >
              <p
                className="text-black text-center whitespace-nowrap transition-all duration-300"
                style={{
                  fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
                  fontSize: isExpanded ? '14px' : '18px',
                  fontWeight: isExpanded ? 400 : 600,
                  lineHeight: '24px',
                }}
              >
                How would you rate this product?
              </p>
              <StarRating rating={rating} onRate={handleRate} size={isExpanded ? 32 : 48} bounceKey={productIndex} />
            </div>

            {/* Expandable content area */}
            <div
              className="overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out self-stretch"
              style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0 }}
            >
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
              <div className="self-stretch shrink-0 overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out"
                style={{ maxHeight: isExpanded ? '80px' : '0px', opacity: isExpanded ? 1 : 0 }}
              >
                <div style={{ padding: '16px 16px 16px' }}>
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
              className="overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out self-stretch"
              style={{ maxHeight: isExpanded ? '0px' : '100px', opacity: isExpanded ? 0 : 1 }}
            >
              <div className="flex justify-center" style={{ marginTop: '72px', paddingBottom: '20px' }}>
                <button
                  onClick={handleSkip}
                  className="text-sm font-medium text-black/80 bg-transparent border-0 cursor-pointer hover:text-black"
                >
                  Skip
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Powered by Razorpay ── */}
      <div
        className="shrink-0 overflow-hidden flex items-center justify-center"
        style={{
          opacity: finalStage ? 0 : 1,
          maxHeight: finalStage ? '0px' : '39px',
          padding: finalStage ? 0 : '12px 10px',
          transition: 'opacity 0.3s, max-height 0.4s ease-in-out, padding 0.4s ease-in-out',
        }}
      >
        <PoweredBy />
      </div>

      {/* Powered by on final green screen */}
      {/* Full-screen confetti overlay */}
      {finalStage && <Confetti />}

      {finalStage && (
        <div className="absolute bottom-7 left-0 right-0 z-50 flex justify-center" style={{ animation: 'textFadeIn 0.4s ease-out 0.3s both' }}>
          <PoweredBy />
        </div>
      )}

    </div>
  )
}
