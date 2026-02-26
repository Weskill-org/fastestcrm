import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, permissionStatus, requestPermission } = useNotifications();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group">
                    <Bell className="h-5 w-5 transition-transform group-hover:rotate-12" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center border-2 border-background animate-in zoom-in">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-xl border-border" align="end">
                <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm tracking-tight">Notifications</h4>
                        {unreadCount > 0 && (
                            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {unreadCount} New
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                markAllAsRead();
                            }}
                            className="h-auto px-2 py-1 text-[11px] font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>

                {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
                    <div className="p-3 bg-primary/5 border-b border-primary/10">
                        <div className="flex flex-col gap-2">
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Get real-time updates for new leads and payments directly in your browser.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={requestPermission}
                                className="w-full text-[11px] font-semibold h-8 bg-background border-primary/20 hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
                            >
                                <Bell className="mr-2 h-3 w-3 text-primary" />
                                Enable Browser Notifications
                            </Button>
                        </div>
                    </div>
                )}

                <ScrollArea className="h-[350px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px] p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <Bell className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">No new notifications at the moment.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex flex-col gap-1 p-4 hover:bg-muted/50 transition-all cursor-pointer relative overflow-hidden group",
                                        !notification.read && "bg-primary/[0.02]"
                                    )}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    {!notification.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                    )}
                                    <div className="flex items-start justify-between gap-3">
                                        <span className={cn(
                                            "font-semibold text-sm leading-tight",
                                            !notification.read ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {notification.title}
                                        </span>
                                        <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-tighter whitespace-nowrap mt-0.5">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className={cn(
                                        "text-xs leading-relaxed mt-0.5",
                                        !notification.read ? "text-muted-foreground" : "text-muted-foreground/60"
                                    )}>
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[10px] text-primary font-medium hover:bg-primary/10"
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                {notifications.length > 0 && (
                    <div className="p-2 border-t bg-muted/10 text-center">
                        <Button variant="link" size="sm" className="text-[11px] h-auto text-muted-foreground hover:text-foreground">
                            View notification settings
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
