import mongoose, { Document, Schema } from 'mongoose';

interface Permission extends Document {
  name: string;
}

export interface PermissionDocument extends Permission, Document {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

const permissionSchema = new Schema<PermissionDocument>({
  name: { type: String, required: true, unique: true },
});

const PermissionModel = mongoose.model<PermissionDocument>('Permission', permissionSchema);

export default PermissionModel;