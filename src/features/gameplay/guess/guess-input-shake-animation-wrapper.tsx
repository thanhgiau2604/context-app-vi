import { motion, useAnimation } from "motion/react";
import { useImperativeHandle, forwardRef } from "react";

type ShakeHandle = { shake: () => void };

// Imperative shake wrapper — call ref.current.shake() on unknown-word submit
export const GuessInputShakeWrapper = forwardRef<ShakeHandle, { children: React.ReactNode }>(
  ({ children }, ref) => {
    const controls = useAnimation();
    useImperativeHandle(ref, () => ({
      shake: async () => {
        await controls.start({ x: [-5, 5, -4, 4, -2, 0], transition: { duration: 0.35 } });
      },
    }));
    return <motion.div animate={controls}>{children}</motion.div>;
  },
);

GuessInputShakeWrapper.displayName = "GuessInputShakeWrapper";
