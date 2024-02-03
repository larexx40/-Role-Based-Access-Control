import { Schema, model, Document } from 'mongoose';
import { UserData } from '../Types/types';


interface IUserDocument extends UserData, Document {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>({  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
    minlength: [3, 'Name must be at least 3 characters long'],
    lowercase: true,
  },
  username: {
    type: String,
    unique: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, 'Invalid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  phoneno: { type: String, required: true, unique: true},
  dob: { type: Date },
  address: { type: String },
  roles: [{ type: String, ref: 'Role' }], // Reference to the Role model (relations wih roles)
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED', 'BANNED'],
    default: 'ACTIVE',
  },
  isEmailVerified: { type: Boolean, required: true, default: false },
  isPhoneVerified: { type: Boolean, required: true, default: false },
  verificationOtp: { type: Number, required: false },
  verificationOtpExpiry: { type: Date, required: false },
  mfaEnabled: { type: Boolean, default: false },
  mfaType: {type: String, enum: ['Email', 'SMS'], default: 'Email', required: false},
  mfaSecret: { type: Number },
  mfaSecretExpiry: { type: Date, required: false },
  profilePic: {type: String, required: false}
});

const UserModel = model<IUserDocument>('User', userSchema);

export default UserModel;
export { IUserDocument };