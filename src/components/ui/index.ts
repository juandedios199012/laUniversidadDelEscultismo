/**
 * UI Components Export Index
 * Centralized export for all Shadcn/ui components
 * 
 * Note: Form components are exported separately to avoid circular dependencies
 * Use: import { Form, FormField, ... } from '@/components/ui/form'
 */

// Core Components
export * from "./button";
export * from "./input";
export * from "./textarea";
export * from "./label";
export * from "./select";
export * from "./badge";
export * from "./card";
export * from "./separator";
export * from "./skeleton";

// Layout Components
export * from "./accordion";
export * from "./tabs";
export * from "./scroll-area";

// Overlay Components
export * from "./dialog";
export * from "./alert-dialog";
export * from "./toast";

// Note: form.tsx and stepper.tsx should be imported directly
// to avoid circular dependency issues:
// import { Form, FormField } from '@/components/ui/form'
// import { Stepper } from '@/components/ui/stepper'
