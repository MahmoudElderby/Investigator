-- Golden fixture: unindexed nvarchar(max) lookup + distributed lock wrapper (35s timeout)

CREATE TABLE dbo.Orders (
    OrderId INT PRIMARY KEY,
    ExternalRef NVARCHAR(100) NOT NULL,
    Status NVARCHAR(50) NOT NULL
);

-- Trap: lookup column is nvarchar(max) — cannot be indexed (Msg 1919)
CREATE TABLE dbo.WebhookEvents (
    EventId INT IDENTITY PRIMARY KEY,
    RequestIdHash NVARCHAR(MAX) NOT NULL,
    ReceivedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    PayloadJson NVARCHAR(MAX)
);

-- Application uses 35-second lock timeout wrapper
-- SELECT * FROM WebhookEvents WHERE RequestIdHash = @hash
-- runs table scan on nvarchar(max) under sp_getapplock held 35s → timeout 258

CREATE PROCEDURE dbo.UpsertWebhookEvent
    @RequestIdHash NVARCHAR(MAX),
    @PayloadJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @lockResult INT;
    EXEC @lockResult = sp_getapplock
        @Resource = 'WebhookEvents',
        @LockMode = 'Exclusive',
        @LockTimeout = 35000;

    IF @lockResult < 0
        THROW 50001, 'Distributed lock timeout after 35s', 1;

    IF NOT EXISTS (SELECT 1 FROM WebhookEvents WHERE RequestIdHash = @RequestIdHash)
        INSERT INTO WebhookEvents (RequestIdHash, PayloadJson)
        VALUES (@RequestIdHash, @PayloadJson);
END;
