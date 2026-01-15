use serde::{Deserialize, Serialize};

#[derive(serde::Deserialize,serde::Serialize)]
pub struct CreateWebsiteInput{
    pub url:String
}