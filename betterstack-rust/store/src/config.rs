use std::env;

pub struct Config {
    pub database_url: String,
}


impl Default for Config {
    fn default() -> Self {
        dotenvy::dotenv().ok();

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| panic!("Please set the DATABASE_URL environment variable"));
        Self { database_url
        }
    }
}
