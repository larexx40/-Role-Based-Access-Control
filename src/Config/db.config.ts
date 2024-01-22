//importing modules
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const dbURL = process.env.MONGO_URL

if (!dbURL) {
    console.error('Error: MONGO_URL environment variable is not set.');
    process.exit(1); // Exit the process with an error code
  }

const options = {
    autoIndex: false, // Don't build indexes
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
}

export const db = mongoose.connect(dbURL, options)
.then(() => {
     console.log('MongoDB Connected')
})
.catch(err => {
    console.error("Error connecting to MongoDB: ", err)
})
