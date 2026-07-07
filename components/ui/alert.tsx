import { cn } from "@/lib/utils";

export function Alert({
  className,
  tone = "info",
  children,
}: {
  className?: string;
  tone?: "info" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const tones = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-200 bg-red-50 text-red-900",
  };

  return <div className={cn("rounded-2xl border px-4 py-3 text-sm", tones[tone], className)}>{children}</div>;
}
