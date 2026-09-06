import { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  threshold?: number;
}

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (staggerDelay = 0.12) => ({
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.05
    }
  })
};

export const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 36,
    scale: 0.96,
    filter: 'blur(4px)'
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

export function ScrollReveal({
  children,
  className = '',
  staggerDelay = 0.12,
  threshold = 0.15
}: ScrollRevealProps) {
  return (
    <motion.div
      variants={containerVariants}
      custom={staggerDelay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ScrollRevealItemProps {
  children: ReactNode;
  className?: string;
}

export function ScrollRevealItem({ children, className = '' }: ScrollRevealItemProps) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

export default ScrollReveal;
