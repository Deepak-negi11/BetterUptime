use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{rand_core::OsRng, SaltString};

/// Hashes a plain-text password using Argon2id algorithm.
/// Returns the hash string which includes the salt and algorithm parameters.
pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2.hash_password(password.as_bytes(), &salt)?.to_string();
    Ok(hash)
}

/// Verifies a plain-text password against a stored hash.
/// Returns true if the password matches, false otherwise.
pub fn verify_password(password: &str, hash: &str) -> bool {
    let parsed_hash = PasswordHash::new(hash).ok();
    parsed_hash.map_or(false, |h| {
        Argon2::default().verify_password(password.as_bytes(), &h).is_ok()
    })
}