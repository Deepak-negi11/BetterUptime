use crate::store::Store;


impl Store {
    pub fn create_website(&self){
        println!("create user called");
        self.conn.execute("INSERT INTO xyz")

    }
    pub fn get_website(&self){

    }
}