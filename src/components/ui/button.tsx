import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-terracotta text-white shadow-sm hover:bg-[#9a4522] hover:shadow-[0_14px_30px_-12px_rgba(140,62,30,0.65)]",
        light: "bg-sand text-ink shadow-sm hover:bg-white hover:shadow-[0_14px_30px_-12px_rgba(42,33,28,0.45)]",
        ghost: "border border-white/70 text-white hover:bg-white/10 hover:shadow-[0_14px_30px_-14px_rgba(27,21,18,0.7)]",
        outline: "border border-ink/20 text-ink hover:border-terracotta hover:text-terracotta-ink hover:shadow-[0_14px_30px_-16px_rgba(140,62,30,0.5)]",
        moss: "bg-moss text-sand shadow-sm hover:bg-[#36442d] hover:shadow-[0_14px_30px_-12px_rgba(54,68,45,0.65)]",
      },
      size: {
        default: "h-12 px-6 text-base",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
