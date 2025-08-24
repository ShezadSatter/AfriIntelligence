import React, { createContext, useState, ReactNode } from "react";

export type UserRole = "teacher" | "student";

export interface UserContextType {
  user: any | null;
  setUser: (user: any) => void;
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole) => void;
}

export const UserContext = createContext<UserContextType | null>(null);

export const UserContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser, selectedRole, setSelectedRole }}>
      {children}
    </UserContext.Provider>
  );
};
