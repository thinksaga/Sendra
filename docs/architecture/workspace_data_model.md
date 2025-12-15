# Workspace Data Model Design

## 1. Schema Overview

We use a standard **Many-to-Many** relationship between `User` and `Workspace` via an explicit join table `WorkspaceMember`. This allows us to store metadata (like `role`) on the membership itself.

### Key Decisions
-   **UUIDs**: Used everywhere for ID safety.
-   **Keycloak Link**: `User.keycloakId` is the bridge to Auth. We verify the specific user by this ID.
-   **Slug**: Added to `Workspace` for friendly URLs (`/workspaces/acme-corp`).
-   **Cascading Deletes**: If a User or Workspace is deleted, membership records are cleaned up automatically.

## 2. Usage Examples

### A. Create User on First Login (JIT)
```typescript
const user = await prisma.user.upsert({
  where: { keycloakId: token.sub },
  update: {}, // No updates on login usually
  create: {
    keycloakId: token.sub,
    email: token.email,
    name: token.name,
  },
});
```

### B. Create a Workspace
```typescript
// Transaction ensures the creator becomes the OWNER immediately
const workspace = await prisma.$transaction(async (tx) => {
  const ws = await tx.workspace.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
    },
  });

  await tx.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId: ws.id,
      role: 'OWNER',
    },
  });

  return ws;
});
```

### C. Add Member to Workspace
```typescript
await prisma.workspaceMember.create({
  data: {
    userId: newUserId,
    workspaceId: workspaceId,
    role: 'MEMBER',
  },
});
```

### D. Get User's Workspaces
```typescript
const memberships = await prisma.workspaceMember.findMany({
  where: { userId: currentUser.id },
  include: {
    workspace: true, // Get the actual workspace details
  },
});
```

## 3. Migration Strategy
1.  **Generate Migration**: `pnpm prisma migrate dev --name init_workspace_model`
2.  **Apply**: This will create the tables in Postgres.
3.  **Client Generation**: `pnpm prisma generate` will create the TypeScript client in `node_modules`.
