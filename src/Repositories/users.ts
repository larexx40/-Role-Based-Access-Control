import RoleModel from "../Models/role";
// import {  IUserDocument, UserModel } from "../Models/users";
import UserModel, { IUserDocument } from "../Models/users";
import { UserData } from "../Types/types";

class UserRepository {
    static async createUser(user: UserData): Promise<IUserDocument> {
        try {
            const newUser = await UserModel.create(user);
            return newUser;
        } catch (error) {
            console.error("User DB error:", error);
            throw error;
        }
    }

    static async getUser(whereClause: any, selectedFields: string[] = []): Promise<IUserDocument | null> {
        try {
            const user =  await UserModel.findOne(whereClause).select(selectedFields.join(' ')).lean().exec();
            if(!user){
              return null;
            }
            user._id = user._id.toString();

            // Populate the 'roles' field with actual role data
            // const roles = await RoleModel.find({ name: { $in: user.roles } });

            //  // Map roles to include permissions
            // const rolesWithPermissions = roles.map(role => ({
            //   name: role.name,
            //   permissions: role.permissions,
            // }));

            // user.roles = rolesWithPermissions
            return user
        } catch (error) {
            console.error("User DB error:", error);
            throw error;
        }
    }
    
    static async updateUser(userId: string, updateData: Partial<UserData>):Promise<IUserDocument | null> {
        try {
            return UserModel.findByIdAndUpdate(userId, updateData, { new: true });
        } catch (error) {
            console.error("User DB error:", error);
            throw error;
        }
    }

    static async updateUserRoles(userId: string, newRoles: string | string[]): Promise<IUserDocument | null> {
      try {
          const updatedUser = await UserModel.findByIdAndUpdate(
              userId,
              { $set: { roles: newRoles } },
              { new: true }
          )
  
          return updatedUser;
      } catch (error) {
          console.error("User DB error:", error);
          throw error;
      }
  }
    
    static async deleteUser(userId: string): Promise<void> {
        try {
          await UserModel.findByIdAndDelete(userId);
        } catch (error) {
          console.error('Error deleting user:', error);
          throw new Error('Failed to delete user');
        }
    }

    static async checkIfExist(whereClause: any): Promise<boolean | null>{
        try {
            const isExist = await UserModel.find(whereClause);
            return (isExist.length> 0)? true: false;
            
        } catch (error) {
            console.error("User DB error:", error);
            throw error;
        }
    }

    static async getAllUsers(): Promise<IUserDocument[]> {
        try {
          const allUsers = await UserModel.find();
          return allUsers;
        } catch (error) {
          console.error('Error fetching all users:', error);
          throw new Error('Failed to fetch all users');
        }
    }

    static async changeUserStatus(userId: string, newStatus: string): Promise<IUserDocument | null> {
        try {
          const user = await UserModel.findByIdAndUpdate(userId, { status: newStatus }, { new: true });
          return user;
        } catch (error) {
          console.error('Error changing user status:', error);
          throw new Error('Failed to change user status');
        }
      }
    
    static async assignRoleToUser(userId: string, roleId: string): Promise<IUserDocument | null> {
        try {
          const user = await UserModel.findByIdAndUpdate(userId, { $addToSet: { roles: roleId } }, { new: true });
          return user;
        } catch (error) {
          console.error('Error assigning role to user:', error);
          throw new Error('Failed to assign role to user');
        }
    }
    
    static async removeUserRole(userId: string, roleId: string): Promise<IUserDocument | null> {
        try {
          const user = await UserModel.findByIdAndUpdate(userId, { $pull: { roles: roleId } }, { new: true });
          return user;
        } catch (error) {
          console.error('Error removing role from user:', error);
          throw new Error('Failed to remove role from user');
        }
    }


}

export default UserRepository;