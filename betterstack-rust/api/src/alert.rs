use serde::Serialize;

#[derive(Serialize)]
struct ResendEmail {
    from: String,
    to: Vec<String>,
    subject: String,
    html: String,
}

/// Send email alert using Resend HTTP API
/// Requires RESEND_API_KEY environment variable
pub async fn send_email_alert(
    target_email: &str,
    url: &str,
    status: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let api_key = std::env::var("RESEND_API_KEY").map_err(|_| "RESEND_API_KEY not set")?;

    let from_email =
        std::env::var("SMTP_USER").unwrap_or_else(|_| "onboarding@resend.dev".to_string());

    // Use Resend's free testing domain for unverified accounts
    let sender = "onboarding@resend.dev";

    let email = ResendEmail {
        from: format!("BetterUptime <{}>", sender),
        to: vec![target_email.to_string()],
        subject: format!("Alert: {} is {}", url, status.to_uppercase()),
        html: format!(
            "<h2>Website Status Alert</h2>\
            <p>Your website <strong>{}</strong> was detected as <strong>{}</strong> at {}.</p>\
            <p>Please check the dashboard for details.</p>",
            url,
            status,
            chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
        ),
    };

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.resend.com/emails")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&email)
        .send()
        .await?;

    if response.status().is_success() {
        println!("✅ Email sent successfully to {}", target_email);
        Ok(())
    } else {
        let error_text = response.text().await.unwrap_or_default();
        eprintln!("❌ Resend API error: {}", error_text);
        Err(format!("Resend API error: {}", error_text).into())
    }
}
