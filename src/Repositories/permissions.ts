import PermissionModel, { Permission, PermissionDocument } from "../Models/permissions";

class PermissionRepository {
    
    static  async addPermission(permission: Permission): Promise<PermissionDocument | null> {
        try {
            const newPermission = await PermissionModel.create(permission);
            return newPermission;
        } catch (error) {
            console.error("Permission DB error:", error);
            throw error;
        }
    }

    static async getAllPermission(selectedFields: string[] = []): Promise<PermissionDocument[] | []>{
        try {
            return await PermissionModel.find().select(selectedFields);
        } catch (error) {
            console.error("Permission DB error:", error);
            throw error;
        }
    }

    static async getPermission(whereClause: any, selectedFields: string[] = []):Promise<PermissionDocument | null>{
        try {
            const data = await PermissionModel.findOne(whereClause).select(selectedFields.join(' '));
            return data;
        } catch (error) {
            console.error("Permission DB error:", error);
            throw error;
        }
    }

    static async getPermissionById(id: string, selectedFields: string[] = []): Promise<PermissionDocument | null>{
        try {
            const data = await PermissionModel.findById(id).select(selectedFields.join(' '));
            return data;
        } catch (error) {
            console.error("Permission DB error:", error);
            throw error;
        }
    }

    static async deletePermision(id: string): Promise<void | null> {
        try {
            return await PermissionModel.findByIdAndDelete(id)
        } catch (error) {
            console.error("Permission DB error:", error);
            throw error;
        }
    }

    static async updatePermission(id: string, updateData: Partial<Permission>):Promise<Permission| null>{
        try {
            return await PermissionModel.findByIdAndUpdate(id, updateData, {new: true})
        } catch (error) {
            console.error("Permission DB error:", error);
            throw error;
        }
    }
    
}

export default PermissionRepository