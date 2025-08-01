
import { motion } from 'framer-motion';

export const FormStepper = ({ currentStep, steps }: { currentStep: number, steps: number }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: steps }).map((_, index) => (
        <motion.div
          key={index}
          className="h-2 w-12 rounded-full bg-gray-600"
          animate={{
            backgroundColor: index === currentStep ? '#34d399' : '#4b5563',
          }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
};
