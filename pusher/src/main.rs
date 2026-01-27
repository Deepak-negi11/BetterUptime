use store::redis::{create_redis_client, x_add_bulk, WebsiteEvent};
use store::store::Store;
use tokio::time::{interval, Duration};

#[tokio::main]
async fn main() {
    let mut interval = interval(Duration::from_secs(30)); 
    let mut store = Store::new().expect("Failed to connect to DB");

    let client = create_redis_client()
        .await
        .expect("Failed to create Redis client");
    let mut con = client
        .get_multiplexed_async_connection()
        .await
        .expect("Failed to connect to Redis");

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
                    Err(e) => eprintln!("Failed to push to Redis: {}", e),
                }
            }
            Err(e) => eprintln!("Failed to fetch websites: {}", e),
        }
    }
}
