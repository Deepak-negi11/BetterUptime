#[derive(serde::Deserialize, serde::Serialize)]
pub struct CreateWebsiteOutput{
    pub id:String
}



#[derive(serde::Deserialize,serde::Serialize)]
pub struct CreateUserOutput{
    pub id:String
}

#[derive(serde::Deserialize,serde::Serialize)]
pub struct SignInOutput{
    pub jwt:String
}

#[derive(serde::Deserialize,serde::Serialize)]
pub struct GetWebsiteOutput{
    pub url:String,
    pub id :String,
    pub user_id :String
}
