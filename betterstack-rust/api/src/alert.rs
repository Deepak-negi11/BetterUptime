use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};

async fn send_message(
    target_email: &str,
    subject: &str,
    body: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    if let Ok(resend_key) = std::env::var("RESEND_API_KEY") {
        if !resend_key.trim().is_empty() {
            let client = reqwest::Client::new();
            let response = client
                .post("https://api.resend.com/emails")
                .bearer_auth(resend_key)
                .json(&serde_json::json!({
                    "from": "BetterUptime <onboarding@resend.dev>",
                    "to": [target_email],
                    "subject": subject,
                    "text": body,
                }))
                .send()
                .await?;

            if !response.status().is_success() {
                return Err(format!("Resend API error: {}", response.text().await?).into());
            }
            return Ok(());
        }
    }

    let smtp_user = std::env::var("SMTP_USER").map_err(|_| "SMTP_USER env var not set")?;
    let smtp_password =
        std::env::var("SMTP_PASSWORD").map_err(|_| "SMTP_PASSWORD env var not set")?;
    let smtp_host = std::env::var("SMTP_HOST").unwrap_or_else(|_| {
        if smtp_user.to_ascii_lowercase().ends_with("@gmail.com") {
            "smtp.gmail.com".to_string()
        } else {
            "smtp-relay.brevo.com".to_string()
        }
    });
    let smtp_port = std::env::var("SMTP_PORT")
        .unwrap_or_else(|_| "587".to_string())
        .parse::<u16>()?;
    let email = Message::builder()
        .from(smtp_user.parse()?)
        .to(target_email.parse()?)
        .subject(subject)
        .body(body.to_string())?;
    let smtp_password = if smtp_user.to_ascii_lowercase().ends_with("@gmail.com") {
        smtp_password.split_whitespace().collect()
    } else {
        smtp_password
    };
    let mailer = SmtpTransport::starttls_relay(&smtp_host)?
        .port(smtp_port)
        .credentials(Credentials::new(smtp_user, smtp_password))
        .build();

    tokio::task::spawn_blocking(move || mailer.send(&email)).await??;
    Ok(())
}

pub async fn send_email_alert(
    target_email: &str,
    url: &str,
    status: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    send_message(
        target_email,
        &format!("Alert: {} is {}", url, status),
        &format!(
            "Your website {} status changed to {}.\nDetected at: {} UTC.",
            url,
            status,
            chrono::Utc::now().format("%Y-%m-%d %H:%M:%S")
        ),
    )
    .await
}

pub async fn send_password_reset_email(
    target_email: &str,
    reset_link: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    send_message(
        target_email,
        "Reset your BetterUptime password",
        &format!(
            "We received a request to reset your password.\n\nOpen this link within one hour:\n{}\n\nIf you did not request this, you can ignore this email.",
            reset_link
        ),
    )
    .await
}
