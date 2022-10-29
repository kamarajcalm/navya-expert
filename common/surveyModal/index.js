import React from "react";
import Modal from "react-modal";
import { IonIcon } from "@ionic/react";
import "./styles.scss";

export default function SurveyModel(props) {
  return (
    <div>
      <div>
        <Modal
          isOpen={props.isOpen}
          onClose={props.onHide}
          className="Modal"
          overlayClassName="Overlay"
        >
          <div className="inner-modal-container">
            <div className="header d-flex-space-between">
              <p className="header-text">{props.title}</p>
              <IonIcon
                className="close-icon"
                name="close"
                onClick={props.onHide}
              />
            </div>
            <div className="body-content">
              {props.children}
              <div className="btn-wrapper">
                <button
                  className="btn-cancel btn-action"
                  onClick={props.onHide}
                >
                  Cancel
                </button>
                <button
                  disabled={props.isEnable?false:true}
                  className={`btn-action mr-0 ${
                    props.isEnable ? "" : "btn-disabled"
                  }`}
                  onClick={props.onSubmit}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
