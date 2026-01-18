use std::env;
use std::sync::{Arc, Mutex};
use crate::request_input::CreateUserInput;
use crate::request_output::{CreateUserOutput, SignInOutput};
use crate::routes::hashing::{hash_password, verify_password};

use jsonwebtoken::{EncodingKey, Header, encode};
use poem::Result;
use poem::{Error, http::StatusCode};
use poem::{handler, web::{Data, Json}};
use store::store::Store;

#[derive(serde::Deserialize, serde::Serialize)]
pub struct Claims {
    pub sub :String,
    exp: usize,
}


#[handler]
pub fn signup(Json(data):Json<CreateUserInput>,Data(s):Data<&Arc<Mutex<Store>>>) -> Result<Json<CreateUserOutput>, Error> {
    let username = data.username;
    let password = data.password;
    
    // Hash the password before storing
    let hashed_password = hash_password(&password)
        .map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;
    
    let mut locked_s = s.lock().unwrap();
    let id = locked_s.sign_up(username, hashed_password).map_err(|_| Error::from_status(StatusCode::CONFLICT))?;
    let response = CreateUserOutput {
        id
    };

    Ok(Json(response))
}

#[handler]
pub fn signin(Json(data):Json<CreateUserInput>,Data(s):Data<&Arc<Mutex<Store>>>) -> Result<Json<SignInOutput>,Error> {
    let username = data.username;
    let password = data.password;
    let mut locked_s = s.lock().unwrap(); 
    
    // Get user with stored hash, then verify password
    let user_result = locked_s.get_user_by_username(&username);
    
    let user_id = match user_result {
        Ok((id, stored_hash)) => {
            if verify_password(&password, &stored_hash) {
                Ok(id)
            } else {
                Err(Error::from_status(StatusCode::UNAUTHORIZED))
            }
        }
        Err(_) => Err(Error::from_status(StatusCode::UNAUTHORIZED))
    };

    match user_id {
        Ok(user_id) => {
            let claims = Claims {
                sub: user_id.to_string(),
                exp: 10000000000,
            };
            let jwt_secret = env::var("JWT_SECRET").map_err(|_| Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;
            let token = encode(
                &Header::default(),
                &claims,
                &EncodingKey::from_secret(jwt_secret.as_bytes()),
            ).map_err(|_| Error::from_status(StatusCode::UNAUTHORIZED))?;

            let response = SignInOutput {
                jwt: token
            };
            Ok(Json(response))
        }
        Err(_e)=>Err(Error::from_status(StatusCode::UNAUTHORIZED))
    }
}