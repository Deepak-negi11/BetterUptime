#[derive(serde::Deserialize, serde::Serialize)]
pub struct CreateWebsiteOutput {
    pub id: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct CreateUserOutput {
    pub id: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct SignInOutput {
    pub jwt: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct TickInfo {
    pub status: String,
    pub response_time: i32,
    pub created_at: String,
    pub region_id: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct WebsiteStats {
    pub uptime_24h: f64,
    pub uptime_7d: Option<f64>,
    pub uptime_30d: Option<f64>,
    pub incidents_24h: i32,
    pub avg_response_time_24h: i32,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct WebsiteBucket {
    pub bucket: String,
    pub avg_response_time: i32,
    pub down_count: i64,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct GetWebsiteOutput {
    pub url: String,
    pub id: String,
    pub user_id: String,
    pub recent_ticks: Vec<TickInfo>,
    pub stats: WebsiteStats,
    pub graph_data: Vec<WebsiteBucket>,
    pub streak: Option<i64>,
    pub created_at: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct WebsiteInfo {
    pub id: String,
    pub url: String,
    pub status: String,
    pub last_check: Option<String>,
    pub response_time: Option<i32>,
    pub region_id: Option<String>,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct GetWebsitesOutput {
    pub websites: Vec<WebsiteInfo>,
}
