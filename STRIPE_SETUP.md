# Stripe Integration Setup Guide

## Environment Variables Required

### Backend (`backend/.env`)

Add these Stripe variables to your backend environment:

```bash
# Stripe Payment Processing - Get these from your Stripe Dashboard
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_STARTER_PRICE_ID=price_your_starter_plan_price_id
STRIPE_PROFESSIONAL_PRICE_ID=price_your_professional_plan_price_id
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_plan_price_id
```

## Where to Find Each Value

### 1. STRIPE_SECRET_KEY
- Go to [Stripe Dashboard](https://dashboard.stripe.com)
- Navigate to **Developers** → **API keys**
- Copy the **Secret key** (starts with `sk_test_` or `sk_live_`)

### 2. STRIPE_WEBHOOK_SECRET
- Go to **Developers** → **Webhooks** 
- Click your webhook endpoint or create one with URL: `https://YOUR_DOMAIN/api/v1/webhooks/stripe`
- Replace `YOUR_DOMAIN` with your actual backend domain (e.g., `replytics-dashboard-api.onrender.com`)
- Select events: `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.*`, `checkout.session.completed`
- Copy the **Signing secret** (starts with `whsec_`)

### 3. STRIPE_PRICE_IDs
- Go to **Products** in Stripe Dashboard
- Create products for each plan (Starter, Professional, Enterprise)
- For each product, create a recurring price
- Copy the Price ID for each plan (starts with `price_`)

## Production Deployment

### For Production (Render.com)
1. Update your environment variables in Render.com dashboard
2. Change `sk_test_` to `sk_live_` for production
3. Update webhook URL to your production domain
4. Ensure webhook endpoint is accessible and secure

### Testing
1. Use Stripe's test mode initially
2. Test webhook delivery in Stripe Dashboard
3. Verify invoice data appears in your billing dashboard
4. Test plan upgrade flow with test payment methods

## Security Notes
- Never commit actual Stripe keys to version control
- Use test keys in development
- Verify webhook signatures are working
- Monitor webhook delivery in Stripe Dashboard

## Troubleshooting
- Check webhook delivery logs in Stripe Dashboard
- Verify environment variables are loaded correctly
- Check server logs for Stripe-related errors
- Ensure your webhook endpoint returns 200 status codes