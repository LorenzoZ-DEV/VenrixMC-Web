import clsx from "clsx";
import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type CommonProps = {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
};

const variantClass: Record<NonNullable<CommonProps["variant"]>, string> = {
  primary: "pixel-btn-primary",
  secondary: "pixel-btn-secondary",
  ghost: "pixel-btn-ghost",
  danger: "pixel-btn-danger",
};

// Taglie ricalibrate sul font proporzionale: il vecchio set (9/10/11px)
// serviva al pixel font maiuscolo, illeggibile con Space Grotesk.
const sizeClass: Record<NonNullable<CommonProps["size"]>, string> = {
  sm: "px-4 py-2 text-[13px]",
  md: "px-5 py-2.5 text-[15px]",
  lg: "px-8 py-3.5 text-[17px]",
};

function baseClasses(variant: CommonProps["variant"] = "primary", size: CommonProps["size"] = "md") {
  return clsx(variantClass[variant], sizeClass[size]);
}

export function Button({
  variant,
  size,
  className,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={clsx(baseClasses(variant, size), className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant,
  size,
  className,
  children,
  external,
}: CommonProps & { href: string; external?: boolean }) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(baseClasses(variant, size), className)}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={clsx(baseClasses(variant, size), className)}>
      {children}
    </Link>
  );
}
