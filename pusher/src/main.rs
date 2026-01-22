use store::redis::{x_add_bulk, WebsiteEvent};
use store::store::Store;
use tokio::time::{interval, Duration};

#[tokio::main]
async fn main() {
    let mut interval = interval(Duration::from_secs(3 * 60 * 1000));
    let mut store = Store::new().expect("Failed to connect to DB");

    loop {
        interval.tick().await;
        println!("Pusher tick: Checking for websites...");

        match store.get_all_websites() {
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
                    })
                    .collect();

                match x_add_bulk(events).await {
                    Ok(ids) => println!("Pushed {} tasks to Redis.", ids.len()),
                    Err(e) => eprintln!("Failed to push to Redis: {}", e),
                }
            }
            Err(e) => eprintln!("Failed to fetch websites: {}", e),
        }
    }
}
