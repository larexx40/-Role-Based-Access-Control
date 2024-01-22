import mongoose, { Document, Schema } from 'mongoose';
import { Role } from '../Types/types';


export interface RoleDocument extends Role, Document {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

const roleSchema = new Schema<RoleDocument>({
  name: { type: String, required: true, unique: true },
  permissions: [{ type: String, ref: 'Permission' }], 
});

const RoleModel = mongoose.model<RoleDocument>('Role', roleSchema);

export default RoleModel;