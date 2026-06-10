'use client';

import styles from '../booking.module.css';

type StepperProps = {
  labels: string[];
  currentStep: number;
  onStepChange: (step: number) => void;
};

export default function Stepper({ labels, currentStep, onStepChange }: StepperProps) {
  return (
    <ol className={styles.stepper}>
      {labels.map((label, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;

        return (
          <li key={label} className={`${styles.stepperItem} ${isActive ? styles.stepperItemActive : ''}`}>
            <button
              type="button"
              className={styles.stepperButton}
              onClick={() => {
                if (index <= currentStep) {
                  onStepChange(index);
                }
              }}
            >
              <span className={`${styles.stepNumber} ${isActive ? styles.stepNumberActive : ''}`}>
                {index + 1}
              </span>
              <span className={styles.stepText}>
                <span className={styles.stepLabel}>{label}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
