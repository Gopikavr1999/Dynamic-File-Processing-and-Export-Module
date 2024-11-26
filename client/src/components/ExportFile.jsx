import React, { useEffect, useState } from 'react'
import "../components/styles/exportFiles.css"
import axios from 'axios'

const ExportFile = ({ disabled }) => {
    const [masters, setMasters] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [headerMapping, setHeaderMapping] = useState([]);
    const [selectedMaster, setSelectedMaster] = useState("");
    const [backend, setBackend] = useState("");
    const [selectedHeaders, setSelectedHeaders] = useState([]);
    const [selectedIDHeader, setSelectedIDHeader] = useState("");
    const [selectedP4USVARIANT, setSelectedP4USVARIANT] = useState({});
    const [selectedP4USCC, setSelectedP4USCC] = useState({});
    const [selectedHeaderIDs, setSelectedHeaderIDs] = useState([]);
    const [selectedIDHeaderID, setSelectedIDHeaderID] = useState("");
    const [status, setStatus] = useState("success"); // Track the status message

    useEffect(() => {
        setMasters(["Shriram General Insurance_Bike"])
        const fetchMasters = async () => {
            const response = await axios.post("http://localhost:8000/fetchMaster", {backend})
            console.log("response of fetchMasters", response.data);
            // setMasters(response.data)

        }
        fetchMasters()
    }, [backend])

    useEffect(() => {        
        const fetchHeaders = async () => {
            console.log("backend------",backend);
            const response = await axios.post('http://localhost:8000/fetchHeaders', { selectedMaster, backend });
            console.log("response of fetch headers", response.data);

            // Extract values (header names) and keys (IDs) from the response data
            const headers = Object.values(response.data); // Extract values (header names)

            // Update the state with headers and headersID
            setHeaders(headers);
            setHeaderMapping(response.data)
        }
        if (selectedMaster) {
            fetchHeaders();
        }
    }, [selectedMaster])

    const handleSelectHeaders = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
        console.log("selectedOptions", selectedOptions);

        // Update the state without overwriting previously selected options
        setSelectedHeaders((prevSelectedHeaders) => {
            // Create a Set to ensure uniqueness of values (no duplicates)
            return Array.from(new Set([...prevSelectedHeaders, ...selectedOptions]));
        });
    };

    // Function to get keys based on values and return an array of {id, header}
    const getKeysAndValues = (values, mapping) => {
        // Reverse the mapping (value => key)
        const reversedMapping = Object.fromEntries(
            Object.entries(mapping).map(([key, value]) => [value, key])
        );

        // If 'values' is a string, convert it to an array for consistent handling
        if (typeof values === 'string') {
            values = [values]; // Wrap the string into an array
        }

        // Map values to an array of objects with {id, header}
        return values.map(value => {
            const id = reversedMapping[value]; // Get the corresponding id
            if (id) {
                return { id, header: value }; // Return object with id and header
            }
            return null; // Filter out undefined or null values
        }).filter(item => item !== null); // Filter out null entries
    };
    useEffect(() => {
        // Get the corresponding IDs
        const correspondingIDs = getKeysAndValues(selectedHeaders, headerMapping);

        console.log("correspondingIDs", correspondingIDs);
        setSelectedHeaderIDs(correspondingIDs)
        setStatus("exporting");
    }, [selectedHeaders])

    useEffect(() => {
        if (selectedIDHeader) {
            // Get the corresponding IDs
            const correspondingIDs = getKeysAndValues(selectedIDHeader, headerMapping);

            console.log("correspondingIDs", correspondingIDs);
            setSelectedIDHeaderID(correspondingIDs)
            setStatus("success");
        }
    }, [selectedIDHeader])

    console.log("headers", selectedHeaders);
    console.log("selectedMaster",selectedMaster);
    console.log("selectedP4USCC",selectedP4USCC);
    console.log("selectedP4USVARIANT",selectedP4USVARIANT);
    const handleExport = async () => {
        // setStatus("exporting"); // Set status to exporting
        try {
            console.log("ok ok ok");
            
            const response = await axios.post('http://localhost:8000/exportFile', {
                selectedMaster,
                selectedHeaderIDs,
                selectedIDHeaderID,
                selectedP4USVARIANT,
                selectedP4USCC,
                backend
            });
            if (response.data.message === "Master Collection created successfully") {
                setStatus("success"); // Set status to success on successful response
            }
        } catch (error) {
            console.error("Error during export:", error);
            setStatus("failed"); // Set status to failed in case of an error
        }
    }
    const handleUniqiueID = async () => {
        const response = await axios.post("http://localhost:8000/uniqueID");
        console.log("response",response);
        
    }
    return (
        <div className='export-main'>
            <h2 className='export-head'>Export the Masters</h2>
            <div className='export-form'>
                <div className='export-form-group'>
                <label htmlFor='file-select'>Select the Backend :</label>
                    <select value={backend} onChange={(e) => setBackend(e.target.value)}>
                        <option value="">Select a database</option>
                        <option value="Backend_Cars">Backend_Cars</option>
                        <option value="Backend_Bikes">Backend_Bikes</option>
                    </select>
                </div>
                <div className='export-form-group'>
                    <label htmlFor='file-select'>Select the Master :</label>
                    {/* <select name='file' id='file-select' > */}
                    <select name='file' id='file-select' onChange={(e) => setSelectedMaster(e.target.value)}>
                        <option value=''>Select</option>
                        {masters.map((master, index) => (

                            <option key={index} value={master}>{master}</option>
                        ))}
                    </select>
                </div>
                <div className='export-form-group'>
                    <label htmlFor='headers-select'>Select the Headers :</label>
                    <select
                        name='headers'
                        multiple
                        id='headers-select'
                        value={setSelectedHeaders}
                        onChange={handleSelectHeaders}
                    >
                        <option style={{ maxHeight: "10px" }} value=''>Select</option>
                        {headers.length > 0 && headers.map((header, index) => (
                            <option key={index} value={header}>{header}</option>
                        ))}
                    </select>
                </div>
                <div className='export-form-group'>
                    <label htmlFor='headers-select'>Select the ID :</label>
                    <select
                        name='headers'
                        value={setSelectedIDHeader}
                        onChange={(e) => setSelectedIDHeader(e.target.value)}
                    >
                        <option value=''>Select</option>
                        {headers.length > 0 && headers.map((header, index) => (
                            <option key={index} value={header}>{header}</option>
                        ))}
                    </select>
                </div>
                <div className='export-form-group'>
                    <label htmlFor='headers-select'>Select the variant key (P4US_VARIANT) :</label>
                    <select
                        name='headers'
                        value={setSelectedP4USVARIANT}
                        onChange={(e) => setSelectedP4USVARIANT(e.target.value)}
                    >
                        <option value=''>Select</option>
                        {headers.length > 0 && headers.map((header, index) => (
                            <option key={index} value={header}>{header}</option>
                        ))}
                    </select>
                </div>
                <div className='export-form-group'>
                    <label htmlFor='headers-select'>Select the CC key (P4US_CC) :</label>
                    <select
                        name='headers'
                        value={setSelectedP4USCC}
                        onChange={(e) => setSelectedP4USCC(e.target.value)}
                    >
                        <option value=''>Select</option>
                        {headers.length > 0 && headers.map((header, index) => (
                            <option key={index} value={header}>{header}</option>
                        ))}
                    </select>
                </div>
                <div className='export-form-group'>
                    <button type='button' onClick={handleExport}>Export</button>
                    <button type='button' onClick={handleUniqiueID}>P4US_ID</button>
                    {/* <button type='button' onClick={handleExport} disabled={disabled || status !== "success"}>Export</button> */}
                </div>
            </div>
        </div>
    )
}

export default ExportFile