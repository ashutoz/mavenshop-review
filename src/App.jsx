import { useState, useRef, useCallback } from 'react'

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
    bgImage: 'https://www.figma.com/api/mcp/asset/8ad53462-fb6b-4fd0-b1cd-76a48e88095d',
    productImage: 'https://www.figma.com/api/mcp/asset/db3bb3c7-1f6a-4e63-b943-fae3b26fddf8',
  },
  {
    name: 'Marvenshop Focus PineLIne SPF 50 PA',
    bgImage: 'https://www.figma.com/api/mcp/asset/3644aeba-35bc-4554-8e24-d718d07d661f',
    productImage: 'https://www.figma.com/api/mcp/asset/3644aeba-35bc-4554-8e24-d718d07d661f',
  },
]

/* ─── Reusable Components ─── */

function StarRating({ rating, onRate, size = 48 }) {
  const [animating, setAnimating] = useState(null)
  const [pressed, setPressed] = useState(null)

  const handleRate = (star) => {
    setAnimating(star)
    onRate(star)
    hapticTick()
    setTimeout(() => setAnimating(null), 500)
  }

  return (
    <div className="flex items-center" style={{ gap: size === 48 ? 12 : 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRate(star)}
          onTouchStart={() => setPressed(star)}
          onTouchEnd={() => setPressed(null)}
          onTouchCancel={() => setPressed(null)}
          className="p-0 border-0 bg-transparent cursor-pointer"
          style={{
            transition: pressed === star ? 'transform 0.06s ease-in' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: pressed === star ? 'scale(0.8)' : 'scale(1)',
            animation:
              animating !== null && star <= animating
                ? `starBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${(star - 1) * 60}ms both`
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
      ))}
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M8 0C5.79086 0 4 1.79086 4 4V12C4 14.2091 5.79086 16 8 16C10.2091 16 12 14.2091 12 12V4C12 1.79086 10.2091 0 8 0ZM6 4C6 2.89543 6.89543 2 8 2C9.10457 2 10 2.89543 10 4V12C10 13.1046 9.10457 14 8 14C6.89543 14 6 13.1046 6 12V4Z" fill="#050505" />
      <path d="M2 10C2 9.44771 1.55228 9 1 9C0.447715 9 0 9.44771 0 10V12C0 16.0796 3.05369 19.446 7 19.9381V22H4C3.44772 22 3 22.4477 3 23C3 23.5523 3.44772 24 4 24H12C12.5523 24 13 23.5523 13 23C13 22.4477 12.5523 22 12 22H9V19.9381C12.9463 19.446 16 16.0796 16 12V10C16 9.44771 15.5523 9 15 9C14.4477 9 14 9.44771 14 10V12C14 15.3137 11.3137 18 8 18C4.68629 18 2 15.3137 2 12V10Z" fill="#050505" />
    </svg>
  )
}

function UploadIllustration() {
  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="80" height="63" viewBox="0 0 80 63" fill="none">
        <rect x="8" y="8" width="56" height="42" rx="6" fill="#E8F0FE" stroke="#C4D7F8" strokeWidth="1.5" />
        <rect x="2" y="14" width="56" height="42" rx="6" fill="#F0F4FF" stroke="#C4D7F8" strokeWidth="1.5" />
        <path d="M14 44L26 28L34 38L42 24L52 44H14Z" fill="#A8C5F7" stroke="#6B9EF0" strokeWidth="1" />
        <circle cx="42" cy="26" r="5" fill="#6B9EF0" stroke="#4A85E8" strokeWidth="1" />
        <circle cx="58" cy="20" r="12" fill="#6B9EF0" fillOpacity="0.9" />
        <path d="M55 15L63 20L55 25V15Z" fill="white" />
      </svg>
      <div className="flex items-center gap-1 text-sm font-medium text-black">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M5.5 1V10M1 5.5H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
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
  // Confetti particles around the badge
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
      {/* Confetti particles */}
      {confetti.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: `calc(50% + ${p.x}px)`,
            top: `calc(50% + ${p.y}px)`,
            animation: `confettiFall 1s ease-in ${p.delay}s both`,
          }}
        />
      ))}

      {/* Pulse ring */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ animation: 'ringPulse 0.8s ease-out 0.3s both' }}
      >
        <div className="w-[126px] h-[126px] rounded-full border-[3px] border-[#7EE86B]" />
      </div>

      {/* Main badge */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ animation: 'circleBounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both' }}
      >
        <svg width="126" height="126" viewBox="0 0 126 126" fill="none">
          {/* Outer lime circle */}
          <circle cx="63" cy="63" r="63" fill="#7EE86B" />
          {/* Shimmer stripes */}
          <rect x="70" y="-10" width="14" height="150" rx="7" fill="#A3F594" opacity="0.5"
            style={{ animation: 'stripeShimmer 1.2s ease-out 0.6s both', transformOrigin: '77px 65px' }} />
          <rect x="88" y="-10" width="10" height="150" rx="5" fill="#A3F594" opacity="0.35"
            style={{ animation: 'stripeShimmer 1.2s ease-out 0.75s both', transformOrigin: '93px 65px' }} />
          {/* Inner green circle */}
          <circle cx="63" cy="63" r="46" fill="#2AB573" />
          <circle cx="63" cy="63" r="42" fill="#25A86A" />
          {/* Animated checkmark */}
          <path
            d="M42 63L56 77L84 49"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray="60"
            strokeDashoffset="60"
            style={{ animation: 'checkDraw 0.45s ease-out 0.5s forwards' }}
          />
        </svg>
      </div>
    </div>
  )
}

function Confetti() {
  // Generate random confetti pieces
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2.5 + Math.random() * 2,
    size: 6 + Math.random() * 8,
    color: ['#FFD666', '#FF6B6B', '#7EE86B', '#6BB5FF', '#FF8ED4', '#A3F594', '#FFB347', '#fff'][i % 8],
    shape: i % 3, // 0=circle, 1=square, 2=rectangle
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: 0,
            width: p.shape === 2 ? p.size * 0.5 : p.size,
            height: p.shape === 2 ? p.size * 1.5 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 0 ? '50%' : '2px',
            animation: `confettiPieceFall ${p.duration}s ease-in ${p.delay}s both`,
          }}
        />
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

/* ─── Main App ─── */

export default function App() {
  const [step, setStep] = useState(0)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [photos, setPhotos] = useState([])
  const [productIndex, setProductIndex] = useState(0)
  const [slideDir, setSlideDir] = useState(null) // 'out' | 'in' | null
  const [reviewCount, setReviewCount] = useState(0)
  const [finalStage, setFinalStage] = useState(null) // null | 'expanding' | 'confetti'
  const inputRef = useRef(null)

  const product = PRODUCTS[productIndex]
  const isExpanded = step >= 2 && step !== 'submitted'
  const isSubmitted = step === 'submitted'

  const handleRate = (star) => {
    setRating(star)
    if (step === 0) {
      setStep(1)
      setTimeout(() => setStep(2), 600)
    }
  }

  const handleSkip = () => {
    // Slide to next product without submitting
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
    // Slide current product out to the left
    setSlideDir('out')
    setTimeout(() => {
      // Switch to next product and reset state
      setProductIndex((i) => (i + 1) % PRODUCTS.length)
      setStep(0)
      setRating(0)
      setReview('')
      setPhotos([])
      setSlideDir('in')
      // Clear slide animation after it completes
      setTimeout(() => setSlideDir(null), 500)
    }, 400)
  }

  const handleSubmit = () => {
    setStep('submitted')
    const newCount = reviewCount + 1
    setReviewCount(newCount)

    if (newCount >= PRODUCTS.length) {
      // All products reviewed — expand card to full screen after 1.5s
      setTimeout(() => {
        setFinalStage('expanding')
        // After expansion animation (0.7s), show confetti
        setTimeout(() => setFinalStage('confetti'), 700)
      }, 1500)
    } else {
      // More products to review — carousel to next after 2s
      setTimeout(() => goToNextProduct(), 2000)
    }
  }

  return (
    <div className="relative w-full h-[100dvh] max-w-[520px] mx-auto bg-[#010101] overflow-hidden">

      {/* ── Background + product image — fills top 56dvh ── */}
      <div
        className="absolute left-0 right-0 top-0"
        style={{
          height: '56dvh',
          animation: slideDir === 'out'
            ? 'slideOutLeft 0.4s ease-in forwards'
            : slideDir === 'in'
            ? 'slideInRight 0.45s ease-out forwards'
            : 'none',
        }}
      >
        <img src={product.bgImage} alt="" className="w-full h-full object-cover" />

        {/* Product image (only show if different from bg) */}
        {product.productImage !== product.bgImage && (
          <div className="absolute left-1/2 -translate-x-1/2 top-[8%] w-[60%] h-[82%]">
            <img src={product.productImage} alt={product.name} className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      {/* Gradient overlay — fades image into black behind the card */}
      <div
        className="absolute -left-[46px] -right-[46px] pointer-events-none transition-all duration-500 ease-in-out"
        style={{
          top: isExpanded && !isSubmitted ? '5dvh' : '37dvh',
          height: isExpanded && !isSubmitted ? '65dvh' : '40dvh',
          transform: 'scaleY(-1)',
          background: 'linear-gradient(178deg, rgb(0,0,0) 61%, rgba(5,5,5,0.95) 74%, transparent 98%)',
          filter: 'blur(5.5px)',
        }}
      />


      {/* ── Bottom content: product name + card + powered by ── */}
      <div
        className="absolute left-0 right-0 bottom-0 z-10 flex flex-col items-center"
        style={{
          top: finalStage
            ? 0
            : isExpanded && !isSubmitted
            ? '20dvh'
            : isSubmitted
            ? '30dvh'
            : '51dvh',
          transition: 'top 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Product name */}
        <p
          className="text-center text-lg text-white/[0.88] whitespace-nowrap px-4 shrink-0"
          style={{
            fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
            opacity: (slideDir === 'out' || finalStage) ? 0 : 1,
            maxHeight: finalStage ? '0px' : '40px',
            marginBottom: finalStage ? 0 : 12,
            overflow: 'hidden',
            transition: 'opacity 0.3s, max-height 0.4s ease-in-out, margin-bottom 0.4s ease-in-out',
            animation: slideDir === 'in' ? 'textFadeIn 0.4s ease-out 0.1s both' : 'none',
          }}
        >
          {product.name}
        </p>

        {/* Card — grows from white success card → full green screen */}
        <div
          className="self-stretch overflow-hidden flex flex-col items-center justify-center"
          style={{
            margin: finalStage ? 0 : '0 16px',
            backgroundColor: finalStage === 'expanding'
              ? '#009e5c'
              : finalStage === 'confetti'
              ? '#009e5c'
              : 'white',
            borderRadius: finalStage === 'confetti' ? 0 : finalStage === 'expanding' ? '8px' : '16px',
            flex: (isExpanded || isSubmitted) && !finalStage ? '0 0 auto' : '1 1 0%',
            transition: 'margin 0.5s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.6s ease-in-out, border-radius 0.5s ease-in-out, flex 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {isSubmitted ? (
            /* ── Success content ── */
            <div className="flex flex-col items-center justify-center px-4 relative flex-1" style={{ padding: '32px 16px' }}>
              {finalStage === 'confetti' && <Confetti />}
              <div style={finalStage ? { filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.15))' } : undefined}>
                <SuccessCheckmark />
              </div>

              {/* "Review Submitted" — visible in white card, fades out during expansion */}
              <p
                className="mt-3 text-[20px] font-semibold text-center"
                style={{
                  fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
                  lineHeight: '26px',
                  color: finalStage ? 'white' : '#006c3f',
                  opacity: finalStage === 'confetti' ? 0 : 1,
                  transition: 'color 0.5s, opacity 0.3s',
                  animation: !finalStage ? 'textFadeIn 0.4s ease-out 0.7s both' : 'none',
                }}
              >
                Review Submitted
              </p>

              {/* Final text — appears on confetti stage */}
              {finalStage === 'confetti' && (
                <div className="flex flex-col items-center gap-1 mt-3">
                  <p
                    className="text-white/80 text-sm"
                    style={{ animation: 'textFadeIn 0.3s ease-out both' }}
                  >
                    Thank you
                  </p>
                  <p
                    className="text-white text-[20px] font-semibold text-center"
                    style={{
                      fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
                      lineHeight: '26px',
                      animation: 'textFadeIn 0.3s ease-out 0.15s both',
                    }}
                  >
                    Review Submitted Successful
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* ── Review flow ── */
            <>
              {/* mavenshop logo */}
              <div className="flex justify-center pt-5 self-stretch">
                <img src={SHARED.mavenLogo} alt="mavenshop" className="h-6" />
              </div>

              {/* Rating */}
              <div className="flex flex-col items-center gap-3 px-4 mt-6 self-stretch">
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
                <StarRating rating={rating} onRate={handleRate} size={isExpanded ? 32 : 48} />
              </div>

              {/* Expandable content area — animated via max-height */}
              <div
                className="overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out self-stretch"
                style={{
                  maxHeight: isExpanded ? '600px' : '0px',
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div className="flex flex-col gap-4 px-4 mt-5 overflow-y-auto" style={{ maxHeight: isExpanded ? 'calc(100dvh - 330px)' : 'none' }}>
                  {/* Upload area */}
                  {photos.length === 0 ? (
                    <button
                      onClick={handleAddPhotos}
                      className="w-full max-h-[280px] min-h-[138px] flex-1 bg-[#f8f8f8] border border-dashed border-black/[0.12] rounded-xl flex items-center justify-center cursor-pointer p-0"
                    >
                      <UploadIllustration />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setPhotos([...photos, photos.length + 1])}
                        className="w-full h-[138px] shrink-0 bg-[#f8f8f8] border border-dashed border-black/[0.12] rounded-xl flex items-center justify-center cursor-pointer p-0"
                      >
                        <UploadIllustration />
                      </button>

                      {/* Photo strip */}
                      <div className="flex gap-4 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
                        {photos.map((_, i) => (
                          <PhotoThumbnail key={i} index={i} onRemove={() => handleRemovePhoto(i)} />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Input row */}
                  <div className="flex gap-2 items-start shrink-0">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Write your review"
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      className="flex-1 h-9 bg-white border border-[#dee1e3] rounded-lg px-3 text-sm text-[#050505] placeholder:text-black/[0.32] outline-none focus:border-black focus:border-[1.5px]"
                    />
                    <button className="w-9 h-9 shrink-0 bg-white border border-[#dee1e3] rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
                      <MicIcon />
                    </button>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    className="w-full h-12 shrink-0 bg-[#050505] text-white rounded-xl font-semibold text-base cursor-pointer border-0 active:bg-[#333] transition-colors mb-1"
                  >
                    Submit
                  </button>
                </div>
              </div>

              {/* Skip link — animated out via max-height */}
              <div
                className="overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out self-stretch"
                style={{
                  maxHeight: isExpanded ? '0px' : '80px',
                  opacity: isExpanded ? 0 : 1,
                }}
              >
                <div className="pt-6 pb-4 flex justify-center">
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

        {/* Powered by Razorpay */}
        <div
          className="shrink-0 overflow-hidden"
          style={{
            opacity: finalStage ? 0 : 1,
            maxHeight: finalStage ? '0px' : '60px',
            padding: finalStage ? 0 : '16px 0',
            transition: 'opacity 0.3s, max-height 0.4s ease-in-out, padding 0.4s ease-in-out',
          }}
        >
          <PoweredBy />
        </div>
      </div>

      {/* Powered by on final green screen */}
      {finalStage === 'confetti' && (
        <div className="absolute bottom-7 left-0 right-0 z-50 flex justify-center" style={{ animation: 'textFadeIn 0.4s ease-out 0.3s both' }}>
          <PoweredBy />
        </div>
      )}

    </div>
  )
}
