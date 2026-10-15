import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { ArrowUpRight, LoaderCircle } from "lucide-react";

export function Button({
  children,
  variant = "gold",
  busy,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "outline" | "ghost";
  busy?: boolean;
}) {
  return (
    <button
      className={`button button-${variant} ${className}`}
      {...props}
      disabled={props.disabled || busy}
    >
      {busy && <LoaderCircle className="spin" size={17} />}
      {children}
    </button>
  );
}
export function ButtonLink({
  children,
  variant = "gold",
  className = "",
  ...props
}: LinkProps & { variant?: "gold" | "outline" | "ghost" }) {
  return (
    <Link className={`button button-${variant} ${className}`} {...props}>
      {children}
    </Link>
  );
}
export function TextLink({ children, ...props }: LinkProps) {
  return (
    <Link className="text-link" {...props}>
      {children}
      <ArrowUpRight size={17} />
    </Link>
  );
}
export function Field({
  label,
  htmlFor,
  error,
  children,
  optional,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>
        {label}
        {optional && <span className="optional">Optional</span>}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="eyebrow">
      <span />
      {children}
    </p>
  );
}
