"use client"

type SchoolIcon = {
  id: string
  className: string
  paths: (ink: string, inkSoft: string) => React.ReactNode
}

const ICONS: SchoolIcon[] = [
  {
    id: "ruler",
    className: "login-float login-float-1 absolute left-[5%] top-[12%] h-14 w-14 sm:h-16 sm:w-16",
    paths: (ink, soft) => (
      <>
        <rect x="10" y="28" width="44" height="10" rx="2" stroke={ink} strokeWidth="1.6" />
        <path d="M16 28v10M22 28v6M28 28v10M34 28v6M40 28v10M46 28v6" stroke={soft} strokeWidth="1.2" />
      </>
    ),
  },
  {
    id: "setsquare",
    className: "login-float login-float-2 absolute right-[6%] top-[14%] h-12 w-12 sm:h-14 sm:w-14",
    paths: (ink, soft) => (
      <>
        <path d="M14 50V14h8v28h28v8H14z" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M26 42h12" stroke={soft} strokeWidth="1.2" />
      </>
    ),
  },
  {
    id: "pencil",
    className: "login-float login-float-3 absolute left-[8%] bottom-[16%] h-12 w-12 sm:h-14 sm:w-14",
    paths: (ink, soft) => (
      <>
        <path d="M40 12l12 12-28 28H12V40L40 12z" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M36 16l12 12" stroke={soft} strokeWidth="1.2" />
        <path d="M14 50l6-2 2 6" stroke={ink} strokeWidth="1.4" strokeLinejoin="round" />
      </>
    ),
  },
  {
    id: "calculator",
    className: "login-float login-float-4 absolute right-[5%] bottom-[18%] h-12 w-12 sm:h-14 sm:w-14",
    paths: (ink, soft) => (
      <>
        <rect x="16" y="10" width="32" height="44" rx="4" stroke={ink} strokeWidth="1.6" />
        <rect x="22" y="16" width="20" height="8" rx="1.5" stroke={soft} strokeWidth="1.2" />
        <circle cx="24" cy="34" r="2" fill={soft} />
        <circle cx="32" cy="34" r="2" fill={soft} />
        <circle cx="40" cy="34" r="2" fill={soft} />
        <circle cx="24" cy="42" r="2" fill={soft} />
        <circle cx="32" cy="42" r="2" fill={soft} />
        <circle cx="40" cy="42" r="2" fill={soft} />
      </>
    ),
  },
  {
    id: "integral",
    className: "login-float login-float-5 absolute left-[44%] top-[6%] h-11 w-11 sm:h-12 sm:w-12",
    paths: (ink) => (
      <path
        d="M38 12c0-4-3-6-6-6s-6 2-6 6c0 2 1 4 2 6L36 46c1 2 2 4 2 6 0 4-3 6-6 6s-6-2-6-6"
        stroke={ink}
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
  },
  {
    id: "book",
    className: "login-float login-float-6 absolute right-[26%] top-[74%] h-12 w-12 sm:h-14 sm:w-14",
    paths: (ink, soft) => (
      <>
        <path
          d="M32 18c-6-4-14-5-18-5v32c6 0 12 1 18 5 6-4 12-5 18-5V13c-4 0-12 1-18 5z"
          stroke={ink}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M32 18v32" stroke={soft} strokeWidth="1.2" />
      </>
    ),
  },
  {
    id: "compass",
    className: "login-float login-float-7 absolute left-[20%] top-[70%] h-10 w-10 sm:h-12 sm:w-12",
    paths: (ink, soft) => (
      <>
        <circle cx="32" cy="14" r="4" stroke={ink} strokeWidth="1.5" />
        <path d="M32 18L18 52M32 18l14 34" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M22 42h20" stroke={soft} strokeWidth="1.2" />
      </>
    ),
  },
  {
    id: "atom",
    className: "login-float login-float-8 absolute right-[16%] top-[46%] h-10 w-10 sm:h-11 sm:w-11",
    paths: (ink, soft) => (
      <>
        <circle cx="32" cy="32" r="3.5" fill={soft} />
        <ellipse cx="32" cy="32" rx="18" ry="8" stroke={ink} strokeWidth="1.4" />
        <ellipse cx="32" cy="32" rx="18" ry="8" stroke={ink} strokeWidth="1.4" transform="rotate(60 32 32)" />
        <ellipse cx="32" cy="32" rx="18" ry="8" stroke={ink} strokeWidth="1.4" transform="rotate(-60 32 32)" />
      </>
    ),
  },
  {
    id: "protractor",
    className: "login-float login-float-9 absolute left-[28%] top-[18%] h-11 w-11 sm:h-12 sm:w-12",
    paths: (ink, soft) => (
      <>
        <path d="M10 42h44A22 22 0 0 0 10 42z" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M18 42a14 14 0 0 1 28 0" stroke={soft} strokeWidth="1.2" />
        <path d="M32 42V28" stroke={soft} strokeWidth="1.2" />
      </>
    ),
  },
  {
    id: "globe",
    className: "login-float login-float-10 absolute right-[38%] top-[10%] h-10 w-10 sm:h-12 sm:w-12",
    paths: (ink, soft) => (
      <>
        <circle cx="32" cy="30" r="16" stroke={ink} strokeWidth="1.6" />
        <ellipse cx="32" cy="30" rx="7" ry="16" stroke={soft} strokeWidth="1.2" />
        <path d="M16 30h32M18 22h28M18 38h28" stroke={soft} strokeWidth="1.1" />
        <path d="M22 48h20" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "flask",
    className: "login-float login-float-11 absolute left-[3%] top-[42%] h-11 w-11 sm:h-12 sm:w-12",
    paths: (ink, soft) => (
      <>
        <path d="M26 10h12v16l12 22a8 8 0 0 1-7 12H21a8 8 0 0 1-7-12l12-22V10z" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M22 14h20" stroke={soft} strokeWidth="1.2" />
        <path d="M18 42h28" stroke={soft} strokeWidth="1.2" />
      </>
    ),
  },
  {
    id: "pi",
    className: "login-float login-float-12 absolute right-[3%] top-[32%] h-10 w-10 sm:h-11 sm:w-11",
    paths: (ink) => (
      <path
        d="M16 20h32M24 20v28M40 20c0 10 2 18-6 28"
        stroke={ink}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: "abacus",
    className: "login-float login-float-13 absolute left-[36%] bottom-[10%] h-11 w-11 sm:h-12 sm:w-12",
    paths: (ink, soft) => (
      <>
        <rect x="12" y="12" width="40" height="40" rx="3" stroke={ink} strokeWidth="1.6" />
        <path d="M20 12v40M32 12v40M44 12v40" stroke={soft} strokeWidth="1.1" />
        <circle cx="20" cy="22" r="3" fill={soft} />
        <circle cx="20" cy="36" r="3" fill={soft} />
        <circle cx="32" cy="28" r="3" fill={soft} />
        <circle cx="44" cy="20" r="3" fill={soft} />
        <circle cx="44" cy="40" r="3" fill={soft} />
      </>
    ),
  },
  {
    id: "backpack",
    className: "login-float login-float-14 absolute right-[12%] top-[64%] h-10 w-10 sm:h-11 sm:w-11",
    paths: (ink, soft) => (
      <>
        <path d="M20 24h24v28a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V24z" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M24 24v-4a8 8 0 0 1 16 0v4" stroke={ink} strokeWidth="1.5" />
        <path d="M24 36h16" stroke={soft} strokeWidth="1.2" />
        <rect x="28" y="40" width="8" height="6" rx="1" stroke={soft} strokeWidth="1.1" />
      </>
    ),
  },
  {
    id: "chalk",
    className: "login-float login-float-15 absolute left-[14%] top-[32%] h-9 w-9 sm:h-10 sm:w-10",
    paths: (ink, soft) => (
      <>
        <rect x="14" y="14" width="36" height="28" rx="2" stroke={ink} strokeWidth="1.6" />
        <path d="M20 24h12M20 30h20M20 36h10" stroke={soft} strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "graduation",
    className: "login-float login-float-16 absolute right-[22%] top-[28%] h-11 w-11 sm:h-12 sm:w-12",
    paths: (ink, soft) => (
      <>
        <path d="M8 26l24-12 24 12-24 12L8 26z" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M16 30v10c6 4 14 6 16 6s10-2 16-6V30" stroke={ink} strokeWidth="1.5" />
        <path d="M56 26v14" stroke={soft} strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="56" cy="42" r="2.5" fill={soft} />
      </>
    ),
  },
  {
    id: "triangle",
    className: "login-float login-float-1 absolute left-[48%] top-[58%] h-9 w-9 sm:h-10 sm:w-10",
    paths: (ink, soft) => (
      <>
        <path d="M32 12L52 48H12L32 12z" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M32 22v18M24 40h16" stroke={soft} strokeWidth="1.1" />
      </>
    ),
  },
  {
    id: "microscope",
    className: "login-float login-float-9 absolute left-[58%] bottom-[14%] h-10 w-10 sm:h-11 sm:w-11",
    paths: (ink, soft) => (
      <>
        <path d="M28 12h8v16l10 14H18l10-14V12z" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M16 52h32" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M24 42v10M40 42v10" stroke={soft} strokeWidth="1.2" />
        <circle cx="32" cy="20" r="3" stroke={soft} strokeWidth="1.1" />
      </>
    ),
  },
  {
    id: "pen",
    className: "login-float login-float-11 absolute right-[44%] top-[40%] h-9 w-9 sm:h-10 sm:w-10",
    paths: (ink, soft) => (
      <>
        <path d="M14 42l8 8 28-28-8-8-28 28z" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M38 18l8 8" stroke={soft} strokeWidth="1.2" />
        <path d="M14 42l4 4" stroke={soft} strokeWidth="1.2" />
      </>
    ),
  },
  {
    id: "sigma",
    className: "login-float login-float-13 absolute left-[70%] top-[58%] h-9 w-9 sm:h-10 sm:w-10",
    paths: (ink) => (
      <path
        d="M46 14H18l16 18L18 50h28"
        stroke={ink}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
]

/**
 * Fond ambiant type Copilot/VS Code pour la page login :
 * orbes lumineux + icônes scolaires SVG flottantes.
 */
export default function LoginAmbientBackground({ isDark }: { isDark: boolean }) {
  const ink = isDark ? "rgba(129, 140, 248, 0.24)" : "rgba(79, 70, 229, 0.18)"
  const inkSoft = isDark ? "rgba(165, 180, 252, 0.16)" : "rgba(99, 102, 241, 0.13)"

  return (
    <div
      className="login-ambient pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className={`absolute inset-0 ${isDark ? "bg-gray-900" : "bg-[#eef2f9]"}`} />

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

      <div
        className={`absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${
          isDark ? "bg-indigo-400/10" : "bg-indigo-300/15"
        }`}
      />

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

      {ICONS.map((icon) => (
        <svg
          key={icon.id}
          className={icon.className}
          viewBox="0 0 64 64"
          fill="none"
        >
          {icon.paths(ink, inkSoft)}
        </svg>
      ))}
    </div>
  )
}
