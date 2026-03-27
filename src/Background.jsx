import { useEffect, useRef } from 'react'
import flowerImg from './assets/background.png'

const RAMP_MS         = 60_000   // 1 min to reach full speed + full res
const DEATH_SPREAD_MS = 150_000  // blocks die over 2.5 min
const FREEZE_MS       = 25_000   // freeze pixel overlay at 25s
const BLOCK_SIZES     = [30, 50, 75, 110]
const PIXEL_SAMPLE    = 5        // source pixels per block (chunky look)
const PIXEL_RES_MAX   = 25       // starting background pixel size (screen px)

export default function Background() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.src = flowerImg

    let animId
    let blocks = []
    let rowOffsets = []
    let onResize = () => {}
    let frozenStaticOverlay = null
    let frozenScrollBlocks = null
    let pixelBuf = null
    let residueCanvas = null // permanent pixelated patches for 40% of blocks

    img.onload = () => {
      const tw = () => canvas.width * 0.09
      const th = () => tw() * (img.naturalHeight / img.naturalWidth)

      const buildBlocks = () => {
        blocks = []
        const tileW = tw()
        const tileH = th()
        let rowIdx = 0
        let y = 0
        while (y < canvas.height + 120) {
          const bh = BLOCK_SIZES[Math.floor(Math.random() * BLOCK_SIZES.length)]
          const scrollWithRow = rowIdx % 2 === 0
          let x = 0
          while (x < canvas.width + 120) {
            const bw = BLOCK_SIZES[Math.floor(Math.random() * BLOCK_SIZES.length)]
            const tx = ((x % tileW) + tileW) % tileW
            const ty = ((y % tileH) + tileH) % tileH
            blocks.push({
              x, y, w: bw, h: bh,
              srcX: (tx / tileW) * img.naturalWidth,
              srcY: (ty / tileH) * img.naturalHeight,
              deathStart: Math.random() * DEATH_SPREAD_MS,
              deathDuration: 500 + Math.random() * 1500,
              scrollWithRow,
              rowIdx,
              permanentPatch: Math.random() < 0.4, // 40% stay pixelated forever
            })
            x += bw
          }
          rowIdx++
          y += bh
        }
      }

      const buildResidue = () => {
        residueCanvas = document.createElement('canvas')
        residueCanvas.width = canvas.width
        residueCanvas.height = canvas.height
        const rc = residueCanvas.getContext('2d')
        rc.imageSmoothingEnabled = false
        rc.globalAlpha = 0.88
        for (const b of blocks) {
          if (!b.permanentPatch) continue
          rc.drawImage(img, b.srcX, b.srcY, PIXEL_SAMPLE, PIXEL_SAMPLE, b.x, b.y, b.w, b.h)
        }
      }

      const setup = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        rowOffsets = []
        frozenStaticOverlay = null
        frozenScrollBlocks = null
        pixelBuf = null
        residueCanvas = null
        buildBlocks()
        buildResidue()
      }

      setup()
      onResize = setup
      window.addEventListener('resize', onResize)

      const startTime = performance.now()
      let lastTime = startTime

      const draw = (now) => {
        const elapsed = now - startTime
        const dt = now - lastTime
        lastTime = now

        const w = canvas.width
        const h = canvas.height
        const tileW = tw()
        const tileH = th()
        const rowCount = Math.ceil(h / tileH) + 2

        while (rowOffsets.length < rowCount) rowOffsets.push(0)

        // cubic ease-in speed ramp
        const t = Math.min(elapsed / RAMP_MS, 1)
        const eased = t * t * t
        const speed = (tileW / 8) * eased * (dt / 1000)

        for (let i = 0; i < rowCount; i++) {
          rowOffsets[i] = i % 2 === 0
            ? (rowOffsets[i] + speed + tileW * 999) % tileW
            : (rowOffsets[i] - speed + tileW * 999) % tileW
        }

        ctx.clearRect(0, 0, w, h)

        // --- background rows (pixelation sharpens over 1 min) ---
        // ease-out: resolution improves quickly then settles
        const pixelRes = Math.max(1, Math.round(PIXEL_RES_MAX * (1 - t) * (1 - t)))

        if (pixelRes > 1) {
          // render at low res then scale up for chunky pixel look
          if (!pixelBuf) pixelBuf = document.createElement('canvas')
          const bw = Math.ceil(w / pixelRes)
          const bh = Math.ceil(h / pixelRes)
          if (pixelBuf.width !== bw || pixelBuf.height !== bh) {
            pixelBuf.width = bw
            pixelBuf.height = bh
          }
          const bc = pixelBuf.getContext('2d')
          bc.clearRect(0, 0, bw, bh)
          bc.imageSmoothingEnabled = true
          const sTileW = tileW / pixelRes
          const sTileH = tileH / pixelRes
          for (let i = 0; i < rowCount; i++) {
            const y = (i * tileH) / pixelRes
            const xStart = (rowOffsets[i] - tileW) / pixelRes
            for (let x = xStart; x < bw + sTileW; x += sTileW) {
              bc.drawImage(img, x, y, sTileW, sTileH)
            }
          }
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(pixelBuf, 0, 0, bw, bh, 0, 0, w, h)
        } else {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          for (let i = 0; i < rowCount; i++) {
            const y = i * tileH
            const xStart = rowOffsets[i] - tileW
            for (let x = xStart; x < w + tileW; x += tileW) {
              ctx.drawImage(img, x, y, tileW, tileH)
            }
          }
        }

        // --- permanent pixelated residue (40% of block areas) ---
        if (residueCanvas) ctx.drawImage(residueCanvas, 0, 0)

        // --- pixel overlay ---
        ctx.imageSmoothingEnabled = false

        if (elapsed >= FREEZE_MS) {
          if (!frozenStaticOverlay) {
            frozenStaticOverlay = document.createElement('canvas')
            frozenStaticOverlay.width = w
            frozenStaticOverlay.height = h
            const fc = frozenStaticOverlay.getContext('2d')
            fc.imageSmoothingEnabled = false
            for (const b of blocks) {
              if (b.scrollWithRow) continue
              const age = FREEZE_MS - b.deathStart
              if (age >= b.deathDuration) continue
              fc.globalAlpha = age < 0 ? 1 : 1 - age / b.deathDuration
              fc.drawImage(img, b.srcX, b.srcY, PIXEL_SAMPLE, PIXEL_SAMPLE, b.x, b.y, b.w, b.h)
            }

            frozenScrollBlocks = blocks
              .filter(b => b.scrollWithRow)
              .map(b => {
                const age = FREEZE_MS - b.deathStart
                const alpha = age >= b.deathDuration ? 0 : age < 0 ? 1 : 1 - age / b.deathDuration
                return { ...b, alpha }
              })
              .filter(b => b.alpha > 0)
          }

          ctx.drawImage(frozenStaticOverlay, 0, 0)

          for (const b of frozenScrollBlocks) {
            ctx.globalAlpha = b.alpha
            const shift = b.rowIdx % 2 === 0 ? rowOffsets[b.rowIdx] : -rowOffsets[b.rowIdx]
            for (const dx of [shift - tileW, shift, shift + tileW]) {
              const drawX = b.x + dx
              if (drawX + b.w < 0 || drawX > w) continue
              ctx.drawImage(img, b.srcX, b.srcY, PIXEL_SAMPLE, PIXEL_SAMPLE, drawX, b.y, b.w, b.h)
            }
          }
          ctx.globalAlpha = 1

        } else {
          for (const b of blocks) {
            const age = elapsed - b.deathStart
            if (age >= b.deathDuration) continue
            ctx.globalAlpha = age < 0 ? 1 : 1 - age / b.deathDuration

            if (b.scrollWithRow) {
              const shift = b.rowIdx % 2 === 0 ? rowOffsets[b.rowIdx] : -rowOffsets[b.rowIdx]
              for (const dx of [shift - tileW, shift, shift + tileW]) {
                const drawX = b.x + dx
                if (drawX + b.w < 0 || drawX > w) continue
                ctx.drawImage(img, b.srcX, b.srcY, PIXEL_SAMPLE, PIXEL_SAMPLE, drawX, b.y, b.w, b.h)
              }
            } else {
              ctx.drawImage(img, b.srcX, b.srcY, PIXEL_SAMPLE, PIXEL_SAMPLE, b.x, b.y, b.w, b.h)
            }
          }
          ctx.globalAlpha = 1
        }

        animId = requestAnimationFrame(draw)
      }

      animId = requestAnimationFrame(draw)
    }

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: -1 }}
    />
  )
}
