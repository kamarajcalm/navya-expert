
import { getReferrer,isUserHasQcAccess } from '../utils';

// const pending = {
//   label: "Pending",
//   subTabs: [
//     {
//       label: 'Awaiting Opinion',
//       icon: 'navya-icon-overdue'
//     },
//     {
//       label: 'Experience Engine',
//       icon: 'xe ion-ios-cog-outline'
//     }
//   ]
// }

const tmcHome = [
  {
    label: 'Priority',
    icon: 'navya-icon-priority'
  },
  {
    label: 'New',
    icon: 'navya-icon-pending'
  },
  // {...pending},
  {
    label: 'Awaiting',
    icon: 'navya-icon-overdue'
  },
  {
    label: 'Done',
    icon: 'ion-checkmark-round'
  }
]


const apolloHome = [
  {
    label: 'Priority',
    icon: 'navya-icon-priority'
  },
  {
    label: 'New',
    icon: 'navya-icon-pending'
  },
  {
    label: 'Awaiting',
    icon: 'navya-icon-overdue'
  }
];


const mskccHome = [
  {
    label: 'Priority',
    icon: 'navya-icon-priority'
  },
  {
    label: 'New',
    icon: 'navya-icon-pending'
  },
  // {...pending},
  {
    label: 'Awaiting',
    icon: 'navya-icon-overdue'
  },
  {
    label: 'Done',
    icon: 'ion-checkmark-round'
  }
];

const pmHome = [
  {
    label: 'Priority',
    icon: 'navya-icon-priority'
  },
  {
    label: 'New',
    icon: 'navya-icon-pending'
  },
  {
    label: 'Awaiting',
    icon: 'navya-icon-overdue'
  },
  {
    label: 'Done',
    icon: 'ion-checkmark-round'
  }
];

const accessHopeHome = [

  {
    label: 'Awaiting Acceptance',
    key:'awaiting_acceptance',
    icon: 'navya-icon-pending'
  },
  {
    label: 'Awaiting Review',
    key:'awaiting_review',
    icon: 'navya-icon-overdue'
  },
  {
    label: 'Completed Cases',
    key:'completed_cases',
    icon: 'ion-checkmark-round'
  },

];

const ahQcHome=[...accessHopeHome]
ahQcHome.splice(2,0,{label:'Awaiting QC',icon:'navya-icon-priority',key:'pending_qc'})


const getStubForHome = () => {
  const referrer = getReferrer();
  switch(referrer) {
    case 'tmc':
      return tmcHome;
    case 'apollo':
      return apolloHome;
    case 'mskcc':
      return mskccHome;
    case 'pm':
      return pmHome;
    case 'accesshope':
      return isUserHasQcAccess()?ahQcHome:accessHopeHome;
  }
  return tmcHome;
}

export default getStubForHome;
