use poem::{Route, Server, get, handler, listener::TcpListener, post, web::{Json, Path}};

use crate::{reqeust_inputs::CreateWebsiteInput, requests_output::{CreateWebsiteOutput, SignInOutput}};
use crate::{requests_output::CreateUserOutput, reqeust_inputs::CreateUserInput};

pub mod reqeust_inputs;
pub mod requests_output;
use store::store::Store;

#[handler]
fn get_website(Path(id): Path<String>) -> Json<GetWebsiteOutput> {
    let mut s = Store::default().unwrap();
    let website = s.get_website(id).unwrap();
    Json(GetWebsiteOutput {
        url: website.url
    })
}

#[handler]
fn signup(Json(data):Json<CreateUserInput>) -> Json<CreateUserOutput> {
    let username = data.username;
    let password = data.password;
    let mut s = Store::default().unwrap();
    let id = s.sign_up(username, password).unwrap();
    let response = CreateUserOutput {
        id
    };

    Json(response)
    
}

#[handler]
fn signin(Json(data):Json<CreateUserInput>) -> Json<SignInOutput> {
    let username = data.username;
    let password = data.password;
    let mut s = Store::default().unwrap();
    let success = s.sign_in(username, password).unwrap();
    let response = SignInOutput {
        jwt: String::from("token")
    };
    Json(response)
}

#[handler]
fn create_website(Json(data): Json<CreateWebsiteInput>) -> Json<CreateWebsiteOutput> {
    let url = data.url;
    let mut s = Store::default().unwrap();
    let _website = s.create_website(String::from("fc67975b-70ff-4021-a077-8223cd545e9a"), url.clone()).unwrap();
    let response = CreateWebsiteOutput {
        id: url
    };

    Json(response)
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    let app = Route::new()
    .at("/signup", post(signup))
    .at("/signin", post(signin))
    .at("/website/:website_id", get(get_website))
    .at("/website", post(create_website));
    Server::new(TcpListener::bind("0.0.0.0:3001"))
      .run(app)
      .await
}