import React from "react";
import logo from "../KMALogo.png"; // Import the image
import Header from "./Header";

const DeclarationConsent = ({ formData, errors, setFormData }) => {
  return (
    <div>
      <Header /> {/* Render the Header component */}
      <h2>APPLICATION FOR MEMBERSHIP </h2>
      <div className="declaration-text">
        {" "}
        {/*Add class for styling */}
        <br />
        To, <br />
        The Honorary Secretary <br />
        Karnataka Mountaineering Association <br />
        ‘Room No.205, I Floor, Kanteerava Sports Complex – 2, <br />
        Kanteerava Stadium premises, Kasturba Road, <br />
        <br />
        Bangalore – 560 001
        <br />
        <br />
        Dear Sir / Madam,
        <br />
        I hereby apply for Membership of your Association, subscribing to the
        DECLARATION below and furnishing my particulars overleaf which are true
        to the best of my knowledge and belief.
        <br />I am interested in Mountaineering and undertake to abide by the
        Rules and Regulations and as per the by laws / memorandum of the
        Association.{" "}
        <b>I provide my consent by "accepting" this declaration.</b>
        <br />
        <br />
        <h3>DECLARATION</h3>
        <br />
        <br />
        I, as Member of the above Association hereby undertake to absolve the
        Association, its Office bearers and any other person, or persons acting
        on its behalf, of any disability or calamity to my person due to any
        accident during the outings, expeditions, training and other activities
        held under the auspices of the Association. I undertake and sign this
        declaration will fully and with all my senses under control.
        <br />
        <br />I hope you will kindly accept my membership.
        {/* <br />
          Yours faithfully
          <br />
          Note – In case of Minor, Guardian should sign.
          <br />
          Signature and date */}
        <br />
        <br />
        {/* <i>Digital Form, hence no Signature required.</i> */}
      </div>
      <div className="radio-group">
        {" "}
        {/* Use the new class for alignment */}
        <label>Consent*:</label>
        <label>
          <input
            type="radio"
            name="consent"
            value="accept"
            checked={formData.consent === true}
            onChange={() => setFormData({ ...formData, consent: true })}
          />
          I Accept
        </label>
        <label>
          <input
            type="radio"
            name="consent"
            value="decline"
            checked={formData.consent === false}
            onChange={() => setFormData({ ...formData, consent: false })}
          />
          I Decline
        </label>
        {errors.consent && <span className="error">{errors.consent}</span>}
      </div>
    </div>
  );
};

export default DeclarationConsent;
