import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-accent/10 text-accent border border-accent/20",
        success: "bg-risk-low/10 text-risk-low border border-risk-low/20",
        info: "bg-info/10 text-info border border-info/20",
        warning: "bg-warning/10 text-warning border border-warning/20",
        danger: "bg-danger/10 text-danger border border-danger/20",
        extreme: "bg-risk-extreme/10 text-risk-extreme border border-risk-extreme/20",
        muted: "bg-bg-elevated text-text-muted border border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
