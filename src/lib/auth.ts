export function isAdmin(userId: string): boolean {
  return userId === process.env.ADMIN_CLERK_USER_ID;
}
