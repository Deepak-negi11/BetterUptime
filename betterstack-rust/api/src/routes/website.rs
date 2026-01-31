use crate::request_input::CreateWebsiteInput;
use crate::request_output::{
    CreateWebsiteOutput, GetWebsiteOutput, GetWebsitesOutput, TickInfo, WebsiteInfo,
};
use crate::routes::authmiddleware::UserId;
use poem::handler;
use poem::web::{Data, Json, Path, Query};
use serde::Deserialize;

use chrono::{DateTime, Duration, Utc};
use std::sync::{Arc, Mutex};

use store::store::Store;

use crate::alert::send_email_alert;

#[derive(Deserialize)]
pub struct WebsitesQuery {
    pub region: Option<String>,
}

#[derive(Deserialize)]
pub struct WebsiteDetailsQuery {
    pub days: Option<i64>,
    pub start: Option<DateTime<Utc>>,
    pub end: Option<DateTime<Utc>>,
    pub region: Option<String>,
}

#[handler]
pub fn get_website(
    Path(id): Path<String>,
    Query(query): Query<WebsiteDetailsQuery>,
    Data(s): Data<&Arc<Mutex<Store>>>,
    UserId(user_id): UserId,
) -> poem::Result<Json<GetWebsiteOutput>> {
    let mut lock = s.lock().unwrap_or_else(|e| e.into_inner());

    let website = lock
        .get_website(&id, &user_id)
        .map_err(|_| poem::Error::from_status(poem::http::StatusCode::NOT_FOUND))?;

    let now = Utc::now();
    let (req_start, req_end) = if let (Some(s), Some(e)) = (query.start, query.end) {
        (s, e)
    } else {
        let days = query.days.unwrap_or(1);
        (now - Duration::days(days), now)
    };

    let region = query.region.as_deref();

    // Fetch data for the graph (requested window) - Granularity depends on this window
    let req_buckets = lock
        .get_analytics_graph(&id, req_start.naive_utc(), req_end.naive_utc(), region)
        .unwrap_or_default();

    // Fetch data for stats (always 30 days) - Granularity will be 30m/1h
    let stats_start = now - Duration::days(30);
    let stats_buckets = lock
        .get_analytics_graph(&id, stats_start.naive_utc(), now.naive_utc(), region)
        .unwrap_or_default();

    let calculate_stats_uptime = |hours: i64| -> Option<f64> {
        let cutoff = (now - Duration::hours(hours)).naive_utc();

        let valid_buckets: Vec<_> = stats_buckets
            .iter()
            .filter(|b| b.bucket > cutoff && b.bucket <= now.naive_utc())
            .collect();

        if valid_buckets.is_empty() {
            return None;
        }

        let total_checks: i64 = valid_buckets.iter().map(|b| b.total_count).sum();
        let total_down: i64 = valid_buckets.iter().map(|b| b.down_count).sum();

        if total_checks > 0 {
            Some(((total_checks as f64 - total_down as f64) / total_checks as f64) * 100.0)
        } else {
            Some(100.0)
        }
    };

    let uptime_24h = calculate_stats_uptime(24).unwrap_or(100.0);
    let uptime_7d = calculate_stats_uptime(24 * 7);
    let uptime_30d = calculate_stats_uptime(24 * 30);

    // Stats for 24h (incidents/response time)
    let cutoff_24h = (now - Duration::hours(24)).naive_utc();
    let last_24h_buckets: Vec<_> = stats_buckets
        .iter()
        .filter(|b| b.bucket > cutoff_24h && b.bucket <= now.naive_utc())
        .collect();

    let incidents_24h: i64 = last_24h_buckets.iter().map(|b| b.down_count).sum();

    let avg_response_time_24h = if last_24h_buckets.is_empty() {
        0
    } else {
        (last_24h_buckets
            .iter()
            .map(|b| b.avg_response_time)
            .sum::<f64>()
            / last_24h_buckets.len() as f64) as i32
    };

    let ticks = lock.get_ticks(&id, region, 50).unwrap_or_default();

    let recent_ticks = ticks
        .into_iter()
        .map(|t| TickInfo {
            status: t.status.to_lowercase(),
            response_time: t.response_time,
            created_at: t.created_at.to_string(),
            region_id: t.region_id,
        })
        .collect();

    let streak = lock.get_current_streak(&id).unwrap_or(None);

    // Map buckets to response graph data
    let graph_data = req_buckets
        .iter()
        .map(|b| crate::request_output::WebsiteBucket {
            bucket: b.bucket.to_string(),
            avg_response_time: b.avg_response_time as i32,
            down_count: b.down_count,
        })
        .collect();

    Ok(Json(GetWebsiteOutput {
        url: website.url,
        id: website.id,
        user_id: website.user_id,
        recent_ticks,
        stats: crate::request_output::WebsiteStats {
            uptime_24h,
            uptime_7d,
            uptime_30d,
            incidents_24h: incidents_24h as i32,
            avg_response_time_24h,
        },
        graph_data,
        streak,
        created_at: website.time_added.to_string(),
    }))
}

#[handler]
pub fn create_website(
    Json(data): Json<CreateWebsiteInput>,
    Data(s): Data<&Arc<Mutex<Store>>>,
    UserId(user_id): UserId,
) -> poem::Result<Json<CreateWebsiteOutput>> {
    let mut locked_s = s.lock().unwrap_or_else(|e| e.into_inner());

    let website = locked_s.create_website(user_id, data.url).map_err(|e| {
        poem::Error::from_string(e.to_string(), poem::http::StatusCode::BAD_REQUEST)
    })?;

    let response = CreateWebsiteOutput { id: website.id };

    Ok(Json(response))
}

#[handler]
pub fn get_websites(
    Query(query): Query<WebsitesQuery>,
    Data(s): Data<&Arc<Mutex<Store>>>,
    UserId(user_id): UserId, // Removed the underscore!
) -> Json<GetWebsitesOutput> {
    let mut lock = s.lock().unwrap_or_else(|e| e.into_inner());

    let websites = lock.get_user_websites(&user_id).unwrap_or_default();

    let website_list: Vec<WebsiteInfo> = websites
        .into_iter()
        .map(|w| {
            let region_filter = query.region.as_deref().filter(|&r| r != "all");
            let tick = lock
                .get_ticks(&w.id, region_filter, 1)
                .ok()
                .and_then(|vec| vec.into_iter().next());

            let streak = lock.get_current_streak(&w.id).unwrap_or(None);

            WebsiteInfo {
                id: w.id,
                url: w.url,
                status: tick
                    .as_ref()
                    .map_or("unknown".to_string(), |t| t.status.to_lowercase()),
                last_check: tick.as_ref().map(|t| t.created_at.to_string()),
                response_time: tick.as_ref().map(|t| t.response_time),
                region_id: tick.as_ref().map(|t| t.region_id.clone()),
                streak,
            }
        })
        .collect();

    Json(GetWebsitesOutput {
        websites: website_list,
    })
}

#[handler]
pub async fn test_alert_handler(
    Path(id): Path<String>,
    UserId(user_id): UserId,
    Data(s): Data<&Arc<Mutex<Store>>>,
) -> poem::Result<Json<serde_json::Value>> {
    // Get data from database, then release lock before SMTP call
    let (user_email, website_url) = {
        let mut lock = s.lock().unwrap_or_else(|e| e.into_inner());

        let website = lock
            .get_website(&id, &user_id)
            .map_err(|_| poem::Error::from_status(poem::http::StatusCode::NOT_FOUND))?;

        let user_email = lock
            .get_user_by_id(&user_id)
            .map_err(|_| poem::Error::from_status(poem::http::StatusCode::INTERNAL_SERVER_ERROR))?;

        (user_email, website.url.clone())
    }; // Lock is released here

    // Now send email without holding the lock
    send_email_alert(&user_email, &website_url, "Test Alert From Dashboard").map_err(|e| {
        eprintln!("🔥 SMTP Error: {:?}", e);
        poem::Error::from_string(e.to_string(), poem::http::StatusCode::INTERNAL_SERVER_ERROR)
    })?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "message": "Test alert sent"
    })))
}
