// Shared types that can be used in both client and server components
// These are duplicated from @workspace/database to avoid importing database code in client components

export enum ActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}