import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, Wallet } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useWalletBalance } from '@/hooks/useFeatureAccess';

interface UnlockFeatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName: string;
    featureDisplayName: string;
    amount: number;
}

export function UnlockFeatureModal({
    isOpen,
    onClose,
    featureName,
    featureDisplayName,
    amount,
}: UnlockFeatureModalProps) {
    const [isUnlocking, setIsUnlocking] = useState(false);
    const { data: walletData, isLoading: walletLoading } = useWalletBalance();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const currentBalance = walletData?.balance || 0;
    const hasInsufficientBalance = currentBalance < amount;

    const handleUnlock = async () => {
        setIsUnlocking(true);
        try {
            const response = await supabase.functions.invoke('unlock-feature', {
                body: { featureName, amount }
            });

            if (response.error) {
                throw new Error(response.error.message);
            }

            if (response.data?.error) {
                throw new Error(response.data.error);
            }

            toast({
                title: "Success!",
                description: `${featureDisplayName} has been unlocked successfully!`,
            });

            // Invalidate queries to refresh access status and wallet balance
            queryClient.invalidateQueries({ queryKey: ['feature-access', featureName] });
            queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });

            onClose();
        } catch (error: any) {
            toast({
                title: "Failed to unlock feature",
                description: error.message || "An error occurred",
                variant: "destructive",
            });
        } finally {
            setIsUnlocking(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        <DialogTitle>Unlock {featureDisplayName}</DialogTitle>
                    </div>
                    <DialogDescription>
                        Get access to premium features by unlocking this feature.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="rounded-lg border p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Unlock Price:</span>
                            <span className="text-lg font-bold">₹{amount.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium flex items-center gap-2">
                                <Wallet className="h-4 w-4" />
                                Current Balance:
                            </span>
                            <span className={`text-lg font-semibold ${hasInsufficientBalance ? 'text-red-500' : 'text-green-600'}`}>
                                {walletLoading ? '...' : `₹${currentBalance.toLocaleString('en-IN')}`}
                            </span>
                        </div>

                        {!walletLoading && !hasInsufficientBalance && (
                            <div className="flex justify-between items-center pt-2 border-t">
                                <span className="text-sm font-medium">Balance After Unlock:</span>
                                <span className="text-lg font-semibold text-blue-600">
                                    ₹{(currentBalance - amount).toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}
                    </div>

                    {hasInsufficientBalance && !walletLoading && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Insufficient balance. You need ₹{(amount - currentBalance).toLocaleString('en-IN')} more to unlock this feature.
                                Please recharge your wallet.
                            </AlertDescription>
                        </Alert>
                    )}

                    <p className="text-sm text-muted-foreground">
                        Once unlocked, you'll have permanent access to {featureDisplayName} for your entire company.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isUnlocking}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUnlock}
                        disabled={hasInsufficientBalance || isUnlocking || walletLoading}
                        className="bg-primary"
                    >
                        {isUnlocking ? 'Unlocking...' : `Unlock for ₹${amount.toLocaleString('en-IN')}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
