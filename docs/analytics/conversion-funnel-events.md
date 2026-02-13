# wRTC Conversion Funnel Analytics Events

## Event Tracking Implementation

### Bridge Flow Events

| Event Name | Trigger | Properties |
|-----------|---------|-----------|
| `bridge_view` | User views bridge page | page, source |
| `bridge_start` | User clicks "Start Bridge" | from_token, to_token |
| `bridge_confirm` | User confirms bridge transaction | amount, gas_estimate |
| `bridge_complete` | Bridge transaction successful | tx_hash, duration |
| `bridge_error` | Bridge transaction failed | error_code, error_message |

### Swap Flow Events

| Event Name | Trigger | Properties |
|-----------|---------|-----------|
| `swap_click` | User clicks swap CTA | source_page |
| `swap_view` | User views swap interface | from_token, to_token |
| `swap_start` | User initiates swap | amount, slippage |
| `swap_complete` | Swap successful | tx_hash, received_amount |

### Funnel Metrics

```javascript
// Analytics implementation example
analytics.track('bridge_view', {
  page: 'bottube.ai/bridge',
  source: 'cta_button',
  timestamp: Date.now()
});

analytics.track('bridge_complete', {
  tx_hash: '0x...',
  duration_ms: 45000,
  from_amount: 100,
  to_amount: 98.5
});
```

## CTA Improvements

### Before
- "Bridge" (ambiguous)
- "Swap" (unclear what to)

### After
- "Bridge RTC → wRTC"
- "Swap wRTC for SOL on Raydium"
- "Start Earning with wRTC"

## UX Copy Improvements

### Safety Messages
- ✅ "Your funds are secured by smart contract"
- ✅ "Transaction will complete in ~2 minutes"
- ✅ "You can track progress in your wallet"

### Confidence Boosters
- ✅ "1,000+ successful bridges today"
- ✅ "Lowest fees: 0.5% bridge fee"
- ✅ "Instant confirmation on RustChain"
