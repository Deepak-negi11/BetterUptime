#[derive(serde::Deserialize, serde::Serialize)]
pub struct CreateWebsiteInput {
    pub url: String,
    pub name: Option<String>,
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
    pub remember_me: Option<bool>,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct ForgotPasswordInput {
    pub email: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct ResetPasswordInput {
    pub token: String,
    pub password: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct UpdateProfileInput {
    pub username: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct UpdateEmailInput {
    pub email: String,
    pub password_confirm: String,
}
