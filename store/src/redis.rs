use redis::streams::{StreamReadOptions, StreamReadReply};
use redis::{Client, Commands, RedisResult};

const STREAM_NAME: &str = "betterstack";

#[derive(Debug, Clone)]
pub struct WebsiteEvent {
    pub website: String,
    pub id: String,
}

pub async fn create_redis_client() -> RedisResult<Client> {
    let client = Client::open("redis://127.0.0.1")?;
    println!("Redis client created");
    Ok(client)
}

pub async fn x_add(website: &str, id: &str) -> RedisResult<()> {
    let client = create_redis_client().await?;
    let mut con = client.get_connection()?;

    let _stream_id: String = con.xadd(STREAM_NAME, "*", &[("website", website), ("id", id)])?;
    Ok(())
}

pub async fn x_add_bulk(events: Vec<WebsiteEvent>) -> RedisResult<Vec<String>> {
    let client = create_redis_client().await?;
    let mut con = client.get_connection()?;
    let mut stream_ids = Vec::new();

    for event in events {
        let stream_id: String = con.xadd(
            STREAM_NAME,
            "*",
            &[("website", event.website), ("id", event.id)],
        )?;
        stream_ids.push(stream_id);
    }
    Ok(stream_ids)
}

/// Ensure the consumer group exists, creating it if necessary
pub fn ensure_group_exists(con: &mut redis::Connection, group_name: &str) -> RedisResult<()> {
    // Try to create the group, ignore error if it already exists
    let result: RedisResult<()> = redis::cmd("XGROUP")
        .arg("CREATE")
        .arg(STREAM_NAME)
        .arg(group_name)
        .arg("0")
        .arg("MKSTREAM")
        .query(con);
    
    match result {
        Ok(_) => Ok(()),
        Err(e) => {
            // Ignore "BUSYGROUP" error (group already exists)
            if e.to_string().contains("BUSYGROUP") {
                Ok(())
            } else {
                Err(e)
            }
        }
    }
}

pub async fn x_read_group(
    consumer_group: &str,
    worker_id: &str,
) -> RedisResult<Vec<WebsiteEvent>> {
    let client = create_redis_client().await?;
    let mut con = client.get_connection()?;
    
    // Ensure group exists
    ensure_group_exists(&mut con, consumer_group)?;

    // Use XREADGROUP command
    let opts = StreamReadOptions::default()
        .group(consumer_group, worker_id)
        .count(10)
        .block(5000); // Block for 5 seconds

    let reply: StreamReadReply = con.xread_options(&[STREAM_NAME], &[">"], &opts)?;

    let mut events = Vec::new();
    for stream_key in reply.keys {
        for stream_id in stream_key.ids {
            let website: String = stream_id.get("website").unwrap_or_default();
            let id: String = stream_id.get("id").unwrap_or_default();
            events.push(WebsiteEvent { website, id });
        }
    }
    
    Ok(events)
}

/// Acknowledge processed messages in bulk
pub async fn x_ack_bulk(consumer_group: &str, message_ids: &[String]) -> RedisResult<i64> {
    let client = create_redis_client().await?;
    let mut con = client.get_connection()?;
    
    let mut cmd = redis::cmd("XACK");
    cmd.arg(STREAM_NAME).arg(consumer_group);
    
    for id in message_ids {
        cmd.arg(id);
    }
    
    let count: i64 = cmd.query(&mut con)?;
    Ok(count)
}

