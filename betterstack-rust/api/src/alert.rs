use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};

pub async fn send_email_alert(
    target_email: &str,
    url: &str,
    status: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
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
