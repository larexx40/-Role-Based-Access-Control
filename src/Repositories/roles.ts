import RoleModel, { RoleDocument } from "../Models/role";
import UserModel from "../Models/users";
import { Role } from "../Types/types";

class RoleRepository {
    static async createRole(role: Role ): Promise<RoleDocument> {
        try {
            const newrole = await RoleModel.create(role);
            return newrole;
        } catch (error) {
            console.error("Role DB error:", error);
            throw error;
        }
    }

    static async getRoleById(roleId: string, selectedFields: string[] = []): Promise<RoleDocument | null> {
        try {
          const role = await RoleModel.findById(roleId).select(selectedFields.join(' '));
          return role;
        } catch (error) {
          console.error("Role DB error:", error);
          return null;
        }
    }

    static async getRole(whereClause: any, selectedFields: string[] = []): Promise<RoleDocument | null> {
        try {
          const role = await RoleModel.findOne(whereClause).select(selectedFields).exec();
          return role;
        } catch (error) {
          console.error("Role DB error:", error);
          return null;
        }
    }
    
    static async getRoles(selectedFields: string[] = []): Promise<RoleDocument[]> {
        try {
          const roles = await RoleModel.find().select(selectedFields);
          return roles;
        } catch (error) {
          console.error("Role DB error:", error);
          throw error;
        }
    }
    
    static async deleteRole(roleId: string): Promise<void> {
        try {
            const role = await RoleModel.findById(roleId);
            if(!role){
                throw new Error("Not found");
            }
            //check if it has been assigned to user
            const assigned = await UserModel.find({roles: role.name});
            if(assigned.length > 0){
                throw new Error("Assigned"); 
            }

          await RoleModel.findByIdAndDelete(roleId);
        } catch (error) {
            console.error("Role DB error:", error);
            throw error;
        }
    }
    
    static async updateRole(roleId: string, updatedRole: Role): Promise<RoleDocument | null> {
        try {
          const role = await RoleModel.findByIdAndUpdate(roleId, updatedRole, { new: true });
          return role;
        } catch (error) {
          console.error("Role DB error:", error);
          return null;
        }
    }
    
    static async addPermissionToRole(roleId: string, permission: string): Promise<RoleDocument | null> {
        try {
          const role = await RoleModel.findByIdAndUpdate(
            roleId,
            { $addToSet: { permissions: permission } },
            { new: true }
          );
          return role;
        } catch (error) {
          console.error("Role DB error:", error);
          return null;
        }
    }
    
    static async removePermissionFromRole(roleId: string, permission: string): Promise<RoleDocument | null> {
        try {
          const role = await RoleModel.findByIdAndUpdate(
            roleId,
            { $pull: { "permissions": permission } },
            { new: true }
          );
          return role;
        } catch (error) {
          console.error("Role DB error:", error);
          return null;
        }
    }

    static async checkIfExist(whereClause: any): Promise<boolean | null>{
      try {
          const isExist = await RoleModel.find(whereClause);
          return (isExist)? true: false;
          
      } catch (error) {
          console.error("Role DB error:", error);
          throw error;
      }
  }
}

export default RoleRepository;