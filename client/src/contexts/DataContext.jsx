import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [masterData, setMasterData] = useState([]);
  // const [collectionType, setCollectionType] = useState([]);

  const updateMasterData = async () => {
    try {    
      const response = await axios.get(
        "http://localhost:8000/uploadedDataFromDB"
      );
      const dataFromDB = response.data;
      console.log("uploaded items :", dataFromDB);

      setMasterData(dataFromDB);
    } catch (error) {
      console.error("Error updating master data:", error.message);
    }
  };
  // Fetch initial master data when the component mounts
  useEffect(() => {
    updateMasterData();
  }, []);

 
  return (
    <DataContext.Provider value={{ masterData,  updateMasterData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  return useContext(DataContext);
};
