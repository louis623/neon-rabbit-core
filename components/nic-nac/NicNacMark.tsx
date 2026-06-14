export function NicNacMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={className ? `sparkle-nic-nac-mark ${className}` : "sparkle-nic-nac-mark"}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.6) }}
    >
      N
    </span>
  );
}
