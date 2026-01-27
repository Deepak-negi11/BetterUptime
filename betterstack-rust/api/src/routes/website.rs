use crate::request_input::CreateWebsiteInput;
use crate::request_output::{
    CreateWebsiteOutput, GetWebsiteOutput, GetWebsitesOutput, TickInfo, WebsiteInfo,
};
use crate::routes::authmiddleware::UserId;
use poem::handler;
use poem::web::{Data, Json, Path, Query};
use serde::Deserialize;

use chrono::{Duration, Utc};
use std::sync::{Arc, Mutex};
use store::models::website_tick::WebsiteStatus;
use store::store::Store;

#[derive(Deserialize)]
pub struct WebsitesQuery {
    pub region: Option<String>,
}

#[handler]
pub fn get_website(
    Path(id): Path<String>,
    Data(s): Data<&Arc<Mutex<Store>>>,
    UserId(user_id): UserId,
) -> poem::Result<Json<GetWebsiteOutput>> {
    let mut lock = s.lock().unwrap_or_else(|e| e.into_inner());

    let website = lock
        .get_website(&id, &user_id)
        .map_err(|_| poem::Error::from_status(poem::http::StatusCode::NOT_FOUND))?;

    let buckets = lock.get_analytics_graph(&id, 7).unwrap_or_default();

    let last_24h_buckets: Vec<_> = buckets
        .iter()
        .filter(|b| b.bucket > (Utc::now() - Duration::hours(24)).naive_utc())
        .collect();

    let incidents_24h: i64 = last_24h_buckets.iter().map(|b| b.down_count).sum();

    let checks_per_hour = 120.0;
    let total_expected_checks = last_24h_buckets.len() as f64 * checks_per_hour;

    let uptime_24h = if total_expected_checks > 0.0 {
        ((total_expected_checks - incidents_24h as f64) / total_expected_checks) * 100.0
    } else {
        100.0
    };

    let avg_response_time_24h = if last_24h_buckets.is_empty() {
        0
    } else {
        (last_24h_buckets
            .iter()
            .map(|b| b.avg_response_time)
            .sum::<f64>()
            / last_24h_buckets.len() as f64) as i32
    };

    // 4. FETCH RECENT TICKS: For the activity table
    let ticks = lock.get_ticks(&id, None, 50).unwrap_or_default();

    let recent_ticks = ticks
        .into_iter()
        .map(|t| TickInfo {
            status: match t.status {
                WebsiteStatus::Up => "up".to_string(),
                WebsiteStatus::Down => "down".to_string(),
            },
            response_time: t.response_time,
            created_at: t.created_at.to_string(),
            region_id: t.region_id,
        })
        .collect();

    Ok(Json(GetWebsiteOutput {
        url: website.url,
        id: website.id,
        user_id: website.user_id,
        recent_ticks,
        stats: crate::request_output::WebsiteStats {
            uptime_24h,
            incidents_24h: incidents_24h as i32,
            avg_response_time_24h,
        },
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

            WebsiteInfo {
                id: w.id,
                url: w.url,
                status: tick
                    .as_ref()
                    .map_or("unknown".to_string(), |t| match t.status {
                        WebsiteStatus::Up => "up".to_string(),
                        WebsiteStatus::Down => "down".to_string(),
                    }),
                last_check: tick.as_ref().map(|t| t.created_at.to_string()),
                response_time: tick.as_ref().map(|t| t.response_time),
                region_id: tick.as_ref().map(|t| t.region_id.clone()),
            }
        })
        .collect();

    Json(GetWebsitesOutput {
        websites: website_list,
    })
}
