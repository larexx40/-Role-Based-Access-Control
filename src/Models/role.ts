import mongoose, { Document, Schema } from 'mongoose';

interface Role extends Document {
  name: string;
  domain: {
    name: string;
    permissions: string[];
  };
}

const roleSchema = new Schema<Role>({
  name: { type: String, required: true, unique: true },
  domain: {
    name: { type: String, required: true },
    permissions: [{ type: String, ref: 'Permission' }], // Reference to the Permission model (relations)
  },
});

const RoleModel = mongoose.model<Role>('Role', roleSchema);

export default RoleModel;