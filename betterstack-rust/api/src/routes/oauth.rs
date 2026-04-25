use crate::routes::hashing::hash_password;
use crate::routes::user::create_jwt;
use poem::http::StatusCode;
use poem::web::{Data, Query, Redirect};
use poem::{handler, Error, Result};
use serde::Deserialize;
use std::env;
use std::sync::{Arc, Mutex};
use store::store::Store;

#[derive(Deserialize)]
pub struct OAuthCallbackQuery {
    code: Option<String>,
    error: Option<String>,
}

#[derive(Deserialize)]
struct GoogleTokenResponse {
    access_token: String,
}

#[derive(Deserialize)]
struct GoogleUserInfo {
    email: String,
}

#[derive(Deserialize)]
struct GithubTokenResponse {
    access_token: String,
}

#[derive(Deserialize)]
struct GithubUserInfo {
    login: String,
    email: Option<String>,
}

#[derive(Deserialize)]
struct GithubEmail {
    email: String,
    primary: bool,
    verified: bool,
}

#[handler]
pub fn google_start() -> Result<Redirect> {
    let client_id = env::var("GOOGLE_CLIENT_ID").map_err(|_| {
        Error::from_string(
            "GOOGLE_CLIENT_ID not set",
            StatusCode::INTERNAL_SERVER_ERROR,
        )
    })?;
    let redirect_uri = oauth_redirect_uri("google")?;

    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=select_account",
        urlencoding::encode(&client_id),
        urlencoding::encode(&redirect_uri),
        urlencoding::encode("openid email profile"),
    );

    Ok(Redirect::temporary(auth_url))
}

#[handler]
pub async fn google_callback(
    Query(query): Query<OAuthCallbackQuery>,
    Data(store): Data<&Arc<Mutex<Store>>>,
) -> Result<Redirect> {
    if let Some(error) = query.error {
        return Ok(redirect_frontend_error(&error));
    }

    let code = query
        .code
        .ok_or_else(|| Error::from_string("missing OAuth code", StatusCode::BAD_REQUEST))?;

    let client_id = env::var("GOOGLE_CLIENT_ID")
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;
    let client_secret = env::var("GOOGLE_CLIENT_SECRET")
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;
    let redirect_uri = oauth_redirect_uri("google")?;

    let client = reqwest::Client::new();
    let token = client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("code", code.as_str()),
            ("grant_type", "authorization_code"),
            ("redirect_uri", redirect_uri.as_str()),
        ])
        .send()
        .await
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?
        .error_for_status()
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?
        .json::<GoogleTokenResponse>()
        .await
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?;

    let user = client
        .get("https://www.googleapis.com/oauth2/v2/userinfo")
        .bearer_auth(token.access_token)
        .send()
        .await
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?
        .error_for_status()
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?
        .json::<GoogleUserInfo>()
        .await
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?;

    finish_oauth_login(store, "google", &user.email)
}

#[handler]
pub fn github_start() -> Result<Redirect> {
    let client_id = env::var("GITHUB_CLIENT_ID").map_err(|_| {
        Error::from_string(
            "GITHUB_CLIENT_ID not set",
            StatusCode::INTERNAL_SERVER_ERROR,
        )
    })?;
    let redirect_uri = oauth_redirect_uri("github")?;

    let auth_url = format!(
        "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}&scope={}",
        urlencoding::encode(&client_id),
        urlencoding::encode(&redirect_uri),
        urlencoding::encode("read:user user:email"),
    );

    Ok(Redirect::temporary(auth_url))
}

#[handler]
pub async fn github_callback(
    Query(query): Query<OAuthCallbackQuery>,
    Data(store): Data<&Arc<Mutex<Store>>>,
) -> Result<Redirect> {
    if let Some(error) = query.error {
        return Ok(redirect_frontend_error(&error));
    }

    let code = query
        .code
        .ok_or_else(|| Error::from_string("missing OAuth code", StatusCode::BAD_REQUEST))?;

    let client_id = env::var("GITHUB_CLIENT_ID")
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;
    let client_secret = env::var("GITHUB_CLIENT_SECRET")
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;
    let redirect_uri = oauth_redirect_uri("github")?;

    let client = reqwest::Client::new();
    let token = client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .form(&[
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("code", code.as_str()),
            ("redirect_uri", redirect_uri.as_str()),
        ])
        .send()
        .await
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?
        .error_for_status()
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?
        .json::<GithubTokenResponse>()
        .await
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?;

    let user = client
        .get("https://api.github.com/user")
        .header("User-Agent", "BetterUptime")
        .bearer_auth(&token.access_token)
        .send()
        .await
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?
        .error_for_status()
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?
        .json::<GithubUserInfo>()
        .await
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?;

    let email = match user.email {
        Some(email) => email,
        None => fetch_github_primary_email(&client, &token.access_token).await?,
    };

    finish_oauth_login(store, "github", &email).or_else(|_| {
        let fallback_email = format!("{}@users.noreply.github.com", user.login);
        finish_oauth_login(store, "github", &fallback_email)
    })
}

async fn fetch_github_primary_email(
    client: &reqwest::Client,
    access_token: &str,
) -> Result<String> {
    let emails = client
        .get("https://api.github.com/user/emails")
        .header("User-Agent", "BetterUptime")
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?
        .error_for_status()
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?
        .json::<Vec<GithubEmail>>()
        .await
        .map_err(|_| Error::from_status(StatusCode::BAD_GATEWAY))?;

    emails
        .into_iter()
        .find(|email| email.primary && email.verified)
        .map(|email| email.email)
        .ok_or_else(|| Error::from_string("GitHub email unavailable", StatusCode::BAD_REQUEST))
}

fn finish_oauth_login(store: &Arc<Mutex<Store>>, provider: &str, email: &str) -> Result<Redirect> {
    let user_id = {
        let mut locked_store = store
            .lock()
            .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;

        match locked_store.get_user_by_email(email) {
            Ok(id) => id,
            Err(_) => {
                let username = oauth_username(provider, email);
                let password = hash_password(&format!("oauth:{provider}:{email}"))
                    .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;
                locked_store
                    .sign_up(username, password, email.to_string())
                    .map_err(|_| Error::from_status(StatusCode::CONFLICT))?
            }
        }
    };

    let token = create_jwt(&user_id)?;
    Ok(redirect_frontend_token(&token))
}

fn oauth_redirect_uri(provider: &str) -> Result<String> {
    let api_url = env::var("API_PUBLIC_URL")
        .or_else(|_| env::var("NEXT_PUBLIC_API_URL"))
        .unwrap_or_else(|_| "http://localhost:3001".to_string());

    Ok(format!(
        "{}/user/oauth/{}/callback",
        api_url.trim_end_matches('/'),
        provider
    ))
}

fn frontend_url() -> String {
    env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string())
}

fn redirect_frontend_token(token: &str) -> Redirect {
    Redirect::temporary(format!(
        "{}/user/oauth/callback?token={}",
        frontend_url().trim_end_matches('/'),
        urlencoding::encode(token)
    ))
}

fn redirect_frontend_error(error: &str) -> Redirect {
    Redirect::temporary(format!(
        "{}/user/signin?error={}",
        frontend_url().trim_end_matches('/'),
        urlencoding::encode(error)
    ))
}

fn oauth_username(provider: &str, email: &str) -> String {
    let normalized = email
        .chars()
        .map(|ch| if ch.is_ascii_alphanumeric() { ch } else { '_' })
        .collect::<String>()
        .trim_matches('_')
        .to_lowercase();
    format!("{provider}_{normalized}")
}
