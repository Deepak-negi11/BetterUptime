use store::redis::{create_redis_client, x_add_bulk, WebsiteEvent};
use store::store::Store;
use tokio::time::{interval, Duration};

#[tokio::main]
async fn main() {
    let mut interval = interval(Duration::from_secs(30));
    let mut store = Store::new().expect("Failed to connect to DB");

    loop {
        // 1. Connect to Redis (Retry loop)
        let client = loop {
            match create_redis_client().await {
                Ok(c) => break c,
                Err(e) => {
                    eprintln!("Failed to create Redis client: {}", e);
                    tokio::time::sleep(Duration::from_secs(5)).await;
                }
            }
        };

        let mut con = loop {
            match client.get_multiplexed_async_connection().await {
                Ok(c) => {
                    println!("Redis connection established.");
                    break c;
                }
                Err(e) => {
                    eprintln!("Failed to connect to Redis: {}", e);
                    tokio::time::sleep(Duration::from_secs(5)).await;
                }
            }
        };

        // 2. Main Work Loop
        loop {
            interval.tick().await;
            println!("Pusher tick: Checking for websites...");

            match store.get_all_websites_global() {
                Ok(websites) => {
                    if websites.is_empty() {
                        println!("No websites found.");
                        continue;
                    }

                    let events: Vec<WebsiteEvent> = websites
                        .into_iter()
                        .map(|w| WebsiteEvent {
                            website: w.url,
                            id: w.id,
                            redis_id: String::new(),
                        })
                        .collect();

                    match x_add_bulk(events, &mut con).await {
                        Ok(ids) => println!("Pushed {} tasks to Redis.", ids.len()),
                        Err(e) => {
                            eprintln!("Failed to push to Redis: {}", e);
                            eprintln!("Restarting connection...");
                            break; // Break inner loop to reconnect
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to fetch websites from DB: {}", e);
                    // DB error might not need Redis reconnection, but let's be safe or just continue
                    // For now, if DB fails, we just retry next tick.
                }
            }
        }
    }
}
