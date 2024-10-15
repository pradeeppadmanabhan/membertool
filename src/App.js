import React, { useState } from "react";
import "./App.css";
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
        {/* Apply the CSS class */}
        <button onClick={handleShowForm}>New Member Form</button>
        <button onClick={handleShowData}>View Member Data</button>
        {showForm && <InputForm />}
        {showData && <DataDisplay />}
      </div>
    </div>
  );
}

export default App;
