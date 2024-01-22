import { Router } from "express";
import Roles from "../Controllers/roles";
import { checkToken, isAdmin } from "../middleware/auth";
const roleRouter = Router();

roleRouter.get('/', checkToken, isAdmin, Roles.getRole )
roleRouter.get('/:id', checkToken, Roles.getRole )
roleRouter.post('/add-role', checkToken, isAdmin, Roles.addRole);
roleRouter.delete('/:id', checkToken, isAdmin, Roles.deleteRole);
roleRouter.patch('/add-permision/:id', checkToken, Roles.addPermission)
roleRouter.delete('/remove-permission/:id', checkToken, isAdmin, Roles.deleteRole);
roleRouter.put('/update/:id', checkToken, isAdmin, Roles.updateRole)


export default roleRouter;