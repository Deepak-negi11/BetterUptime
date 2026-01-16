use std::sync::{Arc, Mutex};
use crate::request_input::CreateUserInput;
use crate::request_output::{CreateUserOutput, SignInOutput};
use poem::{handler, web::{Data, Json}};
use store::store::Store;


#[handler]
pub fn signup(Json(data):Json<CreateUserInput>,Data(s):Data<&Arc<Mutex<Store>>>) -> Json<CreateUserOutput> {
    let username = data.username;
    let password = data.password;
    let mut locked_s = s.lock().unwrap();
    let id = locked_s.sign_up(username, password).unwrap();
    let response = CreateUserOutput {
        id
    };

    Json(response)
    
}

#[handler]
pub fn signin(Json(data):Json<CreateUserInput>,Data(s):Data<&Arc<Mutex<Store>>>) -> Json<SignInOutput> {
    let username = data.username;
    let password = data.password;
    let mut locked_s = s.lock().unwrap(); 
    let _success = locked_s.sign_in(username, password).unwrap();
    let response = SignInOutput {
        jwt: String::from("token")
    };
    Json(response)
}