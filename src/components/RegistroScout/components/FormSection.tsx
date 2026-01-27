/**
 * Form Section Wrapper Component
 * Provides collapsible section UI with consistent styling
 * 
 * UX Improvements:
 * - Error badge to show errors when collapsed
 * - Red border when has errors and collapsed
 * - Smooth transitions
 */

import { ReactNode } from "react";
import { ChevronDown, LucideIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  badge?: ReactNode;
  /** Number of validation errors in this section */
  errorCount?: number;
}

export function FormSection({
  title,
  icon: Icon,
  iconColor = "text-primary",
  isOpen,
  onToggle,
  children,
  badge,
  errorCount = 0,
}: FormSectionProps) {
  const hasErrors = errorCount > 0;
  
  return (
    <div className={cn(
      "border rounded-lg bg-card overflow-hidden transition-colors duration-200",
      hasErrors && !isOpen && "border-destructive/50 bg-destructive/5"
    )}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between p-4",
          "hover:bg-muted/50 transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg bg-muted transition-colors",
            iconColor,
            hasErrors && !isOpen && "bg-destructive/10"
          )}>
            <Icon className={cn("h-5 w-5", hasErrors && !isOpen && "text-destructive")} />
          </div>
          <span className={cn(
            "font-medium text-foreground",
            hasErrors && !isOpen && "text-destructive"
          )}>{title}</span>
          {badge}
          {/* Error badge when collapsed */}
          {hasErrors && !isOpen && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground animate-pulse">
              <AlertCircle className="h-3 w-3" />
              {errorCount} {errorCount === 1 ? 'error' : 'errores'}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-0 border-t">{children}</div>
        </div>
      </div>
    </div>
  );
}
