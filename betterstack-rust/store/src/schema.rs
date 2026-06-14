// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "website_status"))]
    pub struct WebsiteStatus;
}

diesel::table! {
    password_reset_token (id) {
        id -> Text,
        user_id -> Text,
        token -> Text,
        expires_at -> Timestamp,
        used -> Bool,
        created_at -> Timestamp,
    }
}

diesel::table! {
    region (id) {
        id -> Text,
        name -> Text,
    }
}

diesel::table! {
    user (id) {
        id -> Text,
        username -> Text,
        password -> Text,
        email -> Varchar,
    }
}

diesel::table! {
    website (id) {
        id -> Text,
        url -> Text,
        time_added -> Timestamp,
        user_id -> Text,
        is_paused -> Bool,
        name -> Nullable<Text>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::WebsiteStatus;

    website_tick (id) {
        id -> Text,
        response_time -> Int4,
        status -> WebsiteStatus,
        region_id -> Text,
        website_id -> Text,
        created_at -> Timestamp,
    }
}

diesel::joinable!(password_reset_token -> user (user_id));
diesel::joinable!(website -> user (user_id));
diesel::joinable!(website_tick -> region (region_id));
diesel::joinable!(website_tick -> website (website_id));

diesel::allow_tables_to_appear_in_same_query!(
    password_reset_token,
    region,
    user,
    website,
    website_tick,
);
