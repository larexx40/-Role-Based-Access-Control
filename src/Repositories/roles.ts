import RoleModel, { Role, RoleDocument } from "../Models/role";

class RoleRepository {
    static async createUser(role: Role ): Promise<RoleDocument> {
        try {
            const newrole = await RoleModel.create(role);
            return newrole;
        } catch (error) {
            console.error("User DB error:", error);
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
          const role = await RoleModel.findById(whereClause).select(selectedFields).exec();;
          return role;
        } catch (error) {
          console.error("Role DB error:", error);
          return null;
        }
    }
    
    static async getRoles(selectedFields: string[] = []): Promise<RoleDocument[]> {
        try {
          const roles = await RoleModel.find();
          return roles;
        } catch (error) {
          console.error("Role DB error:", error);
          throw error;
        }
    }
    
    static async deleteRole(roleId: string): Promise<void> {
        try {
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
            { $pull: { permissions: permission } },
            { new: true }
          );
          return role;
        } catch (error) {
          console.error("Role DB error:", error);
          return null;
        }
    }
}

export default RoleRepository;