// === IMPORTS ===
// Import necessary types from diesel and std
use diesel::prelude::*;
use diesel::PgConnection;
use diesel::result::ConnectionError;
use std::env;

// === STRUCT DEFINITION ===
// Store holds a database connection that can be reused
pub struct Store {
    pub conn: PgConnection  // Fixed typo: PgConnection (not PgConnnection)
}

// === IMPLEMENTATION ===
impl Store {
    // Constructor: Creates a new Store with database connection
    pub fn new() -> Result<Self, ConnectionError> {
        // Get database URL from environment variable
        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| panic!("DATABASE_URL environment variable must be set"));
        
        // Establish connection to PostgreSQL
        let conn = PgConnection::establish(&database_url)?;
        
        // Return Store with connection
        Ok(Self { conn })
    }
}