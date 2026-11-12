import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface TappableProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

export const Tappable: React.FC<TappableProps> = ({ 
  children, 
  scale = 0.97, 
  className, 
  ...props 
}) => {
  return (
    <motion.div
      whileTap={{ scale }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const TapButton: React.FC<HTMLMotionProps<'button'>> = ({ 
  children, 
  ...props 
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};
