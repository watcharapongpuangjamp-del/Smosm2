import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'rectangle';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangle',
  width,
  height,
}) => {
  const baseClasses = 'animate-pulse bg-slate-200 rounded-xl';

  const variantClasses = {
    text: 'h-4 w-full rounded-md',
    card: 'h-32 w-full rounded-2xl',
    circle: 'rounded-full',
    rectangle: 'rounded-xl',
  };

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      className={clsx(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
};
