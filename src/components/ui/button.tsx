import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-35 cursor-pointer active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-accent to-accent-dim text-text-inverse rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.3),0_0_16px_rgba(228,186,96,0.12)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_0_24px_rgba(228,186,96,0.2)] hover:from-accent-hover hover:to-accent hover:scale-[1.02]",
        secondary:
          "bg-bg-card border border-border text-text-secondary rounded-xl hover:bg-bg-card-hover hover:text-text-primary hover:border-border-hover hover:scale-[1.01]",
        ghost:
          "text-text-secondary rounded-lg hover:text-text-primary hover:bg-bg-card",
        outline:
          "border border-border-accent text-accent rounded-xl bg-accent-muted hover:bg-accent-glow hover:border-accent/40",
        danger:
          "bg-danger/8 text-danger border border-danger/15 rounded-xl hover:bg-danger/15",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-12 px-8 text-base font-bold",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
