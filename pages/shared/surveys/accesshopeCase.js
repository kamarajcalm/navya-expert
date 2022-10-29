import React, { useEffect, useState } from "react";
import { IonIcon } from "@ionic/react";
import localCache from "../../../api/localCache";
import SurveyModel from "../../../common/surveyModal";
import moment from "moment";
import "./styles.scss";
import api from "../../../api/endpoints";
import Table from "./table/index";
import { isUserHasQcAccess } from "../../../utils";

const rejectReasonLists = [
  { name: "rejectReason", value: "Not my speciality" },
  { name: "rejectReason", value: "High caseload right now" },
  { name: "rejectReason", value: "Not interested" },
  { name: "rejectReason", value: "Other" },
];

export default function AcesshopeCase(props) {
  const [showModal, setshowModal] = useState(false);
  const [otherComments, setComments] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [needMoreInformation, setneedMoreInformation] = useState(false);
  const [caseId, setCaseId] = useState();
  const [tableData, setTableData] = useState([]);
  const [modalType, setModalType] = useState('');

  const currentTab = props.label.replace(" ", "_");

  useEffect(() => {
      setTableData(props.data);
  }, [props.data]);
  const clearFunction = () => {
    setCaseId();
    setComments("");
    setSelectedReason("");
    setshowModal(false);
    setModalType('')
    setneedMoreInformation(false);
  };

  const onRejectCase = (obj,type) => {
    console.log('showModalObj',obj,type)
    setshowModal(true);
    setModalType(type)
    setCaseId(obj.EO_SurevyID);
  };

  const onNeedInfo = (obj,type) => {  
    setneedMoreInformation(true);
    setshowModal(true);
    setModalType(type)
    setCaseId(obj.EO_SurevyID);
  };

  const onCloseModal = () => {
    setshowModal(false);
    setneedMoreInformation(false);
    clearFunction();
  };

  const onCommentsChange = (event) => {
    setComments(event.target.value);
  };

  const onChangeReason = (event) => {
    setSelectedReason(event.target.value);
  };

  ///accept api
  const acceptapi = async (item) => {
    let invite_decision = "accept";
    let reject_reason = "";
    let expert_id = localCache.get("expertid");
    let survey_id = item.EO_SurevyID;
    try {
      const obj = await api.eosAcceptReject(
        invite_decision,
        expert_id,
        survey_id,
        reject_reason
      );
      if (obj.success === true) {
        const newTableData = tableData.map((x) => {
          return { ...x, isCompleted: x.isCompleted? x.isCompleted : x.EO_SurevyID === item.EO_SurevyID };
        });
        setshowModal(false);
        setTableData(newTableData);
      }
    } catch (e) {
      console.log("error api", e);
    }
  };

  /// reject api
  const rejectapi = async () => {
    let invite_decision = "reject";
    let reject_reason = selectedReason !== "Other" ? selectedReason : otherComments;
    let expert_id = localCache.get("expertid");
    let survey_id = caseId;
    try {
        const obj = await api.eosAcceptReject(
          invite_decision,
          expert_id,
          survey_id,
          reject_reason
        );
        if (obj.success === true) {
          clearFunction();
          props.recall();
        }
    } catch (e) {
      console.log("reject api error", e);
    }
  };

  const getRemainingTime = (inviteTime) => {
    var caseAcceptanceDate=new Date(inviteTime).getTime() + ( 8* 60 * 60 * 1000);
    var currentDate = new Date();
    var date = new Date(caseAcceptanceDate-currentDate);
    var hour = date.getUTCHours();
    var min = date.getUTCMinutes();
    var staticHour = new Date(caseAcceptanceDate).getHours()-currentDate.getHours();
    var time = hour + ":" +  min;
    return staticHour<0?false:time;
  };

  const cancelRejectContent = (
    <>
      <div className="reject-reason-lists">
        {modalType && modalType === "reject" ?
         <p className="reject-question">Please share your reason for declining the case invitation</p>:<p className="reject-question">Please share your reason for canceling case review.</p>}
        {rejectReasonLists.map((obj, index) => (
          <>
            <label key={index + obj.value} className="reason-label-list">
              <input
                type="radio"
                name={obj.name}
                className=""
                value={obj.value}
                onChange={onChangeReason}
              />
              <span className="">{obj.value}</span>
            </label>
          </>
        ))}
      </div>

      {selectedReason === "Other" ? (
        <textarea value={otherComments} onChange={onCommentsChange} rows={2} maxLength = "200" />
      ) : (
        ""
      )}
      {selectedReason === "Other" && (
        <p className="word-count">{otherComments.length}/200</p>
      )}
    </>
  );

  const needInfoContent = (
    <>
      <p className="reject-question">
        Please share what additional medical records or information you need to
        review the case.
      </p>
      <textarea value={otherComments} onChange={onCommentsChange} rows={5} />
      {/* <p className="word-count">{otherComments.length}/200</p> */}
    </>
  );

  const modalElement = {
    reject: {
      title: "Case Invitation",
      bodyContent: cancelRejectContent,
    },
    cancelReview: {
      title: "Cancel Case Review",
      bodyContent: cancelRejectContent,
    },
    needMoreInfo: {
      title: "Request Additional Information",
      bodyContent: needInfoContent,
    },
  };

  const hideCancelReviewBtn=(acceptanceDate)=>{
    if(!acceptanceDate)
      return false
    let hoursDifference=Math.abs(new Date() - new Date(acceptanceDate.toString()+' GMT')) / 36e5;
    return hoursDifference>1?true:false
  }

  const changeDateFormat=(date)=>{
    if(!date)
      return ''
    else{
      date=date.replaceAll('-','/')
      let utcDate = new Date(date+' UTC');
      return moment(utcDate.toString()).format("MMMM D");
    }  
  }

  const renderColumnDatas = {
    awaiting_acceptance: {
      columnArr: [
        {
          label: "priorityAgeGender",
          title: "",
          rowDataLabel: ["priority", "Age", "gender"],
          renderCellData: null,
        },
        {
          label: "invitation_date",
          title: "Invitation Date",
          rowDataLabel: ["Date_survey_sent_Datetime"],
          renderCellData: (date) => {
            return changeDateFormat(date)
          },
        },
        {
          label: "diagnosis",
          title: "Diagnosis",
          rowDataLabel: ["clinical_diagnosis"],
          renderCellData: null,
        },
        {
          label: "survey_id",
          title: "Case Number",
          rowDataLabel: ["patientReferenceNo"],
          renderCellData: null,
        },
        // {
        //   label: "hours_remaining",
        //   title: "Hours Remaining",
        //   rowDataLabel: ["Date_survey_sent_Datetime"],
        //   renderCellData: (caseObj) => {
        //     return getRemainingTime(caseObj);
        //   },
        // },
        {
          label: "action",
          title: "Invitation",
          rowDataLabel: [
            {
              name: "Accept",
              onclick: (caseObj) => {
                acceptapi(caseObj);
              },
            },
            {
              name: "Decline",
              className: "btn-danger mr-0",
              onclick: (caseObj) => {
                onRejectCase(caseObj,'reject');
              },
            },
          ],
          renderCellData: () => {
            return (
              <span className="case-accepted">
                <i className="ion-checkmark-round icon" /> Accepted
              </span>
            );
          },
        },
      ],
    },
    awaiting_review: {
      columnArr: [
        {
          label: "priorityAgeGender",
          title: "",
          rowDataLabel: ["priority", "Age", "gender"],
          renderCellData: null,
        },
        {
          label: "acceptance_date",
          title: "Acceptance Date",
          rowDataLabel: ["decision_date"],
          renderCellData: (date) => {
            return changeDateFormat(date)
          },
        },
        {
          label: "diagnosis",
          title: "Diagnosis",
          rowDataLabel: ["clinical_diagnosis"],
          renderCellData: null,
        },
        {
          label: "survey_id",
          title: "Case Number",
          rowDataLabel: ["patientReferenceNo"],
          renderCellData: null,
        },
        {
          label: "due_date",
          title: "Due Date",
          rowDataLabel: ["due_date"],
          renderCellData: (date) => {
            return changeDateFormat(date)
          },
        },
        {
          label: "action",
          title: "",
          rowDataLabel: [
            {
              name: "Review Case",
              onclick: (caseObj) => {
                props.goToSurveyDetail(caseObj);
              },
            },
            {
              name: "Cancel Review",
              className: "btn-danger",
              isHide: (date) => {
                return hideCancelReviewBtn(date)
              },
              onclick: (caseObj) => {
                onRejectCase(caseObj,'cancelReview');
              },
            },
            // {
            //   name: "Need More Info",
            //   className: "btn-secondary mr-0",
            //   onclick: (caseObj) => {
            //     onNeedInfo(caseObj,'needMoreInfo');
            //   },
            // },
          ],
          renderCellData: null,
        },
      ],
    },
    pending_qc: {
      columnArr: [
        {
          label: "AgeGender",
          title: "",
          rowDataLabel: ["Age", "gender"],
          renderCellData: null,
        },
        {
          label: "date",
          title: "Date",
          rowDataLabel: ["date"],
          renderCellData: (date) => {
            return changeDateFormat(date)
          },
        },
        {
          label: "diagnosis",
          title: "Diagnosis",
          rowDataLabel: ["clinical_diagnosis"],
          renderCellData: null,
        },
        {
          label: "survey_id",
          title: "Case Number",
          rowDataLabel: ["patientReferenceNo"],
          renderCellData: null,
        },
        {
          label: "due_date",
          title: "Due Date",
          rowDataLabel: ["due_date"],
          renderCellData: (date) => {
            return changeDateFormat(date)
          },
        },
        {
          label: "action",
          title: "",
          rowDataLabel: [
            {
              name: "Review Case",
              className: "mr-0",
              onclick: (caseObj) => {
                props.goToSurveyDetail(caseObj);
              },
            },
          ],
          renderCellData: null,
        },
      ],
    },
    completed_cases: {
      columnArr: [
        {
          label: "AgeGender",
          title: "",
          rowDataLabel: ["Age", "gender"],
          renderCellData: null,
        },
        {
          label: "completion_date",
          title: "Completion Date",
          rowDataLabel: ["Date_survey_responded"],
          renderCellData: (date) => {
            return changeDateFormat(date)
          },
        },
        {
          label: "diagnosis",
          title: "Diagnosis",
          rowDataLabel: ["clinical_diagnosis"],
          renderCellData: null,
        },
        {
          label: "qc_case",
          title: "QC Case",
          rowDataLabel: ["case_type"],
          renderCellData: (caseType) => {
            return caseType==='qc'?"QC":''
          },
        },
        {
          label: "survey_id",
          title: "Case Number",
          rowDataLabel: ["patientReferenceNo"],
          renderCellData: null,
        },
        {
          label: "action",
          title: "",
          rowDataLabel: [
            {
              name: "View Case",
              className: "mr-0",
              onclick: (caseObj) => {
                props.goToSurveyDetail(caseObj);
              },
            },
          ],
          renderCellData: null,
        },
      ],
    },
  };

  const isEnable =(selectedReason === "Other" && otherComments.trim().length > 0) || (needMoreInformation && otherComments.length > 0) ||(selectedReason !== "Other" && selectedReason.length > 0);
  const expertColumnData=renderColumnDatas[currentTab].columnArr.filter(list=>list.title!=='QC Case')
  const columnData= currentTab && isUserHasQcAccess()?renderColumnDatas[currentTab]:{columnArr:expertColumnData}

  return (
    <>
      <Table
        data={tableData}
        columnData={columnData}
      />
      <SurveyModel
        isOpen={showModal}
        isEnable={isEnable}
        title={modalType&&modalElement[modalType].title}
        onHide={onCloseModal}
        onSubmit={rejectapi}
      >
        {modalType&&modalElement[modalType].bodyContent}
      </SurveyModel>
    </>
  );
}
