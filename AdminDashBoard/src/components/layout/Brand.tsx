export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-monogram">
        A<span />
      </span>
      {!compact && (
        <div>
          <strong>AUREL</strong>
          <small>FLEET MANAGEMENT</small>
        </div>
      )}
    </div>
  );
}
export function VehicleIllustration() {
  return (
    <svg
      className="vehicle-illustration"
      viewBox="0 0 800 350"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="body"
          x1="350"
          y1="100"
          x2="400"
          y2="290"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#777a7b" />
          <stop offset=".24" stopColor="#2e3336" />
          <stop offset=".7" stopColor="#171b20" />
          <stop offset="1" stopColor="#353b3e" />
        </linearGradient>
        <linearGradient
          id="glass"
          x1="350"
          y1="80"
          x2="400"
          y2="180"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3c464b" />
          <stop offset="1" stopColor="#0e1317" />
        </linearGradient>
        <radialGradient id="wheel">
          <stop stopColor="#777" />
          <stop offset=".17" stopColor="#24292c" />
          <stop offset=".7" stopColor="#414649" />
          <stop offset=".74" stopColor="#101315" />
          <stop offset="1" stopColor="#050608" />
        </radialGradient>
      </defs>
      <ellipse cx="411" cy="288" rx="340" ry="18" fill="#000" opacity=".5" />
      <path
        d="M69 237 87 198 184 174 274 112Q304 91 356 94L465 101Q493 103 535 145L564 172 686 194 735 223 730 259 672 270 138 269 66 251Z"
        fill="url(#body)"
        stroke="#717477"
        strokeWidth="1.3"
      />
      <path
        d="m202 172 86-53q20-13 52-13l42 2 1 64Zm192-63 67 4q30 3 61 37l22 22H397Z"
        fill="url(#glass)"
        stroke="#7d807d"
      />
      <path
        d="M95 205q220-32 451-21l161 31M178 233h352l114-18M382 181l1 64M543 181l9 64"
        stroke="#8b8b82"
        strokeOpacity=".35"
      />
      <path
        d="m87 203 83-10-14 13-74 12M668 206l46 15 7 8-57-10"
        fill="#e1d5ac"
      />
      <path d="m87 203 83-10" stroke="#f8e8b0" strokeWidth="3" />
      <circle cx="200" cy="251" r="46" fill="#0b0d0f" />
      <circle cx="200" cy="251" r="38" fill="url(#wheel)" stroke="#686b69" />
      <circle cx="622" cy="251" r="46" fill="#0b0d0f" />
      <circle cx="622" cy="251" r="38" fill="url(#wheel)" stroke="#686b69" />
      {[200, 622].map((x) => (
        <g key={x} stroke="#959994" strokeWidth="3">
          {[0, 60, 120].map((angle) => (
            <path
              key={angle}
              d={`M${x} 221v60`}
              transform={`rotate(${angle} ${x} 251)`}
            />
          ))}
          <circle cx={x} cy="251" r="8" fill="#202629" />
        </g>
      ))}
      <path d="M280 190h25m126 0h25" stroke="#c1beb0" strokeWidth="3" />
      <path d="m70 244 65 8m552-5 42-9" stroke="#070a0d" strokeWidth="10" />
    </svg>
  );
}
