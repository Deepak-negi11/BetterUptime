use std::env;
use std::sync::{Arc, Mutex};
use crate::request_input::CreateUserInput;
use crate::request_output::{CreateUserOutput, SignInOutput};

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
    let mut locked_s = s.lock().unwrap();
    let id = locked_s.sign_up(username, password).map_err(|_| Error::from_status(StatusCode::CONFLICT))?;
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
    let user_id = locked_s.sign_in(username, password);

    match user_id {
        Ok(user_id)=>{
            let claims = Claims {
                sub: user_id.to_string(),
                exp: 10000000000,
            };
             let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(env::var("JWT_SECRET").unwrap().as_ref()))
           .map_err(|_| Error::from_status(StatusCode::UNAUTHORIZED))?;

            let response = SignInOutput {
                jwt: user_id.to_string()
            };
           
            Ok(Json(response))
        }
        Err(e)=>Err(Error::from_status(StatusCode::UNAUTHORIZED))
    }
}