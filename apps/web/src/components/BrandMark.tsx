import Image from "next/image";

interface BrandMarkProps {
  size?: "xs" | "sm" | "md" | "lg";
}

const sizes = {
  xs: "h-8 w-8",
  sm: "h-11 w-11",
  md: "h-16 w-16",
  lg: "h-24 w-24",
};

export function BrandMark({ size = "md" }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`${sizes[size]} relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5`}
    >
      <Image
        src="/logo-pgri.png"
        alt=""
        width={192}
        height={192}
        sizes={
          size === "lg"
            ? "96px"
            : size === "md"
              ? "64px"
              : size === "sm"
                ? "44px"
                : "32px"
        }
        className="h-full w-full object-cover"
      />
    </span>
  );
}
