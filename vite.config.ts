// @ts-nocheck — config file, types handled by Vite runtime
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { browserStreamPlugin } from './src/plugins/browserStreamPlugin'

// Disable SSL verification untuk proxy (dev only — beberapa situs punya cert issues)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Proxy plugin — strip X-Frame-Options supaya iframe bisa load situs apapun
function proxyPlugin() {
  return {
    name: 'iframe-proxy',
    configureServer(server: any) {
      server.middlewares.use('/proxy', async (req: any, res: any) => {
        const url = new URL(req.url || '/', 'http://localhost')
        const target = url.searchParams.get('url')

        if (!target) {
          res.writeHead(400, { 'Content-Type': 'text/plain' })
          res.end('Missing ?url= parameter')
          return
        }

        try {
          const response = await fetch(target, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            redirect: 'follow',
          })

          // Copy response headers KECUALI yang blokir iframe
          const headers: Record<string, string> = {}
          response.headers.forEach((value, key) => {
            const lower = key.toLowerCase()
            if (lower === 'x-frame-options') return
            if (lower === 'content-security-policy') return
            if (lower === 'content-security-policy-report-only') return
            if (lower === 'content-encoding') return
            if (lower === 'transfer-encoding') return
            headers[key] = value
          })

          if (!headers['content-type']) {
            headers['content-type'] = 'text/html; charset=utf-8'
          }

          const contentType = headers['content-type'] || ''
          const finalUrl = response.url || target
          const targetOrigin = new URL(finalUrl).origin

          let bodyBuffer: Buffer

          if (contentType.includes('text/html')) {
            const original = await response.text()
            // Inject <base> tag supaya relative URLs (CSS, JS, img) resolve ke domain asli
            // Resource akan load langsung dari domain asli, bukan lewat proxy
            const baseTag = `<base href="${targetOrigin}/">`
            let html = original.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`)

            // Strip <meta> CSP & X-Frame-Options tags (selain header, situs bisa pakai meta tag)
            html = html.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi, '')
            html = html.replace(/<meta[^>]+http-equiv=["']?x-frame-options["']?[^>]*>/gi, '')

            // Inject script yang intercept semua navigasi (link click, window.open, location, history)
            // Script kirim postMessage ke parent window dengan URL tujuan
            const interceptScript = `<script>
              (function() {
                function sendNav(url) {
                  if (!url || url === 'about:blank') return;
                  if (url.startsWith('javascript:') || url.startsWith('#')) return;
                  // Resolve relative URL ke absolute pakai base href
                  try {
                    var base = document.querySelector('base');
                    var baseUrl = base ? base.href : window.location.href;
                    url = new URL(url, baseUrl).href;
                  } catch(e) {}
                  window.parent.postMessage({ type: 'proxy-navigate', url: url }, '*');
                }

                // Intercept semua klik link
                document.addEventListener('click', function(e) {
                  var a = e.target.closest('a');
                  if (!a) return;
                  var href = a.href;
                  if (!href || href.startsWith('javascript:') || href.startsWith('#')) return;
                  e.preventDefault();
                  e.stopPropagation();
                  sendNav(href);
                }, true);

                // Override window.open
                window.open = function(url) {
                  if (url) sendNav(url);
                  return null;
                };

                // Override location.href / location.assign / location.replace
                try {
                  var origAssign = window.location.assign.bind(window.location);
                  var origReplace = window.location.replace.bind(window.location);
                  window.location.assign = function(url) { sendNav(url); };
                  window.location.replace = function(url) { sendNav(url); };
                  // location.href setter
                  var origHref = window.location.href;
                  try {
                    Object.defineProperty(window.location, 'href', {
                      get: function() { return origHref; },
                      set: function(url) { sendNav(url); }
                    });
                  } catch(e) {}
                } catch(e) {}

                // Override history.pushState / replaceState
                try {
                  var origPush = history.pushState.bind(history);
                  var origReplaceState = history.replaceState.bind(history);
                  history.pushState = function(state, title, url) {
                    origPush(state, title, url);
                    if (url) sendNav(url);
                  };
                  history.replaceState = function(state, title, url) {
                    origReplaceState(state, title, url);
                    if (url) sendNav(url);
                  };
                } catch(e) {}

                // Intercept popstate (back/forward)
                window.addEventListener('popstate', function(e) {
                  sendNav(window.location.href);
                });

                // Intercept form submit
                document.addEventListener('submit', function(e) {
                  var form = e.target;
                  if (!form || !form.action) return;
                  e.preventDefault();
                  e.stopPropagation();
                  var url = form.action;
                  if (form.method && form.method.toLowerCase() === 'get') {
                    var params = new URLSearchParams(new FormData(form));
                    url += (url.includes('?') ? '&' : '?') + params.toString();
                  }
                  sendNav(url);
                }, true);
              })();
            </script>`

            html = html.replace('</body>', `${interceptScript}</body>`)
            if (!html.includes(interceptScript)) {
              html = interceptScript + html
            }

            bodyBuffer = Buffer.from(html, 'utf-8')
          } else if (contentType.includes('text/css')) {
            // Rewrite url() di CSS supaya resolve ke domain asli (bukan localhost proxy)
            const css = await response.text()
            const cssUrl = response.url || target
            const cssOrigin = new URL(cssUrl)
            const cssDir = cssUrl.substring(0, cssUrl.lastIndexOf('/') + 1)

            const rewritten = css.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (match, ref) => {
              if (ref.startsWith('data:') || ref.startsWith('http://') || ref.startsWith('https://')) return match
              // Resolve relative URL ke absolute
              try {
                const absolute = new URL(ref, cssDir).href
                return `url("${absolute}")`
              } catch {
                return match
              }
            })

            bodyBuffer = Buffer.from(rewritten, 'utf-8')
          } else {
            bodyBuffer = Buffer.from(await response.arrayBuffer())
          }

          // Update content-length karena HTML mungkin berubah
          headers['content-length'] = String(bodyBuffer.length)

          res.writeHead(response.status, headers)
          res.end(bodyBuffer)
        } catch (err: any) {
          console.error('[proxy] Error:', err?.message || err)
          res.writeHead(502, { 'Content-Type': 'text/plain' })
          res.end('Proxy error: ' + (err?.message || 'unknown'))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), proxyPlugin(), browserStreamPlugin()],
})
