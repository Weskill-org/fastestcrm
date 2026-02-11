import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFeatureAccess(featureName: string) {
    return useQuery({
        queryKey: ['feature-access', featureName],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('features_unlocked')
                .select('*')
                .eq('feature_name', featureName)
                .maybeSingle();

            if (error && error.code !== '42P01' && error.code !== 'PGRST116') {
                console.error('Error checking feature access:', error);
            }

            return {
                isUnlocked: !!data,
                unlockedAt: data?.unlocked_at
            };
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
}

export function useWalletBalance() {
    return useQuery({
        queryKey: ['wallet-balance'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('wallets')
                .select('balance')
                .single();

            if (error) {
                console.error('Error fetching wallet balance:', error);
                return { balance: 0 };
            }

            return { balance: Number(data.balance) };
        },
        staleTime: 1000 * 30, // Cache for 30 seconds
    });
}
