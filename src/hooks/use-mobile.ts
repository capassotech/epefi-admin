import { useEffect, useState } from "react"

const DEFAULT_BREAKPOINT = 768

export function useIsMobile(breakpoint: number = DEFAULT_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches
  })

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`)

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches)
    }

    handleChange(mediaQuery)

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }

    // Fallback for older browsers
    // eslint-disable-next-line deprecation/deprecation
    mediaQuery.addListener(handleChange)
    // eslint-disable-next-line deprecation/deprecation
    return () => mediaQuery.removeListener(handleChange)
  }, [breakpoint])

  return isMobile
}
