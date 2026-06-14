use crate::alert::send_password_reset_email;
use crate::request_input::{
    CreateUserInput, ForgotPasswordInput, ResetPasswordInput, SignInInput, UpdateProfileInput,
    UpdateEmailInput,
};
use crate::request_output::{CreateUserOutput, MessageOutput, SignInOutput, UserProfileOutput};
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

#[handler]
pub fn update_profile(
    Json(data): Json<UpdateProfileInput>,
    Data(s): Data<&Arc<Mutex<Store>>>,
    UserId(user_id): UserId,
) -> Result<Json<UserProfileOutput>, Error> {
    let trimmed = data.username.trim();
    if trimmed.is_empty() || trimmed.len() > 64 {
        return Err(Error::from_status(StatusCode::BAD_REQUEST));
    }

    let mut locked_s = s
        .lock()
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;

    locked_s
        .update_username(&user_id, trimmed)
        .map_err(|_| Error::from_status(StatusCode::CONFLICT))?;

    let (username, email) = locked_s
        .get_user_info(&user_id)
        .map_err(|_| Error::from_status(StatusCode::NOT_FOUND))?;

    Ok(Json(UserProfileOutput { email, username }))
}

#[handler]
pub fn update_email(
    Json(data): Json<UpdateEmailInput>,
    Data(s): Data<&Arc<Mutex<Store>>>,
    UserId(user_id): UserId,
) -> Result<Json<UserProfileOutput>, Error> {
    let trimmed_email = data.email.trim();
    if trimmed_email.is_empty() || !trimmed_email.contains('@') {
        return Err(Error::from_status(StatusCode::BAD_REQUEST));
    }

    let mut locked_s = s
        .lock()
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;

    let password_hash = locked_s
        .get_user_password_hash(&user_id)
        .map_err(|_| Error::from_status(StatusCode::NOT_FOUND))?;

    if !verify_password(&data.password_confirm, &password_hash) {
        return Err(Error::from_status(StatusCode::UNAUTHORIZED));
    }

    locked_s
        .update_email(&user_id, trimmed_email)
        .map_err(|_| Error::from_status(StatusCode::CONFLICT))?;

    let (username, email) = locked_s
        .get_user_info(&user_id)
        .map_err(|_| Error::from_status(StatusCode::NOT_FOUND))?;

    Ok(Json(UserProfileOutput { email, username }))
}

#[handler]
pub fn delete_account(
    Data(s): Data<&Arc<Mutex<Store>>>,
    UserId(user_id): UserId,
) -> Result<Json<MessageOutput>, Error> {
    let mut locked_s = s
        .lock()
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;

    locked_s
        .delete_user(&user_id)
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;

    Ok(Json(MessageOutput {
        message: "Account deleted.".to_string(),
    }))
}

#[handler]
pub async fn forgot_password(
    Json(data): Json<ForgotPasswordInput>,
    Data(s): Data<&Arc<Mutex<Store>>>,
) -> Result<Json<MessageOutput>, Error> {
    let token = {
        let mut store = s
            .lock()
            .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;
        store
            .create_password_reset_token(data.email.trim())
            .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?
    };

    if let Some(token) = token {
        let frontend_url =
            env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
        let reset_link = format!(
            "{}/user/reset-password?token={}",
            frontend_url.trim_end_matches('/'),
            token
        );
        if let Err(error) = send_password_reset_email(data.email.trim(), &reset_link).await {
            eprintln!("Password reset email failed: {error}");
        }
    }

    Ok(Json(MessageOutput {
        message: "If an account exists for that email, a reset link is on its way.".to_string(),
    }))
}

#[handler]
pub fn reset_password(
    Json(data): Json<ResetPasswordInput>,
    Data(s): Data<&Arc<Mutex<Store>>>,
) -> Result<Json<MessageOutput>, Error> {
    if data.password.len() < 8 {
        return Err(Error::from_status(StatusCode::BAD_REQUEST));
    }

    let hashed_password = hash_password(&data.password)
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;
    let mut store = s
        .lock()
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;
    let reset = store
        .reset_password_with_token(&data.token, &hashed_password)
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;

    if !reset {
        return Err(Error::from_status(StatusCode::BAD_REQUEST));
    }

    Ok(Json(MessageOutput {
        message: "Password updated. You can now sign in.".to_string(),
    }))
}
