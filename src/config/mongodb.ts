import mongoose from 'mongoose';

export const getDB = () => {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        throw new Error('Database not connected. Ensure mongoose.connect() is called first.');
    }
    return mongoose.connection.db;
};

export const db = mongoose.connection.db;
