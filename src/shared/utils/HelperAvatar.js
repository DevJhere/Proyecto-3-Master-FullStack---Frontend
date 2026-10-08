// Función para devolver siempre una URL de avatar válida
const getAvatarUrl = (avatarPath) => {
  const defaultUrl = "https://res.cloudinary.com/kvayxt5w/image/upload/v1788861354/profile-default.jpg";
  if (!avatarPath || avatarPath.includes("profile-default")) {
    return defaultUrl;
  }
  return avatarPath;
};

export {
  getAvatarUrl
}