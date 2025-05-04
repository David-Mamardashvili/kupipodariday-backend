export function excludePassword<T extends { password?: string }>(
  user: T,
): Omit<T, 'password'> {
  if (user && user.password) {
    const { password, ...res } = user;
    return res;
  }
  return user;
}
