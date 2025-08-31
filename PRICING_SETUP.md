# Session-Based Pricing System Setup Guide

## Overview
Your tutoring site now uses a session-based pricing model where all plans are billed monthly but include different numbers of tutoring sessions per month.

## Pricing Plans

### Monthly Subscription Plans
1. **Basic Plan** - $99/month
   - **Sessions**: 4 tutoring sessions per month
   - Environment Variable: `STRIPE_BASIC_PRICE_ID`
   - Stripe Price ID needed

2. **Advanced Plan** - $179/month
   - **Sessions**: 8 tutoring sessions per month
   - Environment Variable: `STRIPE_ADVANCED_PRICE_ID`
   - Stripe Price ID needed

3. **Premium Plan** - $249/month
   - **Sessions**: 12 tutoring sessions per month
   - Environment Variable: `STRIPE_PREMIUM_PRICE_ID`
   - Stripe Price ID needed

4. **Unlimited Plan** - $399/month
   - **Sessions**: 30 tutoring sessions per month
   - Environment Variable: `STRIPE_UNLIMITED_PRICE_ID`
   - Stripe Price ID needed

### Add-on Sessions
5. **Single Session** - $29/one-time
   - **Sessions**: 1 additional tutoring session
   - Environment Variable: `STRIPE_ADDON_PRICE_ID`
   - Stripe Price ID needed

### Secret Code Access (Free)
- **TRAINING2024** - 30 days unlimited access
  - Purpose: Training and internal use
  - Unlimited sessions during trial period

## Session Tracking Features

### ✅ What's Implemented
- **Session counting**: Tracks sessions used per month
- **Plan limits**: Enforces monthly session limits
- **Add-on sessions**: Allows purchasing extra sessions
- **Visual indicators**: Shows remaining sessions
- **Scheduling prevention**: Blocks scheduling when out of sessions
- **Plan display**: Shows current plan and session allocation

### Session Limits by Plan
- **Basic**: 4 sessions/month
- **Advanced**: 8 sessions/month  
- **Premium**: 12 sessions/month
- **Unlimited**: 30 sessions/month
- **Trial**: Unlimited (999 sessions)

## Setup Instructions

### 1. Stripe Configuration
1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create products for each plan:
   - **Basic Plan**: $99/month recurring
   - **Advanced Plan**: $179/month recurring
   - **Premium Plan**: $249/month recurring
   - **Unlimited Plan**: $399/month recurring
   - **Single Session**: $29 one-time payment
3. Copy the Price IDs and set them as environment variables

### 2. Environment Variables
Add these to your Firebase project:

```bash
STRIPE_BASIC_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_ADVANCED_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PREMIUM_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_UNLIMITED_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_ADDON_PRICE_ID=price_xxxxxxxxxxxxx
```

### 3. Set Price IDs in Firebase
```bash
firebase functions:config:set stripe.basic_price_id="YOUR_BASIC_PRICE_ID"
firebase functions:config:set stripe.advanced_price_id="YOUR_ADVANCED_PRICE_ID"
firebase functions:config:set stripe.premium_price_id="YOUR_PREMIUM_PRICE_ID"
firebase functions:config:set stripe.unlimited_price_id="YOUR_UNLIMITED_PRICE_ID"
firebase functions:config:set stripe.addon_price_id="YOUR_ADDON_PRICE_ID"
```

### 4. Deploy Functions
```bash
firebase deploy --only functions
```

## User Experience

### For Students
1. **Session Display**: Students see their remaining sessions at the top of their dashboard
2. **Plan Information**: Shows current plan type and session allocation
3. **Scheduling Control**: Can only schedule when sessions are available
4. **Add-on Purchase**: Can buy additional sessions when they run out
5. **Visual Feedback**: Green banner when sessions available, red when none left

### Session Tracking
- **Monthly Reset**: Sessions reset on the 1st of each month
- **Add-on Sessions**: Stack on top of monthly allocation
- **Real-time Updates**: Session count updates immediately after purchases
- **Usage History**: Tracks all sessions in the current month

## Monitoring

### Firebase Console
Check usage in Firebase Console:
- Go to Firestore
- Look at user documents
- Check `billing` object for plan type and add-on sessions
- Check `appointments` collection for session usage

### Session Data Structure
```json
{
  "billing": {
    "active": true,
    "planType": "basic",
    "addonSessions": 2,
    "lastEvent": "checkout.session.completed"
  }
}
```

## Testing

### Test Scenarios
1. **Trial Access**: Use `TRAINING2024` code for unlimited access
2. **Plan Purchase**: Test each plan type purchase
3. **Session Counting**: Verify sessions are counted correctly
4. **Add-on Purchase**: Test buying additional sessions
5. **Scheduling Prevention**: Verify scheduling is blocked when out of sessions

The system is now live and ready for session-based pricing! Students will see their session count and be prevented from scheduling when they run out of sessions.
