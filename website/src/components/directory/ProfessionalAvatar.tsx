import type { ProfessionalAvatar as AvatarId } from "@/data/professionals";

type Props = {
  id: AvatarId;
  className?: string;
};

/**
 * Original abstract marks for demonstration profiles.
 * These are not portraits and must not be replaced with photographs of real people.
 */
export function ProfessionalAvatar({ id, className }: Props) {
  return (
    <svg
      viewBox="0 0 72 72"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <rect width="72" height="72" rx="22" fill="rgba(157,204,182,0.14)" />
      {id === "orbit" ? <Orbit /> : null}
      {id === "grove" ? <Grove /> : null}
      {id === "tide" ? <Tide /> : null}
      {id === "lattice" ? <Lattice /> : null}
    </svg>
  );
}

function Orbit() {
  return (
    <g stroke="#9dccb6" strokeWidth="1.7">
      <circle cx="36" cy="36" r="16" />
      <circle cx="36" cy="36" r="6" fill="#9dccb6" stroke="none" />
      <path d="M36 12v8M36 52v8M12 36h8M52 36h8" strokeLinecap="round" />
    </g>
  );
}

function Grove() {
  return (
    <g stroke="#d7efe4" strokeWidth="1.7" strokeLinecap="round">
      <path d="M36 54V30" />
      <path d="M36 40c-10-2-16-10-16-18 8 1 14 6 16 14 2-8 8-13 16-14 0 8-6 16-16 18Z" />
      <path d="M24 54h24" />
    </g>
  );
}

function Tide() {
  return (
    <g stroke="#9dccb6" strokeWidth="1.7" strokeLinecap="round" fill="none">
      <path d="M14 30c6 0 6-6 12-6s6 6 12 6 6-6 12-6 6 6 8 6" />
      <path d="M14 42c6 0 6-6 12-6s6 6 12 6 6-6 12-6 6 6 8 6" />
      <path d="M18 54h36" />
    </g>
  );
}

function Lattice() {
  return (
    <g stroke="#d7efe4" strokeWidth="1.6">
      <rect x="20" y="20" width="32" height="32" rx="8" />
      <path d="M36 20v32M20 36h32" />
      <circle cx="36" cy="36" r="3" fill="#9dccb6" stroke="none" />
    </g>
  );
}
