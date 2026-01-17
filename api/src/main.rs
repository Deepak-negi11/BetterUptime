use std::sync::{Arc, Mutex};

use poem::{EndpointExt, Route, Server, get, listener::TcpListener, post};

pub mod request_input;
pub mod request_output;
use store::store::Store;
pub mod routes;
use crate::routes::user::{signin, signup};
use crate::routes::website::{create_website, get_website};
use crate::routes::authmiddleware;

#[tokio::main(flavor = "multi_thread")]
async fn main() -> Result<(), std::io::Error> {
    let s = Arc::new(Mutex::new(Store::new().unwrap()));
    let app = Route::new()
    .at("/signup", post(signup))
    .at("/signin", post(signin))
    .at("/website/:website_id", get(get_website))
    .at("/website", post(create_website))
    .data(s);
    Server::new(TcpListener::bind("0.0.0.0:3000"))
      .run(app)
      .await
}