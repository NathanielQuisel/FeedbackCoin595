// src/Dashboard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useClassContext } from "./ClassContext";

const Dashboard: React.FC = () => {
  const { classes } = useClassContext();
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "5vh" }}>
      <h1>Welcome to the Dashboard</h1>

      <h2 style={{ marginTop: "2rem" }}>Your Classes</h2>
      {classes.map((cls) => (
  <div
    key={cls.id}
    style={{
      border: "1px solid #ccc",
      padding: "1rem",
      margin: "1rem auto",
      width: "60%",
      borderRadius: "10px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    }}
  >
    <h3>{cls.name}</h3>
    <p>You are a {cls.role}</p>
    <p><strong>Contract Address:</strong> {cls.contractAddress}</p>

    {cls.role === "teacher" ? (
        <>
          <button
            style={buttonStyle}
            onClick={() =>
              navigate("/view-feedback", {
                state: { contractAddress: cls.contractAddress },
              })
            }
          >
            View Feedback
          </button>
          <button
            style={buttonStyle}
            onClick={() =>
              navigate("/enter-daily-password", {
                state: { classAddress: cls.contractAddress },
              })
            }
          >
            Enter Daily Password
          </button>
        </>
      ) : (
        <>
          <button
            style={buttonStyle}
            onClick={() =>
              navigate("/collect-coin", {
                state: { contractAddress: cls.contractAddress },
              })
            }
          >
            Collect Coin
          </button>
          <button
            style={buttonStyle}
            onClick={() =>
              navigate("/submit-feedback", {
                state: { contractAddress: cls.contractAddress },
              })
            }
          >
            Submit Feedback
          </button>
        </>
      )}
    </div>
  ))}


        <button
        style={{ ...buttonStyle, marginTop: "2rem" }}
        onClick={() => navigate("/join-class")}
      >
        Join Class
      </button>

      <button
        style={{ ...buttonStyle, marginTop: "2rem" }}
        onClick={() => navigate("/create-class")}
      >
        Create Class
      </button>
    </div>
  );
};

const buttonStyle = {
  margin: "0.5rem",
  padding: "0.6rem 1.2rem",
  fontSize: "1rem",
  cursor: "pointer",
};

export default Dashboard;
