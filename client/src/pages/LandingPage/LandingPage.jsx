import Lakshmi from "../../assets/lakshmiGod.png";
import { Link } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  return (
    <div
      className="position-relative d-flex align-items-center justify-content-center min-vh-100"
      style={{
        background: "linear-gradient(135deg, #fff7ad, #ffa9f9)",
        overflow: "hidden",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Decorative Gradient Blobs */}
      <div
        className="position-absolute"
        style={{
          width: "350px",
          height: "350px",
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.8), transparent 70%)",
          top: "-100px",
          left: "-100px",
          zIndex: 0,
          filter: "blur(40px)",
          animation: "float 6s ease-in-out infinite",
        }}
      ></div>
      <div
        className="position-absolute"
        style={{
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.7), transparent 70%)",
          bottom: "-150px",
          right: "-100px",
          zIndex: 0,
          filter: "blur(50px)",
          animation: "float 8s ease-in-out infinite reverse",
        }}
      ></div>

      {/* Main Content */}
      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row align-items-center">
          {/* Image Left */}
          <div className="col-lg-6 col-md-12 text-center mb-5 mb-lg-0">
            <img
              src={Lakshmi}
              alt="Lakshmi"
              className="img-fluid animate__animated animate__fadeInLeft"
              style={{
                maxWidth: "90%",
                height: "auto",
                filter: "drop-shadow(0 12px 30px rgba(0,0,0,0.15))",
                transition: "transform 0.6s ease",
              }}
              onMouseOver={(e) => (e.target.style.transform = "scale(1.07)")}
              onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
            />
          </div>

          {/* Text Right */}
          <div
            className="col-lg-6 col-md-12 text-center text-lg-start px-4 py-4"
            style={{
              background: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
              animation: "fadeInUp 1s ease both",
            }}
          >
            <h1
              className="fw-bold mb-3"
              style={{
                fontSize: "3.2rem",
                color: "#4b0082",
                textShadow: "1px 1px 3px rgba(255,255,255,0.5)",
              }}
            >
              Welcome to{" "}
              <span style={{ color: "#ff69b4" }}>LakshmiLoop</span>
            </h1>

            <h3
              style={{
                color: "#2c003e",
                fontWeight: "600",
                letterSpacing: "0.5px",
              }}
            >
              Your money has patterns.
            </h3>
            <h4 className="mb-4" style={{ color: "#6a0572" }}>
              We help you understand them beautifully.
            </h4>

            {/* Buttons */}
            <div className="d-flex justify-content-center justify-content-lg-start gap-3">
              <Link
                to="/signup"
                className="btn btn-lg px-4 py-2"
                style={{
                  background:
                    "linear-gradient(90deg, #6a0572, #8a2be2, #ff69b4)",
                  color: "white",
                  borderRadius: "50px",
                  fontWeight: "600",
                  border: "none",
                  transition:
                    "transform 0.4s ease, box-shadow 0.4s ease",
                  boxShadow: "0 0 12px rgba(106,5,114,0.4)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.08)";
                  e.target.style.boxShadow =
                    "0 0 25px rgba(138,43,226,0.6)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.boxShadow =
                    "0 0 12px rgba(106,5,114,0.4)";
                }}
              >
                Let’s Begin
              </Link>

              <Link
                to="/login"
                className="btn btn-outline-dark btn-lg px-4 py-2"
                style={{
                  borderRadius: "50px",
                  fontWeight: "600",
                  borderColor: "#6a0572",
                  color: "#6a0572",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#6a0572";
                  e.target.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#6a0572";
                }}
              >
                Login
              </Link>
            </div>

            {/* Sub Tagline */}
            <p
              className="mt-4"
              style={{
                fontSize: "1.15rem",
                color: "#2c003e",
                opacity: 0.9,
              }}
            >
              💫 Track. Save. Grow. — Let your finances flow with{" "}
              <strong>LakshmiLoop</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Animation Keyframes */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(20px); }
            100% { transform: translateY(0px); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
