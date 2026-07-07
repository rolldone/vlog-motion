// @ts-nocheck
import type { Plugin, ViteDevServer } from 'vite'
import puppeteer from 'puppeteer'

type BrowserSession = {
  browser: Awaited<ReturnType<typeof puppeteer.launch>>
  page: Awaited<ReturnType<BrowserSession['browser']['newPage']>>
  viewport: { width: number; height: number }
}

let session: BrowserSession | null = null
let sessionPromise: Promise<BrowserSession> | null = null

async function getSession(): Promise<BrowserSession> {
  if (session) return session
  if (sessionPromise) return sessionPromise

  console.log('[browser-stream] Starting Chromium...')
  sessionPromise = (async () => {
    try {
      const browser = await puppeteer.launch({
        executablePath: '/snap/bin/chromium',
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--window-size=1280,800',
        ],
      })

      const page = await browser.newPage()
      await page.setViewport({ width: 1280, height: 800 })
      await page.goto('https://www.bing.com', { waitUntil: 'domcontentloaded', timeout: 30000 })

      session = { browser, page, viewport: { width: 1280, height: 800 } }
      console.log('[browser-stream] ✅ Chromium ready')
      return session
    } catch (err: any) {
      console.error('[browser-stream] ❌ Failed:', err.message)
      sessionPromise = null
      throw err
    }
  })()

  return sessionPromise
}

export function browserStreamPlugin(): Plugin {
  return {
    name: 'browser-stream',
    configureServer(server: ViteDevServer) {
      // Cleanup: kill browser when server stops
      server.httpServer?.on('close', () => {
        if (session) {
          console.log('[browser-stream] Closing browser...')
          session.browser.close().catch(() => {})
          session = null
          sessionPromise = null
        }
      })

      // SSE stream — kirim screenshot terus-menerus
      server.middlewares.use('/browser/stream', async (req, res) => {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        })

        const sendScreenshot = async () => {
          try {
            const s = await getSession()
            const screenshot = await s.page.screenshot({ type: 'jpeg', quality: 60 })
            const base64 = screenshot.toString('base64')
            res.write(`data: data:image/jpeg;base64,${base64}\n\n`)
          } catch (err) {
            console.error('[browser-stream] Screenshot error:', err.message)
          }
        }

        // Kirim screenshot setiap 500ms
        const interval = setInterval(sendScreenshot, 500)
        sendScreenshot() // kirim langsung pertama

        req.on('close', () => {
          clearInterval(interval)
        })
      })

      // Navigate — POST { url }
      server.middlewares.use('/browser/navigate', async (req, res) => {
        let body = ''
        for await (const chunk of req) body += chunk
        try {
          const { url } = JSON.parse(body)
          const s = await getSession()
          await s.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true, url }))
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: err.message }))
        }
      })

      // Click — POST { x, y }
      server.middlewares.use('/browser/click', async (req, res) => {
        let body = ''
        for await (const chunk of req) body += chunk
        try {
          const { x, y } = JSON.parse(body)
          const s = await getSession()
          await s.page.mouse.click(x, y)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: err.message }))
        }
      })

      // Scroll — POST { deltaX, deltaY }
      server.middlewares.use('/browser/scroll', async (req, res) => {
        let body = ''
        for await (const chunk of req) body += chunk
        try {
          const { deltaX, deltaY } = JSON.parse(body)
          const s = await getSession()
          await s.page.mouse.wheel({ deltaX, deltaY })
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: err.message }))
        }
      })

      // Type — POST { text }
      server.middlewares.use('/browser/type', async (req, res) => {
        let body = ''
        for await (const chunk of req) body += chunk
        try {
          const { text } = JSON.parse(body)
          const s = await getSession()
          await s.page.keyboard.type(text)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: err.message }))
        }
      })

      // Key — POST { key } (e.g. "Enter", "Backspace", "Tab")
      server.middlewares.use('/browser/key', async (req, res) => {
        let body = ''
        for await (const chunk of req) body += chunk
        try {
          const { key } = JSON.parse(body)
          const s = await getSession()
          await s.page.keyboard.press(key)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: err.message }))
        }
      })

      // Close — kill Chromium session
      server.middlewares.use('/browser/close', async (_req, res) => {
        if (session) {
          console.log('[browser-stream] Closing browser by user request...')
          try {
            await session.browser.close()
          } catch {}
          session = null
          sessionPromise = null
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      })
    },
  }
}