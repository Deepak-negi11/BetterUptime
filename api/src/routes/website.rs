use std::sync::{Arc, Mutex};
use crate::request_input::CreateWebsiteInput;
use crate::request_output::{CreateWebsiteOutput, GetWebsiteOutput};
use poem::web::{Data, Json, Path};
use poem::handler;
use store::store::Store;

#[handler]
pub fn get_website(Path(id): Path<String>, Data(s): Data<&Arc<Mutex<Store>>>) -> Json<GetWebsiteOutput> {
    let mut lock = s.lock().unwrap();
    let website = lock.get_website(id).unwrap();
    Json(GetWebsiteOutput {
        url: website.url
    })
}


#[handler]
pub fn create_website(Json(data): Json<CreateWebsiteInput>,Data(s):Data<&Arc<Mutex<Store>>>) -> Json<CreateWebsiteOutput> {
    let mut locked_s = s.lock().unwrap();
    
    let website = locked_s.create_website(String::from("fc67975b-70ff-4021-a077-8223cd545e9a"), data.url).unwrap();
    let response = CreateWebsiteOutput {
        id:website.id
    };

    Json(response)
}
