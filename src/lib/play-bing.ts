export function playBing() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const t = ctx.currentTime

    // "TING" — high note
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.type = "sine"
    osc1.frequency.setValueAtTime(1400, t)
    osc1.frequency.exponentialRampToValueAtTime(1200, t + 0.08)
    gain1.gain.setValueAtTime(0.3, t)
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc1.start(t)
    osc1.stop(t + 0.35)

    // "DONG" — low note, delayed
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = "sine"
    osc2.frequency.setValueAtTime(700, t + 0.18)
    osc2.frequency.exponentialRampToValueAtTime(550, t + 0.5)
    gain2.gain.setValueAtTime(0.0, t)
    gain2.gain.setValueAtTime(0.25, t + 0.18)
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
    osc2.start(t)
    osc2.stop(t + 0.9)
  } catch {}
}
