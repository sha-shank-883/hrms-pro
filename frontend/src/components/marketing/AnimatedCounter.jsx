import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const AnimatedCounter = ({ value, label, suffix }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const numericValue = parseInt(value.replace(/[^0-9.]/g, ''));
  const prefix = value.includes('$') ? '$' : '';
  const hasPlus = value.includes('+');
  const hasPercent = value.includes('%');
  const hasLT = value.includes('<');

  return (
    <div ref={ref} className="text-center">
      <p className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white">
        {hasLT && '< '}
        {prefix}
        <motion.span
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          >
            {isInView ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              >
                {value.replace(/[^0-9.,]/g, '')}
              </motion.span>
            ) : '0'}
          </motion.span>
        </motion.span>
        {hasPlus ? '+' : ''}
        {hasPercent ? '%' : ''}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
};

export default AnimatedCounter;
