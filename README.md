# -Role-Based-Access-Control
This documentation provides an overview of the Role-Based Access Control (RBAC) implementation in our application. RBAC is a system for restricting access to resources based on the roles assigned to users. This feature ensures that users have appropriate access levels and permissions.

## Table of Contents

1. [Introduction](#introduction)
2. [Endpoints](#endpoints)
3. [RBAC Configuration](#rbac-configuration)
4. [Work Left](#work-left)

## Introduction

Role-Based Access Control (RBAC) is implemented to manage user access to various features and functionalities within the application. Users are assigned roles, and each role is associated with specific permissions. These permissions determine the actions a user can perform.

## Endpoints

The following endpoints are available for RBAC:

- `/roles`: CRUD operations for roles (accessible only to administrators).
- `/assign-role/:userId`: Assign a role to a user (accessible only to administrators).
- `/remove-role/:userId`: Remove a role from a user (accessible only to administrators).
- `/enable-mfa`: Allow user to enable multi-factor authentication via SMS or Email OTP.
- `/disable-mfa`: User can disable mfa.
- `/verify-mfa`: Supply the OTP sen via SMS or Email.

## RBAC Configuration

Roles and permissions are configured in the `roles` collection in the database. Each role has a name and a set of associated permissions.

```json
// Example Role
{
  "name": "Admin",
  "permissions": ["CREATE_USER", "UPDATE_USER", "DELETE_USER"]
}


// Example User
{
    "name": "Olatunji Rokeeb",
    "email": "larexx40@gmail.com",
    "phoneno": "08100529552",
    "roles": ["Admin", "Super Admin"],
    "status": "ACTIVE",
    "isEmailVerified": false,
    "isPhoneVerified": false,
    "mfaEnabled": false
}

```

## Work Left

There are some additional features and enhancements that can be implemented to further enhance the security and functionality of our application:

1. **SMS Services:**
   - Implement SMS services for phone number verification and SMS based MFA. This provides an alternative method of verification using mobile phone numbers.

**Contributions:**
Feel free to contribute to these features and improvements. Your contributions will help strengthen the security and user experience of our application.


Here is the URL to the deployed application on Render: https://ttech-4a4z.onrender.com/

- Author - [R. O. Olatunji](https://www.linkedin.com/in/rokeebolatunji/)
 