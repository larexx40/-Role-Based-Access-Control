
import { NextFunction, Request, Response } from "express";
import RoleRepository from "../Repositories/roles";
import { Role } from "../Types/types";
import mongoose from "mongoose";

class Roles {
    //add new role
    static async addRole(req: Request, res: Response, next: NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ 
                status: false, 
                message: "Request body is required",
                error: [],
                data: []
            });
            return;
        }

        const {name, permissions} = req.body;
        if (!name || (!permissions && !Array.isArray(permissions))) {
            res.status(400).json({ 
                status: false, 
                message: "Pass in the required field",
                error: [],
                data: []
            });
            return;
        }

        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {roles} = req.user;
        if (!roles?.includes('Admin')){
            res.status(400).json({ 
                status: false, 
                message: "User not authourised to perform this action",
                error: [],
                data: []
            });
            return;
        }

        const newRole: Role = {
            name,
            permissions: Array.isArray(permissions) ? permissions : [permissions]
        };

        const save = await  RoleRepository.createRole(newRole);
        res.status(200).json({ 
            status: false, 
            message: "Role created sucessfully",
            error: [],
            data: save
        });
        return;
    }
    //edit role
    static async updateRole(req: Request, res: Response, next: NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ 
                status: false, 
                message: "Request body is required",
                error: [],
                data: []
            });
            return;
        }

        const {name, permissions, roleId} = req.body;
        if (!roleId || !name || (!permissions && !Array.isArray(permissions))) {
            res.status(400).json({ 
                status: false, 
                message: "Pass in the required field",
                error: [],
                data: []
            });
            return;
        }

        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {roles} = req.user;
        if (!roles?.includes('Admin')){
            res.status(400).json({ 
                status: false, 
                message: "User not authourised to perform this action",
                error: [],
                data: []
            });
            return;
        }

        const newRoleData : Role ={
            name,
            permissions: Array.isArray(permissions) ? permissions : [permissions]
        }
        const roleExist = await RoleRepository.checkIfExist({_id: roleId});
        if(!roleExist){
            res.status(404).json({ 
                status: false, 
                message: "Role not found",
                error: [],
                data: []
            });
            return;
        }

        const update = await RoleRepository.updateRole(roleId, newRoleData);
        res.status(200).json({ 
            status: false, 
            message: "Role updated successfully",
            error: [],
            data: []
        });
        return;
    }
    //delete role
    static async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ 
                status: false, 
                message: "Request body is required",
                error: [],
                data: []
            });
            return;
        }

        const {roleId} = req.body;
        if (!roleId) {
            res.status(400).json({ 
                status: false, 
                message: "Pass in role id",
                error: [],
                data: []
            });
            return;
        }

        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {roles} = req.user;
        if (!roles?.includes('Admin')){
            res.status(400).json({ 
                status: false, 
                message: "User not authourised to perform this action",
                error: [],
                data: []
            });
            return;
        }
        const isExist = await RoleRepository.checkIfExist(roleId);
        if(isExist){
            res.status(404).json({ 
                status: false, 
                message: "Role not found",
                error: [],
                data: []
            });
            return;
        }

        const deleteRole = await RoleRepository.deleteRole(roleId);
        res.status(200).json({ 
            status: false, 
            message: "Role deleted successfully",
            error: [],
            data: []
        });
        return;

    }
    //get role
    static async getRole(req: Request, res: Response, next: NextFunction): Promise<void>{
        const roleId = req.params.id;

        if (roleId) {
            // If roleId is provided, fetch a single role
            const role = await RoleRepository.getRoleById(roleId);
            if(role){
                res.status(200).json({ 
                    status: true, 
                    message: "Role fetched",
                    error: [],
                    data: role
                });
                return;
            }
            res.status(404).json({ 
                status: false, 
                message: "Role with id not found",
                error: [],
                data: []
            });
            return;
        }
        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {roles} = req.user;
        if (!roles?.includes('Admin')){
            res.status(400).json({ 
                status: false, 
                message: "User not authourised to perform this action",
                error: [],
                data: []
            });
            return;
        }

        //fetch all role
        const allRoles = await RoleRepository.getRoles();
        if(allRoles.length > 0){
            res.status(200).json({ 
                status: true, 
                message: "Role fetched",
                error: [],
                data: allRoles
            });
            return;
        }
        res.status(200).json({ 
            status: true, 
            message: "No role found",
            error: [],
            data: []
        });
        return;
    }
    //add permission
    static async addPermission(req: Request, res: Response, next: NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ 
                status: false, 
                message: "Request body is required",
                error: [],
                data: []
            });
            return;
        }

        const {permissions, roleId} = req.body;
        if (!roleId || (!permissions && !Array.isArray(permissions))) {
            res.status(400).json({ 
                status: false, 
                message: "Pass in the required field",
                error: [],
                data: []
            });
            return;
        }

        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {roles} = req.user;
        if (!roles?.includes('Admin')){
            res.status(400).json({ 
                status: false, 
                message: "User not authourised to perform this action",
                error: [],
                data: []
            });
            return;
        }

        const newPermissions : Partial<Role> ={
            permissions: Array.isArray(permissions) ? permissions : [permissions]
        }

        const roleExist = await RoleRepository.checkIfExist({_id: roleId})
        if(!roleExist){
            res.status(404).json({ 
                status: false, 
                message: "Role with id not found",
                error: [],
                data: []
            });
            return;
        }

        if(permissions.length > 0){
            for (let i = 0; i < permissions.length; i++) {
                const addPermission = await RoleRepository.addPermissionToRole(roleId, permissions[i]);                
            }
            res.status(200).json({ 
                status: true, 
                message: "Permission added successfully",
                error: [],
                data: []
            });
            return;
        }
        const addPermission = await RoleRepository.addPermissionToRole(roleId, permissions)
        res.status(200).json({ 
            status: true, 
            message: "Permissions added successfully",
            error: [],
            data: []
        });

    }
    //remove permission
    static async removePermission(req: Request, res: Response, next: NextFunction): Promise<void>{
        if (!req.body || Object.keys(req.body).length === 0) {
            res.status(400).json({ 
                status: false, 
                message: "Request body is required",
                error: [],
                data: []
            });
            return;
        }

        const {permissions, roleId} = req.body;
        if (!roleId || (!permissions && !Array.isArray(permissions))) {
            res.status(400).json({ 
                status: false, 
                message: "Pass in the required field",
                error: [],
                data: []
            });
            return;
        }

        if(!req.user){
            res.status(400).json({ 
                status: false, 
                message: "User not authenticated",
                error: [],
                data: []
            });
            return;
        }

        const {roles} = req.user;
        if (!roles?.includes('Admin')){
            res.status(400).json({ 
                status: false, 
                message: "User not authourised to perform this action",
                error: [],
                data: []
            });
            return;
        }

        try {
            const roleExist = await RoleRepository.checkIfExist({_id: roleId})
            if(!roleExist){
                res.status(404).json({ 
                    status: false, 
                    message: "Role with id not found",
                    error: [],
                    data: []
                });
                return;
            }

            if(permissions.length > 0){
                for (let i = 0; i < permissions.length; i++) {
                    const removePermission = await RoleRepository.removePermissionFromRole(roleId, permissions[i]);                
                }
                res.status(200).json({ 
                    status: true, 
                    message: "Permission removed successfully",
                    error: [],
                    data: []
                });
                return;
            }
            const removePermission = await RoleRepository.removePermissionFromRole(roleId, permissions)
            res.status(200).json({ 
                status: true, 
                message: "Permission removed successfully",
                error: [],
                data: []
            });
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                // Mongoose validation error
                const validationErrors = Object.values(error.errors).map((err) => err.message);
                // const validationErrors: Record<string, string> = Object.values(error.errors).reduce((acc, err) => {
                //     acc[err.path] = err.message;
                //     return acc;
                //   }, {});
                res.status(400).json({ 
                    status: false,
                    message: "Invalid data passed",
                    error: validationErrors,
                    data:[]
                });
            }
            res.status(500).json({ 
                status: false, 
                message: "Internal server error",
                error: [],
                data: []
            });
            console.error(error);
        }

    }


}

export default Roles