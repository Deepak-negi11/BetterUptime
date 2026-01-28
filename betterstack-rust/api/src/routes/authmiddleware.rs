use crate::routes::user::Claims;
use jsonwebtoken::{decode, DecodingKey, Validation};
use poem::{http::StatusCode, Error, FromRequest, Request, RequestBody};
use std::env;
pub struct UserId(pub String);

impl<'a> FromRequest<'a> for UserId {
    async fn from_request(req: &'a Request, _body: &mut RequestBody) -> Result<Self, Error> {
        let auth_header = req
            .headers()
            .get("Authorization")
            .and_then(|value| value.to_str().ok())
            .ok_or_else(|| Error::from_string("missing token", StatusCode::UNAUTHORIZED))?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or_else(|| Error::from_string("invalid token format", StatusCode::UNAUTHORIZED))?;

        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(env::var("JWT_SECRET").expect("Jwt secret is set").as_ref()),
            &Validation::default(),
        )
        .map_err(|_| Error::from_string("token malformed", StatusCode::UNAUTHORIZED))?;

        Ok(UserId(token_data.claims.sub))
    }
}
