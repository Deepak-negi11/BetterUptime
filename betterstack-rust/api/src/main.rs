use std::sync::{Arc, Mutex};

use poem::{get, listener::TcpListener, middleware::Cors, post, EndpointExt, Route, Server};

pub mod request_input;
pub mod request_output;
use store::store::Store;
pub mod routes;
use crate::routes::user::{signin, signup};
use crate::routes::website::{create_website, get_website, get_websites, test_alert_handler};
pub mod alert;
use crate::routes::oauth::{github_callback, github_start, google_callback, google_start};

#[tokio::main(flavor = "multi_thread")]
async fn main() -> Result<(), std::io::Error> {
    dotenv::dotenv().ok();
    let s = Arc::new(Mutex::new(Store::new().unwrap()));

    let cors = Cors::new()
        .allow_origins_fn(|_| true)
        .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
        .allow_headers(vec!["Content-Type", "Authorization"])
        .allow_credentials(true);

    let app = Route::new()
        .at("/user/signup", post(signup))
        .at("/user/signin", post(signin))
        .at("/user/oauth/google", get(google_start))
        .at("/user/oauth/google/callback", get(google_callback))
        .at("/user/oauth/github", get(github_start))
        .at("/user/oauth/github/callback", get(github_callback))
        .at("/website/:website_id", get(get_website))
        .at("/website/:id/alert-test", post(test_alert_handler))
        .at("/website", post(create_website))
        .at("/websites", get(get_websites))
        .data(s)
        .with(cors);

    Server::new(TcpListener::bind("0.0.0.0:3001"))
        .run(app)
        .await
}
