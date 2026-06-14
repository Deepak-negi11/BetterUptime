use crate::store::Store;
use chrono::{Duration, NaiveDateTime, Utc};
use diesel::prelude::*;
use uuid::Uuid;

#[derive(Queryable, Insertable, Selectable)]
#[diesel(table_name=  crate::schema::user)]
#[diesel(check_for_backend(diesel::pg::Pg))]
struct User {
    id: String,
    username: String,
    email: String,
    password: String,
}

#[derive(Insertable)]
#[diesel(table_name = crate::schema::password_reset_token)]
struct NewPasswordResetToken {
    id: String,
    user_id: String,
    token: String,
    expires_at: NaiveDateTime,
    used: bool,
    created_at: NaiveDateTime,
}

impl Store {
    pub fn sign_up(
        &mut self,
        username: String,
        password: String,
        email: String,
    ) -> Result<String, diesel::result::Error> {
        use crate::schema::user;
        let id = Uuid::new_v4();

        let u = User {
            username,
            password,
            email,
            id: id.to_string(),
        };
        diesel::insert_into(user::table)
            .values(&u)
            .returning(User::as_returning())
            .get_result(&mut self.conn)?;
        Ok(id.to_string())
    }

    pub fn get_user_by_username(
        &mut self,
        input_username: &str,
    ) -> Result<(String, String), diesel::result::Error> {
        use crate::schema::user::dsl::*;
        let user_result = user
            .filter(username.eq(input_username))
            .select(User::as_select())
            .first(&mut self.conn)?;

        Ok((user_result.id, user_result.password))
    }

    pub fn get_user_by_email(
        &mut self,
        input_email: &str,
    ) -> Result<String, diesel::result::Error> {
        use crate::schema::user::dsl::*;
        let user_result = user
            .filter(email.eq(input_email))
            .select(User::as_select())
            .first(&mut self.conn)?;

        Ok(user_result.id)
    }

    pub fn get_user_by_id(&mut self, user_id: &str) -> Result<String, diesel::result::Error> {
        use crate::schema::user::dsl::*;
        let user_result = user
            .find(user_id)
            .select(User::as_select())
            .first(&mut self.conn)?;

        Ok(user_result.email)
    }

    pub fn get_user_info(&mut self, user_id: &str) -> Result<(String, String), diesel::result::Error> {
        use crate::schema::user::dsl::*;
        let user_result = user
            .find(user_id)
            .select(User::as_select())
            .first(&mut self.conn)?;

        Ok((user_result.username, user_result.email))
    }

    pub fn get_user_password_hash(&mut self, user_id: &str) -> Result<String, diesel::result::Error> {
        use crate::schema::user::dsl::*;
        let user_result = user
            .find(user_id)
            .select(User::as_select())
            .first(&mut self.conn)?;

        Ok(user_result.password)
    }

    pub fn update_username(
        &mut self,
        user_id: &str,
        new_username: &str,
    ) -> Result<usize, diesel::result::Error> {
        use crate::schema::user::dsl::*;
        diesel::update(user.find(user_id))
            .set(username.eq(new_username))
            .execute(&mut self.conn)
    }

    pub fn update_email(
        &mut self,
        user_id: &str,
        new_email: &str,
    ) -> Result<usize, diesel::result::Error> {
        use crate::schema::user::dsl::*;
        diesel::update(user.find(user_id))
            .set(email.eq(new_email))
            .execute(&mut self.conn)
    }

    pub fn delete_user(&mut self, target_user_id: &str) -> Result<(), diesel::result::Error> {
        use crate::schema::user::dsl as users;
        use crate::schema::website::dsl as sites;

        self.conn.transaction(|conn| {
            diesel::delete(sites::website.filter(sites::user_id.eq(target_user_id))).execute(conn)?;
            diesel::delete(users::user.find(target_user_id)).execute(conn)?;
            Ok(())
        })
    }

    pub fn create_password_reset_token(
        &mut self,
        input_email: &str,
    ) -> Result<Option<String>, diesel::result::Error> {
        use crate::schema::password_reset_token;

        let user_id = match self.get_user_by_email(input_email) {
            Ok(id) => id,
            Err(diesel::result::Error::NotFound) => return Ok(None),
            Err(error) => return Err(error),
        };
        let now = Utc::now().naive_utc();
        let token = Uuid::new_v4().to_string();
        let reset_token = NewPasswordResetToken {
            id: Uuid::new_v4().to_string(),
            user_id,
            token: token.clone(),
            expires_at: now + Duration::hours(1),
            used: false,
            created_at: now,
        };

        diesel::insert_into(password_reset_token::table)
            .values(&reset_token)
            .execute(&mut self.conn)?;

        Ok(Some(token))
    }

    pub fn reset_password_with_token(
        &mut self,
        input_token: &str,
        hashed_password: &str,
    ) -> Result<bool, diesel::result::Error> {
        use crate::schema::password_reset_token::dsl as reset;
        use crate::schema::user::dsl as users;

        self.conn.transaction(|conn| {
            let user_id = reset::password_reset_token
                .filter(reset::token.eq(input_token))
                .filter(reset::used.eq(false))
                .filter(reset::expires_at.gt(Utc::now().naive_utc()))
                .select(reset::user_id)
                .first::<String>(conn)
                .optional()?;

            let Some(user_id) = user_id else {
                return Ok(false);
            };

            diesel::update(users::user.find(&user_id))
                .set(users::password.eq(hashed_password))
                .execute(conn)?;
            diesel::update(reset::password_reset_token.filter(reset::token.eq(input_token)))
                .set(reset::used.eq(true))
                .execute(conn)?;

            Ok(true)
        })
    }
}
