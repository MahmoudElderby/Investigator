using System.Text.Json.Serialization;

namespace GoldenFixtures.Webhook;

/// <summary>
/// Webhook handler expecting requestIdHash — provider sends requestID instead.
/// </summary>
public class WebhookRequestDto
{
    [JsonPropertyName("requestIdHash")]
    public string? RequestIdHash { get; set; }

    public string? EventType { get; set; }
    public string? Payload { get; set; }
}

public class WebhookHandler
{
    public WebhookResult Handle(WebhookRequestDto dto)
    {
        if (string.IsNullOrEmpty(dto.RequestIdHash))
        {
            return WebhookResult.NotFound("record not found");
        }

        return WebhookResult.Accepted(dto.RequestIdHash);
    }
}

public record WebhookResult(bool Success, string Message)
{
    public static WebhookResult NotFound(string msg) => new(false, msg);
    public static WebhookResult Accepted(string id) => new(true, id);
}
