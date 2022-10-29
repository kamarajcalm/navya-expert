import React from 'react';
import './styles.scss';
import {
  doctors, navyaLogo, tmcLogo, ncgLogo, mskccLogo, pmLogo, accessHopeLogo
} from '../../../assets/images';
import { isMSKCC, isNavya, isPM, isAccessHope } from '../../../referrers';
import { isWeb } from '../../../utils';

export const AboutNavya = () => {
return (
<div className="about">
  <div className="about-header">
    {!isAccessHope&&<img src={`${navyaLogo}`} alt='docs' style={{height: '50px'}} />}
    {
      isNavya() && (
        <React.Fragment>
          <img src={`${tmcLogo}`} alt='docs' style={{height: '50px'}} />
          <img src={`${ncgLogo}`} alt='docs' style={{height: '50px'}} />
        </React.Fragment>
      )
    }

    {
      isMSKCC() &&
        <img src={`${mskccLogo}`} alt='docs' style={{height: '50px'}} />
    }

    {

      isPM() && !isWeb() &&
        <img src={`${pmLogo}`} alt='docs' style={{height: '50px'}} />

    }

    {
      isAccessHope() &&
        <img src={`${accessHopeLogo}`} alt='docs' style={{height: '50px'}} />
    }

  </div>
  <div className="about-body">
    <h1>{isAccessHope()?'About AccessHope':'Navya ExpertApp'}</h1>
      {isAccessHope()?
      <div className="card">
        <div className="item">A first-of-its-kind collaboration among NCI-Designated Comprehensive Cancer Centers. </div>
        <div className="item">AccessHope delivers a revolutionary cancer benefit that connects people with cancer—and their family members and community oncologists—to the latest knowledge from National Cancer Institute (NCI)-Designated Comprehensive Cancer Centers. A patient’s cancer case is matched with a specialist for case review and treatment plan recommendations to optimize care and help improve patient outcomes.</div>
      </div>:
        <>
      <p>The one click solution that allows experts to collaborate on patient cases.</p>
      <p>The Navya ExpertApp is a workflow tool that quickens experts' review of a patient case, enables consultation with multiple experts, and builds a repository of experiential knowledge.</p>
      <p>The ExpertApp uses templates to summarize the medical case of a patient. It presents evidence, guidelines, and experience based options for experts to choose from. After collecting the diagnostic workup or treatment recommendations from a group of medical experts, the ExpertApp builds a consensus opinion. Navya prepares a comprehensive report for the patient, which includes the expert opinion, case summary, and evidence and guidelines information as applicable.</p>
      <div className="card">
        <div className="item">Navya manages the relationship with the patient/caregiver through email, phone, and online communication, collects medical reports and patient preference considerations, coordinates the consensus opinion via the ExpertApp, and prepares the Expert Opinion Report. </div>
        <div className="item">The ExpertApp can convert a patient's medical information from any format (email, Excel spreadsheet, hospital EMR, etc.) to a standardized, structured format called the Navya Form.</div>
        <div className="item">The Navya Form is used to drive the search query on the Navya Evidence Engine, Guidelines Engine, and Experience Engine. Each engine, respectively, stores published literature, NCCN guidelines, and past expert opinions and custom hospital/expert guidelines.</div>
        <div className="item">A single click on the Navya Form creates the Navya Survey. The Navya Survey includes the case summary and the range of applicable treatment options from the Navya Engines. Experts then select a treatment option with one click on the Navya Survey in the Navya ExpertApp. Experts can also provide responses using the opinion text box.</div>
      </div>
      <h1>Experts</h1>
        <div className="card">
        <div className="item">Experts always provide an opinion on the best step to manage the patient’s care at the present decision point. </div>
        <div className="item">Experts do not comment on the accuracy of past treatments that the patient has received.</div>
        <div className="item">Experts are not the patient's treating oncologists. Legal disclaimers are clearly stated throughout.</div>
        <div className="item">Experts provide information based on their experience and expertise in the field, which can be used by the patient/caregiver or the treating oncologist(s) to make their own decisions.</div>
        <div className="item">Experts may provide a decision tree to provide helpful information as far down the treatment path as possible. This is especially useful when recommending diagnostic workups at a decision point and treatment paths that the patient may undertake given the result of the diagnostics.</div>
      </div>
      <p>The Expert Opinion is based on clinical data provided by the patient. The quality of the online opinion depends on the quality and completeness of that data as assessed by Navya.</p>
      </>}
    </div>
  </div>
  )
}
