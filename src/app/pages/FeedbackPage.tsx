import { motion } from "motion/react";
import { LaundryFeedbackForm } from "@/app/components/LaundryFeedbackForm";

export function FeedbackPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="min-h-screen flex items-start justify-center"
    >
      <div className="w-full max-w-[420px] min-h-screen relative overflow-x-hidden">
        <LaundryFeedbackForm />
      </div>
    </motion.div>
  );
}
