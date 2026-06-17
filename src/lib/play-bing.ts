function playBeepFallback() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.value = 0.12
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + duration)
    }
    playTone(880, ctx.currentTime, 0.12)
    playTone(1174, ctx.currentTime + 0.14, 0.18)
    setTimeout(() => void ctx.close(), 500)
  } catch {}
}

export function playBing() {
  try {
    const audio = new Audio("/notification.wav")
    audio.volume = 0.7
    audio.play().catch(playBeepFallback)
  } catch {
    playBeepFallback()
  }
}
