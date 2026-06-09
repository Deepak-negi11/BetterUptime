use redis::aio::MultiplexedConnection;
use reqwest::Client as HttpClient;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use store::models::website_status::WebsiteStatus;
use store::redis::{create_redis_client, x_ack_bulk, x_read_group};
use store::store::Store;
use url::Url;

async fn send_smtp_email(
    to: &str,
    website_url: &str,
    status: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    use lettre::transport::smtp::authentication::Credentials;
    use lettre::{Message, SmtpTransport, Transport};

    let smtp_user = std::env::var("SMTP_USER").map_err(|_| "SMTP_USER env var not set")?;
    let smtp_password = std::env::var("SMTP_PASSWORD").map_err(|_| "SMTP_PASSWORD env var not set")?;
    let smtp_host = std::env::var("SMTP_HOST").unwrap_or_else(|_| "smtp-relay.brevo.com".to_string());
    let smtp_port = std::env::var("SMTP_PORT")
        .unwrap_or_else(|_| "587".to_string())
        .parse::<u16>()?;

    let email = Message::builder()
        .from(smtp_user.parse()?)
        .to(to.parse()?)
        .subject(format!("Alert: {} is {}", website_url, status))
        .body(format!(
            "Your website {} status changed to {}.\nDetected at: {} UTC.",
            website_url,
            status,
            chrono::Utc::now().format("%Y-%m-%d %H:%M:%S")
        ))?;

    let creds = Credentials::new(smtp_user, smtp_password);

    let mailer = SmtpTransport::starttls_relay(&smtp_host)?
        .port(smtp_port)
        .credentials(creds)
        .build();

    tokio::task::spawn_blocking(move || mailer.send(&email)).await??;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    dotenvy::dotenv().ok();

    let region_id =
        std::env::var("REGION_ID").expect("REGION_ID must be set (e.g., 'india-mumbai')");

    let worker_id = format!("{}_worker_1", region_id);

    let http_client = HttpClient::builder()
        .user_agent("BetterUptime-Worker/1.0")
        .timeout(Duration::from_secs(10))
        .build()?;

    let store = Arc::new(Mutex::new(Store::new().expect("Failed to connect to DB")));

    println!("🚀 Real-Region Worker Started: region={}", region_id);

    loop {
        // Create/recreate Redis connection for each cycle
        let redis_client = match create_redis_client().await {
            Ok(client) => client,
            Err(e) => {
                eprintln!("🔥 Failed to create Redis client in {}: {:?}", region_id, e);
                tokio::time::sleep(Duration::from_secs(5)).await;
                continue;
            }
        };

        let mut conn = match redis_client.get_multiplexed_async_connection().await {
            Ok(c) => {
                println!("Redis client created");
                c
            }
            Err(e) => {
                eprintln!("🔥 Failed to connect to Redis in {}: {:?}", region_id, e);
                tokio::time::sleep(Duration::from_secs(5)).await;
                continue;
            }
        };

        // Run worker cycles until connection breaks
        loop {
            match run_worker_cycle(&region_id, &worker_id, &http_client, &mut conn, &store).await {
                Ok(_) => {}
                Err(e) => {
                    let error_msg = format!("{:?}", e);
                    if error_msg.contains("broken pipe") || error_msg.contains("connection") {
                        eprintln!("🔄 Reconnecting to Redis in {}: {:?}", region_id, e);
                        break; // Break inner loop to reconnect
                    }
                    eprintln!("🔥 Critical Error in {}: {:?}", region_id, e);
                    tokio::time::sleep(Duration::from_secs(5)).await;
                }
            }
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    }
}

async fn run_worker_cycle(
    region_id: &str,
    worker_id: &str,
    http_client: &HttpClient,
    redis_conn: &mut MultiplexedConnection,
    store: &Arc<Mutex<Store>>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut events = x_read_group(region_id, worker_id, redis_conn, "0").await?;

    if events.is_empty() {
        events = match x_read_group(region_id, worker_id, redis_conn, ">").await {
            Ok(evs) => evs,
            Err(e) if e.is_timeout() || e.to_string().to_lowercase().contains("timed out") => return Ok(()), // Ignore timeout
            Err(e) => return Err(e.into()),
        };
    }

    if events.is_empty() {
        return Ok(());
    }

    println!("[{}] Processing {} websites", region_id, events.len());

    let futures: Vec<_> = events
        .iter()
        .map(|event| fetch_website(http_client, &event.website, &event.id))
        .collect();

    let results = futures::future::join_all(futures).await;

    {
        let mut store_lock = store.lock().unwrap();
        for (website_id, status, response_time) in &results {
            let last_tick = store_lock.get_ticks(website_id, None, 1)
                .ok()
                .and_then(|ticks| ticks.into_iter().next());

            let new_status = status.clone();

            match store_lock.create_website_tick(
                website_id.clone(),
                region_id.to_string(),
                *response_time as i32,
                status.clone(),
            ) {
                Ok(_) => {
                    println!(
                        "[{}] ✅ Saved tick: {} = {} ({}ms)",
                        region_id, website_id, status, response_time
                    );

                    // Check if status changed
                    if let Some(prev) = last_tick {
                        if prev.status != new_status {
                            println!(
                                "[{}] 📢 Status change detected for {}: {} -> {}",
                                region_id, website_id, prev.status, new_status
                            );

                            if let Ok(website) = store_lock.get_website_global(website_id) {
                                if let Ok(email) = store_lock.get_user_by_id(&website.user_id) {
                                    let url = website.url.clone();
                                    let status_str = format!("{}", new_status);
                                    tokio::spawn(async move {
                                        if let Err(err) = send_smtp_email(&email, &url, &status_str).await {
                                            eprintln!("🔥 Failed to send email alert: {:?}", err);
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
                Err(e) => eprintln!("[{}] ❌ Failed to save tick: {}", region_id, e),
            }
        }
    }

    let message_ids: Vec<String> = events.iter().map(|e| e.redis_id.clone()).collect();
    let ack_count = x_ack_bulk(region_id, &message_ids, redis_conn).await?;

    println!("[{}] ACK result: {} messages cleared", region_id, ack_count);

    Ok(())
}

async fn fetch_website(
    client: &HttpClient,
    url: &str,
    website_id: &str,
) -> (String, WebsiteStatus, u64) {
    let start = Instant::now();
    let mut full_url = url.trim().to_lowercase();
    if !full_url.starts_with("http://") && !full_url.starts_with("https://") {
        full_url = format!("https://{}", full_url);
    }

    let _ = Url::parse(&full_url).ok().map(|u| u.to_string());

    let max_retries = 3;
    let mut last_error = String::new();

    for attempt in 1..=max_retries {
        let result = client
            .get(&full_url)
            .timeout(Duration::from_secs(10))
            .send()
            .await;

        match result {
            Ok(res) => {
                let status_code = res.status();
                let elapsed = start.elapsed().as_millis() as u64;
                if status_code.is_success() || status_code.is_redirection() {
                    println!(
                        "  📡 {} -> Up (HTTP {}) in {}ms",
                        full_url,
                        status_code.as_u16(),
                        elapsed
                    );
                    return (website_id.to_string(), WebsiteStatus::UP, elapsed);
                } else {
                    println!(
                        "  📡 {} -> Down (HTTP {}) in {}ms",
                        full_url,
                        status_code.as_u16(),
                        elapsed
                    );
                    return (website_id.to_string(), WebsiteStatus::DOWN, elapsed);
                }
            }
            Err(e) => {
                last_error = format!("{}", e);
                if attempt < max_retries {
                    println!(
                        "  ⚠️ {} -> Retry {}/{} (Error: {})",
                        full_url, attempt, max_retries, last_error
                    );
                    tokio::time::sleep(Duration::from_millis(500)).await;
                }
            }
        }
    }

    let elapsed = start.elapsed().as_millis() as u64;
    println!(
        "  📡 {} -> Down (Error after {} retries: {}) in {}ms",
        full_url, max_retries, last_error, elapsed
    );
    (website_id.to_string(), WebsiteStatus::DOWN, elapsed)
}
