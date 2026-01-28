use chrono::{Duration, NaiveDateTime, Utc};
use diesel::{
    deserialize::{self, FromSql, FromSqlRow},
    expression::AsExpression,
    pg::{Pg, PgValue},
    prelude::*,
    serialize::{self, IsNull, Output, ToSql},
};
use std::io::Write;
use uuid::Uuid;

use crate::schema::sql_types::WebsiteStatus as WebsiteStatusType;
use crate::store::Store;

#[derive(Debug, Clone, Copy, PartialEq, Eq, AsExpression, FromSqlRow)]
#[diesel(sql_type = WebsiteStatusType)]
pub enum WebsiteStatus {
    Up,
    Down,
}

impl ToSql<WebsiteStatusType, Pg> for WebsiteStatus {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            WebsiteStatus::Up => out.write_all(b"UP")?,
            WebsiteStatus::Down => out.write_all(b"DOWN")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<WebsiteStatusType, Pg> for WebsiteStatus {
    fn from_sql(bytes: PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"UP" => Ok(WebsiteStatus::Up),
            b"DOWN" => Ok(WebsiteStatus::Down),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

#[derive(Queryable, Insertable, Selectable)]
#[diesel(table_name = crate::schema::website_tick)]
pub struct WebsiteTick {
    pub id: String,
    pub response_time: i32,
    pub status: WebsiteStatus,
    pub region_id: String,
    pub website_id: String,
    pub created_at: NaiveDateTime,
}

#[derive(QueryableByName)]
pub struct WebsiteBucket {
    #[diesel(sql_type = diesel::sql_types::Timestamp)]
    pub bucket: NaiveDateTime,
    #[diesel(sql_type = diesel::sql_types::Double)]
    pub avg_response_time: f64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub down_count: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub total_count: i64,
}

impl Store {
    pub fn create_website_tick(
        &mut self,
        website_id: String,
        region_id: String,
        response_time: i32,
        status: WebsiteStatus,
    ) -> Result<WebsiteTick, diesel::result::Error> {
        let tick = WebsiteTick {
            id: Uuid::new_v4().to_string(),
            response_time,
            status,
            region_id,
            website_id,
            created_at: Utc::now().naive_utc(),
        };

        diesel::insert_into(crate::schema::website_tick::table)
            .values(&tick)
            .returning(WebsiteTick::as_returning())
            .get_result(&mut self.conn)
    }

    pub fn get_ticks(
        &mut self,
        target_website_id: &str,
        target_region_id: Option<&str>,
        limit: i64,
    ) -> Result<Vec<WebsiteTick>, diesel::result::Error> {
        use crate::schema::website_tick::dsl::*;

        let mut query = website_tick
            .filter(website_id.eq(target_website_id))
            .into_boxed();

        if let Some(r_id) = target_region_id {
            query = query.filter(region_id.eq(r_id));
        }

        query
            .order(created_at.desc())
            .limit(limit)
            .load::<WebsiteTick>(&mut self.conn)
    }

    pub fn get_analytics_graph(
        &mut self,
        target_website_id: &str,
        start: NaiveDateTime,
        end: NaiveDateTime,
        region: Option<&str>,
    ) -> Result<Vec<WebsiteBucket>, diesel::result::Error> {
        let duration = end - start;
        let days = duration.num_days();

        let resolve_granularity = match days {
            0..=1 => "2 minutes",
            2..=7 => "15 minutes",
            8..=30 => "30 minutes",
            _ => "1 hour",
        };

        let granularity = resolve_granularity;

        let sql = format!(
            r#"
            SELECT 
                to_timestamp(
                    floor(
                        extract(epoch from created_at) 
                        / extract(epoch from interval '{interval}')
                    ) * extract(epoch from interval '{interval}')
                ) AS bucket,
                AVG(response_time)::DOUBLE PRECISION AS avg_response_time,
                COUNT(*) FILTER (WHERE status = 'DOWN')::BIGINT AS down_count,
                COUNT(*)::BIGINT AS total_count
            FROM website_tick
            WHERE website_id = $1
              AND created_at >= $2
              AND created_at <= $3
              AND ($4 IS NULL OR region_id = $4)
            GROUP BY bucket
            ORDER BY bucket ASC
            "#,
            interval = granularity
        );

        diesel::sql_query(sql)
            .bind::<diesel::sql_types::Text, _>(target_website_id)
            .bind::<diesel::sql_types::Timestamp, _>(start)
            .bind::<diesel::sql_types::Timestamp, _>(end)
            .bind::<diesel::sql_types::Nullable<diesel::sql_types::Text>, _>(region)
            .load::<WebsiteBucket>(&mut self.conn)
    }

    pub fn get_current_streak(
        &mut self,
        target_website_id: &str,
    ) -> Result<Option<i64>, diesel::result::Error> {
        use crate::schema::website_tick::dsl::*;

        // 1. Get the latest tick to determine current status
        let latest_tick = website_tick
            .filter(website_id.eq(target_website_id))
            .order(created_at.desc())
            .first::<WebsiteTick>(&mut self.conn)
            .optional()?;

        let latest = match latest_tick {
            Some(t) => t,
            None => return Ok(None),
        };

        let current_status = latest.status;

        // 2. Find the most recent tick that has a DIFFERENT status
        let last_change = website_tick
            .filter(website_id.eq(target_website_id))
            .filter(status.ne(current_status))
            .order(created_at.desc())
            .first::<WebsiteTick>(&mut self.conn)
            .optional()?;

        let streak_start = match last_change {
            Some(tick) => tick.created_at,
            None => {
                // If never changed, start from the very first tick
                website_tick
                    .filter(website_id.eq(target_website_id))
                    .order(created_at.asc())
                    .first::<WebsiteTick>(&mut self.conn)?
                    .created_at
            }
        };

        let now = Utc::now().naive_utc();
        let duration = now - streak_start;
        Ok(Some(duration.num_seconds()))
    }
}
