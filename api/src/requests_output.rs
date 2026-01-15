use serde::{Deserialize, Serialize};

#[derive(serde::Deserialize,serde::Serialize)]
pub struct CreateWebsiteOutput{
    pub id:String
}