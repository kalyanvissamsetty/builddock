const Item = ({ ok, text }: { ok: boolean; text: string }) => (
    <p className={`text-sm ${ok ? "text-green-600" : "text-muted-foreground"}`}>
        {ok ? "✓" : "•"} {text}
    </p>
);
export default function PasswordRules({ rules }: { rules: Record<string, boolean> }) {
    return (
        <div className="space-y-1">
            <Item ok={rules.minLength} text="At least 8 characters" />
            <Item ok={rules.upper} text="One uppercase letter" />
            <Item ok={rules.lower} text="One lowercase letter" />
            <Item ok={rules.number} text="One number" />
            <Item ok={rules.special} text="One special character" />
        </div>
    );
}

export function sanitizePasswordInput(value: string) {
    return value.replace(/\s/g, "");
}

export function getPasswordRules(password: string) {
    return {
        minLength: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9\s]/.test(password),
    };
}

