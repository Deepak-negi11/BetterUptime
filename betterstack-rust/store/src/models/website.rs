use chrono::Utc;
use diesel::prelude::*;
use uuid::Uuid;
use crate::store::Store;

#[derive(Queryable, Insertable, Selectable)]
#[diesel(table_name = crate::schema::website)]
pub struct Website {
    pub id: String,
    pub url: String,
    pub time_added: chrono::NaiveDateTime,
    pub user_id: String,
}

impl Store {
  
    pub fn create_website(
        &mut self,
        user_id: String,
        url: String,
    ) -> Result<Website, diesel::result::Error> {
        let website = Website {
            id: Uuid::new_v4().to_string(),
            url,
            time_added: Utc::now().naive_utc(),
            user_id,
        };

        diesel::insert_into(crate::schema::website::table)
            .values(&website)
            .returning(Website::as_returning())
            .get_result(&mut self.conn)
    }

   
    pub fn delete_website(
        &mut self,
        target_id: &str,
        owner_id: &str,
    ) -> Result<usize, diesel::result::Error> {
        use crate::schema::website::dsl::*;

        diesel::delete(
            website
                .filter(id.eq(target_id))
                .filter(user_id.eq(owner_id)),
        )
        .execute(&mut self.conn)
    }

   
    pub fn get_website(
        &mut self,
        target_id: &str,
        owner_id: &str,
    ) -> Result<Website, diesel::result::Error> {
        use crate::schema::website::dsl::*;

        website
            .filter(id.eq(target_id))
            .filter(user_id.eq(owner_id))
            .select(Website::as_select())
            .first(&mut self.conn)
    }

   
    pub fn get_user_websites(&mut self, owner_id: &str) -> Result<Vec<Website>, diesel::result::Error> {
        use crate::schema::website::dsl::*;

        website
            .filter(user_id.eq(owner_id))
            .select(Website::as_select())
            .load(&mut self.conn)
    }


    pub fn get_all_websites_global(&mut self) -> Result<Vec<Website>, diesel::result::Error> {
        use crate::schema::website::dsl::*;

        website
            .select(Website::as_select())
            .load(&mut self.conn)
    }
}