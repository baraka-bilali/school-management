"use client"

/**
 * Fond ambiant type Copilot/VS Code pour la page login :
 * orbes lumineux + icônes scolaires SVG flottantes.
 */
export default function LoginAmbientBackground({ isDark }: { isDark: boolean }) {
  const ink = isDark ? "rgba(129, 140, 248, 0.22)" : "rgba(79, 70, 229, 0.16)"
  const inkSoft = isDark ? "rgba(165, 180, 252, 0.14)" : "rgba(99, 102, 241, 0.12)"

  return (
    <div
      className="login-ambient pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* Orbes diffus (style Copilot) */}
      <div
        className={`login-orb login-orb-a absolute -left-[12%] top-[8%] h-[42vmin] w-[42vmin] rounded-full blur-3xl ${
          isDark ? "bg-indigo-500/25" : "bg-indigo-400/20"
        }`}
      />
      <div
        className={`login-orb login-orb-b absolute -right-[8%] top-[42%] h-[38vmin] w-[38vmin] rounded-full blur-3xl ${
          isDark ? "bg-sky-500/20" : "bg-sky-400/18"
        }`}
      />
      <div
        className={`login-orb login-orb-c absolute left-[28%] -bottom-[18%] h-[48vmin] w-[48vmin] rounded-full blur-3xl ${
          isDark ? "bg-violet-500/15" : "bg-blue-400/14"
        }`}
      />

      {/* Lueur centrale douce */}
      <div
        className={`absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${
          isDark ? "bg-indigo-400/10" : "bg-indigo-300/15"
        }`}
      />

      {/* Grille très légère */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: isDark
            ? "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)"
            : "radial-gradient(rgba(15,23,42,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 75%)",
        }}
      />

      {/* Icônes scolaires SVG */}
      <svg
        className="login-float login-float-1 absolute left-[6%] top-[14%] h-14 w-14 sm:h-16 sm:w-16"
        viewBox="0 0 64 64"
        fill="none"
      >
        {/* Règle / latte */}
        <rect x="10" y="28" width="44" height="10" rx="2" stroke={ink} strokeWidth="1.6" />
        <path d="M16 28v10M22 28v6M28 28v10M34 28v6M40 28v10M46 28v6" stroke={inkSoft} strokeWidth="1.2" />
      </svg>

      <svg
        className="login-float login-float-2 absolute right-[8%] top-[18%] h-12 w-12 sm:h-14 sm:w-14"
        viewBox="0 0 64 64"
        fill="none"
      >
        {/* Équerre */}
        <path
          d="M14 50V14h8v28h28v8H14z"
          stroke={ink}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M26 42h12" stroke={inkSoft} strokeWidth="1.2" />
      </svg>

      <svg
        className="login-float login-float-3 absolute left-[10%] bottom-[18%] h-12 w-12 sm:h-14 sm:w-14"
        viewBox="0 0 64 64"
        fill="none"
      >
        {/* Crayon */}
        <path
          d="M40 12l12 12-28 28H12V40L40 12z"
          stroke={ink}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M36 16l12 12" stroke={inkSoft} strokeWidth="1.2" />
        <path d="M14 50l6-2 2 6" stroke={ink} strokeWidth="1.4" strokeLinejoin="round" />
      </svg>

      <svg
        className="login-float login-float-4 absolute right-[7%] bottom-[22%] h-12 w-12 sm:h-14 sm:w-14"
        viewBox="0 0 64 64"
        fill="none"
      >
        {/* Calculatrice */}
        <rect x="16" y="10" width="32" height="44" rx="4" stroke={ink} strokeWidth="1.6" />
        <rect x="22" y="16" width="20" height="8" rx="1.5" stroke={inkSoft} strokeWidth="1.2" />
        <circle cx="24" cy="34" r="2" fill={inkSoft} />
        <circle cx="32" cy="34" r="2" fill={inkSoft} />
        <circle cx="40" cy="34" r="2" fill={inkSoft} />
        <circle cx="24" cy="42" r="2" fill={inkSoft} />
        <circle cx="32" cy="42" r="2" fill={inkSoft} />
        <circle cx="40" cy="42" r="2" fill={inkSoft} />
      </svg>

      <svg
        className="login-float login-float-5 absolute left-[42%] top-[8%] h-11 w-11 sm:h-12 sm:w-12"
        viewBox="0 0 64 64"
        fill="none"
      >
        {/* Intégrale ∫ */}
        <path
          d="M38 12c0-4-3-6-6-6s-6 2-6 6c0 2 1 4 2 6L36 46c1 2 2 4 2 6 0 4-3 6-6 6s-6-2-6-6"
          stroke={ink}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <svg
        className="login-float login-float-6 absolute right-[28%] top-[72%] h-12 w-12 sm:h-14 sm:w-14"
        viewBox="0 0 64 64"
        fill="none"
      >
        {/* Livre ouvert */}
        <path
          d="M32 18c-6-4-14-5-18-5v32c6 0 12 1 18 5 6-4 12-5 18-5V13c-4 0-12 1-18 5z"
          stroke={ink}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M32 18v32" stroke={inkSoft} strokeWidth="1.2" />
      </svg>

      <svg
        className="login-float login-float-7 absolute left-[22%] top-[68%] h-10 w-10 sm:h-12 sm:w-12"
        viewBox="0 0 64 64"
        fill="none"
      >
        {/* Compas */}
        <circle cx="32" cy="14" r="4" stroke={ink} strokeWidth="1.5" />
        <path d="M32 18L18 52M32 18l14 34" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M22 42h20" stroke={inkSoft} strokeWidth="1.2" />
      </svg>

      <svg
        className="login-float login-float-8 absolute right-[18%] top-[48%] h-10 w-10"
        viewBox="0 0 64 64"
        fill="none"
      >
        {/* Atome / science */}
        <circle cx="32" cy="32" r="3.5" fill={inkSoft} />
        <ellipse cx="32" cy="32" rx="18" ry="8" stroke={ink} strokeWidth="1.4" />
        <ellipse
          cx="32"
          cy="32"
          rx="18"
          ry="8"
          stroke={ink}
          strokeWidth="1.4"
          transform="rotate(60 32 32)"
        />
        <ellipse
          cx="32"
          cy="32"
          rx="18"
          ry="8"
          stroke={ink}
          strokeWidth="1.4"
          transform="rotate(-60 32 32)"
        />
      </svg>
    </div>
  )
}
