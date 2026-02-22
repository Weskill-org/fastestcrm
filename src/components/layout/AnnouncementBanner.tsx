import { useState } from 'react';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { X, Info, AlertTriangle, CheckCircle, Wrench, ChevronDown, ChevronUp } from 'lucide-react';

type AnnType = 'info' | 'warning' | 'success' | 'maintenance';

const TYPE_STYLES: Record<AnnType, { bar: string; icon: React.ElementType; iconColor: string }> = {
    info: { bar: 'bg-blue-500/10 border-blue-500/30 text-blue-100', icon: Info, iconColor: 'text-blue-400' },
    warning: { bar: 'bg-amber-500/10 border-amber-500/30 text-amber-100', icon: AlertTriangle, iconColor: 'text-amber-400' },
    success: { bar: 'bg-green-500/10 border-green-500/30 text-green-100', icon: CheckCircle, iconColor: 'text-green-400' },
    maintenance: { bar: 'bg-red-500/10 border-red-500/30 text-red-100', icon: Wrench, iconColor: 'text-red-400' },
};

export function AnnouncementBanner() {
    const { unread, dismiss } = useAnnouncements();
    const [expanded, setExpanded] = useState(false);

    if (!unread || unread.length === 0) return null;

    const primary = unread[0];
    const overflow = unread.length - 1;
    const style = TYPE_STYLES[primary.type as AnnType] ?? TYPE_STYLES.info;
    const Icon = style.icon;

    return (
        <div className={`border-b ${style.bar} px-4 py-2.5 flex flex-col gap-1 select-none shrink-0`}>
            {/* Primary announcement row */}
            <div className="flex items-start gap-3">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${style.iconColor}`} />

                <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm">{primary.title}</span>
                    <p className={`text-xs mt-0.5 leading-relaxed ${expanded ? '' : 'line-clamp-1'}`}>
                        {primary.body}
                    </p>

                    {/* Expand / collapse long body */}
                    {primary.body.length > 120 && (
                        <button
                            onClick={() => setExpanded(e => !e)}
                            className="text-xs opacity-60 hover:opacity-100 transition-opacity mt-0.5 flex items-center gap-0.5"
                        >
                            {expanded ? (
                                <><ChevronUp className="h-3 w-3" /> Show less</>
                            ) : (
                                <><ChevronDown className="h-3 w-3" /> Read more</>
                            )}
                        </button>
                    )}
                </div>

                {/* Overflow badge + dismiss */}
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    {overflow > 0 && (
                        <span className="text-xs opacity-70 whitespace-nowrap">+{overflow} more</span>
                    )}
                    <button
                        onClick={() => dismiss(primary.id)}
                        className="opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded"
                        title="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Overflow announcements (collapsed summary) */}
            {overflow > 0 && (
                <div className="pl-7 space-y-1">
                    {unread.slice(1).map(ann => {
                        const s2 = TYPE_STYLES[ann.type as AnnType] ?? TYPE_STYLES.info;
                        const I2 = s2.icon;
                        return (
                            <div key={ann.id} className="flex items-center gap-2 text-xs opacity-80">
                                <I2 className={`h-3 w-3 shrink-0 ${s2.iconColor}`} />
                                <span className="flex-1 truncate">{ann.title}</span>
                                <button
                                    onClick={() => dismiss(ann.id)}
                                    className="opacity-50 hover:opacity-100 shrink-0"
                                    title="Dismiss"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
