import mongoose, { Document, Schema } from 'mongoose';

interface Permission extends Document {
  name: string;
}

const permissionSchema = new Schema<Permission>({
  name: { type: String, required: true, unique: true },
});

const PermissionModel = mongoose.model<Permission>('Permission', permissionSchema);

export default PermissionModel;