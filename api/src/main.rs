use poem::{Body, Route, Server, get, handler, listener::TcpListener, post, web::Path};

use crate::{reqeust_inputs::CreateWebsiteInput, requests_output::CreateWebsiteOutput};

pub mod reqeust_inputs;
pub mod requests_output;

#[handler]
fn get_website(Path(name): Path<String>) -> String {
    format!("hello: {}", name)
}

#[handler]
fn create_website(Json(data): Json<CreateWebsiteInput>) -> Json<CreateWebsiteOutput> {
    let url = data.url;
    let response = CreateWebsiteOutput {
        id: data.url
    };

    Json(response)
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    let app = Route::new()
    .at("/status/:website_id", get(get_website))
    .at("/website", post(create_website));
    Server::new(TcpListener::bind("0.0.0.0:3001"))
      .run(app)
      .await
}