"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Płynne wejście ekranu (jak w iOS) przy każdej zmianie panelu. */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
    >
      {children}
    </motion.div>
  );
}
