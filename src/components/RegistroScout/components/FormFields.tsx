/**
 * Reusable Form Field Components for Scout Registration
 * Wraps Shadcn/ui components with React Hook Form
 * 
 * @fileoverview
 * Provides consistent form field components with:
 * - Built-in validation display
 * - Accessibility support (ARIA)
 * - Consistent styling
 * - Mobile-friendly touch targets
 */

import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface BaseFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

interface TextFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  type?: "text" | "email" | "tel" | "date" | "number" | "password";
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
}

interface SelectFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

interface TextareaFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  placeholder?: string;
  rows?: number;
}

// ============================================
// TextField Component
// ============================================

export function TextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required = false,
  className,
  disabled = false,
  type = "text",
  placeholder,
  maxLength,
  autoComplete,
}: TextFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={field.value ?? ""}
              type={type}
              placeholder={placeholder}
              maxLength={maxLength}
              autoComplete={autoComplete}
              disabled={disabled}
              error={!!fieldState.error}
              className={cn(
                "transition-all",
                fieldState.error && "animate-shake"
              )}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ============================================
// SelectField Component
// ============================================

export function SelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required = false,
  className,
  disabled = false,
  options,
  placeholder = "Seleccione...",
}: SelectFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger error={!!fieldState.error}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ============================================
// TextareaField Component
// ============================================

export function TextareaField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required = false,
  className,
  disabled = false,
  placeholder,
  rows = 3,
}: TextareaFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              placeholder={placeholder}
              rows={rows}
              disabled={disabled}
              error={!!fieldState.error}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ============================================
// DateField Component (Specialized)
// ============================================

export function DateField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required = false,
  className,
  disabled = false,
}: BaseFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type="date"
              disabled={disabled}
              error={!!fieldState.error}
              className="block"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ============================================
// CheckboxField Component
// ============================================

interface CheckboxFieldProps<TFieldValues extends FieldValues>
  extends BaseFieldProps<TFieldValues> {
  description?: string;
}

export function CheckboxField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  className,
  disabled = false,
  description,
}: CheckboxFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4",
            className
          )}
        >
          <FormControl>
            <input
              type="checkbox"
              checked={field.value}
              onChange={field.onChange}
              disabled={disabled}
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="cursor-pointer">{label}</FormLabel>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </FormItem>
      )}
    />
  );
}

// ============================================
// Phone Input Component (Specialized for Peru)
// ============================================

export function PhoneField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required = false,
  className,
  disabled = false,
}: BaseFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                +51
              </span>
              <Input
                {...field}
                type="tel"
                placeholder="999 999 999"
                maxLength={9}
                disabled={disabled}
                error={!!fieldState.error}
                className="rounded-l-none"
                autoComplete="tel"
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
