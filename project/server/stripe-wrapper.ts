// Wrapper for Stripe that handles the case where it's not installed
let Stripe: any = null;

try {
  // Dynamic import to avoid breaking if the module is not installed
  Stripe = (await import('stripe')).default;
} catch (e) {
  console.warn('Stripe module not found or not correctly installed. Billing features will be disabled.');
}

export default Stripe;
