import { Schema, model, Document } from 'mongoose';


const statuses = ["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED", "BANNED"] as const;
export interface IUser extends Document {
  name: string;
  email: string;
  phoneno: string;
  password: string;
  username?: string;
  dob?: Date;
  address?: string;
  role?: string[]; // Array of role names
  status?: typeof statuses[number];
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  verificationOtp?: number | null | '';
  verificationOtpExpiry?: Date | null | '';
  mfaEnabled?: number;
  mfaSecret?: string; // Store the secret key for TOTP
  mfaSecretExpiry?: number | null | '';
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneno: { type: String, required: true, unique: true},
  password: { type: String, required: true },
  username: { type: String, unique: true },
  dob: { type: Date },
  address: { type: String },
  role: [{ type: String }], // Array of role names
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
  mfaSecret: { type: Number },
  mfaSecretExpiry: { type: Date, required: false },
});

export const UserModel = model<IUser>('User', userSchema);