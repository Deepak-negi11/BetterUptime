use reqwest::Client;
use std::env;
use std::time::Instant;
use store::redis::{x_read_group, x_ack_bulk, WebsiteEvent};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    let region_id = env::var("REGION_ID").expect("REGION_ID not provided");
    let worker_id = env::var("WORKER_ID").expect("WORKER_ID not provided");
    let http_client = Client::new();
    println!("Worker started: region={}, worker={}", region_id, worker_id);

    loop {
        let events = match x_read_group(&region_id, &worker_id).await {
            Ok(events) => events,
            Err(e) => {
                eprintln!("Error reading from Redis: {}", e);
                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                continue;
            }
        };

        if events.is_empty() {
            continue;
        }

        println!("Processing {} websites", events.len());
        let futures: Vec<_> = events
            .iter()
            .map(|event| fetch_website(&http_client, &event.website, &event.id, &region_id))
            .collect();

        let results = futures::future::join_all(futures).await;
        let message_ids: Vec<String> = events.iter().map(|e| e.id.clone()).collect();
        if let Err(e) = x_ack_bulk(&region_id, &message_ids).await {
            eprintln!("Error acknowledging messages: {}", e);
        }
        for (website, status, response_time) in results {
            println!("{}: {} ({}ms)", website, status, response_time);
        }
    }
}

async fn fetch_website(
    client: &Client,
    url: &str,
    website_id: &str,
    _region_id: &str,
) -> (String, String, u64) {
    let start = Instant::now();
    let full_url = if url.starts_with("http://") || url.starts_with("https://") {
        url.to_string()
    } else {
        format!("https://{}", url)
    };

    let status = match client.get(&full_url).send().await {
        Ok(response) if response.status().is_success() => "Up",
        Ok(_) => "Down",
        Err(_) => "Down",
    };
    let response_time_ms = start.elapsed().as_millis() as u64;
    (website_id.to_string(), status.to_string(), response_time_ms)
}