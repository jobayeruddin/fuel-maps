"use client";

import * as React from "react";

type Size = "sm" | "md" | "lg" | "xl";

interface LoadingSpinnerProps {
  size?: Size;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses: Record<Size, string> = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        className={`${sizeClasses[size]} animate-spin text-primary`}
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: "text" | "title" | "card";
  lines?: number;
}

export function Skeleton({
  className = "",
  variant = "text",
  lines = 1,
}: SkeletonProps) {
  if (variant === "card") {
    return (
      <div
        className={`rounded-card bg-surface border border-border p-6 ${className}`}
      >
        <div className="space-y-4">
          <div className="h-6 bg-background border border-border rounded animate-pulse w-3/4" />
          <div className="h-4 bg-background border border-border rounded animate-pulse w-1/2" />
          {Array.from({ length: Math.max(lines - 2, 0) }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-background border border-border rounded animate-pulse w-full"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-background border border-border rounded animate-pulse ${
            variant === "text"
              ? "w-3/4"
              : variant === "title"
                ? "w-1/2"
                : "w-full"
          }`}
        />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-card bg-surface border border-border p-12 text-center ${className}`}
    >
      {icon && (
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary mb-6">{description}</p>
      )}
      {actionLabel && actionHref && (
        <a
          className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
          href={actionHref}
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`rounded-card bg-surface border border-red-500/20 p-8 text-center ${className}`}
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary mb-6">{description}</p>
      )}
      {onRetry && (
        <button
          className="inline-flex items-center rounded-pill bg-primary px-6 py-2 text-sm font-medium text-black hover:opacity-90 transition-opacity"
          onClick={onRetry}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  children: React.ReactNode;
  isLoading: boolean;
}

export function LoadingOverlay({ children, isLoading }: LoadingOverlayProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative min-h-[200px]">
      <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
        <LoadingSpinner size="lg" />
      </div>
      <div className="opacity-50 pointer-events-none">{children}</div>
    </div>
  );
}
