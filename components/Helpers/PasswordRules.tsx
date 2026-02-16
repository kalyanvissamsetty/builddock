export default function PasswordRules({ rules }: { rules: Record<string, boolean> }) {
    const Item = ({ ok, text }: { ok: boolean; text: string }) => (
        <p className={`text-sm ${ok ? "text-green-600" : "text-muted-foreground"}`}>
            {ok ? "✓" : "•"} {text}
        </p>
    );

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

