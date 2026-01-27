use redis::aio::MultiplexedConnection;
use redis::streams::{StreamReadOptions, StreamReadReply};
use redis::{AsyncCommands, Client, RedisResult};

const STREAM_NAME: &str = "betterstack";

#[derive(Debug, Clone)]
pub struct WebsiteEvent {
    pub website: String,  // The URL (e.g., "google.com")
    pub id: String,       // Your DB ID (e.g., "site_123")
    pub redis_id: String, // The REAL Redis ID (e.g., "1769...-0")
}

/// Creates the base Redis client. Call this once in main.
pub async fn create_redis_client() -> RedisResult<Client> {
    let client = Client::open("redis://127.0.0.1:6379")?;
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
        let stream_id: String = con
            .xadd(
                STREAM_NAME,
                "*",
                &[("website", event.website), ("id", event.id)],
            )
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
    let result: RedisResult<()> = redis::cmd("XGROUP")
        .arg("CREATE")
        .arg(STREAM_NAME)
        .arg(group_name)
        .arg("0") // Start from the beginning of the stream
        .arg("MKSTREAM") // Create the stream if it doesn't exist
        .query_async(con)
        .await;

    match result {
        Ok(_) => Ok(()),
        Err(e) if e.to_string().contains("BUSYGROUP") => Ok(()), // Already exists
        Err(e) => Err(e),
    }
}

/// Reads messages from a specific group.
/// use start_id="0" for pending, and ">" for new messages.
pub async fn x_read_group(
    consumer_group: &str,
    worker_id: &str,
    con: &mut MultiplexedConnection,
    start_id: &str,
) -> RedisResult<Vec<WebsiteEvent>> {
    ensure_group_exists(con, consumer_group).await?;

    let mut opts = StreamReadOptions::default()
        .group(consumer_group, worker_id)
        .count(10);

    // Only block (Long Poll) if we are looking for NEW messages
    if start_id == ">" {
        opts = opts.block(5000);
    }

    let reply: StreamReadReply = con
        .xread_options(&[STREAM_NAME], &[start_id], &opts)
        .await?;

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

    // eprintln!("DEBUG: x_read_group for {} returned {} events", consumer_group, events.len());
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
