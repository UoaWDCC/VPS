# Target Scenario

This page details the specification requirements (as detailed by Nataly in June 2024) for a single-scenario release targeted for the end-of-semester 2024.

> [!NOTE]
> The specification below is as it was provided to us, so it probably wont be 100% clear, but you can get the general flow.

## Scenario

Overview:

- Patient: John Smith
- Age: 65
- Medical History: Type 2 diabetes, hypertension, chronic kidney disease stage 3
- Presenting Complaint: Chest pain and shortness of breath

---

Opening Scene with Speech Bubbles

Nurse (NPC): "Mr Smith is having really bad chest pain and finding it hard to breathe. His vitals are elevated. Oxygen started at 2 liters per minute via nasal cannula. His oxygen saturation is improving slightly."

Resources and Materials:

- Vital Signs Monitor: Display vital signs such as Blood Pressure, Heart Rate, Respiratory Rate, and Oxygen Saturation.
- ECG Results: Provide an ECG image showing ST-segment elevation in leads II, III, and aVF.
- Lab Orders: Interface for labs (Troponin, CK-MB, CBC, BMP).
- Communication Interface: Chat function to interact with the nurse and other healthcare providers.

---

Branched Scenario - Student 1

Nurse (NPC): "Mr. Smith's vitals are elevated, and the ECG shows ST-segment elevation. It looks like Mr. Smith might be having a heart attack. What should we do next?”

Option 1:

Student 1: "Let's check his vital signs again and ensure he's stable. Can we increase the oxygen flow rate?"

- Nurse (NPC): "Increasing oxygen flow rate to 4 L per minute."
- Nurse (NPC): “The patient is deteriorating. What should we do?” (Loops back to main option screen)

[outcome: The patient’s oxygen saturation improves slightly, but the ECG shows deterioration.]

Option 2 (Correct):

Student 1: "We need to start treatment immediately. Nurse, can you prepare morphine, nitroglycerin, and IV metoprolol? Also, please notify the cardiologist."

- Nurse (NPC): "I'll get those medications ready and notify the cardiologist."

[outcome: The patient receives the appropriate medications promptly. This path leads to next correct path screen.]

Option 3:

Student 1: "Let's wait for the blood test results before making any decisions."

- Nurse (NPC): "Waiting might delay critical treatment. The ECG suggests we need to act fast."
- Nurse: “The patient is deteriorating. What should we do?” (Loops back to main option screen)

[Outcome: ECG shows worsening of the patient's condition]

Following the Correct Path:

Nurse (NPC): "Medications are ready. The cardiologist has been notified and will consult shortly. What should we monitor next?"

Option 1 (Correct):

Student 1: "Let's monitor his kidney function closely due to his CKD and check his blood pressure frequently."

- Nurse (NPC): "Monitoring setup for kidney function and blood pressure. Preparing for transfer to the cath lab."

[Outcome: Goes to summary and handoff.]

Option 2:

Student 1: "We should monitor his glucose levels given his diabetes."

- Nurse (NPC): "We'll add glucose monitoring, but we also need to focus on his cardiovascular status."

[Outcome: loops back to previous options.]

Option 3:

Student 1: "Let's prepare for discharge as soon as his pain is managed."

- Nurse (NPC): "Discharge at this stage might be premature given his condition."

[Outcome: loops back to previous options.]

Summary and Handoff:

Student 1: "Nurse, please ensure all monitoring is in place and document the medication administration. I'll prepare to update the cardiologist on Mr. Smith’s status."

Nurse (NPC): "All set. I'll keep monitoring his vitals and notify you of any changes."

---

Student 2: Medication Appropriateness and Monitoring

Resources and Materials:

- Medication History and List: Overview of the patient's current medications and doses.
- Medical History Overview: Summary of the patient's medical history, including diabetes, hypertension, and chronic kidney disease.
- Consultation Interface: Chat function to interact with the nurse, cardiologist, and other healthcare providers.
- Clinical Guidelines: Access to guidelines for managing medications in patients with diabetes, cardiovascular disease, and chronic kidney disease.
- ECG Results: Display the ECG image with ST-segment elevation in leads II, III, and aVF.
- Lab Results Display

- Nurse (NPC): "We need you to review Mr. Smith's medications. He has a complex history with diabetes, hypertension, and chronic kidney disease. The recent labs and ECG are available for your review."

Reviewing Medication History and Lab Results:

- Medication History and List:
    - Metformin 1000 mg BID
    - Lisinopril 20 mg daily
    - Amlodipine 10 mg daily
    - Atorvastatin 40 mg daily
- Lab Results Display:
    - Troponin: Elevated
    - CK-MB: Elevated
    - CBC: Normal
    - BMP: Elevated creatinine (2.0 mg/dL), reduced GFR (45 mL/min/1.73m²)

Nurse (NPC): "Based on these results, what changes, if any, should we make to his medications?"

I would want icons for all 4 medications with the option to increase/decrease them (as in Ready to Practice) so student can reduce metformin but continue the other medication at the normal dose.

Option 1 (Correct):

Considering his acute renal function decline, we should hold metformin to avoid the risk of lactic acidosis. We should also continue lisinopril and amlodipine for blood pressure management, and atorvastatin for cardiovascular protection, but monitor his kidney function closely.

Other options:

Increasing or decreasing other medications will show incorrect answers and students will need to start again until they get it right.

---

Student 3: Medication Monitoring

Following the Correct Path:

Nurse (NPC): "Metformin held. Continuing lisinopril, amlodipine, and atorvastatin. Preparing for further instructions from the cardiologist. What else should we monitor?"

Next Steps Interaction:

Option 1 (Correct):

Student 3: "We need to monitor his renal function, electrolytes, and blood glucose levels."

- Nurse (NPC): "Monitoring setup for renal function, electrolytes, and blood glucose levels. Watching for side effects."

[Outcome: moves onto the next screen].

Option 2:

Student 3: "Let's only monitor his blood glucose levels given his diabetes."

- Nurse (NPC): "We need to monitor more than just his glucose levels due to his complex condition."

[Outcome: This option loops back to the main screen where students can select all the necessary options to monitor]

Option 3:

Student 3: "No additional monitoring is needed at this time."

- Nurse (NPC): "Skipping monitoring could miss potential complications."

[Outcome: This option loops back to the main screen where students can select all the necessary options to monitor]

 

Following from correct pathway:

- Nurse (NPC): "All set. I'll keep monitoring his vitals and notify you of any significant changes."
- Nurse (NPC): "We need to monitor Mr. Smith for potential side effects from his medications. What side effects should we be particularly concerned about?"

Reviewing Medication List:

- Medication List:
    - Metformin (held)
    - Lisinopril 20 mg daily
    - Amlodipine 10 mg daily
    - Atorvastatin 40 mg daily
    - New medications: Aspirin, Nitroglycerin, Beta-blocker

Option 1 (Correct):

Student 3: "We should monitor for hypotension and bradycardia due to the beta-blocker, bleeding risk from aspirin, and angioedema from lisinopril."

- Nurse (NPC): "Got it. I'll keep an eye on his blood pressure, heart rate, and any signs of bleeding or swelling."

[Outcome: goes to the next screen]

Option 2:

Student 3: "We should monitor for hyperglycemia and fluid retention."

- Nurse (NPC): "Those are important, but given the new medications, we need to focus on cardiovascular and bleeding risks first."

[Outcome: loops back to main page of options].

Option 3:

Student 3: "No specific monitoring is needed beyond what's already set up."

- Nurse (NPC): "We should still watch for specific side effects from his new medications to ensure we catch any issues early."

[Outcome: loops back to main page of options].


Following the Correct Path:

Nurse (NPC): "I'll monitor his blood pressure, heart rate, and check for any signs of bleeding or swelling. Anything else we should keep in mind?"

Next Steps Interaction:

Option 1 (Correct):

Student 3: "We should also watch for muscle pain or weakness as potential side effects of atorvastatin."

- Nurse (NPC): "Monitoring for muscle pain or weakness as well. Noted."

[Outcome: goes to final screen].

Option 2:

Student 3: "We should monitor for gastrointestinal upset due to metformin."

- Nurse (NPC): "Metformin has been held, so gastrointestinal upset isn't a primary concern right now."

[Outcome: loops back].

Option 3:

Student 3: "We should prepare for possible allergic reactions to any medications."

- Nurse (NPC): "That's a good point. We'll be vigilant for any signs of an allergic reaction."

[Outcome: While important, this option alone doesn't cover all the critical side effects., so loops back to main screen]

Summary and Handoff:

Student 3: "Nurse, please ensure all the monitoring parameters are documented and communicated to the team. Let’s make sure we’re prepared to address any side effects promptly."

Nurse (NPC): "All set. I'll keep an eye on his vitals and any potential side effects, and notify you immediately if there are any concerns."

---

The end
