use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};
use std::time::Duration;

pub fn send_email_alert(
    target_email: &str,
    url: &str,
    status: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let to_address = target_email.parse().or_else(|_| {
        std::env::var("SMTP_USER")
            .map_err(|_| "SMTP_USER not set")
            .and_then(|u| u.parse().map_err(|_| "Invalid SMTP_USER format"))
    })?;

    let email = Message::builder()
        .from("Betteruptime <deepaknegi108r@gmail.com>".parse()?)
        .to(to_address)
        .subject(format!("Alert: {} is {}", url, status.to_uppercase()))
        .body(format!(
            "Your website {} was detected as {} at {}.\n\nPlease check the dashboard for details.",
            url,
            status,
            chrono::Utc::now()
        ))?;

    let smtp_user = std::env::var("SMTP_USER").map_err(|_| "SMTP_USER not set")?;
    let smtp_password = std::env::var("SMTP_PASSWORD").map_err(|_| "SMTP_PASSWORD not set")?;

    let creds = Credentials::new(smtp_user, smtp_password.replace(' ', ""));

    let mailer = SmtpTransport::relay("smtp.gmail.com")?
        .credentials(creds)
        .timeout(Some(Duration::from_secs(10))) // 10 second timeout
        .build();

    mailer.send(&email)?;

    Ok(())
}
