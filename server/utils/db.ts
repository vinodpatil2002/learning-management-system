import mongoose, { set } from 'mongoose';
require('dotenv').config();

const dbUrl:string = process.env.DB_URL || '';

const connectDB = async () => {
    try {
        await mongoose.connect(dbUrl).then((data:any) => {
            console.log(`Database conneted with ${data.connection.host}`);
        });


    } catch (error:any) {
        console.log(error);
        setTimeout(connectDB, 3000);
    }
}

export default connectDB;
