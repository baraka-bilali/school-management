export function playBing() {
  try {
    const audio = new Audio("/notification.wav")
    audio.volume = 0.7
    audio.play().catch(() => {})
  } catch {}
}
