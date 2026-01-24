use redis::aio::MultiplexedConnection;
use reqwest::Client as HttpClient;
use std::time::{Duration, Instant};
use store::redis::{create_redis_client, x_ack_bulk, x_read_group};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    dotenvy::dotenv().ok();

    let http_client = HttpClient::new();
    let redis_client = create_redis_client().await?;

    let regions = vec!["india-1", "us-east-1"];
    let mut handles = vec![];

    for region in regions {
        let client = http_client.clone();
        let r_id = region.to_string();
        let w_id = format!("{}_worker_1", region);

        // Give each task its own MultiplexedConnection
        let mut conn = redis_client.get_multiplexed_async_connection().await?;

        let handle = tokio::spawn(async move {
    println!("🚀 Worker Task Started: region={}", r_id);
    loop {
        match run_worker_cycle(&r_id, &w_id, &client, &mut conn).await {
            Ok(_) => {
                // Success! No error, just loop back.
            }
            Err(e) => {
                // Check if the error is a Timeout
                // We convert it to a string to check the message
                let err_msg = e.to_string();
                
                if err_msg.contains("timed out") || err_msg.contains("timeout") {
                    // This is the "Ghost" error. We do NOTHING here.
                    // It just means the 5 seconds passed with no new websites.
                } else {
                    // This is a REAL error (like Redis crashed). Print THIS.
                    eprintln!("🔥 REAL CRITICAL ERROR [{}]: {:?}", r_id, e);
                    tokio::time::sleep(Duration::from_secs(2)).await;
                }
            }
        }
     }
    });
    handles.push(handle);
    }

    // Wait for all spawned tasks
    futures::future::join_all(handles).await;
    Ok(())
}

async fn run_worker_cycle(
    region_id: &str,
    worker_id: &str,
    http_client: &HttpClient,
    redis_conn: &mut MultiplexedConnection,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // 1. Check for Pending (ID "0") first (Self-healing logic)
    let mut events = x_read_group(region_id, worker_id, redis_conn, "0").await?;

    // 2. If nothing pending, wait for New (ID ">") (Long-polling)
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

    // 3. Parallel HTTP Checks (Asynchronous)
    let futures: Vec<_> = events
        .iter()
        .map(|event| fetch_website(http_client, &event.website, &event.id))
        .collect();

    let results = futures::future::join_all(futures).await;

    // 4. Acknowledge and Log Results
    let message_ids: Vec<String> = events.iter().map(|e| e.redis_id.clone()).collect();
    let ack_count = x_ack_bulk(region_id, &message_ids, redis_conn).await?;

    println!("[{}] ACK result: {} messages cleared", region_id, ack_count);

    for (website_id, status, response_time) in results {
        println!(
            "[{}] {}: {} ({}ms)",
            region_id, website_id, status, response_time
        );
    }

    Ok(())
}

async fn fetch_website(client: &HttpClient, url: &str, website_id: &str) -> (String, String, u64) {
    let start = Instant::now();
    let full_url = if url.starts_with("http") {
        url.to_string()
    } else {
        format!("https://{}", url)
    };

    let status = match client
        .get(&full_url)
        .timeout(Duration::from_secs(5))
        .send()
        .await
    {
        Ok(res) if res.status().is_success() => "Up",
        _ => "Down",
    };
    (
        website_id.to_string(),
        status.to_string(),
        start.elapsed().as_millis() as u64,
    )
}