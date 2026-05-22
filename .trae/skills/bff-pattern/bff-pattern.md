---
name: "bff-pattern"
description: "Backend for Frontend pattern implementation. Use when designing APIs for multiple client types (Web, Mobile) with different data needs."
---

# BFF Pattern Implementation (Backend for Frontend)

## Overview
A BFF is a dedicated backend service for a specific frontend (e.g., Web BFF, Mobile BFF).

## Problem
Different frontends have different data needs. A "one-size-fits-all" API might over-fetch for mobile or under-fetch for desktop.

## Solution
- The BFF calls downstream microservices and aggregates/formats data specifically for its frontend.
- Handles authentication, caching, and protocol translation (e.g., gRPC to JSON).

## When to use
- You have multiple client types (Web, iOS, Android) with significantly different UI requirements.

## Procedure

### 1. Define Client-Specific Requirements
Identify the unique data needs for each client (Web vs. Mobile).
- **Web**: Full dashboard, complex tables, many fields.
- **Mobile**: Minimalist view, paginated lists, essential fields only (to save bandwidth).

### 2. Implementation: Aggregation Logic
The BFF calls multiple downstream services and merges the results.
```typescript
router.get('/dashboard', async (req, res) => {
  const [userProfile, recentOrders, notifications] = await Promise.all([
    userService.getProfile(req.userId),
    orderService.getRecent(req.userId),
    notificationService.getUnread(req.userId)
  ]);
  res.json({
    user: { name: userProfile.name, avatar: userProfile.avatar },
    orders: recentOrders.map(o => ({ id: o.id, total: o.price })),
    alerts: notifications.length
  });
});
```

### 3. Protocol Translation
Convert internal protocols (like gRPC) to client-friendly JSON/REST or GraphQL.

### 4. Client-Specific Authentication
Handle different auth flows (e.g., Session cookies for Web, JWT for Mobile).

## Constraints
- **Avoid Business Logic**: Business logic should stay in the downstream microservices; the BFF is for **formatting and aggregation**.
- **Latency**: Parallelize downstream calls (`Promise.all`) to avoid "waterfall" latency.
- **Resilience**: Implement timeouts and circuit breakers for downstream dependencies.

## Expected Output
A middleware service that optimizes communication between specific frontend clients and the backend ecosystem.
