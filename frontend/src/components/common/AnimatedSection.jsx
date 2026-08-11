import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const fadeInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  hidden: {},
  visible: (i = 0) => ({
    transition: { staggerChildren: 0.08, delayChildren: i * 0.1 },
  }),
};

const variants = { fadeInUp, fadeInLeft, fadeInRight, fadeInScale, stagger };

export function AnimatedSection({ children, className, variant = 'fadeInUp', delay = 0, once = true, ...props }) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-60px' }}
      variants={variants[variant]}
      custom={delay}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function AnimatedDiv({ children, className, variant = 'fadeInUp', delay = 0, once = true, ...props }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-40px' }}
      variants={variants[variant]}
      custom={delay}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({ children, className, delay = 0, ...props }) {
  return (
    <motion.div
      variants={fadeInUp}
      custom={delay}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className, delay = 0, once = true, ...props }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-40px' }}
      variants={stagger}
      custom={delay}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
};

export function PageWrapper({ children, className, ...props }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export { fadeInUp, fadeInLeft, fadeInRight, fadeInScale, stagger };
