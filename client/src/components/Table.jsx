import React from "react";
import "./styles/table.css";

const Table = ({ head1, datas, handleDelete }) => {
  console.log("datas", datas);

  return (
    <div className="col-md-11 table-main">
      <table className="table">
        <thead>
          <tr>
            <th className="table-head">
              <h3>{head1}</h3>
            </th>
          </tr>
        </thead>
        <tbody>
          {datas.map((collectionName, index) => (
            <tr key={index}>
              <td className="table-col">{collectionName}</td>
              <td>
                <button 
                  className="delete-button" 
                  onClick={() => handleDelete(collectionName)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
