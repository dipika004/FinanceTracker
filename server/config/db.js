const mongoose = require('mongoose');
require('dotenv').config();
const mongoURI = process.env.MONGO_URI;

const databaseConnection=async()=>{
    try{
        await mongoose.connect(mongoURI);
        console.log("Database connected successfully");
    }catch(err){
        console.log("Error while connecting to database", err);
    }
}
module.exports=databaseConnection;