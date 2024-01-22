const statuses = ["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED", "BANNED"] as const;
type mfaType = 'EMAIL'| 'SMS';
export interface UserData {
    [x: string]: any;
    name: string;
    email: string;
    phoneno: string;
    password: string | '';
    username?: string;
    dob?: Date;
    address?: string;
    roles?: string[]; // Array of role names
    status?: typeof statuses[number];
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    verificationOtp?: number | null | '';
    verificationOtpExpiry?: Date | null | '';
    mfaEnabled?: boolean;
    mfaType?: mfaType | '';
    mfaSecret?: number | ''; // Store the secret key for TOTP
    mfaSecretExpiry?: Date | null | '';
}

export interface Role {
    name: string;
    permissions: string[];
}

export interface AuthTokenPayload {
    userid: string;
    email: string;
    roles: string[] | undefined; 
}

export interface UserProfile {
    userid: string,
    name: string;
    username?: string;
    email: string;
    phoneno: string;
    dob?: Date;
    address?: string;
    roles: string[]|undefined;
    status?: typeof statuses[number];
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    mfaEnabled?: boolean;
    mfaType?: string;
    createdAt: Date;
    updatedAt: Date;
}