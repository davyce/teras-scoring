import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Bouton TERAS – design dark basé sur tes variables CSS (globals.css)
 * Utilisé par Login.tsx, Dashboard.tsx, etc.
 */
export function Button({ variant = "primary", size = "md", className = "", disabled, children, ...props }) {
    const base = "inline-flex items-center justify-center rounded border transition-colors select-none focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none";
    const byVariant = {
        primary: "bg-primary text-primary-foreground border-[color:var(--sidebar-border)] hover:opacity-90",
        secondary: "bg-secondary text-secondary-foreground border-[color:var(--sidebar-border)] hover:opacity-90",
        outline: "bg-transparent text-foreground border-[color:var(--border)] hover:bg-[color:var(--secondary)]",
        ghost: "bg-transparent text-foreground border-transparent hover:bg-[color:var(--secondary)]",
        destructive: "bg-[color:var(--destructive)] text-white border-[color:var(--sidebar-border)] hover:opacity-90",
    };
    const bySize = {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-5 text-base",
    };
    return (_jsx("button", { ...props, disabled: disabled, className: `${base} ${byVariant[variant]} ${bySize[size]} ${className}`, children: children }));
}
export default Button;
