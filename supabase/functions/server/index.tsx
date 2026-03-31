import { Hono } from "npm:hono@4";
import { cors } from "npm:hono@4/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client with service role for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// CORS must be first
app.use("*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Health check
app.get("/make-server-ecfd718d/health", (c) => {
  console.log("✅ Health check called");
  return c.json({ status: "ok", message: "Server is running" });
});

// AUTH ROUTES

// Sign up new user
app.post("/make-server-ecfd718d/auth/signup", async (c) => {
  console.log("📥 Signup request received");
  
  try {
    const body = await c.req.json();
    const { email, password, username, name, tradingStyle, instruments } = body;
    
    // Validate required fields
    if (!email || !password || !username || !name) {
      return c.json({ 
        success: false, 
        message: "Missing required fields" 
      }, 400);
    }
    
    // Check if username already exists
    const existingUsername = await kv.get(`username:${username.toLowerCase()}`);
    if (existingUsername) {
      return c.json({ 
        success: false, 
        message: "Username already taken" 
      }, 400);
    }
    
    // Check if email already exists by querying Supabase auth users
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const emailExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        console.log(`⚠️ Signup attempt with existing email: ${email}`);
        return c.json({ 
          success: false, 
          message: "An account with this email already exists. Please sign in instead." 
        }, 400);
      }
    } catch (checkError) {
      console.error("❌ Error checking existing users:", checkError);
      // Continue anyway - the createUser will catch it
    }
    
    // Create auth user with auto-confirmed email
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since we don't have email server
      user_metadata: {
        username,
        name,
        tradingStyle: tradingStyle || '',
        instruments: instruments || []
      }
    });
    
    if (authError) {
      console.error("❌ Auth error:", authError);
      
      // Handle specific error cases
      if (authError.code === 'email_exists' || 
          authError.message?.includes('already been registered') || 
          authError.message?.includes('already exists')) {
        return c.json({ 
          success: false, 
          message: "An account with this email already exists. Please sign in instead." 
        }, 400);
      }
      
      return c.json({ 
        success: false, 
        message: authError.message || "Failed to create account"
      }, 400);
    }
    
    // Store username mapping
    await kv.set(`username:${username.toLowerCase()}`, authData.user.id);
    
    // Store user profile data
    await kv.set(`user:${authData.user.id}`, {
      id: authData.user.id,
      email,
      username,
      name,
      tradingStyle: tradingStyle || '',
      instruments: instruments || [],
      isPremium: false,
      points: 0,
      level: 1,
      streak: 0,
      createdAt: new Date().toISOString()
    });
    
    console.log(`✅ User created: ${username}`);
    
    return c.json({ 
      success: true, 
      user: authData.user 
    });
    
  } catch (error) {
    console.error("❌ Signup error:", error);
    return c.json({ 
      success: false, 
      message: String(error) 
    }, 500);
  }
});

// Check if username exists
app.post("/make-server-ecfd718d/auth/check-username", async (c) => {
  try {
    const body = await c.req.json();
    const { username } = body;
    
    const exists = await kv.get(`username:${username.toLowerCase()}`);
    
    return c.json({ exists: !!exists });
    
  } catch (error) {
    console.error("❌ Check username error:", error);
    return c.json({ exists: false });
  }
});

// Get user profile
app.get("/make-server-ecfd718d/auth/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "No token provided" }, 401);
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const profile = await kv.get(`user:${user.id}`);
    
    return c.json({ 
      success: true, 
      profile: profile || { id: user.id, email: user.email }
    });
    
  } catch (error) {
    console.error("❌ Get profile error:", error);
    return c.json({ error: String(error) }, 500);
  }
});

// Update user profile
app.post("/make-server-ecfd718d/auth/update-profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "No token provided" }, 401);
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const body = await c.req.json();
    const existingProfile = await kv.get(`user:${user.id}`) || {};
    
    const updatedProfile = {
      ...existingProfile,
      ...body,
      id: user.id // Ensure ID doesn't change
    };
    
    await kv.set(`user:${user.id}`, updatedProfile);
    
    return c.json({ 
      success: true, 
      profile: updatedProfile 
    });
    
  } catch (error) {
    console.error("❌ Update profile error:", error);
    return c.json({ error: String(error) }, 500);
  }
});

// STRIPE ROUTES

// Create checkout session
app.post("/make-server-ecfd718d/stripe/create-checkout", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "No token provided" }, 401);
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const body = await c.req.json();
    const { priceId, plan } = body; // plan: 'monthly' or 'annual'
    
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return c.json({ error: "Stripe not configured" }, 500);
    }
    
    // Create Stripe checkout session
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'customer_email': user.email || '',
        'client_reference_id': user.id,
        'success_url': `${c.req.header('origin')}/app/settings?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${c.req.header('origin')}/app/settings`,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'metadata[user_id]': user.id,
        'metadata[plan]': plan,
      }).toString()
    });
    
    const session = await response.json();
    
    if (!response.ok) {
      console.error("❌ Stripe error:", session);
      return c.json({ error: session.error?.message || "Stripe error" }, 400);
    }
    
    console.log(`✅ Checkout session created for user ${user.id}`);
    
    return c.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url 
    });
    
  } catch (error) {
    console.error("❌ Create checkout error:", error);
    return c.json({ error: String(error) }, 500);
  }
});

// Stripe webhook
app.post("/make-server-ecfd718d/stripe/webhook", async (c) => {
  try {
    const body = await c.req.text();
    const sig = c.req.header('stripe-signature');
    
    // In production, verify webhook signature
    // For now, just parse the event
    const event = JSON.parse(body);
    
    console.log(`📥 Stripe webhook: ${event.type}`);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id || session.client_reference_id;
      
      if (userId) {
        // Update user to premium
        const profile = await kv.get(`user:${userId}`) || {};
        await kv.set(`user:${userId}`, {
          ...profile,
          isPremium: true,
          subscriptionId: session.subscription,
          stripeCustomerId: session.customer,
          plan: session.metadata?.plan || 'monthly',
          subscriptionStartDate: new Date().toISOString()
        });
        
        console.log(`✅ User ${userId} upgraded to premium`);
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const userId = subscription.metadata?.user_id;
      
      if (userId) {
        // Downgrade user from premium
        const profile = await kv.get(`user:${userId}`) || {};
        await kv.set(`user:${userId}`, {
          ...profile,
          isPremium: false,
          subscriptionId: null,
          plan: null,
          subscriptionEndDate: new Date().toISOString()
        });
        
        console.log(`✅ User ${userId} subscription cancelled`);
      }
    }
    
    return c.json({ received: true });
    
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return c.json({ error: String(error) }, 500);
  }
});

// AI Analysis endpoint - SIMPLIFIED
app.post("/make-server-ecfd718d/ai-analysis", async (c) => {
  console.log("📥 AI analysis request received");
  
  try {
    const body = await c.req.json();
    console.log(`📊 Analyzing ${body.entries?.length || 0} trades`);
    
    const entries = body.entries || [];
    
    // Simple win/loss calculation
    const wins = entries.filter(e => e.outcome === 'win' || e.result === 'win').length;
    const losses = entries.filter(e => e.outcome === 'loss' || e.result === 'loss').length;
    const total = entries.length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    
    console.log(`✅ Analysis complete: ${winRate}% win rate`);
    
    return c.json({
      winRate,
      totalTrades: total,
      wins,
      losses,
      breakevens: 0,
      avgWinAmount: 0,
      avgLossAmount: 0,
      profitFactor: 1,
      totalPnL: 0,
      predictedProbability: winRate,
      bestDay: 'N/A',
      maxLossStreak: 0,
      riskScore: 50,
      emotionalPattern: 'Balanced emotional state',
      recommendations: [
        total < 10 
          ? "Add more trades to build a meaningful sample size" 
          : "Keep journaling consistently to track your progress"
      ],
      patterns: [],
      emotionalPatterns: [],
      timePatterns: [],
      strategyPerformance: {},
      customFieldInsights: null,
      confluenceInsights: [],
      highProbabilitySetups: [],
      bestTimePattern: null,
      descriptionPatterns: [],
      isEnhancedByAI: false
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    return c.json({ 
      error: String(error),
      message: "Analysis failed"
    }, 500);
  }
});

// Generate insights endpoint - SIMPLIFIED
app.post("/make-server-ecfd718d/generate-insights", async (c) => {
  console.log("📥 Generate insights request received");
  
  try {
    const body = await c.req.json();
    const entry = body.entry || {};
    
    const insights = [];
    
    if (entry.result === 'win') {
      insights.push("Great trade! Review what you did right and replicate this process.");
    } else if (entry.result === 'loss') {
      insights.push("Every loss is a learning opportunity. Focus on what you can improve.");
    } else {
      insights.push("Breaking even shows discipline.");
    }
    
    insights.push("Keep documenting your trades to build better habits.");
    
    console.log(`✅ Generated ${insights.length} insights`);
    
    return c.json({ insights });
    
  } catch (error) {
    console.error("❌ Error:", error);
    return c.json({ 
      error: String(error),
      message: "Insights generation failed"
    }, 500);
  }
});

// Catch all other routes
app.all("*", (c) => {
  console.log(`⚠️  Unknown route: ${c.req.method} ${c.req.url}`);
  return c.json({ error: "Not found" }, 404);
});

console.log("🚀 Starting server...");

Deno.serve(app.fetch);