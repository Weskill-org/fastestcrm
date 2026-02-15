import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const LoadingSpinner = ({ className }: { className?: string }) => {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px]">
      <Loader2 className={cn("h-8 w-8 animate-spin text-primary", className)} />
    </div>
  );
};
