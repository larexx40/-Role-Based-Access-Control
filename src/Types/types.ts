const statuses = ["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED", "BANNED"] as const;
type mfaType = 'Email'| 'SMS';
export interface UserData {
  name: string;
  email: string;
  phoneno: string;
  password: string;
  username?: string;
  dob?: Date;
  address?: string;
  roles?: string[]; // Array of role names
  status?: typeof statuses[number];
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  verificationOtp?: number | null | '';
  verificationOtpExpiry?: Date | null | '';
  mfaEnabled?: number;
  mfaType?: mfaType;
  mfaSecret?: string; // Store the secret key for TOTP
  mfaSecretExpiry?: number | null | '';
}