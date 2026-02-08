

# Fix Meta Integration: Page Access Token Not Being Saved

## Problem Summary
The Meta integration flow is broken because data is not being saved to the `performance_marketing_integrations` table. After investigating, I found:

- The database table is completely empty (0 Meta records)
- The OAuth callback is failing to save the initial user access token
- This causes `meta-select-page` to fail with "Integration not found"
- The UI gets stuck in a loading state

## Root Cause
The OAuth flow breaks at the token exchange step because:
1. Cross-origin messaging between popup and parent window may be failing
2. Edge function errors are not being logged properly
3. No fallback mechanism when `postMessage` fails

## Implementation Plan

### Phase 1: Fix OAuth Callback Communication
**File: `src/pages/MetaOAuthCallback.tsx`**
- Add fallback `localStorage` storage when popup communication fails
- Log debug info to help diagnose issues
- Auto-close popup with a slight delay to ensure message is sent

### Phase 2: Improve OAuth Callback Dialog Handling
**File: `src/components/integrations/MetaAdsSetupDialog.tsx`**
- Add fallback check using `localStorage` when `postMessage` doesn't work
- Add polling mechanism to detect when popup closes
- Improve error handling and display better messages
- Add timeout handling for stuck states

### Phase 3: Fix Edge Function Error Handling
**File: `supabase/functions/meta-oauth-callback/index.ts`**
- Add comprehensive logging for every step
- Ensure database operations have proper error handling
- Return detailed error messages to the client
- Fix potential issues with `.single()` vs `.maybeSingle()`

### Phase 4: Fix Page Selection Flow
**File: `supabase/functions/meta-select-page/index.ts`**
- Add detailed logging at each step
- Handle edge cases where integration might not exist
- Ensure page access token is properly extracted and stored
- Add validation before database updates

### Phase 5: Add Debug Tooling (Temporary)
Add a simple debug button on the integrations page that:
- Shows current integration state in the database
- Shows the last error that occurred
- Allows manual token refresh if needed

## Technical Details

### Key Code Changes

1. **MetaOAuthCallback.tsx** - Add localStorage fallback:
```typescript
// Always try to save code to localStorage as backup
if (code) {
  localStorage.setItem('meta_oauth_code', code);
  localStorage.setItem('meta_oauth_timestamp', Date.now().toString());
}
```

2. **MetaAdsSetupDialog.tsx** - Add polling for localStorage:
```typescript
// Poll localStorage if postMessage doesn't arrive
const pollInterval = setInterval(() => {
  const storedCode = localStorage.getItem('meta_oauth_code');
  const timestamp = localStorage.getItem('meta_oauth_timestamp');
  if (storedCode && timestamp) {
    // Verify it's recent (within 5 minutes)
    if (Date.now() - parseInt(timestamp) < 300000) {
      handleOAuthCallback(storedCode);
      localStorage.removeItem('meta_oauth_code');
      localStorage.removeItem('meta_oauth_timestamp');
      clearInterval(pollInterval);
    }
  }
}, 1000);
```

3. **meta-oauth-callback Edge Function** - Better error handling:
```typescript
// Log every database operation result
console.log('Database operation result:', { 
  existing: !!existing, 
  error: existing?.error,
  companyId 
});

// Ensure we actually inserted/updated
if (!result.error) {
  // Verify the record exists
  const { data: verify } = await supabase
    .from('performance_marketing_integrations')
    .select('id, access_token')
    .eq('company_id', companyId)
    .single();
  console.log('Verification check:', verify ? 'Record exists' : 'MISSING!');
}
```

4. **meta-select-page Edge Function** - Validate token storage:
```typescript
// After update, verify it was saved correctly
const { data: updated } = await supabase
  .from('performance_marketing_integrations')
  .select('id, access_token, page_id')
  .eq('id', integration.id)
  .single();

console.log('Post-update verification:', {
  hasToken: !!updated?.access_token,
  tokenLength: updated?.access_token?.length,
  pageId: updated?.page_id
});
```

## Expected Outcome
After implementation:
1. OAuth flow will work reliably even if `postMessage` fails
2. User tokens will be correctly saved to the database
3. Page access tokens will be properly stored for lead retrieval
4. The integration page will correctly show the connected status
5. Detailed logs will help debug any remaining issues

## Testing Steps
1. Remove any existing Meta integration (if any)
2. Click "Continue with Facebook" and complete the OAuth flow
3. Verify the popup closes and pages list appears
4. Select a page and verify success message appears
5. Check the database to confirm `access_token` and `page_id` are saved
6. Submit a test lead form and verify it appears in the CRM

