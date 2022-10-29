import React from "react";

import './styles.scss'

export default function Table({columnData,data,tableContainerClass}) {
   const{columnArr}=columnData

   const renderColumnHeading=()=>{
        return columnArr.map((columnObj,index)=><th key={index+columnObj.title}>{columnObj.title}</th>)
   }

   const renderButtons=(columnObj,rowObj,index)=>{
        return <td>{rowObj.isCompleted?columnObj.renderCellData():columnObj.rowDataLabel.map(x=>x.isHide&&x.isHide(rowObj.decision_date)?'':<button onClick={()=>x.onclick(rowObj)} className={`btn-action ${x.className}`}>{x.name}</button>)}</td>
   }

   const renderPriorityAgeGenderData=(columnObj,rowObj,index)=>{
    return <td>{columnObj.rowDataLabel.map(x=><React.Fragment>
        {x==='priority'&&rowObj[x]==='1'?<i className="navya-icon-priority-AH" />:''}
        {x==='Age'&&<p className="age-gender-text">{rowObj[x]}</p>}
        {x==='gender'&&<p className="age-gender-text">{rowObj[x].charAt(0)}</p> }
    </React.Fragment>)}</td>
    }

   const renderRowData=(rowObj,index)=>{
        return columnArr.map((columnObj,ind)=>{
            if(columnObj.label==='action'){
                return renderButtons(columnObj,rowObj,index)
            }else if(columnObj.label.includes('AgeGender')){
                return renderPriorityAgeGenderData(columnObj,rowObj,index)
            }else{
                return <td key={ind+columnObj.label}>{columnObj.rowDataLabel.map(x=>columnObj.renderCellData?columnObj.renderCellData(rowObj[x]):rowObj[x])}</td>
            }
        })
   }

  return (<div className="table-wrapper">
    <table className={tableContainerClass?tableContainerClass:'default-table-container'}>
      <thead>  
      <tr>
        {renderColumnHeading()}
      </tr>
      </thead>
      <tbody>
      {data.map((rowData,index)=><tr key={index+rowData.EO_SurevyID}>{renderRowData(rowData,index)}</tr>)}
      </tbody>
    </table>
    </div>
  );
}
