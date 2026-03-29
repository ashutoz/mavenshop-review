import { useState, useRef, useCallback, useEffect } from 'react'

const PRODUCTS = [
  {
    name: 'Foxtale Glow Sunscreen SPF 50 PA',
    bgImage: 'https://www.figma.com/api/mcp/asset/fc169834-8358-4179-a247-345986b120ed',
  },
  {
    name: 'Golly Glow Cream SPF 40 PA',
    bgImage: 'https://www.figma.com/api/mcp/asset/11e7029e-58e3-452d-b057-d1cbc5ec43ac',
  },
  {
    name: 'Marvenshop Focus PineLine SPF 50 PA',
    bgImage: 'https://www.figma.com/api/mcp/asset/3644aeba-35bc-4554-8e24-d718d07d661f',
  },
]

const CARD_BACK_LOGO = 'https://www.figma.com/api/mcp/asset/83e41df8-38a9-4c29-a285-ba5521160a6f'
const MAVEN_LOGO = 'https://www.figma.com/api/mcp/asset/0546b409-9d38-4715-b128-36b9dfeaa81e'

const ANIM_DURATION = 650 // ms for slide + flip

function Dots({ count, active }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === active ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background: i === active ? 'white' : 'rgba(255,255,255,0.3)',
            transition: 'width 0.3s ease, background 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}

function CardFace({ product, flipped, duration }) {
  return (
    <div
      style={{
        width: 289,
        height: 412,
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: `transform ${duration}ms cubic-bezier(0.33, 0, 0.15, 1)`,
      }}
    >
      {/* FRONT FACE — product card */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(180,160,220,0.25), 0 0 30px rgba(120,200,180,0.15)',
          border: '3px solid rgba(255,255,255,0.15)',
        }}
      >
        <img
          src={product.bgImage}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          draggable={false}
        />
        <div
          style={{
            position: 'absolute',
            left: 0, right: 0, bottom: 0,
            height: 175,
            background: 'linear-gradient(to bottom, transparent 0%, black 57.866%)',
            pointerEvents: 'none',
          }}
        />
        <p
          style={{
            position: 'absolute',
            left: 16, bottom: 16,
            fontFamily: "'TASA Orbiter Display', system-ui, sans-serif",
            fontSize: 14, fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '2.8px',
            lineHeight: '18px',
            color: 'white',
            maxWidth: 200, margin: 0,
          }}
        >
          {product.name}
        </p>
      </div>

      {/* BACK FACE — mavenshop logo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 16,
          backgroundColor: '#0e0e0e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 60px rgba(0,0,0,0.6)',
          border: '3px solid rgba(255,255,255,0.08)',
        }}
      >
        <img
          src={CARD_BACK_LOGO}
          alt="mavenshop"
          style={{ width: 180, height: 'auto' }}
          draggable={false}
        />
      </div>
    </div>
  )
}

export default function Carousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  // transition phases: null → 'setup' (position incoming off-screen, no transition) → 'go' (animate both)
  const [transition, setTransition] = useState(null)
  const animating = useRef(false)

  // When transition enters 'setup', kick off 'go' on next frame
  useEffect(() => {
    if (transition?.phase === 'setup') {
      // Force layout read to ensure 'setup' styles are applied
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransition(prev => prev ? { ...prev, phase: 'go' } : null)
        })
      })
    }
  }, [transition?.phase])

  const goTo = useCallback((newIndex) => {
    if (animating.current) return
    if (newIndex < 0 || newIndex >= PRODUCTS.length || newIndex === activeIndex) return
    animating.current = true

    const direction = newIndex > activeIndex ? 'left' : 'right'

    // Phase 1: setup — render incoming card off-screen with back face, no transition
    setTransition({ from: activeIndex, to: newIndex, direction, phase: 'setup' })

    // Phase 2 ('go') is triggered by useEffect above

    // Phase 3: cleanup after animation
    setTimeout(() => {
      setActiveIndex(newIndex)
      setTransition(null)
      animating.current = false
    }, ANIM_DURATION + 100) // extra buffer for rAF delay
  }, [activeIndex])

  // Slide positions
  const exitTarget = transition?.direction === 'left' ? '-120%' : '120%'
  const enterStart = transition?.direction === 'left' ? '120%' : '-120%'

  const isGo = transition?.phase === 'go'
  const isSetup = transition?.phase === 'setup'
  const hasTransition = transition !== null

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 520,
        margin: '0 auto',
        height: '100dvh',
        background: '#010101',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 0 0', display: 'flex', justifyContent: 'center' }}>
        <img src={MAVEN_LOGO} alt="mavenshop" style={{ height: 24 }} />
      </div>

      {/* Cards area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Current / Exiting card container */}
        <div
          key={`current-${activeIndex}`}
          style={{
            position: 'absolute',
            transform: isGo ? `translateX(${exitTarget})` : 'translateX(0)',
            transition: isGo
              ? `transform ${ANIM_DURATION}ms cubic-bezier(0.45, 0, 0.15, 1)`
              : 'none',
            perspective: 1200,
          }}
        >
          <CardFace
            product={PRODUCTS[hasTransition ? transition.from : activeIndex]}
            flipped={isGo} // flip to back while sliding out
            duration={ANIM_DURATION}
          />
        </div>

        {/* Incoming card container */}
        {hasTransition && (
          <div
            style={{
              position: 'absolute',
              // setup: position off-screen instantly. go: slide to center
              transform: isGo ? 'translateX(0)' : `translateX(${enterStart})`,
              transition: isGo
                ? `transform ${ANIM_DURATION}ms cubic-bezier(0.45, 0, 0.15, 1)`
                : 'none',
              perspective: 1200,
            }}
          >
            <CardFace
              product={PRODUCTS[transition.to]}
              flipped={!isGo} // setup: back face showing. go: flip to front
              duration={isSetup ? 0 : ANIM_DURATION} // no transition during setup
            />
          </div>
        )}
      </div>

      {/* Dots + Arrows */}
      <div style={{ paddingBottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Dots count={PRODUCTS.length} active={hasTransition ? transition.to : activeIndex} />
        <div style={{ display: 'flex', gap: 24 }}>
          <button
            onClick={() => goTo(activeIndex - 1)}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)',
              color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: activeIndex === 0 ? 0.3 : 1,
              transition: 'opacity 0.2s',
            }}
            disabled={activeIndex === 0}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 5L7 10L12 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => goTo(activeIndex + 1)}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)',
              color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: activeIndex === PRODUCTS.length - 1 ? 0.3 : 1,
              transition: 'opacity 0.2s',
            }}
            disabled={activeIndex === PRODUCTS.length - 1}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 5L13 10L8 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
