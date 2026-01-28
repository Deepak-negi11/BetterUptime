use redis::aio::MultiplexedConnection;
use reqwest::Client as HttpClient;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use store::models::website_tick::WebsiteStatus;
use store::redis::{create_redis_client, x_ack_bulk, x_read_group};
use store::store::Store;
use url::Url;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    dotenvy::dotenv().ok();
    let http_client = HttpClient::builder()
        .user_agent("BetterUptime/1.0")
        .timeout(Duration::from_secs(10))
        .build()?;
    let redis_client = create_redis_client().await?;
    let store = Arc::new(Mutex::new(Store::new().expect("Failed to connect to DB")));

    let regions = vec!["india-1", "us-east-1","asia-1"];
    let mut handles = vec![];

    for region in regions {
        let client = http_client.clone();
        let r_id = region.to_string();
        let w_id = format!("{}_worker_1", region);
        let store_clone = Arc::clone(&store);

        let mut conn = redis_client.get_multiplexed_async_connection().await?;

        let handle = tokio::spawn(async move {
            println!("🚀 Worker Task Started: region={}", r_id);
            loop {
                match run_worker_cycle(&r_id, &w_id, &client, &mut conn, &store_clone).await {
                    Ok(_) => {
                    }
                    Err(e) => {
                        
                        let err_msg = e.to_string();

                        if err_msg.contains("timed out") || err_msg.contains("timeout") {
                        
                        } else {

                            eprintln!("🔥 REAL CRITICAL ERROR [{}]: {:?}", r_id, e);
                            tokio::time::sleep(Duration::from_secs(2)).await;
                        }
                    }
                }
            }
        });
        handles.push(handle);
    }

    
    futures::future::join_all(handles).await;
    Ok(())
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
            Err(e) if e.is_timeout() => return Ok(()), // Ignore timeout
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
            let ws_status = if status == "Up" {
                WebsiteStatus::Up
            } else {
                WebsiteStatus::Down
            };

            match store_lock.create_website_tick(
                website_id.clone(),
                region_id.to_string(),
                *response_time as i32,
                ws_status,
            ) {
                Ok(_) => println!(
                    "[{}] ✅ Saved tick: {} = {} ({}ms)",
                    region_id, website_id, status, response_time
                ),
                Err(e) => eprintln!("[{}] ❌ Failed to save tick: {}", region_id, e),
            }
        }
    }

  
    let message_ids: Vec<String> = events.iter().map(|e| e.redis_id.clone()).collect();
    let ack_count = x_ack_bulk(region_id, &message_ids, redis_conn).await?;

    println!("[{}] ACK result: {} messages cleared", region_id, ack_count);

    Ok(())
}

async fn fetch_website(client: &HttpClient, url: &str, website_id: &str) -> (String, String, u64) {
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
                    return (website_id.to_string(), "Up".to_string(), elapsed);
                } else {
                    println!(
                        "  📡 {} -> Down (HTTP {}) in {}ms",
                        full_url,
                        status_code.as_u16(),
                        elapsed
                    );
                    return (website_id.to_string(), "Down".to_string(), elapsed);
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
    (website_id.to_string(), "Down".to_string(), elapsed)
}