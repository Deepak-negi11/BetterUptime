use crate::store::Store;


impl Store {
    pub fn create_user(&self){
        println!("create user called");
        self.conn.execute("INSERT INTO xyz")

    }
    pub fn get_user(&self){

    }
}