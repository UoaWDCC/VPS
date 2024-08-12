// to do: remove imgs from project folder when integrating

const resources = [
  {
    id: "vital_signs_initial",
    displayName: "Vital Signs",
    content: [
      {
        type: "image",
        src: "https://resusmonitor.com/static/cropped_monitor.png",
        alt: "Initial Vital Signs Monitor",
      },
    ],
  },
  {
    id: "vital_signs_improved",
    displayName: "Vital Signs",
    content: [
      {
        type: "image",
        src: "https://resusmonitor.com/static/cropped_monitor.png",
        alt: "Improved Vital Signs Monitor",
      },
    ],
  },

  {
    id: "inital_ecg",
    displayName: "ECG",
    content: [
      {
        type: "image",
        src: "https://www.ecgedu.com/wp-content/uploads/2022/05/Junctional-tachycardia-strip-black-on-red-paper.png",
        alt: "Initial ECG Graph",
      },
    ],
  },
  {
    id: "improved_ecg",
    displayName: "ECG",
    content: [
      {
        type: "image",
        src: "https://www.ecgedu.com/wp-content/uploads/2022/05/Ventricular-fibrillation-strip-black-on-red-paper.jpeg",
        // src: "images/ECG_improved.png",
        alt: "Improved ECG Graph",
      },
    ],
  },
  {
    id: "deteriorated_ecg",
    displayName: "ECG",
    content: [
      {
        type: "image",
        src: "https://wtcs.pressbooks.pub/app/uploads/sites/36/2022/11/Sinus-Tachycardia-1-1024x281.jpg",
        alt: "Deteriorated ECG Graph",
      },
    ],
  },

  {
    id: "medical_history",
    displayName: "Medical History",
    content: [
      {
        type: "text",
        items: [
          "Type 2 diabetes",
          "Hypertension",
          "Chronic kidney disease stage 3",
        ],
      },
    ],
  },
  {
    id: "medication_history",
    displayName: "Medication History",
    content: [
      {
        type: "text",
        items: [
          "Metformin 1000 mg BID",
          "Lisinopril 20 mg daily",
          "Amlodipine 10 mg daily",
          "Atorvastatin 40 mg daily",
        ],
      },
    ],
  },
  {
    id: "new_medication_history",
    displayName: "Medication History",
    content: [
      {
        type: "text",
        items: [
          "Metformin (held)",
          "Lisinopril 20 mg daily",
          "Amlodipine 10 mg daily",
          "Atorvastatin 40 mg daily",
          "New medications: Aspirin, Nitroglycerin, Beta-blocker",
        ],
      },
    ],
  },

  {
    id: "lab_results",
    displayName: "Lab Result",
    content: [
      {
        type: "text",
        items: [
          "Troponin: Elevated",
          "CK-MB: Elevated",
          "CBC: Normal",
          "BMP: Elevated",
          "creatinine (2.0 mg/dL)",
          "reduced GFR (45 mL/min/1.73m²)",
        ],
      },
    ],
  },
  {
    id: "general_guidlines",
    displayName: "General Guidelines",
    content: [
      {
        type: "text",
        items: ["Don't overdose patient", "Keep patient fed"],
      },
    ],
  },
];

export default resources;
