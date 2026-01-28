use crate::store::Store;
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

    pub fn get_user_by_id(&mut self, user_id: &str) -> Result<String, diesel::result::Error> {
        use crate::schema::user::dsl::*;
        let user_result = user
            .find(user_id)
            .select(User::as_select())
            .first(&mut self.conn)?;

        Ok(user_result.email)
    }
}
