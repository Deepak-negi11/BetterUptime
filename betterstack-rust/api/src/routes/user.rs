use crate::request_input::{CreateUserInput, SignInInput};
use crate::request_output::{CreateUserOutput, SignInOutput, UserProfileOutput};
use crate::routes::authmiddleware::UserId;
use crate::routes::hashing::{hash_password, verify_password};
use std::env;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

use jsonwebtoken::{encode, EncodingKey, Header};
use poem::Result;
use poem::{
    handler,
    web::{Data, Json},
};
use poem::{http::StatusCode, Error};
use store::store::Store;

#[derive(serde::Deserialize, serde::Serialize)]
pub struct Claims {
    pub sub: String,
    exp: u64,
}

const REMEMBERED_SESSION_HOURS: u64 = 24 * 30;

fn configured_expiry_hours() -> u64 {
    env::var("JWT_EXPIRATION")
        .unwrap_or_else(|_| "12".to_string())
        .parse()
        .unwrap_or(12)
}

fn create_jwt_with_expiry(user_id: &str, expiry_hours: u64) -> Result<String, Error> {
    let expiration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        + (expiry_hours * 60 * 60);

    let claims = Claims {
        sub: user_id.to_string(),
        exp: expiration,
    };

    let jwt_secret = match env::var("JWT_SECRET") {
        Ok(val) => val,
        Err(e) => {
            println!("Failed to load JWT_SECRET: {}", e);
            return Err(Error::from_status(StatusCode::INTERNAL_SERVER_ERROR));
        }
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )
    .map_err(|e| {
        println!("Token encoding failed: {}", e);
        Error::from_status(StatusCode::UNAUTHORIZED)
    })
}

pub fn create_jwt(user_id: &str) -> Result<String, Error> {
    create_jwt_with_expiry(user_id, configured_expiry_hours())
}

pub fn create_remembered_jwt(user_id: &str) -> Result<String, Error> {
    create_jwt_with_expiry(user_id, REMEMBERED_SESSION_HOURS)
}

#[handler]
pub fn signup(
    Json(data): Json<CreateUserInput>,
    Data(s): Data<&Arc<Mutex<Store>>>,
) -> Result<Json<CreateUserOutput>, Error> {
    let username = data.username;
    let password = data.password;
    let email = data.email;
    let hashed_password = hash_password(&password)
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;
    let mut locked_s = s
        .lock()
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;
    let id = locked_s
        .sign_up(username, hashed_password, email)
        .map_err(|_| Error::from_status(StatusCode::CONFLICT))?;
    let token = create_remembered_jwt(&id)?;
    let response = CreateUserOutput { id, jwt: token };

    Ok(Json(response))
}

#[handler]
pub fn signin(
    Json(data): Json<SignInInput>,
    Data(s): Data<&Arc<Mutex<Store>>>,
) -> Result<Json<SignInOutput>, Error> {
    let username = data.username;
    let password = data.password;
    let mut locked_s = s
        .lock()
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;

    let user_result = locked_s.get_user_by_username(&username);

    let user_id = match user_result {
        Ok((id, stored_hash)) => {
            if verify_password(&password, &stored_hash) {
                Some(id)
            } else {
                None
            }
        }
        Err(e) => {
            println!("User retrieval failed (User not found or DB error): {}", e);
            let dummy_hash =
                hash_password("dummy_password_for_timing").unwrap_or_else(|_| String::new());
            let _ = verify_password(&password, &dummy_hash);
            None
        }
    };

    let user_id = user_id.ok_or_else(|| Error::from_status(StatusCode::UNAUTHORIZED))?;

    let token = if data.remember_me.unwrap_or(true) {
        create_remembered_jwt(&user_id)?
    } else {
        create_jwt(&user_id)?
    };

    Ok(Json(SignInOutput { jwt: token }))
}

#[handler]
pub fn profile(
    Data(s): Data<&Arc<Mutex<Store>>>,
    UserId(user_id): UserId,
) -> Result<Json<UserProfileOutput>, Error> {
    let mut locked_s = s
        .lock()
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;
    let (username, email) = locked_s
        .get_user_info(&user_id)
        .map_err(|_| Error::from_status(StatusCode::NOT_FOUND))?;

    Ok(Json(UserProfileOutput { email, username }))
}
