import Link from "next/link";

/** Static logo from /public — plain img avoids Next/Image sizing issues with w-auto */
export function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center shrink-0 py-1"
      aria-label="Saido home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/saido-logo.png"
        alt="Saido"
        width={110}
        height={36}
        className="block h-8 w-auto sm:h-9 max-w-[min(160px,40vw)] object-contain object-left"
        fetchPriority="high"
      />
    </Link>
  );
}
