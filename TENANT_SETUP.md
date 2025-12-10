# Tenant Setup Guide

This guide explains how to set up a new tenant for the HRMS application.

## Prerequisites

- Ensure the backend server is running or at least the database is accessible.
- You need to be in the `backend` directory.

## Quick Start

We have provided an interactive script to make tenant creation easy.

1.  Open your terminal and navigate to the `backend` folder:
    ```bash
    cd backend
    ```

2.  Run the tenant creation script:
    ```bash
    npm run create-tenant
    ```

3.  Follow the interactive prompts:
    - **Tenant ID**: Must start with `tenant_` (e.g., `tenant_acme`).
    - **Tenant Name**: The display name of the company (e.g., `Acme Corp`).
    - **Admin Email**: The email for the initial admin user.
    - **Admin Password**: The password for the initial admin user.

## What the Script Does

The script performs the following actions automatically:

1.  **Registers the Tenant**: Adds an entry to the `shared.tenants` table.
2.  **Creates Schema**: Creates a new PostgreSQL schema for the tenant (e.g., `tenant_acme`).
3.  **Applies Schema**: Runs the `config/tenant_schema.sql` to create all necessary tables within the new schema.
4.  **Creates Admin**: Inserts the initial admin user into the tenant's `users` table.

## Manual Verification

After running the script, you can verify the setup by:

1.  Checking the database:
    ```sql
    SELECT * FROM shared.tenants;
    SELECT * FROM "tenant_YOUR_ID".users;
    ```
2.  Trying to log in via the frontend with the new credentials.
