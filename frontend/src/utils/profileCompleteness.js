export const profileCompleteness = user => {
  if (!user) return 0;
  const fields = [user.avatar, user.headline, user.bio, user.location, user.company, user.role, user.skills?.length];
  return Math.round(fields.filter(Boolean).length / fields.length * 100);
};
