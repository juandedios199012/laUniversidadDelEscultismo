/**
 * Stepper Component for Multi-Step Forms
 * Accessible wizard navigation with progress indication
 */

import { ReactNode } from "react";
import { Check, ChevronRight, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================
// Types
// ============================================

export interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowNavigation?: boolean;
  orientation?: "horizontal" | "vertical";
}

interface StepIndicatorProps {
  step: Step;
  stepIndex: number;
  currentStep: number;
  isLast: boolean;
  onClick?: () => void;
  allowNavigation: boolean;
  orientation: "horizontal" | "vertical";
}

// ============================================
// Step Indicator Component
// ============================================

function StepIndicator({
  step,
  stepIndex,
  currentStep,
  isLast,
  onClick,
  allowNavigation,
  orientation,
}: StepIndicatorProps) {
  const isCompleted = stepIndex < currentStep;
  const isCurrent = stepIndex === currentStep;
  const isClickable = allowNavigation && (isCompleted || isCurrent);

  return (
    <div
      className={cn(
        "flex items-center",
        orientation === "vertical" && "flex-col items-start"
      )}
    >
      <button
        type="button"
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        className={cn(
          "flex items-center gap-3",
          isClickable && "cursor-pointer",
          !isClickable && "cursor-default"
        )}
        aria-current={isCurrent ? "step" : undefined}
      >
        {/* Circle Indicator */}
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
            isCompleted && "bg-primary border-primary text-primary-foreground",
            isCurrent && "border-primary text-primary bg-primary/10",
            !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
          )}
        >
          {isCompleted ? (
            <Check className="h-5 w-5" />
          ) : (
            <span className="text-sm font-semibold">{stepIndex + 1}</span>
          )}
        </div>

        {/* Text */}
        <div className="text-left">
          <p
            className={cn(
              "text-sm font-medium",
              isCurrent && "text-primary",
              !isCurrent && !isCompleted && "text-muted-foreground"
            )}
          >
            {step.title}
          </p>
          {step.description && (
            <p className="text-xs text-muted-foreground hidden sm:block">
              {step.description}
            </p>
          )}
        </div>
      </button>

      {/* Connector Line */}
      {!isLast && (
        <div
          className={cn(
            "flex-1 mx-4",
            orientation === "horizontal" && "hidden sm:flex items-center",
            orientation === "vertical" && "w-px h-8 ml-5 my-2"
          )}
        >
          {orientation === "horizontal" ? (
            <ChevronRight
              className={cn(
                "h-5 w-5",
                isCompleted ? "text-primary" : "text-muted-foreground/30"
              )}
            />
          ) : (
            <div
              className={cn(
                "w-full h-full",
                isCompleted ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Stepper Component
// ============================================

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  allowNavigation = true,
  orientation = "horizontal",
}: StepperProps) {
  return (
    <nav aria-label="Progreso del formulario">
      <ol
        className={cn(
          "flex",
          orientation === "horizontal" && "flex-row items-center justify-between",
          orientation === "vertical" && "flex-col"
        )}
      >
        {steps.map((step, index) => (
          <li key={step.id} className="flex-1">
            <StepIndicator
              step={step}
              stepIndex={index}
              currentStep={currentStep}
              isLast={index === steps.length - 1}
              onClick={() => onStepClick?.(index)}
              allowNavigation={allowNavigation}
              orientation={orientation}
            />
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ============================================
// Step Content Wrapper
// ============================================

interface StepContentProps {
  children: ReactNode;
  step: number;
  currentStep: number;
}

export function StepContent({ children, step, currentStep }: StepContentProps) {
  if (step !== currentStep) return null;
  
  return (
    <div
      className="animate-in fade-in-50 slide-in-from-right-10 duration-300"
      role="tabpanel"
      aria-labelledby={`step-${step}`}
    >
      {children}
    </div>
  );
}

// ============================================
// Step Actions
// ============================================

interface StepActionsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  nextLabel?: string;
  submitLabel?: string;
}

export function StepActions({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting = false,
  nextLabel = "Siguiente",
  submitLabel = "Guardar",
}: StepActionsProps) {
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep || isSubmitting}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Anterior
      </Button>

      {isLastStep ? (
        <Button
          type="button"
          onClick={onSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          <Save className="h-4 w-4 mr-2" />
          {submitLabel}
        </Button>
      ) : (
        <Button type="button" onClick={onNext} disabled={isSubmitting}>
          {nextLabel}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  );
}
