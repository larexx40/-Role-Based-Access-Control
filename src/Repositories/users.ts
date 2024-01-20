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

    static async getUser(whereClause: any): Promise<IUserDocument | null> {
        try {
            return await UserModel.findOne(whereClause).populate('roles'); // Populate the 'roles' field with actual role data
        } catch (error) {
            console.error("User DB error:", error);
            throw error;
        }
    }
    
    static async updateUser(userId: string, updateData: Partial<UserData>):Promise<IUserDocument | null> {
        try {
            return UserModel.findByIdAndUpdate(userId, updateData, { new: true }).populate('roles');
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
            return (isExist)? true: false;
            
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