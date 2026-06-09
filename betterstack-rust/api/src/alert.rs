use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};

pub async fn send_email_alert(
    target_email: &str,
    url: &str,
    status: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    if let Ok(resend_key) = std::env::var("RESEND_API_KEY") {
        if !resend_key.trim().is_empty() {
            println!("📧 Sending email alert using Resend API to {}", target_email);
            let client = reqwest::Client::new();
            let body = serde_json::json!({
                "from": "BetterUptime Alerts <onboarding@resend.dev>",
                "to": [target_email],
                "subject": format!("Alert: {} is {}", url, status),
                "html": format!(
                    "Your website {} status changed to {}.<br/>Detected at: {} UTC.",
                    url,
                    status,
                    chrono::Utc::now().format("%Y-%m-%d %H:%M:%S")
                )
            });

            let res = client.post("https://api.resend.com/emails")
                .bearer_auth(resend_key)
                .json(&body)
                .send()
                .await?;

            if !res.status().is_success() {
                let err_text = res.text().await?;
                return Err(format!("Resend API error: {}", err_text).into());
            }
            return Ok(());
        }
    }

    println!("📧 Sending email alert using SMTP to {}", target_email);
    let smtp_user = std::env::var("SMTP_USER").map_err(|_| "SMTP_USER env var not set")?;
    let smtp_password = std::env::var("SMTP_PASSWORD").map_err(|_| "SMTP_PASSWORD env var not set")?;
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
        .subject(format!("Alert: {} is {}", url, status))
        .body(format!(
            "Your website {} status changed to {}.\nDetected at: {} UTC.",
            url,
            status,
            chrono::Utc::now().format("%Y-%m-%d %H:%M:%S")
        ))?;

    let smtp_password = if smtp_user.to_ascii_lowercase().ends_with("@gmail.com") {
        smtp_password.split_whitespace().collect()
    } else {
        smtp_password
    };
    let creds = Credentials::new(smtp_user, smtp_password);

    let mailer = SmtpTransport::starttls_relay(&smtp_host)?
        .port(smtp_port)
        .credentials(creds)
        .build();

    tokio::task::spawn_blocking(move || mailer.send(&email)).await??;

    Ok(())
}
