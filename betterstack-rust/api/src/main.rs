use std::sync::{Arc, Mutex};

use poem::{get, listener::TcpListener, middleware::Cors, post, EndpointExt, Route, Server};

pub mod request_input;
pub mod request_output;
use store::store::Store;
pub mod routes;
use crate::routes::user::{signin, signup};
use crate::routes::website::{create_website, get_website, get_websites};

#[tokio::main(flavor = "multi_thread")]
async fn main() -> Result<(), std::io::Error> {
    dotenv::dotenv().ok();
    let s = Arc::new(Mutex::new(Store::new().unwrap()));

    // Configure CORS to allow requests from frontend
    let cors = Cors::new()
        .allow_origin("http://localhost:3000")
        .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
        .allow_headers(vec!["Content-Type", "Authorization"])
        .allow_credentials(true);

    let app = Route::new()
        .at("/user/signup", post(signup))
        .at("/user/signin", post(signin))
        .at("/website/:website_id", get(get_website))
        .at("/website", post(create_website))
        .at("/websites", get(get_websites))
        .data(s)
        .with(cors);

    Server::new(TcpListener::bind("0.0.0.0:3001"))
        .run(app)
        .await
}
