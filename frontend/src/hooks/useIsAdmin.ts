import { useUser } from "@clerk/clerk-react";

export const useIsAdmin = () => {
  const { isLoaded, user } = useUser();

  return {
    isLoaded,
    isAdmin: user?.publicMetadata?.role === "admin",
  };
};
