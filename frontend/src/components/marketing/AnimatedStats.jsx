import React from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

const AnimatedStats = ({ stats }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-wrap items-center justify-center gap-8 lg:gap-12"
    >
      {stats.map((stat) => (
        <AnimatedCounter key={stat.label} value={stat.value} label={stat.label} />
      ))}
    </motion.div>
  );
};

export default AnimatedStats;
