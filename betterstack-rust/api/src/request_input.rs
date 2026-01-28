#[derive(serde::Deserialize, serde::Serialize)]
pub struct CreateWebsiteInput {
    pub url: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct CreateUserInput {
    pub username: String,
    pub password: String,
    pub email: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct SignInInput {
    pub username: String,
    pub password: String,
}
