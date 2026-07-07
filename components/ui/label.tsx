import { cn } from "@/lib/utils";

export function Label({
  className,
  children,
  htmlFor,
}: {
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-2 block text-sm font-medium text-slate-800", className)}>
      {children}
    </label>
  );
}
