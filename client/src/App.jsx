import "./App.css";
import { useEffect, useState } from "react";
import Upload from "./components/Upload";
import axios from "axios";
import { useData } from "./contexts/DataContext";
import Table from "./components/Table";
import ExportFile from "./components/ExportFile";

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState(""); // upload status message
  const [isUploading, setIsUploading] = useState(false); // Track the upload status
  // const [dbName, setDbName] = useState("");
  // const [newdbName, setNewDbName] = useState("");
  const [backend, setBackend] = useState("");
  const { masterData } = useData();
  console.log("masterData",masterData);
  

  useEffect(() => {
    fetch("http://localhost:8000/api")
      .then((response) => response.json())
      .then((data) => setMessage(data.message));
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("csv", file);
    formData.append('backend', backend);

    setIsUploading(true); // Disable the button while uploading
    setUploadMessage("");

    try {
      const response = await axios.post(
        "http://localhost:8000/upload",
        formData
      );
      console.log("response", response.data);
      setUploadMessage(
        "File processed and data stored successfully without duplicates."
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadMessage("File upload failed. Please try again.");
    } finally {
      setIsUploading(false); // Enable the button after upload
    }
  };

  // // Function to handle the DB rename
  // const handleRename = async () => {
  //   if (!dbName) {
  //     alert("Please enter a new database name");
  //     return;
  //   }

  //   try {
  //     const response = await axios.post("http://localhost:8000/rename", {dbName,newdbName});
  //     console.log("Database renamed:", response.data);
  //   } catch (error) {
  //     console.error("Error renaming the database:", error);
  //   }
  // };


  const handleDelete = async (fileName) => {
    // const fileName = "Reliance General_Bike"

    const response = await axios.post("http://localhost:8000/delete", {fileName});
    console.log(`${response.data} - delete`);
        
  };
  const handleDeleteID = async () => {
    const fileName = "P4US_Bike"
   const response = await axios.post("http://localhost:8000/deleteID", {fileName});
   console.log(`${response.data} - deleted ID`);    
 };


  return (
    <div className="main">
      <div className="main-div1">
        <h1>{message}</h1>
        {/* <h4>
          Old DB:
          <input
            type="text"
            value={dbName}
            onChange={(e) => setDbName(e.target.value)}
          />
        </h4>
        <h4>
          New DB:
          <input
            type="text"
            value={newdbName}
            onChange={(e) => setNewDbName(e.target.value)}
          />
        </h4>
          <button onClick={handleRename}>Rename</button> */}
          <h4>
          Select the Backend:
          <select value={backend} onChange={(e) => setBackend(e.target.value)}>
          <option value="">Select a database</option>
          <option value="Backend_Cars">Backend_Cars</option>
          <option value="Backend_Bikes">Backend_Bikes</option>
        </select>
        </h4>
        <Upload
          onFileChange={handleFileChange}
          onFileUpload={handleUpload}
          disabled={isUploading}
        />
      </div>
      {/* <button onClick={handleDeleteID}>Delete P4US_ID</button> */}
      <div className="main-div2">
        <div className="main-div3">
          <ExportFile disabled={isUploading} />
        </div>
        <div className="main-div4">
          {/* <button onClick={handleDelete}>Delete</button> */}
          <Table datas={masterData} head1={"All Uploaded Masters"} handleDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}

export default App;