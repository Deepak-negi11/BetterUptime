use diesel::deserialize::{self, FromSql};
use diesel::pg::Pg;
use diesel::serialize::{self, ToSql, Output};
use diesel::sql_types::Text;
use std::io::Write;

#[derive(Debug, Clone, Copy, PartialEq, Eq, diesel::AsExpression, diesel::FromSqlRow, serde::Serialize, serde::Deserialize)]
#[diesel(sql_type = crate::schema::sql_types::WebsiteStatus)]
pub enum WebsiteStatus {
    UP,
    DOWN,
}

impl WebsiteStatus {
    pub fn to_lowercase(&self) -> String {
        match self {
            WebsiteStatus::UP => "up".to_string(),
            WebsiteStatus::DOWN => "down".to_string(),
        }
    }
}

impl std::fmt::Display for WebsiteStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WebsiteStatus::UP => write!(f, "UP"),
            WebsiteStatus::DOWN => write!(f, "DOWN"),
        }
    }
}

impl ToSql<crate::schema::sql_types::WebsiteStatus, Pg> for WebsiteStatus {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            WebsiteStatus::UP => out.write_all(b"UP")?,
            WebsiteStatus::DOWN => out.write_all(b"DOWN")?,
        }
        Ok(serialize::IsNull::No)
    }
}

impl FromSql<crate::schema::sql_types::WebsiteStatus, Pg> for WebsiteStatus {
    fn from_sql(bytes: diesel::pg::PgValue<'_>) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"UP" => Ok(WebsiteStatus::UP),
            b"DOWN" => Ok(WebsiteStatus::DOWN),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}
