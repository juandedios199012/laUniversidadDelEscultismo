/**
 * Vertical Stepper Component for Multi-Step Forms
 * 
 * Features:
 * - Visual progress indicator
 * - Step states: pending, current, completed, error
 * - Click navigation between steps
 * - Progress bar
 */

import { cn } from "@/lib/utils";
import { Check, AlertCircle, LucideIcon } from "lucide-react";

export interface StepConfig {
  id: string;
  title: string;
  icon: LucideIcon;
  description?: string;
}

export type StepStatus = "pending" | "current" | "completed" | "error";

interface VerticalStepperProps {
  steps: StepConfig[];
  currentStep: number;
  stepStatuses: Record<string, StepStatus>;
  onStepClick: (stepIndex: number) => void;
  completedSteps: number;
}

export function VerticalStepper({
  steps,
  currentStep,
  stepStatuses,
  onStepClick,
  completedSteps,
}: VerticalStepperProps) {
  const progressPercentage = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="w-64 flex-shrink-0 bg-card border-r border-border p-4 flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Pasos del Registro
        </h3>
      </div>

      {/* Steps */}
      <nav className="flex-1 space-y-1">
        {steps.map((step, index) => {
          const status = stepStatuses[step.id] || "pending";
          const isActive = index === currentStep;
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => onStepClick(index)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all",
                "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                isActive && "bg-primary/10 border border-primary/30",
                !isActive && "border border-transparent"
              )}
            >
              {/* Step Indicator */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                  status === "completed" && "bg-green-500 text-white",
                  status === "current" && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                  status === "error" && "bg-red-500 text-white",
                  status === "pending" && "bg-muted text-muted-foreground"
                )}
              >
                {status === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : status === "error" ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    isActive && "text-primary",
                    status === "completed" && "text-green-600",
                    status === "error" && "text-red-600",
                    status === "pending" && !isActive && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Status Badge */}
              {status === "completed" && !isActive && (
                <span className="text-xs text-green-600 font-medium">✓</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Progress Section */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Progreso</span>
          <span className="text-sm font-medium text-foreground">
            {completedSteps}/{steps.length}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {progressPercentage}% completado
        </p>
      </div>
    </div>
  );
}
