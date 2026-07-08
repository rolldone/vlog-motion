import { useState, useCallback, useEffect, useRef } from 'react'
import { FloatingWindow } from './FloatingWindow'
import type { useInteractionRecorder } from '../hooks/useInteractionRecorder'

type Recorder = ReturnType<typeof useInteractionRecorder>

// Bookmark quick-links
const BOOKMARKS = [
  { label: 'Bing', url: 'https://www.bing.com', icon: '🔍' },
  { label: 'Bing Maps', url: 'https://www.bing.com/maps', icon: '🗺️' },
  { label: 'Wikipedia', url: 'https://en.wikipedia.org', icon: '📖' },
  { label: 'YouTube', url: 'https://www.youtube.com', icon: '▶️' },
  { label: 'Reddit', url: 'https://www.reddit.com', icon: '🤖' },
]

interface Tab {
  id: string
  url: string
  title: string
}

export function BrowserPanel({ onClosePanel, recorder }: { onClosePanel: () => void; recorder: Recorder }) {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [browserOpen, setBrowserOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [focusKey, setFocusKey] = useState(0)
  const tabCounter = useRef(0)
  const activeTabRef = useRef<string | null>(null)

  // Keep ref in sync
  useEffect(() => {
    activeTabRef.current = activeTabId
    ;(window as any).__activeTabId = activeTabId
  }, [activeTabId])

  // ─── Cleanup on unmount: hide native browser view ───
  useEffect(() => {
    return () => {
      window.browser.hide().catch(() => {})
    }
  }, [])

  // ─── Hide native WebContentsView when on blank new-tab page ───
  // (so React bookmark overlay can receive mouse clicks)
  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId)
    if (activeTab && activeTab.url === '' && activeTabId) {
      window.browser.hideTabView(activeTabId)
    } else if (activeTab && activeTab.url !== '' && activeTabId) {
      window.browser.showTabView(activeTabId)
    }
  }, [activeTabId, tabs])

  const normalizeUrl = useCallback((rawUrl: string) => {
    let finalUrl = rawUrl.trim()
    // Already a full URL
    if (finalUrl.startsWith('http://') || finalUrl.startsWith('https://')) {
      return finalUrl
    }
    // Looks like a URL (contains dot AND no spaces) → add https://
    if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
      return 'https://' + finalUrl
    }
    // Otherwise treat as search query → Bing
    return 'https://www.bing.com/search?q=' + encodeURIComponent(finalUrl)
  }, [])

  // ─── Create a new tab ───
  const handleNewTab = useCallback(async (url?: string) => {
    const finalUrl = url ? normalizeUrl(url) : undefined
    recorder.recordEvent({ type: 'browser-newtab', url: finalUrl })
    const tabId = await window.browser.createTab(finalUrl)
    tabCounter.current += 1
    const newTab: Tab = { id: tabId, url: finalUrl || '', title: `Tab ${tabCounter.current}` }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(tabId)
    setInputValue(finalUrl || '')
    setFocusKey((k) => k + 1) // trigger auto-focus in FloatingWindow
  }, [normalizeUrl, recorder])

  // ─── Close a tab ───
  const handleCloseTab = useCallback(async (tabId: string) => {
    recorder.recordEvent({ type: 'browser-closetab', tabId })
    const remainingActive = await window.browser.closeTab(tabId)
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== tabId)
      // If no tabs left, close browser + panel
      if (next.length === 0) {
        window.browser.hide()
        setBrowserOpen(false)
        setActiveTabId(null)
        onClosePanel()
      } else {
        setActiveTabId(remainingActive || next[0].id)
        const active = next.find((t) => t.id === (remainingActive || next[0].id))
        if (active) setInputValue(active.url)
      }
      return next
    })
  }, [onClosePanel, recorder])

  // ─── Switch tab ───
  const handleSwitchTab = useCallback(async (tabId: string) => {
    recorder.recordEvent({ type: 'browser-switchtab', tabId })
    await window.browser.switchTab(tabId)
    setActiveTabId(tabId)
    setLoading(false) // clear loading from previous tab
    const tab = tabs.find((t) => t.id === tabId)
    if (tab) {
      setInputValue(tab.url)
      // Auto-focus if switching to a blank tab (new tab page)
      if (!tab.url) setFocusKey((k) => k + 1)
    }
  }, [tabs, recorder])

  // ─── Navigate active tab ───
  const handleGo = useCallback(() => {
    const currentTab = activeTabRef.current
    if (!currentTab) return
    const url = normalizeUrl(inputValue)
    recorder.recordEvent({ type: 'browser-navigate', url })
    setLoading(true)
    window.browser.navigate(currentTab, url)
  }, [inputValue, normalizeUrl, recorder])

  const handleBookmark = useCallback((url: string) => {
    setInputValue(url)
    setLoading(true)
    const currentTab = activeTabRef.current
    if (currentTab) {
      recorder.recordEvent({ type: 'browser-navigate', url })
      window.browser.navigate(currentTab, url)
    } else {
      handleNewTab(url)
    }
  }, [handleNewTab, recorder])

  // ─── Navigation buttons ───
  const handleBack = useCallback(() => {
    if (activeTabId) {
      recorder.recordEvent({ type: 'browser-back' })
      window.browser.goBack(activeTabId)
    }
  }, [activeTabId, recorder])

  const handleForward = useCallback(() => {
    if (activeTabId) {
      recorder.recordEvent({ type: 'browser-forward' })
      window.browser.goForward(activeTabId)
    }
  }, [activeTabId, recorder])

  const handleReload = useCallback(() => {
    if (activeTabId) {
      recorder.recordEvent({ type: 'browser-reload' })
      window.browser.reload(activeTabId)
    }
  }, [activeTabId, recorder])

  // ─── Expose global functions for replay engine ───
  useEffect(() => {
    ;(window as any).__browserNewTab = (url?: string) => handleNewTab(url)
    ;(window as any).__browserCloseTab = (tabId: string) => handleCloseTab(tabId)
    ;(window as any).__browserSwitchTab = (tabId: string) => handleSwitchTab(tabId)
    return () => {
      delete (window as any).__browserNewTab
      delete (window as any).__browserCloseTab
      delete (window as any).__browserSwitchTab
    }
  }, [handleNewTab, handleCloseTab, handleSwitchTab])

  // ─── Close browser — tutup panel langsung ───
  const handleClose = useCallback(() => {
    window.browser.hide()
    setBrowserOpen(false)
    onClosePanel()
  }, [onClosePanel])

  const handleBoundsChange = useCallback((bounds: { x: number; y: number; width: number; height: number }) => {
    if (browserOpen) {
      window.browser.setBounds(bounds)
    }
  }, [browserOpen])

  // ─── Listen for URL changes, title changes, and new tabs from main process ───
  useEffect(() => {
    const cleanupUrl = window.browser.onUrlChanged(({ tabId, url }) => {
      setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, url } : t)))
      if (tabId === activeTabRef.current) {
        setInputValue(url)
        setLoading(false)
      }
    })
    const cleanupTitle = window.browser.onTitleChanged(({ tabId, title }) => {
      setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, title } : t)))
    })
    // ─── Main process created a new tab (from target="_blank" click) ───
    const cleanupTabCreated = window.browser.onTabCreated(({ tabId, url, title }) => {
      tabCounter.current += 1
      setTabs((prev) => [...prev, { id: tabId, url, title }])
      setActiveTabId(tabId)
      setInputValue(url)
    })
    return () => {
      cleanupUrl()
      cleanupTitle()
      cleanupTabCreated()
    }
  }, []) // run once; activeTabRef always current

  // ─── Auto-open browser on mount (blank tab, no auto-load) ───
  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    window.browser.getTabs().then((existing: { id: string; url: string; title: string }[]) => {
      if (existing.length > 0) {
        // Restore existing tabs
        const mapped: Tab[] = existing.map((t) => ({ id: t.id, url: t.url, title: t.title }))
        setTabs(mapped)
        const active = existing[existing.length - 1]
        setActiveTabId(active.id)
        setInputValue(active.url)
        window.browser.switchTab(active.id)
        window.browser.show({
          x: Math.round(window.innerWidth * 0.1),
          y: 60 + 80,
          width: Math.round(window.innerWidth * 0.8),
          height: Math.round(window.innerHeight * 0.8) - 80,
        })
      } else {
        // First time — new blank tab (bookmark page, no auto-load)
        handleNewTab()
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Show browser view when opened ───
  useEffect(() => {
    if (browserOpen) {
      window.browser.show({
        x: Math.round(window.innerWidth * 0.1),
        y: 60 + 80,
        width: Math.round(window.innerWidth * 0.8),
        height: Math.round(window.innerHeight * 0.8) - 80,
      })
    }
    return () => {
      if (browserOpen) window.browser.hide()
    }
  }, [browserOpen])

  return (
    <>
      {/* Floating browser window with tab bar + address bar — WebContentsView in main process */}
      {browserOpen && (
        <FloatingWindow
          onClose={handleClose}
          onBoundsChange={handleBoundsChange}
          tabs={tabs}
          activeTabId={activeTabId}
          onNewTab={() => handleNewTab()}
          onCloseTab={handleCloseTab}
          onSwitchTab={handleSwitchTab}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onGo={handleGo}
          onBack={handleBack}
          onForward={handleForward}
          onReload={handleReload}
          loading={loading}
          focusKey={focusKey}
          bookmarks={BOOKMARKS}
          onBookmarkClick={handleBookmark}
        />
      )}
    </>
  )
}
