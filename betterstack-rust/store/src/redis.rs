use redis::aio::MultiplexedConnection;
use redis::streams::{StreamReadOptions, StreamReadReply};
use redis::{AsyncCommands, Client, RedisResult};

const STREAM_NAME: &str = "betterstack";
const STREAM_MAX_LEN: usize = 5_000;

#[derive(Debug, Clone)]
pub struct WebsiteEvent {
    pub website: String,  // The URL (e.g., "google.com")
    pub id: String,       // Your DB ID (e.g., "site_123")
    pub redis_id: String, // The REAL Redis ID (e.g., "1769...-0")
}

/// Creates the base Redis client. Call this once in main.
pub async fn create_redis_client() -> RedisResult<Client> {
    let redis_url =
        std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    let client = Client::open(redis_url.as_str())?;
    println!("Redis client created");
    Ok(client)
}

/// Adds multiple events to the Redis stream
pub async fn x_add_bulk(
    events: Vec<WebsiteEvent>,
    con: &mut MultiplexedConnection,
) -> RedisResult<Vec<String>> {
    let mut stream_ids = Vec::new();

    for event in events {
        let stream_id: String = redis::cmd("XADD")
            .arg(STREAM_NAME)
            .arg("MAXLEN")
            .arg("~")
            .arg(STREAM_MAX_LEN)
            .arg("*")
            .arg("website")
            .arg(event.website)
            .arg("id")
            .arg(event.id)
            .query_async(con)
            .await?;
        stream_ids.push(stream_id);
    }
    Ok(stream_ids)
}

/// Ensures the Consumer Group exists in Redis.
pub async fn ensure_group_exists(
    con: &mut MultiplexedConnection,
    group_name: &str,
) -> RedisResult<()> {
    println!("[DEBUG Redis] XGROUP CREATE for {} ...", group_name);
    let result: RedisResult<()> = redis::cmd("XGROUP")
        .arg("CREATE")
        .arg(STREAM_NAME)
        .arg(group_name)
        .arg("$") // Monitoring tasks expire; new regions only need future checks
        .arg("MKSTREAM") // Create the stream if it doesn't exist
        .query_async(con)
        .await;

    match result {
        Ok(_) => {
            println!("[DEBUG Redis] XGROUP CREATE for {} succeeded", group_name);
            Ok(())
        }
        Err(e) if e.to_string().contains("BUSYGROUP") => {
            println!("[DEBUG Redis] XGROUP CREATE for {} already exists (BUSYGROUP)", group_name);
            Ok(())
        }
        Err(e) => {
            println!("[DEBUG Redis] XGROUP CREATE for {} failed: {:?}", group_name, e);
            Err(e)
        }
    }
}

/// Drops stale monitoring jobs and starts this consumer at the live stream position.
///
/// Website checks are pushed again every 30 seconds, so replaying an old backlog
/// delays current monitoring without adding useful data.
pub async fn reset_consumer_to_latest(
    consumer_group: &str,
    worker_id: &str,
    con: &mut MultiplexedConnection,
) -> RedisResult<()> {
    ensure_group_exists(con, consumer_group).await?;

    let _: i64 = redis::cmd("XGROUP")
        .arg("DELCONSUMER")
        .arg(STREAM_NAME)
        .arg(consumer_group)
        .arg(worker_id)
        .query_async(con)
        .await?;

    let _: () = redis::cmd("XGROUP")
        .arg("SETID")
        .arg(STREAM_NAME)
        .arg(consumer_group)
        .arg("$")
        .query_async(con)
        .await?;

    println!(
        "[{}] Redis consumer reset to the latest monitoring tasks",
        consumer_group
    );
    Ok(())
}

/// Reads messages from a specific group.
/// use start_id="0" for pending, and ">" for new messages.
pub async fn x_read_group(
    consumer_group: &str,
    worker_id: &str,
    con: &mut MultiplexedConnection,
    start_id: &str,
) -> RedisResult<Vec<WebsiteEvent>> {
    println!("[DEBUG Redis] x_read_group start for {}, start_id={}", consumer_group, start_id);
    ensure_group_exists(con, consumer_group).await?;

    let mut opts = StreamReadOptions::default()
        .group(consumer_group, worker_id)
        .count(10);

    // Only block (Long Poll) if we are looking for NEW messages
    // REDUCED TO 2000ms to avoid client-side timeouts
    if start_id == ">" {
        opts = opts.block(2000);
    }

    println!("[DEBUG Redis] xread_options calling with start_id={}", start_id);
    let reply: StreamReadReply = con
        .xread_options(&[STREAM_NAME], &[start_id], &opts)
        .await?;
    println!("[DEBUG Redis] xread_options completed, found keys={}", reply.keys.len());

    let mut events = Vec::new();
    for stream_key in reply.keys {
        for stream_id in stream_key.ids {
            events.push(WebsiteEvent {
                website: stream_id.get("website").unwrap_or_default(),
                id: stream_id.get("id").unwrap_or_default(),
                redis_id: stream_id.id.clone(), // CRITICAL: Used for XACK
            });
        }
    }

    Ok(events)
}

/// Acknowledges a list of message IDs.
pub async fn x_ack_bulk(
    consumer_group: &str,
    message_ids: &[String],
    con: &mut MultiplexedConnection,
) -> RedisResult<i64> {
    if message_ids.is_empty() {
        return Ok(0);
    }

    let mut cmd = redis::cmd("XACK");
    cmd.arg(STREAM_NAME).arg(consumer_group);

    for id in message_ids {
        cmd.arg(id);
    }

    cmd.query_async(con).await
}
