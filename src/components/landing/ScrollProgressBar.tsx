import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[100] pointer-events-none bg-transparent">
      <motion.div
        className="h-full origin-left bg-gradient-to-r from-teal-400 via-primary to-cyan-400 shadow-[0_0_12px_rgba(20,184,166,0.8)]"
        style={{ scaleX }}
      />
    </div>
  );
}

export default ScrollProgressBar;
