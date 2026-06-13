import { colorFromString, initials } from '@/lib/utils';

export function Avatar({
  first,
  last,
  seed,
  size = 32,
}: {
  first: string;
  last: string;
  seed?: string;
  size?: number;
}) {
  const bg = colorFromString(seed ?? `${first}${last}`);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ background: bg, width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(first, last)}
    </span>
  );
}
