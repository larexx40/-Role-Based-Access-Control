import { Schema, model, Document } from 'mongoose';
import { UserData } from '../Types/types';



export interface IUser extends UserData, Document {

}

export interface IUserDocument extends IUser, Document {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneno: { type: String, required: true, unique: true},
  password: { type: String, required: true },
  username: { type: String, unique: true },
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
});

export const UserModel = model<IUserDocument>('User', userSchema);