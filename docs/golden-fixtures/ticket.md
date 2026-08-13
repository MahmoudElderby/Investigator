# Golden Scenario Ticket

## Summary

Provider webhooks failing with "record not found" errors. Database operations hang and timeout after approximately **35 seconds** under distributed lock contention.

## Symptoms

- Webhook endpoint returns 404-equivalent "record not found" for valid provider events
- Order processing stalls; SQL operations exceed 35s lock timeout
- Error **258** appears in application and SQL logs

## Impact

- Incoming webhooks not persisted
- Downstream order fulfillment blocked during incident window

## Timeline

- Started: 2026-08-13 14:00 UTC
- Frequency: ~40% of webhook deliveries since deploy `v2.3.1`

## Environment hints

- Webhook handler: `src/webhook/WebhookHandler.cs`
- Provider sample payload: `src/webhook/provider-payload.json`
- Database schema: `src/data/schema.sql`
- Log snippets: `logs/`

## Raw intake

> Provider webhooks failing "record not found"; DB operations timing out after 35s lock.
