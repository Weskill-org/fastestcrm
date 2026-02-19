import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MaskedValueProps {
    value: string | null | undefined;
    type: 'phone' | 'email';
    enabled: boolean;
    className?: string;
    showIcon?: boolean;
}

export function MaskedValue({ value, type, enabled, className = '', showIcon = true }: MaskedValueProps) {
    const [revealed, setRevealed] = useState(false);

    if (!value) return <span className="text-muted-foreground">-</span>;
    if (!enabled) return <span className={className}>{value}</span>;

    const toggleReveal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRevealed(!revealed);
    };

    const getMaskedValue = () => {
        if (type === 'email') {
            const [local, domain] = value.split('@');
            if (!local || local.length < 3) return '***@' + (domain || '...');
            return `${local.substring(0, 3)}...@${domain}`;
        } else {
            // Phone
            if (value.length < 4) return '***';
            return `*******${value.substring(value.length - 3)}`;
        }
    };

    if (revealed) {
        return (
            <div className={`flex items-center gap-2 group ${className}`}>
                <span>{value}</span>
                {showIcon && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 opacity-50 hover:opacity-100"
                        onClick={toggleReveal}
                        title="Hide"
                    >
                        <EyeOff className="h-3 w-3" />
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 group cursor-pointer ${className}`} onClick={toggleReveal} title="Click to reveal">
            <span>{getMaskedValue()}</span>
            {showIcon && (
                <Eye className="h-3 w-3 opacity-50 group-hover:opacity-100" />
            )}
        </div>
    );
}
