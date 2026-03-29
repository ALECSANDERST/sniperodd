import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default: "bg-accent-muted text-accent border border-border-accent",
        success: "bg-risk-low/8 text-risk-low border border-risk-low/15",
        info: "bg-info/8 text-info border border-info/15",
        warning: "bg-warning/8 text-warning border border-warning/15",
        danger: "bg-danger/8 text-danger border border-danger/15",
        extreme: "bg-risk-extreme/8 text-risk-extreme border border-risk-extreme/15",
        muted: "bg-bg-elevated text-text-muted border border-border",
        teal: "bg-teal-dim text-teal border border-teal/15",
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
