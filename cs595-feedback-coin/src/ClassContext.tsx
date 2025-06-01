import React, { createContext, useContext, useState, useEffect } from "react";
import { useMetaMask } from "./MetaMaskContext";

type ClassInfo = {
  id: number;
  name: string;
  contractAddress: string;
  role: "teacher" | "student";
};

type ClassContextType = {
    classes: ClassInfo[];
    addJoinedClass: (name: string, contractAddress: string, role?: "teacher" | "student") => Promise<void>;
};
  

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const useClassContext = () => {
  const context = useContext(ClassContext);
  if (!context) throw new Error("useClassContext must be used within a ClassProvider");
  return context;
};

export const ClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const { account } = useMetaMask();

  useEffect(() => {
    const fetchUserClasses = async () => {
      if (!account) return;
      const res = await fetch(`http://localhost:3001/api/get-user-classes/${account}`);
      const data = await res.json();
      setClasses(data);
    };

    fetchUserClasses();
  }, [account]);

  const addJoinedClass = async (name: string, contractAddress: string, role: "teacher" | "student" = "student") => {
    if (!account) return;
  
    const newClass = { id: Date.now(), name, contractAddress, role };
    setClasses((prev) => [...prev, newClass]);
  
    await fetch("http://localhost:3001/api/add-user-class", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: account, className: name, contractAddress, role }),
    });
  };  

  return (
    <ClassContext.Provider value={{ classes, addJoinedClass }}>
        {children}
    </ClassContext.Provider>
  );
};
