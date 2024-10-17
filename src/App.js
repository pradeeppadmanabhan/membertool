import React, { useState } from "react";
import "./global.css";
import DataDisplay from "./DataDisplay.js";
import InputForm from "./InputForm";

function App() {
  const [showForm, setShowForm] = useState(false); // State to manage which component to show
  const [showData, setShowData] = useState(false);

  const handleShowForm = () => {
    setShowForm(true);
    setShowData(false);
  };

  const handleShowData = () => {
    setShowData(true);
    setShowForm(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Membership Tool</h1>
      </header>
      <div className="button-container">
        <button onClick={handleShowForm}>New Member Form</button>
        {showForm && <InputForm />}
        <button onClick={handleShowData}>View Member Data</button>
        {showData && <DataDisplay />}
      </div>
    </div>
  );
}

export default App;
